"use client"

import { Suspense } from 'react'
import AdminLayout from '@/components/admin/admin-layout'
import AdminProtectedRoute from '@/components/admin/admin-protected-route'
import Loading from '@/components/ui/loading'
import dynamic from 'next/dynamic'

const AdminAnalyticsTab = dynamic(() => import('@/components/admin/admin-analytics-tab'), {
  loading: () => (
    <div className="flex items-center justify-center py-16">
      <Loading size="lg" />
    </div>
  )
})

function AdminAnalyticsPageContent() {
  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          <AdminAnalyticsTab />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  )
}

export default function AdminAnalyticsPage() {
  return (
    <Suspense fallback={
      <AdminProtectedRoute>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Loading size="lg" />
              <div className="mt-4 text-gray-600">Loading analytics...</div>
            </div>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    }>
      <AdminAnalyticsPageContent />
    </Suspense>
  )
}
