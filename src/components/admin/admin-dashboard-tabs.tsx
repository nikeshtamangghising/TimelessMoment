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
import Button from '@/components/ui/button'
import AdminDashboardContent from './admin-dashboard-content'
import AdminSettingsTab from './admin-settings-tab'

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
        return <AdminDashboardContent />
      case 'settings':
        return <AdminSettingsTab />
      case 'products':
        return (
          <div className="text-center py-16">
            <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Products Management</h3>
            <p className="mt-2 text-gray-500">Products management interface will be implemented here.</p>
          </div>
        )
      case 'categories':
        return (
          <div className="text-center py-16">
            <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Categories Management</h3>
            <p className="mt-2 text-gray-500">Categories management interface will be implemented here.</p>
          </div>
        )
      case 'brands':
        return (
          <div className="text-center py-16">
            <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Brands Management</h3>
            <p className="mt-2 text-gray-500">Brands management interface will be implemented here.</p>
          </div>
        )
      case 'inventory':
        return (
          <div className="text-center py-16">
            <ArchiveBoxIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Inventory Management</h3>
            <p className="mt-2 text-gray-500">Inventory management interface will be implemented here.</p>
          </div>
        )
      case 'orders':
        return (
          <div className="text-center py-16">
            <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Orders Management</h3>
            <p className="mt-2 text-gray-500">Orders management interface will be implemented here.</p>
          </div>
        )
      case 'customers':
        return (
          <div className="text-center py-16">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Customers Management</h3>
            <p className="mt-2 text-gray-500">Customers management interface will be implemented here.</p>
          </div>
        )
      case 'analytics':
        return (
          <div className="text-center py-16">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Analytics Dashboard</h3>
            <p className="mt-2 text-gray-500">Analytics dashboard will be implemented here.</p>
          </div>
        )
      default:
        return <AdminDashboardContent />
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
                      className={`w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <tab.icon
                        className={`mr-3 h-5 w-5 flex-shrink-0 ${
                          isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                      />
                      {tab.name}
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
                  className={`w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <tab.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {tab.name}
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