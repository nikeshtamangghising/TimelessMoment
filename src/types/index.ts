import { User, Product, Order, OrderItem, Role, OrderStatus, InventoryChangeType, Category, Brand, Address, AddressType, Review, EmailLog } from '@prisma/client'

// Re-export Prisma types
export type { User, Product, Order, OrderItem, Role, OrderStatus, InventoryChangeType, Category, Brand, Address, AddressType, Review, EmailLog }

// Extended types with relations
export type UserWithOrders = User & {
  orders: Order[]
}

export type ProductWithCategory = Product & {
  category: Category
  brand?: Brand | null
}

export type OrderWithItems = Order & {
  items: (OrderItem & {
    product: Product & {
      category?: Category
    }
  })[]
  user?: User | null
}

export type OrderItemWithProduct = OrderItem & {
  product: Product
}

// API Response types
export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
}

// Cart types
export type CartItem = {
  productId: string
  quantity: number
  product: Product
}

export type Cart = {
  items: CartItem[]
  total: number
}

// Form types
export type CreateProductData = {
  name: string
  description: string
  price: number
  images: string[]
  inventory: number
  lowStockThreshold: number
  category: string
  slug: string
}

export type UpdateProductData = Partial<CreateProductData>

export type CreateOrderData = {
  userId: string
  items: {
    productId: string
    quantity: number
    price: number
  }[]
  total: number
}

export type CreateGuestOrderData = {
  guestEmail: string
  guestName: string
  items: {
    productId: string
    quantity: number
    price: number
  }[]
  total: number
  shippingAddress: {
    fullName: string
    email: string
    phone?: string
    address: string
    city: string
    postalCode: string
  }
}

// Filter and pagination types
export type ProductFilters = {
  category?: string
  minPrice?: number
  maxPrice?: number
  search?: string
  isActive?: boolean
}

export type PaginationParams = {
  page?: number
  limit?: number
}

export type PaginatedResponse<T> = {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Inventory types
export type InventoryUpdate = {
  productId: string
  quantity: number
}

export type InventoryAdjustment = {
  id: string
  productId: string
  quantity: number
  type: InventoryChangeType
  reason: string
  createdBy?: string
  createdAt: Date
}

export type InventoryAdjustmentWithProduct = InventoryAdjustment & {
  product: {
    id: string
    name: string
    slug: string
  }
}

export type InventorySummary = {
  totalProducts: number
  lowStockProducts: Product[]
  outOfStockProducts: Product[]
  totalValue: number
  recentAdjustments: InventoryAdjustmentWithProduct[]
}

// Additional comprehensive types for production
export interface ErrorWithMessage {
  message: string
}

export interface FileWithPreview extends File {
  preview?: string
}

export interface SearchFilters {
  category?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  rating?: number
  sortBy?: 'name' | 'price' | 'rating' | 'created'
  sortOrder?: 'asc' | 'desc'
}

export interface SearchParams {
  q?: string
  page?: number
  limit?: number
  filters?: SearchFilters
}

// Authentication types
export interface AuthUser {
  id: string
  email: string
  name: string | null
  role: Role
}

// Payment types
export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: string
  clientSecret?: string
}

export interface PaymentMethod {
  id: string
  type: string
  card?: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
}

// Analytics types
export interface AnalyticsData {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  averageOrderValue: number
  conversionRate: number
  topProducts: Array<{
    id: string
    name: string
    revenue: number
    orders: number
  }>
  revenueByDate: Array<{
    date: string
    revenue: number
    orders: number
  }>
}

// Settings types
export interface Settings {
  siteName: string
  siteDescription: string
  siteUrl: string
  contactEmail: string
  currency: string
  taxRate: number
  shippingRates: Record<string, number>
  paymentMethods: string[]
  emailTemplates: Record<string, string>
  socialMedia: Record<string, string>
  seoSettings: Record<string, string>
}

// Cache types
export interface CacheOptions {
  ttl?: number
  tags?: string[]
}

export interface CacheEntry<T = unknown> {
  data: T
  timestamp: number
  ttl: number
  tags?: string[]
}

// Event types
export interface ActivityEvent {
  type: string
  userId?: string
  sessionId?: string
  data: Record<string, unknown>
  timestamp: Date
  userAgent?: string
  ipAddress?: string
}

// Performance types
export interface PerformanceMetrics {
  pageLoadTime: number
  timeToFirstByte: number
  timeToInteractive: number
  cumulativeLayoutShift: number
  firstContentfulPaint: number
  largestContentfulPaint: number
}

// Email template types
export interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

export interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

// Webhook types
export interface WebhookEvent {
  id: string
  type: string
  data: Record<string, unknown>
  timestamp: number
  signature: string
}

// Component prop types
export interface ImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  loading?: 'lazy' | 'eager'
  quality?: number
  sizes?: string
}

export interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
  className?: string
  onClick?: () => void
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

// Form data types
export interface ProductFormData {
  name: string
  description: string
  slug: string
  price: number
  compareAtPrice: number | null
  sku: string
  barcode: string
  images: string[]
  category: string
  brand: string
  inventory: number
  lowStockThreshold: number
  isActive: boolean
  weight: number | null
  dimensions: Record<string, number | string> | null
  tags: string[]
  seoTitle: string
  seoDescription: string
  specifications: Record<string, string | number | boolean> | null
}

export interface BrandFormData {
  name: string
  slug: string
  description: string
  logo: string
  website: string
  isActive: boolean
  sortOrder: number
  seoTitle: string
  seoDescription: string
}

export interface CategoryFormData {
  name: string
  slug: string
  description: string
  image: string
  parentId: string | null
  isActive: boolean
  sortOrder: number
  seoTitle: string
  seoDescription: string
}

export interface CustomerInfo {
  name: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  country: string
}

// Type guards
export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  )
}

export function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as Record<string, unknown>).success === 'boolean'
  )
}

// Utility types
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>
export type RequiredExcept<T, K extends keyof T> = Required<T> & Partial<Pick<T, K>>
export type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateInput<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>

// Form validation types
export interface ValidationError {
  field: string
  message: string
}

export interface FormState<T = Record<string, unknown>> {
  data: T
  errors: ValidationError[]
  isSubmitting: boolean
  isValid: boolean
}
