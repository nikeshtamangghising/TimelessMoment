'use client'

import Link from 'next/link'
import { formatCurrency, getFreeShippingThreshold, DEFAULT_CURRENCY } from '@/lib/currency'

export default function SimpleHomepage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center text-white">
        <div className="text-center max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Welcome to Our Store
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Discover amazing products at unbeatable prices
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/products"
              className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              Shop Now
            </Link>
            <Link 
              href="/categories"
              className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Browse Categories
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
              ✨ Explore Categories
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Shop by Category
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our carefully curated collections across different categories
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: 'Electronics', icon: '📱', gradient: 'from-blue-500 to-cyan-500' },
              { name: 'Clothing', icon: '👕', gradient: 'from-pink-500 to-rose-500' },
              { name: 'Books', icon: '📚', gradient: 'from-amber-500 to-orange-500' },
              { name: 'Home & Garden', icon: '🏠', gradient: 'from-green-500 to-emerald-500' },
              { name: 'Sports', icon: '⚽', gradient: 'from-red-500 to-pink-500' },
              { name: 'Beauty', icon: '💄', gradient: 'from-purple-500 to-pink-500' },
              { name: 'Toys', icon: '🧸', gradient: 'from-yellow-500 to-orange-500' },
              { name: 'Automotive', icon: '🚗', gradient: 'from-gray-500 to-slate-600' }
            ].map((category) => (
              <Link
                key={category.name}
                href={`/products?category=${category.name}`}
                className="group bg-white rounded-2xl p-8 text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100"
              >
                <div className={`w-20 h-20 bg-gradient-to-br ${category.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}>
                  <span className="text-3xl">
                    {category.icon}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-gray-900 group-hover:text-gray-700 transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-500 mt-2">Explore Collection</p>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/categories"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              View All Categories
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-gray-100 text-gray-800 rounded-full text-sm font-medium mb-4">
              ⭐ Why Choose Us
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Shopping Made Simple
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're committed to providing you with the best shopping experience possible
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '🚚', title: 'Free Shipping', desc: `Free delivery on orders over ${formatCurrency(getFreeShippingThreshold(), DEFAULT_CURRENCY)}. Fast and reliable shipping worldwide.`, gradient: 'from-blue-500 to-cyan-500' },
              { icon: '🔒', title: 'Secure Payment', desc: 'Your payment information is encrypted and secure with industry-standard protection.', gradient: 'from-green-500 to-emerald-500' },
              { icon: '🔄', title: 'Easy Returns', desc: '30-day hassle-free returns. Not satisfied? Get your money back, no questions asked.', gradient: 'from-purple-500 to-pink-500' },
              { icon: '💬', title: '24/7 Support', desc: 'Our friendly customer support team is here to help you anytime, anywhere.', gradient: 'from-orange-500 to-red-500' },
              { icon: '🎁', title: 'Loyalty Rewards', desc: 'Earn points with every purchase and unlock exclusive rewards and discounts.', gradient: 'from-indigo-500 to-purple-500' },
              { icon: '💳', title: 'Flexible Payment', desc: 'Multiple payment options including buy now, pay later with 0% interest.', gradient: 'from-pink-500 to-rose-500' }
            ].map((feature, index) => (
              <div 
                key={feature.title}
                className="group relative p-8 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6 transform group-hover:scale-110 transition-all duration-500 shadow-lg`}>
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium mb-4">
              ⭐ Customer Reviews
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Don't just take our word for it. Here's what real customers have to say.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah Johnson', role: 'Fashion Enthusiast', review: 'Amazing quality products and lightning-fast delivery! I\'ve been shopping here for over a year and they never disappoint.', rating: 5 },
              { name: 'Michael Chen', role: 'Tech Professional', review: 'The best online shopping experience I\'ve ever had. Great prices, authentic products, and incredible customer service.', rating: 5 },
              { name: 'Emily Rodriguez', role: 'Small Business Owner', review: 'I love how easy it is to find exactly what I need. The search functionality is excellent and delivery is always on time.', rating: 5 }
            ].map((testimonial, index) => (
              <div 
                key={testimonial.name}
                className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">⭐</span>
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6">
                  "{testimonial.review}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-bold">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <div className="inline-flex items-center space-x-8 text-gray-500">
              <div className="flex items-center">
                <span className="text-yellow-400 text-xl mr-1">⭐</span>
                <span className="font-semibold text-gray-900">4.9/5</span>
                <span className="ml-1">Average Rating</span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
              <div>
                <span className="font-semibold text-gray-900">10,000+</span>
                <span className="ml-1">Happy Customers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Stay Updated
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Get exclusive deals and updates delivered to your inbox
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-3 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="px-8 py-3 bg-blue-600 rounded-full font-semibold hover:bg-blue-700 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}