import { db } from '@/lib/db';
import { cartItems, products, categories } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { ActivityTracker } from './activity-tracker';

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  addedAt: Date;
  updatedAt: Date;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    discountPrice?: number;
    images: string[];
    inventory: number;
    isActive: boolean;
    category: {
      name: string;
    };
  };
}

export interface AddToCartData {
  productId: string;
  quantity?: number;
  userId?: string;
  sessionId?: string;
}

export class CartRepository {
  /**
   * Add item to cart
   */
  static async addToCart(data: AddToCartData): Promise<CartItem> {
    const { productId, quantity = 1, userId, sessionId } = data;

    if (!userId && !sessionId) {
      throw new Error('Either userId or sessionId must be provided');
    }

    // Check if product exists and is available
    const productResult = await db.select({
      id: products.id,
      inventory: products.inventory,
      isActive: products.isActive,
      name: products.name,
    })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
    
    const product = productResult[0];

    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.isActive) {
      throw new Error('Product is not available');
    }

    if (product.inventory < quantity) {
      throw new Error(`Only ${product.inventory} items available in stock`);
    }

    try {
      // Check if item already exists in cart
      const whereConditions = [eq(cartItems.productId, productId)];
      if (userId) {
        whereConditions.push(eq(cartItems.userId, userId));
      } else {
        whereConditions.push(eq(cartItems.sessionId, sessionId!));
      }

      const existingItems = await db.select()
        .from(cartItems)
        .where(and(...whereConditions))
        .limit(1);
      
      const existingItem = existingItems[0];
      let result;

      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity;
        
        if (product.inventory < newQuantity) {
          throw new Error(`Cannot add ${quantity} items. Only ${product.inventory - existingItem.quantity} more can be added`);
        }

        await db.update(cartItems)
          .set({ 
            quantity: newQuantity,
            updatedAt: new Date(),
          })
          .where(eq(cartItems.id, existingItem.id));
        
        // Fetch with product and category
        result = await db.query.cartItems.findFirst({
          where: eq(cartItems.id, existingItem.id),
          with: {
            product: {
              with: {
                category: true,
              },
            },
          },
        });
      } else {
        // Create new cart item
        const insertData: any = {
          productId,
          quantity,
        };
        if (userId) insertData.userId = userId;
        if (sessionId) insertData.sessionId = sessionId;

        const insertResult = await db.insert(cartItems)
          .values(insertData)
          .returning();
        
        // Fetch with product and category
        result = await db.query.cartItems.findFirst({
          where: eq(cartItems.id, insertResult[0].id),
          with: {
            product: {
              with: {
                category: true,
              },
            },
          },
        });
      }

      // Track activity
      await ActivityTracker.trackActivity({
        userId,
        sessionId,
        productId,
        activityType: 'CART_ADD',
      });

      return result as CartItem;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get cart items for user or session
   */
  static async getCart(identifier: { userId: string } | { sessionId: string }): Promise<CartItem[]> {
    const whereCondition = 'userId' in identifier 
      ? eq(cartItems.userId, identifier.userId)
      : eq(cartItems.sessionId, identifier.sessionId);

    const items = await db.query.cartItems.findMany({
      where: whereCondition,
      with: {
        product: {
          with: {
            category: true,
          },
        },
      },
      orderBy: (cartItems, { desc }) => [desc(cartItems.createdAt)],
    });

    // Filter out inactive products or products with no inventory
    return items.filter(item => 
      item.product.isActive && item.product.inventory > 0
    ) as CartItem[];
  }

  /**
   * Update cart item quantity
   */
  static async updateQuantity(
    cartItemId: string,
    quantity: number,
    identifier: { userId: string } | { sessionId: string }
  ): Promise<CartItem> {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    // Verify ownership
    const whereConditions = [eq(cartItems.id, cartItemId)];
    if ('userId' in identifier) {
      whereConditions.push(eq(cartItems.userId, identifier.userId));
    } else {
      whereConditions.push(eq(cartItems.sessionId, identifier.sessionId));
    }

    const existingItems = await db.query.cartItems.findMany({
      where: and(...whereConditions),
      with: { product: true },
      limit: 1,
    });
    
    const existingItem = existingItems[0];

    if (!existingItem) {
      throw new Error('Cart item not found');
    }

    if (existingItem.product.inventory < quantity) {
      throw new Error(`Only ${existingItem.product.inventory} items available in stock`);
    }

    // Update the cart item quantity
    await db.update(cartItems)
      .set({ 
        quantity,
        updatedAt: new Date(),
      })
      .where(eq(cartItems.id, cartItemId));

    // Track activity for add events (when increasing quantity)
    if (quantity > existingItem.quantity) {
      await ActivityTracker.trackActivity({
        userId: 'userId' in identifier ? identifier.userId : undefined,
        sessionId: 'sessionId' in identifier ? identifier.sessionId : undefined,
        productId: existingItem.productId,
        activityType: 'CART_ADD',
      });
    }

    // Return with category included (consistent with previous return type)
    const updatedItem = await db.query.cartItems.findFirst({
      where: eq(cartItems.id, cartItemId),
      with: {
        product: { with: { category: true } },
      },
    });

    return updatedItem as CartItem;
  }

