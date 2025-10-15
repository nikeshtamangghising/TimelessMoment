import { wrapEmailTemplate } from './email'
import { Order, Product, User } from '@/types'

export interface OrderConfirmationData {
  order: Order
  user: User
  orderItems: Array<{
    product: Product
    quantity: number
    price: number
  }>
}

export interface OrderStatusUpdateData {
  order: Order
  user: User
  previousStatus: string
  newStatus: string
}

export interface PasswordResetData {
  user: User
  resetToken: string
  resetUrl: string
}

export interface WelcomeEmailData {
  user: {
    name: string
    email: string
  }
}

export interface PaymentFailureData {
  user: User
  paymentIntentId: string
  amount: number
  failureReason: string
}

export function generateOrderConfirmationEmail(data: OrderConfirmationData): { subject: string; html: string; text: string } {
  const { order, user, orderItems } = data
  
  const itemsHtml = orderItems.map(item => `
    <tr>
      <td>${item.product.name}</td>
      <td class="text-center">${item.quantity}</td>
      <td class="text-right">$${item.price.toFixed(2)}</td>
      <td class="text-right">$${(item.quantity * item.price).toFixed(2)}</td>
    </tr>
  `).join('')

  const content = `
    <h1>Order Confirmation</h1>
    <p>Hi ${user.name || user.email},</p>
    <p>Thank you for your order! We've received your payment and are preparing your items for shipment.</p>
    
    <div class="mt-4 mb-4">
      <strong>Order Details:</strong><br>
      Order Number: <strong>#${order.id}</strong><br>
      Order Date: ${new Date(order.createdAt).toLocaleDateString()}<br>
      Status: <strong>${order.status}</strong>
    </div>

    <h2>Items Ordered:</h2>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th class="text-center">Quantity</th>
          <th class="text-right">Price</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3"><strong>Total Amount:</strong></td>
          <td class="text-right"><strong>$${order.total.toFixed(2)}</strong></td>
        </tr>
      </tfoot>
    </table>

    <div class="mt-4">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/orders/${order.id}" class="button">
        View Order Details
      </a>
    </div>

    <p>We'll send you another email when your order ships. If you have any questions, please don't hesitate to contact our support team.</p>
  `

  const textContent = `
Order Confirmation

Hi ${user.name || user.email},

Thank you for your order! We've received your payment and are preparing your items for shipment.

Order Details:
Order Number: #${order.id}
Order Date: ${new Date(order.createdAt).toLocaleDateString()}
Status: ${order.status}

Items Ordered:
${orderItems.map(item => 
  `${item.product.name} - Qty: ${item.quantity} - $${item.price.toFixed(2)} each - Total: $${(item.quantity * item.price).toFixed(2)}`
).join('\n')}

Total Amount: $${order.total.toFixed(2)}

View your order: ${process.env.NEXT_PUBLIC_SITE_URL}/orders/${order.id}

We'll send you another email when your order ships. If you have any questions, please contact our support team.

Best regards,
E-Commerce Platform Team
  `

  return {
    subject: `Order Confirmation - #${order.id}`,
    html: wrapEmailTemplate(content, 'Order Confirmation'),
    text: textContent
  }
}

