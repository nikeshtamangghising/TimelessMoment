'use client'

import { useEffect, useState } from 'react'
import { 
  UsersIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  EnvelopeIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Loading from '@/components/ui/loading'
import { formatCurrency } from '@/lib/currency'

type Customer = {
  id: string
  name: string
  email: string
  joinedAt: string
  totalOrders: number
  totalSpent: number
  isActive: boolean
  lastOrderDate?: string
  role: string
  emailVerified?: string
}

type CustomersResponse = {
  data: Customer[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function AdminCustomersTab() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    fetchCustomers()
  }, [currentPage, searchQuery, statusFilter])

  const fetchCustomers = async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchQuery,
        status: statusFilter,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })

      const response = await fetch(`/api/customers?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch customers')
      }

      const data: CustomersResponse = await response.json()
      setCustomers(data.data)
      setPagination(data.pagination)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load customers'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchCustomers()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatPrice = (amount: number) => {
    return formatCurrency(amount, 'NPR')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600">Manage your customer accounts and data</p>
        </div>
        <a href="/api/customers/export" target="_blank" rel="noopener noreferrer">
          <Button className="flex items-center space-x-2">
            <UsersIcon className="h-4 w-4" />
            <span>Export Customers</span>
          </Button>
        </a>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Customers</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button type="submit" className="flex items-center space-x-2">
                <MagnifyingGlassIcon className="h-4 w-4" />
                <span>Search</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                  setCurrentPage(1)
                }}
              >
                Clear Filters
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              {customers.length} Customers
            </h2>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loading size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchCustomers}>Try Again</Button>
            </div>
          ) : customers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <UserCircleIcon className="h-10 w-10 text-gray-300" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {customer.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer.totalOrders} orders
                        </div>
                        <div className="text-sm text-gray-500">
                          Joined {formatDate(customer.joinedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPrice(customer.totalSpent)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.lastOrderDate 
                          ? formatDate(customer.lastOrderDate)
                          : 'No orders'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          customer.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {customer.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <a href={`/admin/customers/${customer.id}`}>
                            <Button variant="ghost" size="sm">
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                          </a>
                          <Button variant="ghost" size="sm">
                            <EnvelopeIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <UsersIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No customers found
              </h3>
              <p className="text-gray-500">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Customers will appear here when they create accounts.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} customers
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={currentPage === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <UsersIcon className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">{pagination.total}</h3>
            <p className="text-sm text-gray-500">Total Customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <UsersIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">
              {customers.filter(c => c.isActive).length}
            </h3>
            <p className="text-sm text-gray-500">Active (This Page)</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <UsersIcon className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">
              {formatPrice(customers.reduce((sum, c) => sum + c.totalSpent, 0))}
            </h3>
            <p className="text-sm text-gray-500">Value (This Page)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}