  /**
   * Remove item from cart
   */
  static async removeFromCart(
    cartItemId: string,
    identifier: { userId: string } | { sessionId: string }
  ): Promise<void> {
    // Verify ownership
    const whereConditions = [eq(cartItems.id, cartItemId)];
    if ('userId' in identifier) {
      whereConditions.push(eq(cartItems.userId, identifier.userId));
    } else {
      whereConditions.push(eq(cartItems.sessionId, identifier.sessionId));
    }

    const existingItems = await db.select()
      .from(cartItems)
      .where(and(...whereConditions))
      .limit(1);

    if (existingItems.length === 0) {
      throw new Error('Cart item not found');
    }

    await db.delete(cartItems)
      .where(eq(cartItems.id, cartItemId));
  }

  /**
   * Clear entire cart
   */
  static async clearCart(identifier: { userId: string } | { sessionId: string }): Promise<void> {
    const whereCondition = 'userId' in identifier 
      ? eq(cartItems.userId, identifier.userId)
      : eq(cartItems.sessionId, identifier.sessionId);

    await db.delete(cartItems)
      .where(whereCondition);
  }

  /**
   * Get cart count
   */
  static async getCartCount(identifier: { userId: string } | { sessionId: string }): Promise<number> {
    const whereCondition = 'userId' in identifier 
      ? eq(cartItems.userId, identifier.userId)
      : eq(cartItems.sessionId, identifier.sessionId);

    const result = await db.select({
      total: sql<number>`COALESCE(SUM(${cartItems.quantity}), 0)`,
    })
    .from(cartItems)
    .where(whereCondition);

    return Number(result[0]?.total || 0);
  }

  /**
   * Get cart total
   */
  static async getCartTotal(identifier: { userId: string } | { sessionId: string }): Promise<number> {
    const cartItems = await this.getCart(identifier);
    
    return cartItems.reduce((total, item) => {
      const price = item.product.discountPrice || item.product.price;
      return total + (price * item.quantity);
    }, 0);
  }

  /**
   * Merge session cart with user cart (for login)
   */
  static async mergeSessionCart(sessionId: string, userId: string): Promise<void> {
    const sessionCartItems = await db.query.cartItems.findMany({
      where: eq(cartItems.sessionId, sessionId),
      with: { product: true },
    });

    if (sessionCartItems.length === 0) return;

    for (const sessionItem of sessionCartItems) {
      // Check if user already has this product in cart
      const existingUserItems = await db.select()
        .from(cartItems)
        .where(and(
          eq(cartItems.userId, userId),
          eq(cartItems.productId, sessionItem.productId)
        ))
        .limit(1);

      const existingUserItem = existingUserItems[0];

      if (existingUserItem) {
        // Update quantity (up to inventory limit)
        const newQuantity = Math.min(
          existingUserItem.quantity + sessionItem.quantity,
          sessionItem.product.inventory
        );

        await db.update(cartItems)
          .set({ 
            quantity: newQuantity,
            updatedAt: new Date(),
          })
          .where(eq(cartItems.id, existingUserItem.id));
      } else {
        // Create new user cart item
        await db.insert(cartItems)
          .values({
            userId,
            productId: sessionItem.productId,
            quantity: Math.min(sessionItem.quantity, sessionItem.product.inventory),
          });
      }

      // Remove session cart item
      await db.delete(cartItems)
        .where(eq(cartItems.id, sessionItem.id));
    }
  }

  /**
   * Check if product is in cart
   */
  static async isInCart(
    productId: string,
    identifier: { userId: string } | { sessionId: string }
  ): Promise<boolean> {
    const whereConditions = [eq(cartItems.productId, productId)];
    if ('userId' in identifier) {
      whereConditions.push(eq(cartItems.userId, identifier.userId));
    } else {
      whereConditions.push(eq(cartItems.sessionId, identifier.sessionId));
    }

    const items = await db.select()
      .from(cartItems)
      .where(and(...whereConditions))
      .limit(1);

    return items.length > 0;
  }

  /**
   * Clean expired session carts
   */
  static async cleanExpiredCarts(daysOld: number = 7): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    await db.delete(cartItems)
      .where(and(
        sql`${cartItems.userId} IS NULL`,
        sql`${cartItems.createdAt} < ${cutoffDate}`
      ));
  }

  /**
   * Get recently added items
   */
  static async getRecentlyAdded(
    identifier: { userId: string } | { sessionId: string },
    limit: number = 5
  ): Promise<CartItem[]> {
    const whereCondition = 'userId' in identifier 
      ? eq(cartItems.userId, identifier.userId)
      : eq(cartItems.sessionId, identifier.sessionId);

    const items = await db.query.cartItems.findMany({
      where: whereCondition,
      with: {
        product: {
          with: { category: true },
        },
      },
      orderBy: (cartItems, { desc }) => [desc(cartItems.createdAt)],
      limit,
    });

    return items.filter(item => 
      item.product.isActive && item.product.inventory > 0
    ) as CartItem[];
  }
}

export default CartRepository;