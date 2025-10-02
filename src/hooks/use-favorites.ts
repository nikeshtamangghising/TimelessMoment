import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { trackActivity } from '@/lib/activity-utils';

export interface FavoriteItem {
  id: string;
  productId: string;
  createdAt: Date;
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

export function useFavorites() {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState<string | null>(null);

  const userId = session?.user?.id;

  // Fetch user's favorites
  const fetchFavorites = useCallback(async () => {
    if (!userId) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/favorites?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
      } else {
        console.error('Failed to fetch favorites');
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load favorites on component mount or when user changes
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Check if a product is in favorites
  const isInFavorites = useCallback((productId: string): boolean => {
    return favorites.some(fav => fav.productId === productId);
  }, [favorites]);

  // Add to favorites
  const addToFavorites = useCallback(async (productId: string): Promise<boolean> => {
    if (!userId) {
      // Could show login modal here
      return false;
    }

    if (isInFavorites(productId)) {
      return true; // Already in favorites
    }

    setOperationLoading(productId);
    
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          productId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFavorites(prev => [...prev, data.favorite]);
        
        // Track activity
        trackActivity({
          productId,
          activityType: 'FAVORITE',
          userId,
        });
        
        return true;
      } else {
        const error = await response.json();
        console.error('Failed to add to favorites:', error.error);
        return false;
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return false;
    } finally {
      setOperationLoading(null);
    }
  }, [userId, isInFavorites]);

  // Remove from favorites
  const removeFromFavorites = useCallback(async (productId: string): Promise<boolean> => {
    if (!userId || !isInFavorites(productId)) {
      return false;
    }

    setOperationLoading(productId);
    
    try {
      const response = await fetch('/api/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          productId,
        }),
      });

      if (response.ok) {
        setFavorites(prev => prev.filter(fav => fav.productId !== productId));
        return true;
      } else {
        const error = await response.json();
        console.error('Failed to remove from favorites:', error.error);
        return false;
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return false;
    } finally {
      setOperationLoading(null);
    }
  }, [userId, isInFavorites]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (productId: string): Promise<boolean> => {
    if (!userId) {
      return false;
    }

    if (isInFavorites(productId)) {
      return await removeFromFavorites(productId);
    } else {
      return await addToFavorites(productId);
    }
  }, [userId, isInFavorites, addToFavorites, removeFromFavorites]);

  // Get favorites count
  const favoritesCount = favorites.length;

  // Check if operation is loading for specific product
  const isOperationLoading = useCallback((productId: string): boolean => {
    return operationLoading === productId;
  }, [operationLoading]);

  return {
    favorites,
    loading,
    isInFavorites,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    favoritesCount,
    isOperationLoading,
    refetch: fetchFavorites,
    isLoggedIn: !!userId,
  };
}