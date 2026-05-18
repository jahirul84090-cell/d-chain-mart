import { create } from "zustand";

const useWishlistStore = create((set, get) => ({
  wishlist: [],
  isLoading: true,
  error: null,
  isAddingAllToCart: false,

  setIsAddingAllToCart: (val) => set({ isAddingAllToCart: val }),

  fetchWishlist: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/wishlist");
      if (!response.ok) throw new Error("Failed to fetch wishlist.");
      const data = await response.json();

      const productsWithStockStatus = data.products.map((product) => ({
        ...product,
        isOutOfStock: product.stockAmount <= 0,
      }));

      set({ wishlist: productsWithStockStatus, isLoading: false });
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      set({ error: error.message, isLoading: false });
    }
  },

  toggleWishlist: async (product, isCurrentlyInWishlist) => {
    const action = isCurrentlyInWishlist ? "remove" : "add";
    const method = isCurrentlyInWishlist ? "DELETE" : "PATCH";
    const prevWishlist = get().wishlist;

    const productWithStockStatus = {
      ...product,
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
    } catch (error) {
      console.error(`Error with ${action} operation:`, error);
      set({ wishlist: prevWishlist, error: error.message });
      setTimeout(() => set({ error: null }), 3000);
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

export default useWishlistStore;
