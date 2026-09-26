import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { create } from "zustand";

// One shared request for everyone who needs the wishlist at the same time.
let inflight = null;

const useWishlistStore = create((set, get) => ({
  wishlist: [],
  isLoading: false,
  hasLoaded: false,
  error: null,
  isAddingAllToCart: false,

  setIsAddingAllToCart: (val) => set({ isAddingAllToCart: val }),

  // Loads the wishlist once; later calls reuse it unless `force` is set.
  fetchWishlist: async ({ force = false } = {}) => {
    if (inflight) return inflight;
    if (get().hasLoaded && !force) return;
    set({ isLoading: true, error: null });
    inflight = (async () => {
      try {
        const response = await fetch("/api/wishlist");
        if (!response.ok) throw new Error("Failed to fetch wishlist.");
        const data = await response.json();
        set({
          wishlist: data.products.map((product) => ({
            ...product,
            image: product.mainImage,
            isOutOfStock: product.stockAmount <= 0,
          })),
          isLoading: false,
          hasLoaded: true,
        });
      } catch (error) {
        set({ error: error.message, isLoading: false, hasLoaded: true });
      } finally {
        inflight = null;
      }
    })();
    return inflight;
  },

  reset: () => set({ wishlist: [], hasLoaded: false, isLoading: false, error: null }),

  toggleWishlist: async (product, isCurrentlyInWishlist) => {
    const action = isCurrentlyInWishlist ? "remove" : "add";
    const method = isCurrentlyInWishlist ? "DELETE" : "PATCH";
    const prevWishlist = get().wishlist;

    const productWithStockStatus = {
      ...product,
      image: product.image || product.mainImage,
      isOutOfStock: product.stockAmount <= 0,
    };

    const newWishlist = isCurrentlyInWishlist
      ? prevWishlist.filter((item) => item.id !== product.id)
      : [...prevWishlist, productWithStockStatus];

    set({ wishlist: newWishlist });

    try {
      const response = await fetch("/api/wishlist", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId: product.id }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} product from wishlist.`);
      }
      return true;
    } catch (error) {
      console.error(`Error with ${action} operation:`, error);
      set({ wishlist: prevWishlist, error: error.message });
      setTimeout(() => set({ error: null }), 3000);
      return false;
    }
  },

  clearWishlist: async () => {
    const prevWishlist = get().wishlist;
    set({ wishlist: [] });

    try {
      const response = await fetch("/api/wishlist", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to clear wishlist.");
      }
    } catch (error) {
      console.error("Error clearing wishlist:", error);
      set({ wishlist: prevWishlist, error: error.message });
    }
  },
}));

// Loads the wishlist for signed-in users only (guests have none).
export function useWishlistWithSession() {
  const { status } = useSession();
  const store = useWishlistStore();
  const { hasLoaded, fetchWishlist, reset } = store;

  useEffect(() => {
    if (status === "authenticated" && !hasLoaded) fetchWishlist();
    if (status === "unauthenticated" && hasLoaded) reset();
  }, [status, hasLoaded, fetchWishlist, reset]);

  return store;
}

export default useWishlistStore;
