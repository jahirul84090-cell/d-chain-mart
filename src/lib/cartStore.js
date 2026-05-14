import { create } from "zustand";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useEffect } from "react";

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

const useCartStore = create((set, get) => {
  const apiUpdateCartItemQuantity = async (
    dbItemId,
    newQuantity,
    clientItemId
  ) => {
    try {
      if (newQuantity < 1) {
        await get().removeFromCart(dbItemId, clientItemId);
        return;
      }

      // Fetch stock amount to validate quantity
      const item = get().cartItems.find((item) => item.id === clientItemId);
      if (!item) return;
      const stockAmount = await get().fetchProductStock(item.productId);
      if (newQuantity > stockAmount) {
        throw new Error(`Only ${stockAmount} items available in stock.`);
      }

      const response = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          action: "update",
          itemId: dbItemId,
          quantity: newQuantity,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update item quantity");
      }
    } catch (error) {
      console.error("Error updating cart item quantity:", error);
      const originalItems = get().cartItems.map((item) =>
        item.id === clientItemId
          ? { ...item, isUpdating: false, quantity: item.originalQuantity }
          : item
      );
      set({ cartItems: originalItems });
      get().updateTotals();
      toast.error(error.message);
    } finally {
      const currentItems = get().cartItems.map((item) =>
        item.id === clientItemId ? { ...item, isUpdating: false } : item
      );
      set({ cartItems: currentItems });
    }
  };

  const debouncedApiUpdate = debounce(apiUpdateCartItemQuantity, 500);

  return {
    cartId: null,
    cartItems: [],
    totalItems: 0,
    totalPrice: 0,

    // Fetch product stock by productId
    fetchProductStock: async (productId) => {
      try {
        const response = await fetch(`/api/admin/product/${productId}`, {
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch product stock.");
        }
        const data = await response.json();
        return data.product.stockAmount || 0;
      } catch (error) {
        console.error("Error fetching product stock:", error);
        toast.error(error.message || "Failed to fetch product stock.");
        return 0;
      }
    },

    updateTotals: () => {
      const { cartItems } = get();
      const totalItems = cartItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const totalPrice = cartItems.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      );
      set({ totalItems, totalPrice });
    },

    initializeCart: async () => {
      try {
        const response = await fetch("/api/cart", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch cart: ${response.statusText}`);
        }
        const cart = await response.json();
        set({
          cartId: cart.id,
          cartItems: cart.items.map((item) => ({
            id: `${item.productId}-${item.selectedSize || "no-size"}-${
              item.selectedColor || "no-color"
            }`,
            productId: item.productId,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
            image: item.product.mainImage,
            dbItemId: item.id,
            slug: item.product.slug,
          })),
        });
        get().updateTotals();
      } catch (error) {
        console.error("Error initializing cart:", error);
        set({ cartId: null, cartItems: [], totalItems: 0, totalPrice: 0 });
      }
    },

    addToCart: async (productId, quantity, selectedSize, selectedColor) => {
      const { cartItems, updateTotals, fetchProductStock } = get();
      const itemIdentifier = `${productId}-${selectedSize || "no-size"}-${
        selectedColor || "no-color"
      }`;
      const existingItemIndex = cartItems.findIndex(
        (item) => item.id === itemIdentifier
      );

      // Fetch stock amount
      const stockAmount = await fetchProductStock(productId);
      if (stockAmount <= 0) {
        toast.error("This product is out of stock.");
        return;
      }
      if (quantity > stockAmount) {
        toast.error(`Only ${stockAmount} items available in stock.`);
        return;
      }

      if (existingItemIndex !== -1) {
        const existingItem = cartItems[existingItemIndex];
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > stockAmount) {
          toast.error(`Cannot add more items. Only ${stockAmount} available.`);
          return;
        }
        await get().updateCartItemQuantity(
          existingItem.dbItemId,
          newQuantity,
          itemIdentifier
        );
        return;
      }

      const tempItem = {
        id: itemIdentifier,
        dbItemId: null,
        productId,
        name: "Loading...",
        price: 0,
        quantity,
        selectedSize,
        selectedColor,
        image: null,
        isUpdating: true,
      };
      const previousItems = cartItems;
      set({ cartItems: [...cartItems, tempItem] });
      updateTotals();

      try {
        const response = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify({
            action: "add",
            productId,
            quantity,
            selectedSize,
            selectedColor,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to add to cart");
        }
        await get().initializeCart();
        toast.success("Item added to cart!");
      } catch (error) {
        console.error("Error adding to cart:", error);
        set({ cartItems: previousItems });
        updateTotals();
        toast.error(error.message);
      }
    },

    updateCartItemQuantity: (dbItemId, newQuantity, clientItemId) => {
      const { cartItems, updateTotals } = get();
      const itemToUpdate = cartItems.find((item) => item.id === clientItemId);
      if (!itemToUpdate) {
        return;
      }

      if (newQuantity <= 0) {
        get().removeFromCart(dbItemId, clientItemId);
        return;
      }

      const updatedItems = cartItems.map((item) =>
        item.id === clientItemId
          ? {
              ...item,
              quantity: newQuantity,
              isUpdating: true,
              originalQuantity: item.quantity,
            }
          : item
      );
      set({ cartItems: updatedItems });
      updateTotals();

      debouncedApiUpdate(dbItemId, newQuantity, clientItemId);
    },

    removeFromCart: async (dbItemId, clientItemId) => {
      const { cartItems, updateTotals } = get();
      const itemToRemove = cartItems.find((item) => item.id === clientItemId);
      if (!itemToRemove) {
        return;
      }

      const previousItems = cartItems;

      const filteredItems = cartItems.filter(
        (item) => item.id !== clientItemId
      );
      set({ cartItems: filteredItems });
      updateTotals();

      try {
        const response = await fetch("/api/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify({
            action: "remove",
            itemId: dbItemId,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to remove item");
        }
        toast.success("Item removed from cart.");
      } catch (error) {
        console.error("Error removing from cart:", error);
        set({ cartItems: previousItems });
        updateTotals();
        toast.error(error.message);
      }
    },

    clearCart: async () => {
      try {
        const response = await fetch("/api/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify({
            action: "clear",
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to clear cart");
        }
        set({ cartId: null, cartItems: [], totalItems: 0, totalPrice: 0 });
        toast.success("Cart cleared.");
      } catch (error) {
        console.error("Error clearing cart:", error);
        toast.error(error.message);
      }
    },
  };
});

export function useCartWithSession() {
  const { data: session, status } = useSession();
  const store = useCartStore();

  useEffect(() => {
    if (status === "authenticated" && session?.user && !store.cartId) {
      store.initializeCart();
    }
  }, [status, session, store]);

  return store;
}

export default useCartStore;
