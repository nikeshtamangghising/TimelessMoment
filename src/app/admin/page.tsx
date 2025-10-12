'use client'

import AdminProtectedRoute from '@/components/admin/admin-protected-route'
import AdminDashboardTabs from '@/components/admin/admin-dashboard-tabs'
import AdminErrorBoundary from '@/components/admin/admin-error-boundary'

export default function AdminDashboard() {
  return (
    <AdminErrorBoundary>
      <AdminProtectedRoute>
        <AdminDashboardTabs />
      </AdminProtectedRoute>
    </AdminErrorBoundary>
  )
}
