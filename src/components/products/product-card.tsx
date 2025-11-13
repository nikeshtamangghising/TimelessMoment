import { memo, useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";

import { Card, CardContent } from "@/components/ui/card";
import { useFavorites } from "@/hooks/use-favorites";
import { createViewTracker } from "@/lib/activity-tracker";
import { getSessionId } from "@/lib/activity-utils";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency";
import { ProductWithCategory } from "@/types";
interface ProductCardProps {
  product: ProductWithCategory;
  showFavoriteButton?: boolean;
  trackViews?: boolean;
  compact?: boolean;
}

function ProductCard({
  product,
  showFavoriteButton = true,
  trackViews = true,
  compact = false,
}: ProductCardProps) {
  const { data: session } = useSession();
  const { isInFavorites, toggleFavorite, isOperationLoading } = useFavorites();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);



  // Set up view tracking
  useEffect(() => {
    if (!trackViews || !cardRef.current) return;

    // Generate a session ID for guest users if no user is logged in
    // Use getSessionId() utility which handles session storage properly
    const sessionId = !session?.user?.id
      ? getSessionId()
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

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!session?.user) {
      // Could trigger login modal here
      return;
    }

    await toggleFavorite(product.id);
  };

  const isFavoriteLoading = isOperationLoading(product.id);
  const isFavorited = isInFavorites(product.id);

  // Navigation helper
  const navigateToProduct = () => {
    const href = `/products/${product.slug || product.id}`;
    window.location.href = href;
  };

  // Simple click handler for navigation
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigateToProduct();
  };

  // Keyboard support: Enter -> navigate
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      navigateToProduct();
    }
  };

  return (
    <Card
      ref={cardRef}
      className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-gray-100 hover:border-blue-200 overflow-hidden bg-white relative select-none rounded-2xl shadow-sm hover:shadow-blue-100/50 cursor-pointer"
      role="link"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={handleCardClick}
      suppressHydrationWarning
    >
      <div className="relative" suppressHydrationWarning>
        <div className="aspect-square w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 cursor-pointer relative rounded-t-2xl" suppressHydrationWarning>
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300 animate-pulse" suppressHydrationWarning>
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"
                style={{ animationDelay: "0.5s", animationDuration: "2s" }}
                suppressHydrationWarning
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
            suppressHydrationWarning
          />

          {/* Favorite Button */}
          {showFavoriteButton && session?.user && (
            <button
              onClick={handleFavoriteClick}
              disabled={isFavoriteLoading}
              className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/95 backdrop-blur-sm hover:bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-white/20"
              suppressHydrationWarning
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
                suppressHydrationWarning
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
            <div className="absolute top-4 left-4" suppressHydrationWarning>
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
              suppressHydrationWarning
            >
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm border border-white/20 ${
                  product.inventory === 0
                    ? "bg-red-500/90 text-white"
                    : "bg-amber-500/90 text-white"
                }`}
                suppressHydrationWarning
              >
                {product.inventory === 0
                  ? "❌ Sold Out"
                  : `⚡ Only ${product.inventory} left`}
              </span>
            </div>
          )}
        </div>
      </div>
      <CardContent className={compact ? "p-2" : "p-5"} suppressHydrationWarning>
        {/* Category Badge */}
        {!compact && (
          <div className="mb-3" suppressHydrationWarning>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 border border-blue-100">
              {product.category.name}
            </span>
          </div>
        )}

        {/* Product Title */}
        <h3
          className={
            compact
              ? "text-sm font-semibold text-gray-900 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors mb-1 leading-tight"
              : "text-base font-bold text-gray-900 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors mb-3 leading-tight"
          }
          suppressHydrationWarning
        >
          {product.name}
        </h3>

        {/* Price */}
        <div
          className={
            compact
              ? "flex items-center flex-wrap gap-1 mb-2"
              : "flex items-center flex-wrap gap-3 mb-4"
          }
          suppressHydrationWarning
        >
          {product.discountPrice ? (
            <>
              <span
                className={
                  compact
                    ? "text-sm sm:text-base font-bold text-emerald-600"
                    : "text-base sm:text-lg font-bold text-emerald-600"
                }
                suppressHydrationWarning
              >
                {formatCurrency(
                  product.discountPrice,
                  product.currency || DEFAULT_CURRENCY
                )}
              </span>
              <span
                className={
                  compact
                    ? "text-xs sm:text-sm text-gray-500 line-through"
                    : "text-sm sm:text-base text-gray-500 line-through"
                }
                suppressHydrationWarning
              >
                {formatCurrency(
                  product.price,
                  product.currency || DEFAULT_CURRENCY
                )}
              </span>
              <span className="text-xs bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full font-bold shadow-sm">
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
                  ? "text-sm sm:text-base font-bold text-slate-800"
                  : "text-base sm:text-lg font-bold text-slate-800"
              }
              suppressHydrationWarning
            >
              {formatCurrency(
                product.price,
                product.currency || DEFAULT_CURRENCY
              )}
            </span>
          )}
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

  if ((prev.showFavoriteButton || true) !== (next.showFavoriteButton || true))
    return false;
  if ((prev.trackViews || true) !== (next.trackViews || true)) return false;
  if ((prev.compact || false) !== (next.compact || false)) return false;
  return true;
}

export default memo(ProductCard, areEqual);