export function generateOrderStatusUpdateEmail(data: OrderStatusUpdateData): { subject: string; html: string; text: string } {
  const { order, user, previousStatus, newStatus } = data

  const statusMessages = {
    PENDING: 'Your order is being processed',
    CONFIRMED: 'Your order has been confirmed',
    SHIPPED: 'Your order has been shipped',
    DELIVERED: 'Your order has been delivered',
    CANCELLED: 'Your order has been cancelled'
  }

  const statusMessage = statusMessages[newStatus as keyof typeof statusMessages] || `Your order status has been updated to ${newStatus}`

  const content = `
    <h1>Order Status Update</h1>
    <p>Hi ${user.name || user.email},</p>
    <p>${statusMessage}.</p>
    
    <div class="mt-4 mb-4">
      <strong>Order Details:</strong><br>
      Order Number: <strong>#${order.id}</strong><br>
      Previous Status: ${previousStatus}<br>
      New Status: <strong>${newStatus}</strong><br>
      Updated: ${new Date().toLocaleDateString()}
    </div>

    ${newStatus === 'SHIPPED' ? `
      <div class="mt-4 mb-4">
        <p><strong>Shipping Information:</strong></p>
        <p>Your order is on its way! You should receive it within 3-5 business days.</p>
      </div>
    ` : ''}

    ${newStatus === 'DELIVERED' ? `
      <div class="mt-4 mb-4">
        <p><strong>Order Delivered!</strong></p>
        <p>We hope you're happy with your purchase. If you have any issues, please contact our support team.</p>
      </div>
    ` : ''}

    <div class="mt-4">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/orders/${order.id}" class="button">
        View Order Details
      </a>
    </div>

    <p>Thank you for shopping with us!</p>
  `

  const textContent = `
Order Status Update

Hi ${user.name || user.email},

${statusMessage}.

Order Details:
Order Number: #${order.id}
Previous Status: ${previousStatus}
New Status: ${newStatus}
Updated: ${new Date().toLocaleDateString()}

${newStatus === 'SHIPPED' ? 'Your order is on its way! You should receive it within 3-5 business days.' : ''}
${newStatus === 'DELIVERED' ? 'Order delivered! We hope you\'re happy with your purchase.' : ''}

View your order: ${process.env.NEXT_PUBLIC_SITE_URL}/orders/${order.id}

Thank you for shopping with us!

Best regards,
E-Commerce Platform Team
  `

  return {
    subject: `Order Update - #${order.id} ${newStatus}`,
    html: wrapEmailTemplate(content, 'Order Status Update'),
    text: textContent
  }
}

export function generatePasswordResetEmail(data: PasswordResetData): { subject: string; html: string; text: string } {
  const { user, resetUrl } = data

  const content = `
    <h1>Password Reset Request</h1>
    <p>Hi ${user.name || user.email},</p>
    <p>We received a request to reset your password for your E-Commerce Platform account.</p>
    
    <div class="mt-4 mb-4">
      <a href="${resetUrl}" class="button">
        Reset Your Password
      </a>
    </div>

    <p>This link will expire in 1 hour for security reasons.</p>
    
    <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    
    <p>For security reasons, please don't share this link with anyone.</p>
  `

  const textContent = `
Password Reset Request

Hi ${user.name || user.email},

We received a request to reset your password for your E-Commerce Platform account.

Reset your password: ${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

For security reasons, please don't share this link with anyone.

Best regards,
E-Commerce Platform Team
  `

  return {
    subject: 'Password Reset Request',
    html: wrapEmailTemplate(content, 'Password Reset'),
    text: textContent
  }
}

export function generateWelcomeEmail(data: WelcomeEmailData): { subject: string; html: string; text: string } {
  const { user } = data

  const content = `
    <h1>Welcome to E-Commerce Platform!</h1>
    <p>Hi ${user.name || user.email},</p>
    <p>Welcome to E-Commerce Platform! We're excited to have you as part of our community.</p>
    
    <p>Here's what you can do with your new account:</p>
    <ul>
      <li>Browse our extensive product catalog</li>
      <li>Save items to your wishlist</li>
      <li>Track your orders in real-time</li>
      <li>Enjoy fast and secure checkout</li>
      <li>Get exclusive member discounts</li>
    </ul>

    <div class="mt-4 mb-4">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/products" class="button">
        Start Shopping
      </a>
    </div>

    <p>If you have any questions, our support team is here to help. Just reply to this email or visit our help center.</p>
    
    <p>Happy shopping!</p>
  `

  const textContent = `
Welcome to E-Commerce Platform!

Hi ${user.name || user.email},

Welcome to E-Commerce Platform! We're excited to have you as part of our community.

Here's what you can do with your new account:
- Browse our extensive product catalog
- Save items to your wishlist
- Track your orders in real-time
- Enjoy fast and secure checkout
- Get exclusive member discounts

Start shopping: ${process.env.NEXT_PUBLIC_SITE_URL}/products

If you have any questions, our support team is here to help. Just reply to this email or visit our help center.

Happy shopping!

Best regards,
E-Commerce Platform Team
  `

  return {
    subject: 'Welcome to E-Commerce Platform!',
    html: wrapEmailTemplate(content, 'Welcome'),
    text: textContent
  }
}

