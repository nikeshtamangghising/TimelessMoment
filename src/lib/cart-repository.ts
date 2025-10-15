import { prisma } from '@/lib/db';
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
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { 
        id: true, 
        inventory: true, 
        isActive: true,
        name: true,
      },
    });

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
      const result = await prisma.$transaction(async (tx) => {
        // Check if item already exists in cart
        const existingItem = await tx.cart.findFirst({
          where: {
            productId,
            ...(userId ? { userId } : { sessionId }),
          },
        })

        let cartItem;

        if (existingItem) {
          // Update quantity
          const newQuantity = existingItem.quantity + quantity;
          
          if (product.inventory < newQuantity) {
            throw new Error(`Cannot add ${quantity} items. Only ${product.inventory - existingItem.quantity} more can be added`);
          }

          cartItem = await tx.cart.update({
            where: { id: existingItem.id },
            data: { 
              quantity: newQuantity,
              updatedAt: new Date(),
            },
            include: {
              product: {
                include: { category: true },
              },
            },
          });
        } else {
          // Create new cart item
          cartItem = await tx.cart.create({
            data: {
              productId,
              quantity,
              userId,
              sessionId,
            },
            include: {
              product: {
                include: { category: true },
              },
            },
          });
        }

        return cartItem;
      });

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
    const cartItems = await prisma.cart.findMany({
      where: identifier,
      include: {
        product: {
          include: { category: true },
        },
      },
      orderBy: { addedAt: 'desc' },
    });

    // Filter out inactive products or products with no inventory
    return cartItems.filter(item => 
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
    const existingItem = await prisma.cart.findFirst({
      where: {
        id: cartItemId,
        ...identifier,
      },
      include: { product: true },
    });

    if (!existingItem) {
      throw new Error('Cart item not found');
    }

    if (existingItem.product.inventory < quantity) {
      throw new Error(`Only ${existingItem.product.inventory} items available in stock`);
    }

    const updatedItem = await prisma.$transaction(async (tx) => {
      // Update the cart item quantity
      const item = await tx.cart.update({
        where: { id: cartItemId },
        data: { 
          quantity,
          updatedAt: new Date(),
        },
        include: {
          product: true,
        },
      })

      // Track activity for add events (when increasing quantity)
      if (quantity > existingItem.quantity) {
        await ActivityTracker.trackActivity({
          userId: 'userId' in identifier ? identifier.userId : undefined,
          sessionId: 'sessionId' in identifier ? identifier.sessionId : undefined,
          productId: item.productId,
          activityType: 'CART_ADD',
        })
      }

      // Return with category included (consistent with previous return type)
      return await tx.cart.findUnique({
        where: { id: item.id },
        include: {
          product: { include: { category: true } },
        },
      })
    })

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
    const existingItem = await prisma.cart.findFirst({
      where: {
        id: cartItemId,
        ...identifier,
      },
    });

    if (!existingItem) {
      throw new Error('Cart item not found');
    }

    await prisma.cart.delete({
      where: { id: cartItemId },
    });
  }

  /**
   * Clear entire cart
   */
  static async clearCart(identifier: { userId: string } | { sessionId: string }): Promise<void> {
    await prisma.cart.deleteMany({
      where: identifier,
    });
  }

  /**
   * Get cart count
   */
  static async getCartCount(identifier: { userId: string } | { sessionId: string }): Promise<number> {
    const result = await prisma.cart.aggregate({
      where: identifier,
      _sum: { quantity: true },
    });

    return result._sum.quantity || 0;
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
    const sessionCartItems = await prisma.cart.findMany({
      where: { sessionId },
      include: { product: true },
    });

    if (sessionCartItems.length === 0) return;

    await prisma.$transaction(async (tx) => {
      for (const sessionItem of sessionCartItems) {
        // Check if user already has this product in cart
        const existingUserItem = await tx.cart.findFirst({
          where: {
            userId,
            productId: sessionItem.productId,
          },
        });

        if (existingUserItem) {
          // Update quantity (up to inventory limit)
          const newQuantity = Math.min(
            existingUserItem.quantity + sessionItem.quantity,
            sessionItem.product.inventory
          );

          await tx.cart.update({
            where: { id: existingUserItem.id },
            data: { 
              quantity: newQuantity,
              updatedAt: new Date(),
            },
          });
        } else {
          // Create new user cart item
          await tx.cart.create({
            data: {
              userId,
              productId: sessionItem.productId,
              quantity: Math.min(sessionItem.quantity, sessionItem.product.inventory),
            },
          });
        }

        // Remove session cart item
        await tx.cart.delete({
          where: { id: sessionItem.id },
        });
      }
    });
  }

  /**
   * Check if product is in cart
   */
  static async isInCart(
    productId: string,
    identifier: { userId: string } | { sessionId: string }
  ): Promise<boolean> {
    const item = await prisma.cart.findFirst({
      where: {
        productId,
        ...identifier,
      },
    });

    return !!item;
  }

  /**
   * Clean expired session carts
   */
  static async cleanExpiredCarts(daysOld: number = 7): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    await prisma.cart.deleteMany({
      where: {
        userId: null, // Only session carts
        addedAt: { lt: cutoffDate },
      },
    });
  }

  /**
   * Get recently added items
   */
  static async getRecentlyAdded(
    identifier: { userId: string } | { sessionId: string },
    limit: number = 5
  ): Promise<CartItem[]> {
    const items = await prisma.cart.findMany({
      where: identifier,
      include: {
        product: {
          include: { category: true },
        },
      },
      orderBy: { addedAt: 'desc' },
      take: limit,
    });

    return items.filter(item => 
      item.product.isActive && item.product.inventory > 0
    ) as CartItem[];
  }
}

export default CartRepository;