'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon, SparklesIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 md:py-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-gray-100/[0.03] bg-[size:60px_60px]"></div>
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          {/* Small Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium mb-6">
            <SparklesIcon className="w-4 h-4 mr-2" />
            New Arrivals • Free Shipping Over $50
          </div>
          
          {/* Main Headline - More Product Focused */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900 leading-tight">
            Find Your Perfect
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Product Today
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Discover thousands of products at unbeatable prices with fast, free delivery.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Link href="/categories">
            <Button 
              size="lg" 
              className="group bg-indigo-600 hover:bg-indigo-700 px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <ShoppingBagIcon className="w-5 h-5 mr-2" />
              Shop Now
              <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          
          <Link href="/categories?sort=deals">
            <Button 
              variant="outline" 
              size="lg" 
              className="group border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 hover:scale-105"
            >
              View Deals
              <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Key Features - More Commerce Focused */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-lg font-semibold text-gray-900 mb-2">Free Shipping</div>
            <div className="text-gray-600">On orders over $50</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="text-lg font-semibold text-gray-900 mb-2">Fast Delivery</div>
            <div className="text-gray-600">2-day shipping available</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-lg font-semibold text-gray-900 mb-2">Secure Checkout</div>
            <div className="text-gray-600">256-bit SSL encryption</div>
          </div>
        </div>
      </div>
    </section>
  );
}