export function generatePaymentFailureEmail(data: PaymentFailureData): { subject: string; html: string; text: string } {
  const { user, paymentIntentId, amount, failureReason } = data

  const content = `
    <h1>Payment Failed</h1>
    <p>Hi ${user.name || user.email},</p>
    <p>We were unable to process your payment for your recent order.</p>
    
    <div class="mt-4 mb-4">
      <strong>Payment Details:</strong><br>
      Payment ID: ${paymentIntentId}<br>
      Amount: $${amount.toFixed(2)}<br>
      Reason: ${failureReason}
    </div>

    <p>Don't worry - no charges were made to your account. Here's what you can do:</p>
    <ul>
      <li>Check that your payment information is correct</li>
      <li>Ensure you have sufficient funds or credit available</li>
      <li>Try using a different payment method</li>
      <li>Contact your bank if the issue persists</li>
    </ul>

    <div class="mt-4">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/cart" class="button">
        Try Again
      </a>
    </div>

    <p>If you continue to experience issues, please contact our support team for assistance.</p>
  `

  const textContent = `
Payment Failed

Hi ${user.name || user.email},

We were unable to process your payment for your recent order.

Payment Details:
Payment ID: ${paymentIntentId}
Amount: $${amount.toFixed(2)}
Reason: ${failureReason}

Don't worry - no charges were made to your account. Here's what you can do:
- Check that your payment information is correct
- Ensure you have sufficient funds or credit available
- Try using a different payment method
- Contact your bank if the issue persists

Try again: ${process.env.NEXT_PUBLIC_SITE_URL}/cart

If you continue to experience issues, please contact our support team for assistance.

Best regards,
E-Commerce Platform Team
  `

  return {
    subject: 'Payment Failed - Please Try Again',
    html: wrapEmailTemplate(content, 'Payment Failed'),
    text: textContent
  }
}

export function generateLowStockAlertEmail(product: Product, currentStock: number): { subject: string; html: string; text: string } {
  const content = `
    <h1>Low Stock Alert</h1>
    <p>This is an automated alert to inform you that a product is running low on stock.</p>
    
    <div class="mt-4 mb-4">
      <strong>Product Details:</strong><br>
      Name: <strong>${product.name}</strong><br>
      SKU: ${product.id}<br>
      Category: ${(product as any).category?.name || 'N/A'}<br>
      Current Stock: <strong>${currentStock} units</strong><br>
      Price: $${product.price.toFixed(2)}
    </div>

    <div class="mt-4">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/products/${product.id}" class="button">
        Update Stock
      </a>
    </div>

    <p>Please consider restocking this item to avoid stockouts.</p>
  `

  const textContent = `
Low Stock Alert

This is an automated alert to inform you that a product is running low on stock.

Product Details:
Name: ${product.name}
SKU: ${product.id}
Category: ${(product as any).category?.name || 'N/A'}
Current Stock: ${currentStock} units
Price: $${product.price.toFixed(2)}

Update stock: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/products/${product.id}

Please consider restocking this item to avoid stockouts.

Best regards,
E-Commerce Platform System
  `

  return {
    subject: `Low Stock Alert - ${product.name}`,
    html: wrapEmailTemplate(content, 'Low Stock Alert'),
    text: textContent
  }
}