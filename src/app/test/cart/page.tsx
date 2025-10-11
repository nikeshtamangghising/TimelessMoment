'use client'

import { useState } from 'react'
import CartDebug from '@/components/debug/cart-debug'
import CartDebugDetailed from '@/components/debug/cart-debug-detailed'
import CartDebugSimple from '@/components/debug/cart-debug-simple'
import CartProductDebug from '@/components/debug/cart-product-debug'
import CartReferenceDebug from '@/components/debug/cart-reference-debug'
import CartComprehensiveDebug from '@/components/debug/cart-comprehensive-debug'
import MainLayout from '@/components/layout/main-layout'

export default function CartTestPage() {
  const [activeTab, setActiveTab] = useState<'simple' | 'detailed' | 'basic' | 'product' | 'reference' | 'comprehensive'>('basic')

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Cart Testing Page</h1>
        
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('basic')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'basic'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Basic Test
              </button>
              <button
                onClick={() => setActiveTab('simple')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'simple'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Simple Test
              </button>
              <button
                onClick={() => setActiveTab('detailed')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'detailed'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Detailed Test
              </button>
              <button
                onClick={() => setActiveTab('product')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'product'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Product Debug
              </button>
              <button
                onClick={() => setActiveTab('reference')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reference'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Reference Debug
              </button>
              <button
                onClick={() => setActiveTab('comprehensive')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'comprehensive'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Comprehensive Debug
              </button>
            </nav>
          </div>
        </div>
        
        {activeTab === 'basic' ? <CartDebugSimple /> : 
         activeTab === 'simple' ? <CartDebug /> : 
         activeTab === 'detailed' ? <CartDebugDetailed /> :
         activeTab === 'product' ? <CartProductDebug /> :
         activeTab === 'reference' ? <CartReferenceDebug /> :
         <CartComprehensiveDebug />}
      </div>
    </MainLayout>
  )
}