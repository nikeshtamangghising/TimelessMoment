// Note: Install PDFKit with: npm install pdfkit @types/pdfkit
// import PDFDocument from 'pdfkit'
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency'

interface InvoiceOrder {
  id: string
  userId: string
  status: string
  total: number
  createdAt: Date
  stripePaymentIntentId: string | null
  user: {
    id: string
    name: string
    email: string
    createdAt: Date
    role: string
  }
  items: Array<{
    id: string
    quantity: number
    price: number
    product: {
      id: string
      name: string
      currency?: string
      category?: {
        name: string
      }
    }
  }>
  shippingAddress?: {
    fullName: string
    email?: string
    phone?: string
    address: string
    city: string
    postalCode: string
    country?: string
  } | null
}

export async function generateInvoicePDF(order: InvoiceOrder): Promise<Buffer> {
  // Temporary implementation - install PDFKit to enable PDF generation
  // Run: npm install pdfkit @types/pdfkit
  
  // For now, return a simple text-based invoice
  const invoiceText = generateInvoiceText(order)
  return Buffer.from(invoiceText, 'utf-8')
}

function generateInvoiceText(order: InvoiceOrder): string {
  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = subtotal * 0.13
  const shipping = subtotal >= 2000 ? 0 : 200
  const total = subtotal + tax + shipping

  return `
RIJAL DECORS VALLEY - INVOICE
================================

Invoice #: ${order.id.slice(-8).toUpperCase()}
Date: ${new Date(order.createdAt).toLocaleDateString()}
Status: ${order.status}

CUSTOMER INFORMATION:
Name: ${order.user.name}
Email: ${order.user.email}

${order.shippingAddress ? `
SHIPPING ADDRESS:
${order.shippingAddress.fullName}
${order.shippingAddress.address}
${order.shippingAddress.city}, ${order.shippingAddress.postalCode}
${order.shippingAddress.phone ? `Phone: ${order.shippingAddress.phone}` : ''}
` : ''}

ORDER ITEMS:
${order.items.map(item => 
  `${item.product.name} - Qty: ${item.quantity} x ${formatCurrency(item.price, item.product.currency || DEFAULT_CURRENCY)} = ${formatCurrency(item.price * item.quantity, item.product.currency || DEFAULT_CURRENCY)}`
).join('\n')}

SUMMARY:
Subtotal: ${formatCurrency(subtotal, DEFAULT_CURRENCY)}
Shipping: ${shipping === 0 ? 'Free' : formatCurrency(shipping, DEFAULT_CURRENCY)}
Tax (13% VAT): ${formatCurrency(tax, DEFAULT_CURRENCY)}
Total: ${formatCurrency(total, DEFAULT_CURRENCY)}

Payment Method: ${order.stripePaymentIntentId ? 'Online Payment' : 'Cash on Delivery'}
${order.stripePaymentIntentId ? `Payment ID: ${order.stripePaymentIntentId.slice(-8).toUpperCase()}` : ''}

Thank you for your business!
Rijal Decors Valley
Generated on: ${new Date().toLocaleString()}
`
}

