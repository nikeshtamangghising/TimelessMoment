import { memo, useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/contexts/cart-context";
import { useCartStore } from "@/stores/cart-store";
import { useFavorites } from "@/hooks/use-favorites";
import { createViewTracker, trackActivity } from "@/lib/activity-tracker";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency";
import { ProductWithCategory } from "@/types";
interface ProductCardProps {
  product: ProductWithCategory;
  onAddToCart?: (productId: string) => void;
  onProductClick?: (product: ProductWithCategory) => void;
  loading?: boolean;
  showFavoriteButton?: boolean;
  trackViews?: boolean;
  compact?: boolean;
}

function ProductCard({
  product,
  onAddToCart,
  onProductClick,
  loading,
  showFavoriteButton = true,
  trackViews = true,
  compact = false,
}: ProductCardProps) {
  const { data: session } = useSession();
  const { addToCart } = useCart(); // Removed cartLoading from destructuring
  const { openCart } = useCartStore();
  const { isInFavorites, toggleFavorite, isOperationLoading } = useFavorites();
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isAdding, setIsAdding] = useState(false); // Local loading state for this product
  const [isBuying, setIsBuying] = useState(false);

  // Long-press detection state
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggeredRef = useRef(false);

  // Set up view tracking
  useEffect(() => {
    if (!trackViews || !cardRef.current) return;

    // Generate a session ID for guest users if no user is logged in
    const sessionId = !session?.user?.id
      ? `guest_${Date.now()}_${Math.random()}`
      : undefined;

    const observer = createViewTracker(session?.user?.id, sessionId);
    if (observer) {
      cardRef.current.setAttribute("data-product-id", product.id);
      observer.observe(cardRef.current);

      return () => {
        observer.disconnect();
      };
    }
  }, [product.id, session?.user?.id, trackViews]);

  const handleAddToCart = async () => {
    const productCopy = JSON.parse(JSON.stringify(product));

    if (onAddToCart) {
      onAddToCart(productCopy.id);
    } else {
      setIsAdding(true);
      try {
        const success = await addToCart(productCopy, 1);
        if (success) {
          trackActivity({
            productId: productCopy.id,
            activityType: "CART_ADD",
            userId: session?.user?.id,
          });
          openCart();
        }
      } finally {
        setIsAdding(false);
      }
    }
  };

  const handleBuyNow = async () => {
    if (product.inventory === 0) return;
    const productCopy = JSON.parse(JSON.stringify(product));
    setIsBuying(true);
    try {
      const success = await addToCart(productCopy, 1);
      if (success) {
        router.push("/checkout");
      }
    } finally {
      setIsBuying(false);
    }
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!session?.user) {
      // Could trigger login modal here
      return;
    }

    await toggleFavorite(product.id);
  };

  // Use local loading state instead of global cart loading state
  const isButtonLoading = loading || isAdding;
  const isFavoriteLoading = isOperationLoading(product.id);
  const isFavorited = isInFavorites(product.id);

  // Navigation helper
  const navigateToProduct = () => {
    const href = `/products/${product.slug || product.id}`;
    router.push(href);
  };

  // Pointer/long-press handlers for image/title area
  const handlePointerDown = () => {
    longPressTriggeredRef.current = false;
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    pressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      if (onProductClick) {
        onProductClick(product);
      }
    }, 450); // ~0.45s long-press threshold
  };

  const clearPressTimer = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    // Always clear timer first
    clearPressTimer();

    if (longPressTriggeredRef.current) {
      // Quick view already opened, prevent navigation bubbling (e.g., parent Link)
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Short click: open product page
    e.preventDefault();
    e.stopPropagation();
    navigateToProduct();
  };

  const handlePointerLeave = () => {
    clearPressTimer();
  };

  const handlePointerCancel = () => {
    clearPressTimer();
  };

  // Keyboard support: Enter -> navigate, Space -> quick view
  const handleKeyDownInteractive = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      navigateToProduct();
    } else if (e.key === " " || e.code === "Space") {
      if (onProductClick) {
        e.preventDefault();
        e.stopPropagation();
        onProductClick(product);
      }
    }
  };

  // Quick view button click
  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onProductClick) onProductClick(product);
  };

  return (
    <Card
      ref={cardRef}
      className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-gray-100 hover:border-blue-200 overflow-hidden bg-white relative select-none rounded-2xl shadow-sm hover:shadow-blue-100/50"
      role="link"
      tabIndex={0}
      onKeyDown={handleKeyDownInteractive}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerCancel}
      onContextMenu={(e) => e.preventDefault()}
      style={{ WebkitTouchCallout: "none" }}
    >
      <div className="relative">
        <div className="aspect-square w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 cursor-pointer relative rounded-t-2xl">
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300 animate-pulse">
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"
                style={{ animationDelay: "0.5s", animationDuration: "2s" }}
              />
            </div>
          )}
          <Image
            src={product.images[0] || "/placeholder-product.svg"}
            alt={product.name}
            width={400}
            height={400}
            className={`h-full w-full object-cover object-center group-hover:scale-105 transition-all duration-700 ease-out ${
              isImageLoaded ? "opacity-100" : "opacity-0"
            }`}
            loading="lazy"
            onLoad={() => setIsImageLoaded(true)}
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
            draggable={false}
          />

          {/* Favorite Button */}
          {showFavoriteButton && session?.user && (
            <button
              onClick={handleFavoriteClick}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              disabled={isFavoriteLoading}
              className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/95 backdrop-blur-sm hover:bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-white/20"
            >
              <svg
                className={`w-5 h-5 transition-all duration-300 ${
                  isFavorited
                    ? "text-red-500 fill-red-500 scale-110"
                    : "text-gray-400 hover:text-red-500 hover:scale-110"
                }`}
                fill={isFavorited ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          )}

          {/* New Badge */}
          {product.isNewArrival && (
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg backdrop-blur-sm border border-white/20">
                ✨ NEW
              </span>
            </div>
          )}

          {/* Stock Status Badge */}
          {product.inventory <= 5 && (
            <div
              className={`absolute ${
                product.isNewArrival ? "top-14" : "top-4"
              } left-4`}
            >
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm border border-white/20 ${
                  product.inventory === 0
                    ? "bg-red-500/90 text-white"
                    : "bg-amber-500/90 text-white"
                }`}
              >
                {product.inventory === 0
                  ? "❌ Sold Out"
                  : `⚡ Only ${product.inventory} left`}
              </span>
            </div>
          )}

          {/* Quick view overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0 scale-95 group-hover:scale-100">
              <button
                type="button"
                onClick={handleQuickViewClick}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="bg-white/95 backdrop-blur-sm text-gray-900 px-6 py-3 rounded-full text-sm font-semibold shadow-xl hover:bg-white hover:shadow-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 border border-white/20"
                aria-label="Open quick view"
              >
                👁️ Quick View
              </button>
            </div>
          </div>
        </div>
      </div>
      <CardContent className={compact ? "p-3" : "p-5"}>
        {/* Category Badge */}
        {!compact && (
          <div className="mb-3">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 border border-blue-100">
              {product.category.name}
            </span>
          </div>
        )}

        {/* Product Title */}
        <h3
          className={
            compact
              ? "text-sm font-semibold text-gray-900 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors mb-2 leading-tight"
              : "text-base font-bold text-gray-900 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors mb-3 leading-tight"
          }
        >
          {product.name}
        </h3>

        {/* Price */}
        <div
          className={
            compact
              ? "flex items-center flex-wrap gap-2 mb-3"
              : "flex items-center flex-wrap gap-3 mb-4"
          }
        >
          {product.discountPrice ? (
            <>
              <span
                className={
                  compact
                    ? "text-lg font-bold text-emerald-600"
                    : "text-xl font-bold text-emerald-600"
                }
              >
                {formatCurrency(
                  product.discountPrice,
                  product.currency || DEFAULT_CURRENCY
                )}
              </span>
              <span
                className={
                  compact
                    ? "text-sm text-gray-500 line-through"
                    : "text-base text-gray-500 line-through"
                }
              >
                {formatCurrency(
                  product.price,
                  product.currency || DEFAULT_CURRENCY
                )}
              </span>
              <span className="text-xs bg-gradient-to-r from-red-500 to-pink-500 text-white px-2.5 py-1 rounded-full font-bold shadow-sm">
                {Math.round(
                  ((product.price - product.discountPrice) / product.price) *
                    100
                )}
                % OFF
              </span>
            </>
          ) : (
            <span
              className={
                compact
                  ? "text-lg font-bold text-slate-800"
                  : "text-xl font-bold text-slate-800"
              }
            >
              {formatCurrency(
                product.price,
                product.currency || DEFAULT_CURRENCY
              )}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div
          className={
            compact ? "mt-3 flex flex-col gap-2" : "mt-4 flex flex-col gap-3"
          }
        >
          <Button
            onClick={handleAddToCart}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
            }}
            disabled={product.inventory === 0 || isButtonLoading}
            className={`w-full ${
              product.inventory === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl border-0"
            } ${
              compact ? "!px-3 !py-2 !text-sm" : "!px-4 !py-3 !text-base"
            } font-semibold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95`}
            size={compact ? "sm" : "md"}
          >
            {isButtonLoading ? (
              <div className="flex items-center justify-center">
                <svg
                  className={`animate-spin ${
                    compact ? "h-4 w-4 mr-2" : "h-5 w-5 mr-2"
                  } text-current`}
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {compact ? "Adding..." : "Adding to Cart..."}
              </div>
            ) : product.inventory === 0 ? (
              compact ? (
                "❌ Sold Out"
              ) : (
                "❌ Sold Out"
              )
            ) : compact ? (
              "🛒 Add"
            ) : (
              "🛒 Add to Cart"
            )}
          </Button>

          {/* Buy Now button */}
          <Button
            onClick={handleBuyNow}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
            }}
            disabled={product.inventory === 0 || isBuying || isButtonLoading}
            className={`w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border disabled:border-gray-200 ${
              compact ? "!px-3 !py-2 !text-sm" : "!px-4 !py-3 !text-base"
            } font-semibold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 border-0`}
            size={compact ? "sm" : "md"}
          >
            {isBuying ? (
              <div className="flex items-center justify-center">
                <svg
                  className={`animate-spin ${
                    compact ? "h-4 w-4 mr-2" : "h-5 w-5 mr-2"
                  } text-white`}
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {compact ? "Processing..." : "Processing..."}
              </div>
            ) : compact ? (
              "⚡ Buy"
            ) : (
              "⚡ Buy Now"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Memoize to avoid unnecessary re-renders when product data hasn't changed
function areEqual(
  prev: Readonly<ProductCardProps>,
  next: Readonly<ProductCardProps>
) {
  const a = prev.product;
  const b = next.product;
  if (a.id !== b.id) return false;
  if (a.price !== b.price) return false;
  if ((a.discountPrice || null) !== (b.discountPrice || null)) return false;
  if (a.inventory !== b.inventory) return false;
  if ((a.currency || DEFAULT_CURRENCY) !== (b.currency || DEFAULT_CURRENCY))
    return false;
  if ((a.category?.name || "") !== (b.category?.name || "")) return false;
  const aImg = Array.isArray(a.images) && a.images.length ? a.images[0] : "";
  const bImg = Array.isArray(b.images) && b.images.length ? b.images[0] : "";
  if (aImg !== bImg) return false;
  // For the rest (handlers, flags), assume stable usage; compare simple flags
  if ((prev.loading || false) !== (next.loading || false)) return false;
  if ((prev.showFavoriteButton || true) !== (next.showFavoriteButton || true))
    return false;
  if ((prev.trackViews || true) !== (next.trackViews || true)) return false;
  if ((prev.compact || false) !== (next.compact || false)) return false;
  return true;
}

export default memo(ProductCard, areEqual);
