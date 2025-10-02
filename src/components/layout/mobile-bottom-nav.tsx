'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  Squares2X2Icon, 
  ShoppingBagIcon, 
  UserIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { 
  HomeIcon as HomeIconSolid, 
  Squares2X2Icon as Squares2X2IconSolid, 
  ShoppingBagIcon as ShoppingBagIconSolid, 
  UserIcon as UserIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid
} from '@heroicons/react/24/solid'
import { useCartStore } from '@/stores/cart-store'
import { useAuth } from '@/hooks/use-auth'

export default function MobileBottomNav() {
  const pathname = usePathname()
  const { getTotalItems, openCart } = useCartStore()
  const { isAuthenticated } = useAuth()

  const navigation = [
    {
      name: 'Home',
      href: '/',
      icon: HomeIcon,
      iconActive: HomeIconSolid,
      isActive: pathname === '/'
    },
    {
      name: 'Categories',
      href: '/categories',
      icon: Squares2X2Icon,
      iconActive: Squares2X2IconSolid,
      isActive: pathname === '/categories'
    },
    {
      name: 'Search',
      href: '/search',
      icon: MagnifyingGlassIcon,
      iconActive: MagnifyingGlassIconSolid,
      isActive: pathname === '/search'
    },
    {
      name: 'Cart',
      href: '#',
      icon: ShoppingBagIcon,
      iconActive: ShoppingBagIconSolid,
      isActive: false,
      isCart: true
    },
    {
      name: 'Profile',
      href: isAuthenticated ? '/account' : '/auth/signin',
      icon: UserIcon,
      iconActive: UserIconSolid,
      isActive: pathname === '/account' || pathname.startsWith('/auth')
    }
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex">
        {navigation.map((item) => {
          const Icon = item.isActive ? item.iconActive : item.icon
          
          if (item.isCart) {
            return (
              <button
                key={item.name}
                onClick={openCart}
                className={`flex-1 flex flex-col items-center justify-center px-2 py-2 text-xs font-medium transition-colors ${
                  item.isActive
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="relative">
                  <Icon className="h-6 w-6" />
                  {getTotalItems() > 0 && (
                    <div className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {getTotalItems() > 99 ? '99+' : getTotalItems()}
                    </div>
                  )}
                </div>
                <span className="mt-1">{item.name}</span>
              </button>
            )
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center px-2 py-2 text-xs font-medium transition-colors ${
                item.isActive
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="mt-1">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}