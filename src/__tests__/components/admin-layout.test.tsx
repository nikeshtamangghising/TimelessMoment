import { render, screen, fireEvent } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import AdminLayout from '@/components/admin/admin-layout'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}))

// Mock the auth hook
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'admin123', name: 'Admin User', role: 'ADMIN' },
    isAuthenticated: true,
    isAdmin: true,
    isLoading: false,
  }),
}))

describe('AdminLayout Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(usePathname as jest.Mock).mockReturnValue('/admin')
  })

  it('renders admin layout with navigation', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    )

    expect(screen.getByText('Rijal Decors Valley Admin')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Products')).toBeInTheDocument()
    expect(screen.getByText('Orders')).toBeInTheDocument()
    expect(screen.getByText('Customers')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('highlights active navigation item', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/admin/products')
    
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    )

    const productsLink = screen.getByText('Products').closest('a')
    expect(productsLink).toHaveClass('bg-indigo-100', 'text-indigo-700')
  })

  it('displays user information', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    )

    expect(screen.getByText('Admin User')).toBeInTheDocument()
    expect(screen.getByText('Administrator')).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument() // User initial
  })

  it('handles sign out', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    )

    const signOutButton = screen.getByText('Sign Out')
    fireEvent.click(signOutButton)

    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' })
  })

  it('renders children content', () => {
    const testContent = <div data-testid="test-content">Custom Admin Content</div>
    
    render(
      <AdminLayout>
        {testContent}
      </AdminLayout>
    )

    expect(screen.getByTestId('test-content')).toBeInTheDocument()
    expect(screen.getByText('Custom Admin Content')).toBeInTheDocument()
  })

  it('shows correct navigation structure', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    )

    // Check that all navigation items are present and are links
    const navigationItems = [
      'Dashboard',
      'Products', 
      'Orders',
      'Customers',
      'Analytics',
      'Settings'
    ]

    navigationItems.forEach(item => {
      const link = screen.getByText(item).closest('a')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href')
    })
  })

  it('applies correct styling for non-active items', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/admin')
    
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    )

    const productsLink = screen.getByText('Products').closest('a')
    expect(productsLink).toHaveClass('text-gray-700')
    expect(productsLink).not.toHaveClass('bg-indigo-100')
  })
})