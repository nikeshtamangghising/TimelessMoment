import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import CartRepository from '@/lib/cart-repository';

// Validation schemas
const addToCartSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().min(1).max(99).default(1),
  userId: z.string().cuid().optional(),
  sessionId: z.string().optional(),
}).refine(data => data.userId || data.sessionId, {
  message: "Either userId or sessionId must be provided",
});

const updateCartSchema = z.object({
  cartItemId: z.string().cuid(),
  quantity: z.number().int().min(1).max(99),
  userId: z.string().cuid().optional(),
  sessionId: z.string().optional(),
}).refine(data => data.userId || data.sessionId, {
  message: "Either userId or sessionId must be provided",
});

const removeFromCartSchema = z.object({
  cartItemId: z.string().cuid(),
  userId: z.string().cuid().optional(),
  sessionId: z.string().optional(),
}).refine(data => data.userId || data.sessionId, {
  message: "Either userId or sessionId must be provided",
});

// Add to cart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = addToCartSchema.parse(body);

    const identifier = validatedData.userId 
      ? { userId: validatedData.userId }
      : { sessionId: validatedData.sessionId! };

    const cartItem = await CartRepository.addToCart({
      productId: validatedData.productId,
      quantity: validatedData.quantity,
      ...identifier,
    });

    return NextResponse.json({
      success: true,
      message: 'Item added to cart successfully',
      item: cartItem,
    });
  } catch (error) {

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add to cart' },
      { status: 400 }
    );
  }
}

// Get cart items
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    const summary = searchParams.get('summary') === 'true';

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'Either userId or sessionId must be provided' },
        { status: 400 }
      );
    }

    const identifier = userId ? { userId } : { sessionId: sessionId! };

    if (summary) {
      // Return cart summary
      const [items, count, total] = await Promise.all([
        CartRepository.getRecentlyAdded(identifier, 3),
        CartRepository.getCartCount(identifier),
        CartRepository.getCartTotal(identifier),
      ]);

      return NextResponse.json({
        summary: {
          count,
          total,
          recentItems: items,
        },
      });
    } else {
      // Return full cart
      const items = await CartRepository.getCart(identifier);
      const total = await CartRepository.getCartTotal(identifier);

      return NextResponse.json({
        items,
        total,
        count: items.reduce((sum, item) => sum + item.quantity, 0),
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

// Update cart item quantity
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = updateCartSchema.parse(body);

    const identifier = validatedData.userId 
      ? { userId: validatedData.userId }
      : { sessionId: validatedData.sessionId! };

    const updatedItem = await CartRepository.updateQuantity(
      validatedData.cartItemId,
      validatedData.quantity,
      identifier
    );

    return NextResponse.json({
      success: true,
      message: 'Cart item updated successfully',
      item: updatedItem,
    });
  } catch (error) {

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update cart item' },
      { status: 400 }
    );
  }
}

// Remove from cart
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = removeFromCartSchema.parse(body);

    const identifier = validatedData.userId 
      ? { userId: validatedData.userId }
      : { sessionId: validatedData.sessionId! };

    await CartRepository.removeFromCart(validatedData.cartItemId, identifier);

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart successfully',
    });
  } catch (error) {

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove from cart' },
      { status: 400 }
    );
  }
}