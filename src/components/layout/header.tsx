'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { signOut } from 'next-auth/react'
import Button from '@/components/ui/button'
import { UserIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import ProfileDropdown from './profile-dropdown'
import CartIcon from '@/components/cart/cart-icon'
import SearchAutocomplete from '@/components/search/search-autocomplete'

export default function Header() {
  const { user, isAuthenticated, isAdmin } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
    // Close profile dropdown when opening mobile menu
    if (!isMobileMenuOpen) {
      setIsProfileDropdownOpen(false)
    }
  }


  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900 hover:text-indigo-600">
              E-Shop
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <SearchAutocomplete className="w-full" />
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/categories"
              className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium"
            >
              Categories
            </Link>
            {isAuthenticated ? (
              <Link
                href="/orders"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium"
              >
                My Orders
              </Link>
            ) : (
              <Link
                href="/guest-orders"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium"
              >
                Track Orders
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                className="text-indigo-600 hover:text-indigo-800 px-3 py-2 text-sm font-medium"
              >
                Admin
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Cart */}
            <CartIcon />

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              onClick={toggleMobileMenu}
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              )}
            </button>

            {/* Desktop User menu */}
            <div className="hidden md:flex md:items-center md:space-x-3 relative">
              {isAuthenticated ? (
                <>
                  {/* Profile Icon Button */}
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(!isProfileDropdownOpen)
                      // Close mobile menu when opening profile dropdown
                      if (!isProfileDropdownOpen) {
                        setIsMobileMenuOpen(false)
                      }
                    }}
                    className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-600">
                        {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-700 hidden lg:block">
                      {user?.name}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Profile Dropdown */}
                  <ProfileDropdown
                    user={user!}
                    isOpen={isProfileDropdownOpen}
                    onClose={() => setIsProfileDropdownOpen(false)}
                  />
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/auth/signin">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          {/* Mobile Search */}
          <div className="px-4 py-3 border-b border-gray-200">
            <SearchAutocomplete 
              className="w-full" 
              onClose={() => setIsMobileMenuOpen(false)}
            />
          </div>
          <div className="px-4 py-3 space-y-1">
            <Link
              href="/categories"
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Categories
            </Link>
            {isAuthenticated ? (
              <Link
                href="/orders"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                My Orders
              </Link>
            ) : (
              <Link
                href="/guest-orders"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Track Orders
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                className="block px-3 py-2 text-base font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Admin
              </Link>
            )}
            
            {/* Mobile User Menu */}
            <div className="border-t border-gray-200 pt-3 mt-3">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(!isProfileDropdownOpen)
                      // Close mobile menu when opening profile dropdown
                      if (!isProfileDropdownOpen) {
                        setIsMobileMenuOpen(false)
                      }
                    }}
                    className="flex items-center w-full px-3 py-2 text-left"
                  >
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-indigo-600">
                        {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Mobile Profile Dropdown */}
                  <div className="mt-2">
                    <ProfileDropdown
                      user={user!}
                      isOpen={isProfileDropdownOpen}
                      onClose={() => setIsProfileDropdownOpen(false)}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <Link
                    href="/auth/signin"
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block px-3 py-2 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}