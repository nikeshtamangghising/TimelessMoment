'use client';

import { useEffect, useState } from 'react';
import { ProductWithCategory } from '@/types';
import MainLayout from '@/components/layout/main-layout';
import HeroSection from './hero-section';
import CategoriesSection from './categories-section';
import ProductSection from './product-section';
import RecommendationsSection from './recommendations-section';
import FeaturesSection from './features-section';
import TestimonialsSection from './testimonials-section';

interface HomepageData {
  featured: ProductWithCategory[];
  popular: ProductWithCategory[];
  newArrivals: ProductWithCategory[];
  categories: string[];
}

export default function HomepageClient() {
  const [data, setData] = useState<HomepageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    async function fetchHomepageData() {
      try {
        const response = await fetch('/api/homepage/featured');
        
        if (!response.ok) {
          throw new Error('Failed to fetch homepage data');
        }
        
        const homepageData = await response.json();
        setData(homepageData);
      } catch (err) {
        console.error('Error fetching homepage data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load homepage');
      } finally {
        setLoading(false);
      }
    }

    fetchHomepageData();
  }, [mounted]);

  // Prevent hydration mismatch by not rendering dynamic content until mounted
  if (!mounted) {
    return (
      <MainLayout>
        <div className="min-h-screen">
          <HeroSection />
        </div>
      </MainLayout>
    );
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen">
          <HeroSection />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <p className="text-lg">Loading amazing products...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="min-h-screen">
          <HeroSection />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-red-800 mb-2">
                  Unable to load homepage content
                </h3>
                <p className="text-red-600">
                  {error}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!data) {
    return (
      <MainLayout>
        <div className="min-h-screen">
          <HeroSection />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen">
        <HeroSection />
        
        {data.categories.length > 0 && (
          <CategoriesSection categories={data.categories} />
        )}
        
        {data.featured.length > 0 && (
          <ProductSection
            title="Featured Products"
            subtitle="Discover our handpicked selection of amazing products"
            products={data.featured}
            viewAllLink="/categories"
            variant="featured"
          />
        )}
        
        <RecommendationsSection />
        
        {data.popular.length > 0 && (
          <ProductSection
            title="Popular Choices"
            subtitle="See what everyone else is buying"
            products={data.popular}
            viewAllLink="/categories?sort=popular"
            className="bg-gradient-to-b from-gray-50 to-white"
            variant="popular"
          />
        )}
        
        {data.newArrivals.length > 0 && (
          <ProductSection
            title="New Arrivals"
            subtitle="Check out our latest products"
            products={data.newArrivals}
            viewAllLink="/categories?sort=newest"
            variant="trending"
          />
        )}
        
        <FeaturesSection />
        <TestimonialsSection />
      </div>
    </MainLayout>
  );
}