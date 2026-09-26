import { create } from "zustand";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useEffect } from "react";

const QUANTITY_SYNC_DELAY_MS = 500;

export const cartItemKey = (productId, size, color) =>
  `${productId}-${size || "no-size"}-${color || "no-color"}`;

const toClientItem = (item) => ({
  id: cartItemKey(item.productId, item.selectedSize, item.selectedColor),
  productId: item.productId,
  name: item.product.name,
  price: item.product.price,
  quantity: item.quantity,
  stockAmount: item.product.stockAmount,
  selectedSize: item.selectedSize,
  selectedColor: item.selectedColor,
  image: item.product.mainImage,
  dbItemId: item.id,
  slug: item.product.slug,
});

async function readError(response, fallback) {
  try {
    const data = await response.json();
    return data?.error || fallback;
  } catch {
    return fallback;
  }
}

// One pending timer per cart line, so quick changes to different items
// never cancel each other's server update.
const pendingQuantityTimers = new Map();

// Shared in-flight cart request, so many components loading at once make one call.
let cartRequest = null;

const useCartStore = create((set, get) => {
  const syncQuantity = async (dbItemId, newQuantity, clientItemId, previousQuantity) => {
    try {
      const response = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ itemId: dbItemId, quantity: newQuantity }),
      });
      if (!response.ok) {
        throw new Error(await readError(response, "Failed to update quantity."));
      }
      set({
        cartItems: get().cartItems.map((item) =>
          item.id === clientItemId ? { ...item, isUpdating: false } : item
        ),
      });
    } catch (error) {
      // Roll back to the last quantity the server accepted.
      set({
        cartItems: get().cartItems.map((item) =>
          item.id === clientItemId
            ? { ...item, quantity: previousQuantity, isUpdating: false }
            : item
        ),
      });
      toast.error(error.message);
    } finally {
      get().updateTotals();
    }
  };

  return {
    cartId: null,
    cartItems: [],
    totalItems: 0,
    totalPrice: 0,
    isInitializing: false,
    hasLoaded: false,

    updateTotals: () => {
      const { cartItems } = get();
      set({
        totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: cartItems.reduce((sum, item) => sum + item.quantity * item.price, 0),
      });
    },

    initializeCart: async () => {
      if (cartRequest) return cartRequest;
      cartRequest = (async () => {
      set({ isInitializing: true });
      try {
        const response = await fetch("/api/cart", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to fetch cart: ${response.statusText}`);
        }
        const cart = await response.json();
        set({ cartId: cart.id, cartItems: cart.items.map(toClientItem) });
        get().updateTotals();
      } catch (error) {
        console.error("Error initializing cart:", error);
        set({ cartId: null, cartItems: [], totalItems: 0, totalPrice: 0 });
      } finally {
        set({ isInitializing: false, hasLoaded: true });
        cartRequest = null;
      }
      })();
      return cartRequest;
    },

    /**
     * Adds a product variant to the cart. Stock, availability and the chosen
     * size/colour are validated by the server. Returns true on success.
     */
    addToCart: async (productId, quantity, selectedSize, selectedColor, { silent = false } = {}) => {
      const key = cartItemKey(productId, selectedSize, selectedColor);
      const existing = get().cartItems.find((item) => item.id === key);

      try {
        const response = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            productId,
            quantity,
            selectedSize: selectedSize || null,
            selectedColor: selectedColor || null,
          }),
        });
        if (!response.ok) {
          throw new Error(await readError(response, "Failed to add to cart."));
        }
        await get().initializeCart();
        if (!silent) {
          toast.success(existing ? "Cart updated." : "Added to cart!");
        }
        return true;
      } catch (error) {
        if (!silent) toast.error(error.message);
        return false;
      }
    },

    updateCartItemQuantity: (dbItemId, newQuantity, clientItemId) => {
      const item = get().cartItems.find((i) => i.id === clientItemId);
      if (!item) return;

      if (newQuantity <= 0) {
        get().removeFromCart(dbItemId, clientItemId);
        return;
      }

      if (item.stockAmount != null && newQuantity > item.stockAmount) {
        toast.error(`Only ${item.stockAmount} available in stock.`);
        return;
      }

      // Remember the last confirmed quantity for rollback.
      const previousQuantity = item.isUpdating ? item.previousQuantity : item.quantity;

      set({
        cartItems: get().cartItems.map((i) =>
          i.id === clientItemId
            ? { ...i, quantity: newQuantity, isUpdating: true, previousQuantity }
            : i
        ),
      });
      get().updateTotals();

      clearTimeout(pendingQuantityTimers.get(clientItemId));
      pendingQuantityTimers.set(
        clientItemId,
        setTimeout(() => {
          pendingQuantityTimers.delete(clientItemId);
          syncQuantity(dbItemId, newQuantity, clientItemId, previousQuantity);
        }, QUANTITY_SYNC_DELAY_MS)
      );
    },

    removeFromCart: async (dbItemId, clientItemId) => {
      const previousItems = get().cartItems;
      if (!previousItems.some((item) => item.id === clientItemId)) return;

      clearTimeout(pendingQuantityTimers.get(clientItemId));
      pendingQuantityTimers.delete(clientItemId);

      set({ cartItems: previousItems.filter((item) => item.id !== clientItemId) });
      get().updateTotals();

      try {
        const response = await fetch("/api/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ itemId: dbItemId }),
        });
        if (!response.ok) {
          throw new Error(await readError(response, "Failed to remove item."));
        }
        toast.success("Item removed from cart.");
      } catch (error) {
        set({ cartItems: previousItems });
        get().updateTotals();
        toast.error(error.message);
      }
    },

    clearCart: async () => {
      const previous = get();
      set({ cartItems: [], totalItems: 0, totalPrice: 0 });
      try {
        const response = await fetch("/api/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({}),
        });
        if (!response.ok) {
          throw new Error(await readError(response, "Failed to clear cart."));
        }
        toast.success("Cart cleared.");
      } catch (error) {
        set({
          cartItems: previous.cartItems,
          totalItems: previous.totalItems,
          totalPrice: previous.totalPrice,
        });
        toast.error(error.message);
      }
    },

    // Local reset after an order: the server already emptied the cart.
    resetCart: () => {
      pendingQuantityTimers.forEach((t) => clearTimeout(t));
      pendingQuantityTimers.clear();
      set({ cartItems: [], totalItems: 0, totalPrice: 0 });
    },

    // Forget everything (e.g. on sign-out) so the next user loads fresh.
    resetSession: () => {
      pendingQuantityTimers.forEach((t) => clearTimeout(t));
      pendingQuantityTimers.clear();
      set({ cartId: null, cartItems: [], totalItems: 0, totalPrice: 0, hasLoaded: false });
    },
  };
});

export function useCartWithSession() {
  const { status } = useSession();
  const store = useCartStore();
  const { hasLoaded, isInitializing, initializeCart } = store;

  // Load the cart once per session (a failed load is not retried in a loop).
  // Reset on sign-out so the next account never sees the previous cart.
  const { resetSession } = store;
  useEffect(() => {
    if (status === "authenticated" && !hasLoaded && !isInitializing) {
      initializeCart();
    }
    if (status === "unauthenticated" && hasLoaded) resetSession();
  }, [status, hasLoaded, isInitializing, initializeCart, resetSession]);

  return store;
}

export default useCartStore;
