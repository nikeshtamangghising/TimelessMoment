'use client'

import { useState } from 'react'
import { 
  HomeIcon, 
  ShoppingBagIcon, 
  CubeIcon, 
  UsersIcon, 
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ArchiveBoxIcon,
  FolderIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import { signOut } from 'next-auth/react'
import { useAuth } from '@/hooks/use-auth'
import dynamic from 'next/dynamic'
import Button from '@/components/ui/button'

// Dynamic imports to prevent chunk loading errors
const AdminDashboardContent = dynamic(() => import('./admin-dashboard-content'), {
  loading: () => <div className="flex justify-center items-center py-16">Loading dashboard...</div>
})

const AdminSettingsTab = dynamic(() => import('./admin-settings-tab'), {
  loading: () => <div className="flex justify-center items-center py-16">Loading settings...</div>
})

const AdminProductsTab = dynamic(() => import('./admin-products-tab'), {
  loading: () => <div className="flex justify-center items-center py-16">Loading products...</div>
})

const AdminBrandsTab = dynamic(() => import('./admin-brands-tab'), {
  loading: () => <div className="flex justify-center items-center py-16">Loading brands...</div>
})

const AdminCategoriesTab = dynamic(() => import('./admin-categories-tab'), {
  loading: () => <div className="flex justify-center items-center py-16">Loading categories...</div>
})

const AdminInventoryTab = dynamic(() => import('./admin-inventory-tab'), {
  loading: () => <div className="flex justify-center items-center py-16">Loading inventory...</div>
})

const AdminOrdersTab = dynamic(() => import('./admin-orders-tab'), {
  loading: () => <div className="flex justify-center items-center py-16">Loading orders...</div>
})

const AdminCustomersTab = dynamic(() => import('./admin-customers-tab'), {
  loading: () => <div className="flex justify-center items-center py-16">Loading customers...</div>
})

const AdminAnalyticsTab = dynamic(() => import('./admin-analytics-tab'), {
  loading: () => <div className="flex justify-center items-center py-16">Loading analytics...</div>
})

export type AdminTab = 'dashboard' | 'products' | 'categories' | 'brands' | 'inventory' | 'orders' | 'customers' | 'analytics' | 'settings'

interface TabItem {
  id: AdminTab
  name: string
  icon: any
}

const tabs: TabItem[] = [
  { id: 'dashboard', name: 'Dashboard', icon: HomeIcon },
  { id: 'products', name: 'Products', icon: CubeIcon },
  { id: 'categories', name: 'Categories', icon: FolderIcon },
  { id: 'brands', name: 'Brands', icon: TagIcon },
  { id: 'inventory', name: 'Inventory', icon: ArchiveBoxIcon },
  { id: 'orders', name: 'Orders', icon: ShoppingBagIcon },
  { id: 'customers', name: 'Customers', icon: UsersIcon },
  { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
  { id: 'settings', name: 'Settings', icon: Cog6ToothIcon },
]

export default function AdminDashboardTabs() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboardContent onTabChange={setActiveTab} />
      case 'settings':
        return <AdminSettingsTab />
      case 'products':
        return <AdminProductsTab />
      case 'categories':
        return <AdminCategoriesTab />
      case 'brands':
        return <AdminBrandsTab />
      case 'inventory':
        return <AdminInventoryTab />
      case 'orders':
        return <AdminOrdersTab />
      case 'customers':
        return <AdminCustomersTab />
      case 'analytics':
        return <AdminAnalyticsTab />
      default:
        return <AdminDashboardContent onTabChange={setActiveTab} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
            <div className="flex h-full flex-col">
              {/* Mobile header */}
              <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
                <div className="text-lg font-bold text-indigo-600">
                  E-Shop Admin
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-md hover:bg-gray-100"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 space-y-1 px-4 py-6">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id)
                        setSidebarOpen(false)
                      }}
                      className={`w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm'
                      }`}
                    >
                      <tab.icon
                        className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                          isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                      />
                      <span className="flex-1 text-left">{tab.name}</span>
                      {isActive && (
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      )}
                    </button>
                  )
                })}
              </nav>

              {/* Mobile User info and sign out */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-600">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                </div>
                <div className="mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="w-full justify-start text-gray-700 hover:text-gray-900"
                  >
                    <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:bg-white lg:shadow-lg">
        <div className="flex h-full flex-col">
          {/* Desktop Logo */}
          <div className="flex h-16 items-center justify-center border-b border-gray-200">
            <div className="text-xl font-bold text-indigo-600">
              E-Shop Admin
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="flex-1 space-y-1 px-4 py-6">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm'
                  }`}
                >
                  <tab.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                      isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  <span className="flex-1 text-left">{tab.name}</span>
                  {isActive && (
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Desktop User info and sign out */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-indigo-600">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start text-gray-700 hover:text-gray-900"
              >
                <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center">
              <div className="text-lg font-bold text-indigo-600">
                E-Shop Admin
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <main className="py-4 lg:py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  )
}