// Commented out PDF implementation - uncomment after installing PDFKit
/*
export async function generateInvoicePDF(order: InvoiceOrder): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const PDFDocument = require('pdfkit')
      const doc = new PDFDocument({ margin: 50 })
      const buffers: Buffer[] = []

      doc.on('data', buffers.push.bind(buffers))
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers)
        resolve(pdfData)
      })

      // Company Header
      doc.fontSize(20)
         .fillColor('#4f46e5')
         .text('Rijal Decors Valley', 50, 50)
         .fontSize(10)
         .fillColor('#666666')
         .text('Premium E-commerce Platform', 50, 75)
         .text('Email: support@rijaldecorsvalley.com', 50, 90)
         .text('Phone: +977-1-XXXXXXX', 50, 105)

      // Invoice Title
      doc.fontSize(20)
         .fillColor('#000000')
         .text('INVOICE', 400, 50)
         .fontSize(10)
         .fillColor('#666666')
         .text(`Invoice #: ${order.id.slice(-8).toUpperCase()}`, 400, 75)
         .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 400, 90)
         .text(`Status: ${order.status}`, 400, 105)

      // Line separator
      doc.moveTo(50, 140)
         .lineTo(550, 140)
         .strokeColor('#cccccc')
         .stroke()

      // Customer Information
      let yPosition = 160
      doc.fontSize(14)
         .fillColor('#000000')
         .text('Bill To:', 50, yPosition)
         .fontSize(10)
         .fillColor('#666666')
         .text(order.user.name, 50, yPosition + 20)
         .text(order.user.email, 50, yPosition + 35)

      // Shipping Address (if available)
      if (order.shippingAddress) {
        doc.fontSize(14)
           .fillColor('#000000')
           .text('Ship To:', 300, yPosition)
           .fontSize(10)
           .fillColor('#666666')
           .text(order.shippingAddress.fullName, 300, yPosition + 20)
           .text(order.shippingAddress.address, 300, yPosition + 35)
           .text(`${order.shippingAddress.city}, ${order.shippingAddress.postalCode}`, 300, yPosition + 50)
        
        if (order.shippingAddress.phone) {
          doc.text(`Phone: ${order.shippingAddress.phone}`, 300, yPosition + 65)
        }
      }

      // Items Table Header
      yPosition = 260
      doc.rect(50, yPosition, 500, 25)
         .fillColor('#f8f9fa')
         .fill()
         .fillColor('#000000')
         .fontSize(10)
         .text('Item', 60, yPosition + 8)
         .text('Qty', 350, yPosition + 8)
         .text('Price', 400, yPosition + 8)
         .text('Total', 480, yPosition + 8)

      // Items
      yPosition += 25
      let subtotal = 0

      order.items.forEach((item, index) => {
        const itemTotal = item.price * item.quantity
        subtotal += itemTotal

        // Alternate row background
        if (index % 2 === 0) {
          doc.rect(50, yPosition, 500, 20)
             .fillColor('#fafafa')
             .fill()
        }

        doc.fillColor('#000000')
           .fontSize(9)
           .text(item.product.name, 60, yPosition + 6, { width: 280 })
           .text(item.quantity.toString(), 350, yPosition + 6)
           .text(formatCurrency(item.price, item.product.currency || DEFAULT_CURRENCY), 400, yPosition + 6)
           .text(formatCurrency(itemTotal, item.product.currency || DEFAULT_CURRENCY), 480, yPosition + 6)

        yPosition += 20
      })

      // Totals Section
      yPosition += 20
      const tax = subtotal * 0.13 // 13% VAT
      const shipping = subtotal >= 2000 ? 0 : 200 // Free shipping over 2000 NPR
      const total = subtotal + tax + shipping

      // Subtotal
      doc.fontSize(10)
         .text('Subtotal:', 400, yPosition)
         .text(formatCurrency(subtotal, DEFAULT_CURRENCY), 480, yPosition)

      yPosition += 15
      // Shipping
      doc.text('Shipping:', 400, yPosition)
         .text(shipping === 0 ? 'Free' : formatCurrency(shipping, DEFAULT_CURRENCY), 480, yPosition)

      yPosition += 15
      // Tax
      doc.text('Tax (13% VAT):', 400, yPosition)
         .text(formatCurrency(tax, DEFAULT_CURRENCY), 480, yPosition)

      yPosition += 15
      // Total line
      doc.moveTo(400, yPosition)
         .lineTo(550, yPosition)
         .strokeColor('#cccccc')
         .stroke()

      yPosition += 10
      // Total
      doc.fontSize(12)
         .fillColor('#000000')
         .text('Total:', 400, yPosition)
         .text(formatCurrency(total, DEFAULT_CURRENCY), 480, yPosition)

      // Payment Information
      yPosition += 40
      doc.fontSize(12)
         .fillColor('#000000')
         .text('Payment Information:', 50, yPosition)
         .fontSize(10)
         .fillColor('#666666')
         .text(`Method: ${order.stripePaymentIntentId ? 'Online Payment' : 'Cash on Delivery'}`, 50, yPosition + 20)

      if (order.stripePaymentIntentId) {
        doc.text(`Payment ID: ${order.stripePaymentIntentId.slice(-8).toUpperCase()}`, 50, yPosition + 35)
      }

      // Footer
      const footerY = doc.page.height - 100
      doc.fontSize(8)
         .fillColor('#999999')
         .text('Thank you for your business!', 50, footerY)
         .text('This is a computer-generated invoice. No signature required.', 50, footerY + 15)
         .text(`Generated on: ${new Date().toLocaleString()}`, 50, footerY + 30)

      // Company footer
      doc.text('Rijal Decors Valley - Your Premium Online Store', 300, footerY)
         .text('Visit us at: www.rijaldecorsvalley.com', 300, footerY + 15)

      doc.end()

    } catch (error) {
      reject(error)
    }
  })
}
*/