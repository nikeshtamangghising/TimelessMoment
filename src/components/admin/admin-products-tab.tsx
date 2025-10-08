'use client'

import React from 'react'
import { CubeIcon } from '@heroicons/react/24/outline'

export default function AdminProductsTab() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Products Management</h2>
        <p className="text-gray-500">Manage your product catalog.</p>
      </div>
      <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
        <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Product Management Interface</h3>
        <p className="mt-2 text-gray-500">
          This is where the interface for adding, editing, and deleting products will be.
        </p>
      </div>
    </div>
  )
}
