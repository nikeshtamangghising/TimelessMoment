'use client'

import AdminProtectedRoute from '@/components/admin/admin-protected-route'
import AdminDashboardTabs from '@/components/admin/admin-dashboard-tabs'

export default function AdminDashboard() {
  return (
    <AdminProtectedRoute>
      <AdminDashboardTabs />
    </AdminProtectedRoute>
  )
}
