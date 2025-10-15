import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import FavoritesRepository from '@/lib/favorites-repository';

// Validation schemas
const addToFavoritesSchema = z.object({
  userId: z.string().cuid(),
  productId: z.string().cuid(),
});

const toggleFavoriteSchema = z.object({
  userId: z.string().cuid(),
  productId: z.string().cuid(),
});

const removeFromFavoritesSchema = z.object({
  userId: z.string().cuid(),
  productId: z.string().cuid(),
});

// Add to favorites
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if it's a toggle request
    if (body.action === 'toggle') {
      const validatedData = toggleFavoriteSchema.parse(body);
      
      const result = await FavoritesRepository.toggleFavorite(
        validatedData.userId,
        validatedData.productId
      );

      return NextResponse.json({
        success: true,
        added: result.added,
        message: result.added ? 'Added to favorites' : 'Removed from favorites',
        favorite: result.favorite || null,
      });
    } else {
      // Regular add to favorites
      const validatedData = addToFavoritesSchema.parse(body);
      
      const favorite = await FavoritesRepository.addToFavorites(
        validatedData.userId,
        validatedData.productId
      );

      return NextResponse.json({
        success: true,
        message: 'Added to favorites successfully',
        favorite,
      });
    }
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
      { error: error instanceof Error ? error.message : 'Failed to manage favorites' },
      { status: 400 }
    );
  }
}

// Get user favorites
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const categoryId = searchParams.get('categoryId');
    const summary = searchParams.get('summary') === 'true';
    const availability = searchParams.get('availability') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (summary) {
      // Return favorites summary
      const favoriteSummary = await FavoritesRepository.getFavoritesSummary(userId);
      return NextResponse.json(favoriteSummary);
    } else if (availability) {
      // Return favorites with availability status
      const favorites = await FavoritesRepository.getFavoritesWithAvailability(userId);
      return NextResponse.json({
        favorites,
        count: favorites.length,
      });
    } else if (categoryId) {
      // Return favorites by category
      const favorites = await FavoritesRepository.getFavoritesByCategory(userId, categoryId);
      return NextResponse.json({
        favorites,
        categoryId,
        count: favorites.length,
      });
    } else {
      // Return all favorites
      const [favorites, count] = await Promise.all([
        FavoritesRepository.getFavorites(userId),
        FavoritesRepository.getFavoritesCount(userId),
      ]);

      return NextResponse.json({
        favorites,
        count,
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}

// Remove from favorites
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = removeFromFavoritesSchema.parse(body);

    await FavoritesRepository.removeFromFavorites(
      validatedData.userId,
      validatedData.productId
    );

    return NextResponse.json({
      success: true,
      message: 'Removed from favorites successfully',
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
      { error: error instanceof Error ? error.message : 'Failed to remove from favorites' },
      { status: 400 }
    );
  }
}