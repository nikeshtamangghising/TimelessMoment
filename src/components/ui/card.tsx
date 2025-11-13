import { HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-white border border-gray-200',
      outlined: 'bg-white border-2 border-gray-300',
      elevated: 'bg-white shadow-lg border border-gray-100',
    }

    return (
      <div
        ref={ref}
        className={clsx(
          'rounded-lg',
          variants[variant],
          className
        )}
        {...props}
        suppressHydrationWarning
      />
    )
  }
)

Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx('px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200', className)}
      {...props}
      suppressHydrationWarning
    />
  )
)

CardHeader.displayName = 'CardHeader'

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx('px-4 py-3 sm:px-6 sm:py-4', className)}
      {...props}
      suppressHydrationWarning
    />
  )
)

CardContent.displayName = 'CardContent'

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={clsx('text-lg font-semibold leading-6 text-gray-900', className)}
      {...props}
      suppressHydrationWarning
    />
  )
)

CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={clsx('text-sm text-gray-600 mt-1', className)}
      {...props}
      suppressHydrationWarning
    />
  )
)

CardDescription.displayName = 'CardDescription'

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx('px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-200', className)}
      {...props}
      suppressHydrationWarning
    />
  )
)

CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter }