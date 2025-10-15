'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ProfileForm from '@/components/account/profile-form'
import AddressBook from '@/components/account/address-book'
import OrderHistory from '@/components/account/order-history'
import { useAuth } from '@/hooks/use-auth'
import Loading from '@/components/ui/loading'

export default function AccountPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin?redirect=/account')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-16">
            <Loading size="lg" />
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!isAuthenticated || !user) {
    return null // Will redirect to signin
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="mt-2 text-gray-600">
            Manage your profile, addresses, and order history
          </p>
        </div>

        {/* User Info Card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-xl font-medium text-indigo-600">
                    {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-500">
                  Member since {new Date((user as any)?.createdAt || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Management Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="addresses">Address Book</TabsTrigger>
            <TabsTrigger value="orders">Order History</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
                <p className="text-sm text-gray-600">
                  Update your personal information and account settings
                </p>
              </CardHeader>
              <CardContent>
                <ProfileForm user={{...user, createdAt: (user as any)?.createdAt || new Date().toISOString()}} />
              </CardContent>
            </Card>
            </div>
          </TabsContent>

          <TabsContent value="addresses">
            <div className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900">Address Book</h3>
                <p className="text-sm text-gray-600">
                  Manage your shipping and billing addresses for faster checkout
                </p>
              </CardHeader>
              <CardContent>
                <AddressBook />
              </CardContent>
            </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900">Order History</h3>
                <p className="text-sm text-gray-600">
                  View and track your previous orders
                </p>
              </CardHeader>
              <CardContent>
                <OrderHistory />
              </CardContent>
            </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
