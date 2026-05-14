import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Eye,
  Heart,
  Leaf,
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
  Star,
} from "lucide-react";
import { useState } from "react";

const ProductCard = ({
  product,
  viewMode,
  selections,
  handleSelectionChange,
  cartItems,
  addToCart,
  updateCartItemQuantity,
  wishlist,
  toggleWishlist,
}) => {
  const sizes = product.availableSizes ? product.availableSizes.split(",") : [];
  const colors = product.availableColors
    ? product.availableColors.split(",")
    : [];
  const selectedSize =
    selections[product.id]?.selectedSize ||
    (sizes.length > 0 ? sizes[0] : null);
  const selectedColor =
    selections[product.id]?.selectedColor ||
    (colors.length > 0 ? colors[0] : null);
  const cartItemId = `${product.id}-${selectedSize || "no-size"}-${
    selectedColor || "no-color"
  }`;
  const cartItem = cartItems.find((item) => item.id === cartItemId);
  const isUpdating = cartItem?.isUpdating || false;
  const quantity = cartItem?.quantity || 0;
  const isInWishlist = wishlist.some((item) => item.id === product.id);
  const [addCart, setAddCart] = useState(false);
  const manageAddCart = async () => {
    setAddCart(true);
    await addToCart(product.id, 1, selectedSize, selectedColor);
    setAddCart(false);
  };

  return (
    <Card
      className={`rounded-2xl overflow-hidden shadow-lg border-gray-100 transition-all duration-300 hover:shadow-xl group flex flex-col ${
        viewMode === "list" ? "sm:flex-row items-center p-4" : ""
      } ${viewMode === "grid" ? "h-full" : ""}`}
    >
      <div
        className={`relative ${
          viewMode === "list"
            ? "w-full sm:w-32 h-48 sm:h-32 mb-4 sm:mb-0 sm:mr-4 flex-shrink-0"
            : "w-full h-32"
        }`}
      >
        {product.discount > 0 && (
          <Badge className="absolute top-2 left-2 bg-rose-500 text-white rounded-full px-2 py-1 text-xs font-bold z-10">
            -{product.discount}%
          </Badge>
        )}
        <div className="absolute top-2 right-2 flex space-x-2">
          <Link href={`/${product.slug}`}>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full w-8 h-8 z-10 bg-white/50 backdrop-blur-sm hover:bg-white transition-colors"
            >
              <Eye className="h-4 w-4 text-gray-600" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full w-8 h-8 z-10 bg-white/50 backdrop-blur-sm hover:bg-white transition-colors ${
              isInWishlist ? "text-red-500" : "text-gray-600"
            }`}
            onClick={() => toggleWishlist(product, isInWishlist)}
          >
            <Heart
              className={`h-4 w-4 ${isInWishlist ? "fill-current" : ""}`}
            />
          </Button>
        </div>
        <Image
          src={product.mainImage}
          alt={product.name}
          width={400}
          height={300}
          className={`object-cover ${
            viewMode === "list" ? "w-full h-full rounded-lg" : "w-full h-full"
          }`}
        />
        {product.organic && (
          <Badge className="absolute bottom-2 left-2 bg-green-500 text-white rounded-full px-2 py-1 text-xs font-bold z-10">
            <Leaf className="h-3 w-3 mr-1" /> Organic
          </Badge>
        )}
      </div>
      <CardContent
        className={`p-3 flex-1 flex flex-col ${
          viewMode === "list"
            ? "grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:gap-4"
            : ""
        }`}
      >
        <div className={viewMode === "list" ? "col-span-2 sm:col-span-1" : ""}>
          <h3 className="text-base font-semibold text-gray-800">
            {product.name}
          </h3>
          <div className="flex items-center my-0 mt-1 mb-0 text-xs text-yellow-500">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < product.rating ? "fill-current" : "text-gray-300"
                }`}
              />
            ))}
            <span className="text-gray-500 ml-1 text-xs">
              ({product.rating})
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Sold: {product.totalSales}
          </p>
        </div>
        <div
          className={`mt-2 ${
            viewMode === "list" ? "flex flex-col items-start sm:items-end" : ""
          }`}
        >
          <div className="flex items-center justify-start sm:justify-end mb-1">
            <span className="text-lg font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            {product.oldPrice && (
              <span className="text-sm text-gray-500 line-through ml-2">
                ${product.oldPrice.toFixed(2)}
              </span>
            )}
          </div>
          <div className="text-sm font-medium">
            {product.stockAmount > 0 ? (
              <span className="text-green-600 flex items-center">
                In Stock ({product.stockAmount})
                {product.stockAmount <= 5 && (
                  <span className="ml-1 text-rose-500">
                    (Only {product.stockAmount} left!)
                  </span>
                )}
              </span>
            ) : (
              <span className="text-rose-500">Out of Stock</span>
            )}
          </div>
          {(sizes.length > 0 || colors.length > 0) && (
            <div className="mt-2 space-y-2">
              {sizes.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Label className="text-gray-600">Size:</Label>
                  <select
                    value={selectedSize || ""}
                    onChange={(e) =>
                      handleSelectionChange(
                        product.id,
                        "selectedSize",
                        e.target.value
                      )
                    }
                    className="border border-gray-300 rounded-md p-1 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {sizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {colors.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Label className="text-gray-600">Color:</Label>
                  <select
                    value={selectedColor || ""}
                    onChange={(e) =>
                      handleSelectionChange(
                        product.id,
                        "selectedColor",
                        e.target.value
                      )
                    }
                    className="border border-gray-300 rounded-md p-1 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {colors.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
          {cartItem ? (
            <div className="flex items-center mt-3 space-x-2">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-lg border-gray-300"
                onClick={() =>
                  updateCartItemQuantity(
                    cartItem.dbItemId,
                    quantity - 1,
                    cartItem.id
                  )
                }
                disabled={isUpdating || quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-8 text-center">
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  quantity
                )}
              </span>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-lg border-gray-300"
                onClick={() =>
                  updateCartItemQuantity(
                    cartItem.dbItemId,
                    quantity + 1,
                    cartItem.id
                  )
                }
                disabled={isUpdating || product.stockAmount <= quantity}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              className="mt-3 w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              disabled={product.stockAmount <= 0 || addCart}
              onClick={manageAddCart}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {addCart ? "Adding" : "Add to Cart"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
