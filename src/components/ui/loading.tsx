import { clsx } from 'clsx'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Loading({ size = 'md', className }: LoadingProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div className={clsx('animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600', sizes[size], className)} suppressHydrationWarning />
  )
}

export function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" suppressHydrationWarning>
      <div className="text-center" suppressHydrationWarning>
        <Loading size="lg" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}