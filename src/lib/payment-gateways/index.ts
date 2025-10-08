import { ESewaGateway, getESewaGateway, ESewaPaymentData } from './esewa'
import { KhaltiGateway, getKhaltiGateway, KhaltiPaymentData } from './khalti'

export type PaymentMethod = 'esewa' | 'khalti' | 'cod'

export interface PaymentGatewayConfig {
  method: PaymentMethod
  orderId: string
  amount: number
  productName: string
  customerInfo?: {
    name?: string
    email?: string
    phone?: string
  }
}

export interface PaymentInitiationResult {
  method: PaymentMethod
  success: boolean
  paymentUrl?: string
  error?: string
  transactionId?: string
  data?: any
}

export interface PaymentVerificationResult {
  method: PaymentMethod
  success: boolean
  transactionId: string
  amount: number
  orderId: string
  error?: string
  data?: any
}

export class PaymentGatewayManager {
  /**
   * Initiate payment with the specified gateway
   */
  async initiatePayment(config: PaymentGatewayConfig): Promise<PaymentInitiationResult> {
    try {
      switch (config.method) {
        case 'esewa':
          return await this.initiateESewaPayment(config)
        case 'khalti':
          return await this.initiateKhaltiPayment(config)
        case 'cod':
          return await this.initiateCODPayment(config)
        default:
          throw new Error(`Unsupported payment method: ${config.method}`)
      }
    } catch (error) {
      console.error('Payment initiation error:', error)
      return {
        method: config.method,
        success: false,
        error: error instanceof Error ? error.message : 'Payment initiation failed',
      }
    }
  }

  /**
   * Verify payment with the specified gateway
   */
  async verifyPayment(
    method: PaymentMethod,
    transactionId: string,
    additionalData?: any
  ): Promise<PaymentVerificationResult> {
    try {
      switch (method) {
        case 'esewa':
          return await this.verifyESewaPayment(transactionId, additionalData)
        case 'khalti':
          return await this.verifyKhaltiPayment(transactionId)
        case 'cod':
          return await this.verifyCODPayment(transactionId, additionalData)
        default:
          throw new Error(`Unsupported payment method: ${method}`)
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      return {
        method,
        success: false,
        transactionId,
        amount: 0,
        orderId: '',
        error: error instanceof Error ? error.message : 'Payment verification failed',
      }
    }
  }

  /**
   * Get payment method display name
   */
  getPaymentMethodDisplayName(method: PaymentMethod): string {
    const names = {
      esewa: 'eSewa',
      khalti: 'Khalti',
      cod: 'Cash on Delivery',
    }
    return names[method] || method
  }

  /**
   * Check if payment method is online
   */
  isOnlinePaymentMethod(method: PaymentMethod): boolean {
    return method !== 'cod'
  }

  /**
   * Get payment method icon/logo path
   */
  getPaymentMethodIcon(method: PaymentMethod): string {
    const icons = {
      esewa: '/images/payment/esewa-logo.png',
      khalti: '/images/payment/khalti-logo.png',
      cod: '/images/payment/cod-icon.png',
    }
    return icons[method] || '/images/payment/default.png'
  }

  private async initiateESewaPayment(config: PaymentGatewayConfig): Promise<PaymentInitiationResult> {
    const esewa = getESewaGateway()
    
    const paymentData: ESewaPaymentData = {
      amount: config.amount,
      productId: config.orderId,
      productName: config.productName,
      orderId: config.orderId,
      customerEmail: config.customerInfo?.email,
      customerPhone: config.customerInfo?.phone,
    }

    const paymentRequest = esewa.createPaymentRequest(paymentData)
    const paymentUrl = esewa.getPaymentUrl(paymentRequest)

    return {
      method: 'esewa',
      success: true,
      paymentUrl,
      transactionId: paymentRequest.pid,
      data: paymentRequest,
    }
  }

  private async initiateKhaltiPayment(config: PaymentGatewayConfig): Promise<PaymentInitiationResult> {
    const khalti = getKhaltiGateway()
    
    const paymentData: KhaltiPaymentData = {
      amount: khalti.convertNprToPaisa(config.amount), // Convert to paisa
      productIdentity: config.orderId,
      productName: config.productName,
      orderId: config.orderId,
      customerInfo: config.customerInfo,
    }

    const initiateResponse = await khalti.initiatePayment(paymentData)

    return {
      method: 'khalti',
      success: true,
      paymentUrl: initiateResponse.payment_url,
      transactionId: initiateResponse.pidx,
      data: initiateResponse,
    }
  }

  private async initiateCODPayment(config: PaymentGatewayConfig): Promise<PaymentInitiationResult> {
    // For COD, we don't need to redirect to any payment gateway
    // We'll handle this in the checkout flow directly
    const transactionId = `cod-${config.orderId}-${Date.now()}`

    return {
      method: 'cod',
      success: true,
      transactionId,
      data: {
        orderId: config.orderId,
        amount: config.amount,
        method: 'cod',
      },
    }
  }

  private async verifyESewaPayment(
    transactionId: string,
    additionalData: { oid: string; amt: string; refId: string }
  ): Promise<PaymentVerificationResult> {
    const esewa = getESewaGateway()
    
    const isVerified = await esewa.verifyPayment(
      additionalData.oid,
      additionalData.amt,
      additionalData.refId
    )

    return {
      method: 'esewa',
      success: isVerified,
      transactionId: additionalData.refId,
      amount: parseFloat(additionalData.amt),
      orderId: additionalData.oid,
      data: additionalData,
    }
  }

  private async verifyKhaltiPayment(transactionId: string): Promise<PaymentVerificationResult> {
    const khalti = getKhaltiGateway()
    
    const verificationResponse = await khalti.verifyPayment(transactionId)
    const isSuccessful = khalti.isPaymentSuccessful(verificationResponse)

    return {
      method: 'khalti',
      success: isSuccessful,
      transactionId: verificationResponse.transaction_id,
      amount: khalti.convertPaisaToNpr(verificationResponse.total_amount),
      orderId: verificationResponse.purchase_order_id,
      data: verificationResponse,
    }
  }

  private async verifyCODPayment(
    transactionId: string,
    additionalData: { orderId: string; amount: number }
  ): Promise<PaymentVerificationResult> {
    // For COD, verification is always successful since no online payment is involved
    return {
      method: 'cod',
      success: true,
      transactionId,
      amount: additionalData.amount,
      orderId: additionalData.orderId,
    }
  }
}

// Singleton instance
let paymentManager: PaymentGatewayManager | null = null

export const getPaymentGatewayManager = (): PaymentGatewayManager => {
  if (!paymentManager) {
    paymentManager = new PaymentGatewayManager()
  }
  return paymentManager
}

// Export everything from individual gateway files
export * from './esewa'
export * from './khalti'

// Helper functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    minimumFractionDigits: 2,
  }).format(amount)
}

export const getAvailablePaymentMethods = (): PaymentMethod[] => {
  return ['esewa', 'khalti', 'cod']
}

export const getPaymentMethodInfo = (method: PaymentMethod) => {
  const manager = getPaymentGatewayManager()
  
  return {
    method,
    displayName: manager.getPaymentMethodDisplayName(method),
    isOnline: manager.isOnlinePaymentMethod(method),
    icon: manager.getPaymentMethodIcon(method),
  }
}