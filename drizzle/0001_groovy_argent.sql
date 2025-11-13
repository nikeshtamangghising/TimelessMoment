CREATE TABLE "cart_items" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text,
	"sessionId" text,
	"productId" text NOT NULL,
	"quantity" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discount_usage" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"discountId" text NOT NULL,
	"userId" text,
	"orderId" text,
	"usedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discounts" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"discountType" text NOT NULL,
	"discountValue" numeric NOT NULL,
	"minimumOrderValue" numeric,
	"maximumDiscountAmount" numeric,
	"usageLimit" integer,
	"usedCount" integer DEFAULT 0 NOT NULL,
	"validFrom" timestamp NOT NULL,
	"validTo" timestamp NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"applicableProductIds" text[] DEFAULT '{}',
	"applicableCategoryIds" text[] DEFAULT '{}',
	"userId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "discounts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "user_favorites" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"productId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cart" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "coupons" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "favorites" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "order_tracking" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "cart" CASCADE;--> statement-breakpoint
DROP TABLE "coupons" CASCADE;--> statement-breakpoint
DROP TABLE "favorites" CASCADE;--> statement-breakpoint
DROP TABLE "order_tracking" CASCADE;--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_tracking_number_unique";--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_session_token_unique";--> statement-breakpoint
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "addresses" DROP CONSTRAINT "addresses_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "blog_posts" DROP CONSTRAINT "blog_posts_author_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "categories" DROP CONSTRAINT "categories_parent_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "inventory_adjustments" DROP CONSTRAINT "inventory_adjustments_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_order_id_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "product_attributes" DROP CONSTRAINT "product_attributes_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "product_relations" DROP CONSTRAINT "product_relations_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "product_relations" DROP CONSTRAINT "product_relations_related_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_category_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_brand_id_brands_id_fk";
--> statement-breakpoint
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_activities" DROP CONSTRAINT "user_activities_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_activities" DROP CONSTRAINT "user_activities_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "user_interests" DROP CONSTRAINT "user_interests_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_interests" DROP CONSTRAINT "user_interests_category_id_categories_id_fk";
--> statement-breakpoint
DROP INDEX "provider_account_id_idx";--> statement-breakpoint
DROP INDEX "unique_relation_idx";--> statement-breakpoint
DROP INDEX "unique_user_category_idx";--> statement-breakpoint
DROP INDEX "identifier_token_idx";--> statement-breakpoint
ALTER TABLE "addresses" ALTER COLUMN "country" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "inventory_adjustments" ALTER COLUMN "reason" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "category" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "category" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "userId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "providerAccountId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "refreshToken" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "accessToken" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "expiresAt" integer;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "tokenType" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "idToken" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "sessionState" text;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "userId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "firstName" text NOT NULL;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "lastName" text NOT NULL;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "company" text;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "addressLine1" text NOT NULL;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "addressLine2" text;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "state" text NOT NULL;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "postalCode" text NOT NULL;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "isDefault" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "featuredImage" text;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "metaTitle" text;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "metaDescription" text;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "isPublished" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "authorId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "categoryId" text;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "viewCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "likeCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "commentCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "publishedAt" timestamp;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "isActive" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "parentId" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "metaTitle" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "metaDescription" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "isActive" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "sortOrder" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "email_logs" ADD COLUMN "messageId" text;--> statement-breakpoint
ALTER TABLE "email_logs" ADD COLUMN "sentAt" timestamp;--> statement-breakpoint
ALTER TABLE "email_logs" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "email_logs" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_adjustments" ADD COLUMN "productId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_adjustments" ADD COLUMN "changeType" text NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_adjustments" ADD COLUMN "referenceId" text;--> statement-breakpoint
ALTER TABLE "inventory_adjustments" ADD COLUMN "userId" text;--> statement-breakpoint
ALTER TABLE "inventory_adjustments" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_adjustments" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "orderId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "productId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "userId" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "guestEmail" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "guestName" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "trackingNumber" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "stripePaymentIntentId" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shippingAddress" json;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "isGuestOrder" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "product_attributes" ADD COLUMN "productId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "product_attributes" ADD COLUMN "displayType" text;--> statement-breakpoint
ALTER TABLE "product_attributes" ADD COLUMN "sortOrder" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "product_attributes" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "product_attributes" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "product_relations" ADD COLUMN "productId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "product_relations" ADD COLUMN "relatedProductId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "product_relations" ADD COLUMN "relationType" text DEFAULT 'RELATED' NOT NULL;--> statement-breakpoint
ALTER TABLE "product_relations" ADD COLUMN "sortOrder" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "product_relations" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "shortDescription" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "purchasePrice" numeric;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "discountPrice" numeric;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "lowStockThreshold" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "metaTitle" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "metaDescription" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "viewCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "orderCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "favoriteCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cartCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "popularityScore" numeric DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "lastScoreUpdate" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "purchaseCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "ratingAvg" numeric DEFAULT '0';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "ratingCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "categoryId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "brandId" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "isActive" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "isFeatured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "isNewArrival" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "productId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "userId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "comment" text;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "isVerifiedPurchase" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "isApproved" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "helpfulCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "notHelpfulCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "sessionToken" text NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "userId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "isPublic" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user_activities" ADD COLUMN "userId" text;--> statement-breakpoint
ALTER TABLE "user_activities" ADD COLUMN "sessionId" text;--> statement-breakpoint
ALTER TABLE "user_activities" ADD COLUMN "productId" text;--> statement-breakpoint
ALTER TABLE "user_activities" ADD COLUMN "activityType" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user_activities" ADD COLUMN "metadata" json;--> statement-breakpoint
ALTER TABLE "user_activities" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user_interests" ADD COLUMN "userId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user_interests" ADD COLUMN "categoryId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user_interests" ADD COLUMN "interestScore" numeric DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_interests" ADD COLUMN "interactionCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_interests" ADD COLUMN "lastInteraction" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user_interests" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user_interests" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emailVerified" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "resetToken" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "resetTokenExpiry" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_usage" ADD CONSTRAINT "discount_usage_discountId_discounts_id_fk" FOREIGN KEY ("discountId") REFERENCES "public"."discounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_usage" ADD CONSTRAINT "discount_usage_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_usage" ADD CONSTRAINT "discount_usage_orderId_orders_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniqueUserProductFavoriteIdx" ON "user_favorites" USING btree ("userId","productId");--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_authorId_users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_categoryId_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_categories_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_orders_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_relations" ADD CONSTRAINT "product_relations_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_relations" ADD CONSTRAINT "product_relations_relatedProductId_products_id_fk" FOREIGN KEY ("relatedProductId") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_brandId_brands_id_fk" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interests" ADD CONSTRAINT "user_interests_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interests" ADD CONSTRAINT "user_interests_categoryId_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "providerAccountIdIdx" ON "accounts" USING btree ("provider","providerAccountId");--> statement-breakpoint
CREATE UNIQUE INDEX "uniqueProductRelationIdx" ON "product_relations" USING btree ("productId","relatedProductId");--> statement-breakpoint
CREATE UNIQUE INDEX "uniqueUserCategoryInterestIdx" ON "user_interests" USING btree ("userId","categoryId");--> statement-breakpoint
CREATE UNIQUE INDEX "identifierTokenIdx" ON "verificationtokens" USING btree ("identifier","token");--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "provider_account_id";--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "refresh_token";--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "access_token";--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "expires_at";--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "token_type";--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "id_token";--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "session_state";--> statement-breakpoint
ALTER TABLE "addresses" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "addresses" DROP COLUMN "is_default";--> statement-breakpoint
ALTER TABLE "addresses" DROP COLUMN "full_name";--> statement-breakpoint
ALTER TABLE "addresses" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "addresses" DROP COLUMN "address";--> statement-breakpoint
ALTER TABLE "addresses" DROP COLUMN "postal_code";--> statement-breakpoint
ALTER TABLE "addresses" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "addresses" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "blog_posts" DROP COLUMN "featured_image";--> statement-breakpoint
ALTER TABLE "blog_posts" DROP COLUMN "meta_title";--> statement-breakpoint
ALTER TABLE "blog_posts" DROP COLUMN "meta_description";--> statement-breakpoint
ALTER TABLE "blog_posts" DROP COLUMN "is_published";--> statement-breakpoint
ALTER TABLE "blog_posts" DROP COLUMN "published_at";--> statement-breakpoint
ALTER TABLE "blog_posts" DROP COLUMN "author_id";--> statement-breakpoint
ALTER TABLE "blog_posts" DROP COLUMN "view_count";--> statement-breakpoint
ALTER TABLE "blog_posts" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "blog_posts" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "brands" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "brands" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "brands" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "parent_id";--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "meta_title";--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "meta_description";--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "sort_order";--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "email_logs" DROP COLUMN "message_id";--> statement-breakpoint
ALTER TABLE "email_logs" DROP COLUMN "sent_at";--> statement-breakpoint
ALTER TABLE "email_logs" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "inventory_adjustments" DROP COLUMN "product_id";--> statement-breakpoint
ALTER TABLE "inventory_adjustments" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "inventory_adjustments" DROP COLUMN "created_by";--> statement-breakpoint
ALTER TABLE "inventory_adjustments" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN "order_id";--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN "product_id";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "guest_email";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "guest_name";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "tracking_number";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "stripe_payment_intent_id";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "shipping_address";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "is_guest_order";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "product_attributes" DROP COLUMN "product_id";--> statement-breakpoint
ALTER TABLE "product_relations" DROP COLUMN "product_id";--> statement-breakpoint
ALTER TABLE "product_relations" DROP COLUMN "related_product_id";--> statement-breakpoint
ALTER TABLE "product_relations" DROP COLUMN "relation_type";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "short_description";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "purchase_price";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "discount_price";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "low_stock_threshold";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "meta_title";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "meta_description";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "view_count";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "order_count";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "favorite_count";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "cart_count";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "popularity_score";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "last_score_update";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "purchase_count";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "rating_avg";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "rating_count";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "category_id";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "brand_id";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "is_featured";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "is_new_arrival";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "reviews" DROP COLUMN "product_id";--> statement-breakpoint
ALTER TABLE "reviews" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "reviews" DROP COLUMN "guest_name";--> statement-breakpoint
ALTER TABLE "reviews" DROP COLUMN "guest_email";--> statement-breakpoint
ALTER TABLE "reviews" DROP COLUMN "content";--> statement-breakpoint
ALTER TABLE "reviews" DROP COLUMN "is_verified";--> statement-breakpoint
ALTER TABLE "reviews" DROP COLUMN "is_approved";--> statement-breakpoint
ALTER TABLE "reviews" DROP COLUMN "helpful_votes";--> statement-breakpoint
ALTER TABLE "reviews" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "reviews" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "session_token";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "site_settings" DROP COLUMN "is_public";--> statement-breakpoint
ALTER TABLE "site_settings" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "site_settings" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "user_activities" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "user_activities" DROP COLUMN "session_id";--> statement-breakpoint
ALTER TABLE "user_activities" DROP COLUMN "product_id";--> statement-breakpoint
ALTER TABLE "user_activities" DROP COLUMN "activity_type";--> statement-breakpoint
ALTER TABLE "user_activities" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "user_interests" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "user_interests" DROP COLUMN "category_id";--> statement-breakpoint
ALTER TABLE "user_interests" DROP COLUMN "interest_score";--> statement-breakpoint
ALTER TABLE "user_interests" DROP COLUMN "interaction_count";--> statement-breakpoint
ALTER TABLE "user_interests" DROP COLUMN "last_interaction";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "email_verified";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "reset_token";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "reset_token_expiry";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_trackingNumber_unique" UNIQUE("trackingNumber");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_sessionToken_unique" UNIQUE("sessionToken");