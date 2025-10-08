import crypto from 'crypto'

export interface KhaltiConfig {
  publicKey: string
  secretKey: string
  baseUrl: string
  successUrl: string
  failureUrl: string
}

export interface KhaltiPaymentData {
  amount: number // Amount in paisa (1 NPR = 100 paisa)
  productIdentity: string
  productName: string
  productUrl?: string
  orderId: string
  customerInfo?: {
    name?: string
    email?: string
    phone?: string
  }
  amountBreakdown?: {
    label: string
    amount: number
  }[]
  website_url?: string
}

export interface KhaltiPaymentRequest {
  return_url: string
  website_url: string
  amount: number
  purchase_order_id: string
  purchase_order_name: string
  customer_info?: {
    name?: string
    email?: string
    phone?: string
  }
  amount_breakdown?: {
    label: string
    amount: number
  }[]
  product_details?: {
    identity: string
    name: string
    total_price: number
    quantity: number
    unit_price: number
  }[]
}

export interface KhaltiInitiateResponse {
  pidx: string // Payment identifier
  payment_url: string
  expires_at: string
  expires_in: number
}

export interface KhaltiVerificationResponse {
  pidx: string
  total_amount: number
  status: 'Completed' | 'Pending' | 'Initiated' | 'Refunded' | 'Failed' | 'Expired' | 'User Canceled'
  transaction_id: string
  fee: number
  refunded: boolean
  purchase_order_id: string
  purchase_order_name: string
  extra_merchant_params?: Record<string, any>
}

export class KhaltiGateway {
  private config: KhaltiConfig

  constructor(config: KhaltiConfig) {
    this.config = config
  }

  /**
   * Initiate payment with Khalti
   */
  async initiatePayment(paymentData: KhaltiPaymentData): Promise<KhaltiInitiateResponse> {
    try {
      const payload: KhaltiPaymentRequest = {
        return_url: this.config.successUrl,
        website_url: paymentData.website_url || this.config.successUrl,
        amount: paymentData.amount, // Amount in paisa
        purchase_order_id: paymentData.orderId,
        purchase_order_name: paymentData.productName,
        customer_info: paymentData.customerInfo,
        amount_breakdown: paymentData.amountBreakdown,
        product_details: [{
          identity: paymentData.productIdentity,
          name: paymentData.productName,
          total_price: paymentData.amount,
          quantity: 1,
          unit_price: paymentData.amount,
        }],
      }

      const response = await fetch(`${this.config.baseUrl}/api/v2/epayment/initiate/`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.config.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Khalti payment initiation failed: ${JSON.stringify(errorData)}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Khalti payment initiation error:', error)
      throw error
    }
  }

  /**
   * Verify payment with Khalti
   */
  async verifyPayment(pidx: string): Promise<KhaltiVerificationResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v2/epayment/lookup/`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.config.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pidx }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Khalti payment verification failed: ${JSON.stringify(errorData)}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Khalti payment verification error:', error)
      throw error
    }
  }

  /**
   * Check if payment is successful
   */
  isPaymentSuccessful(verificationResponse: KhaltiVerificationResponse): boolean {
    return verificationResponse.status === 'Completed'
  }

  /**
   * Get payment status text for display
   */
  getPaymentStatusText(status: KhaltiVerificationResponse['status']): string {
    const statusMap = {
      'Completed': 'Payment Successful',
      'Pending': 'Payment Pending',
      'Initiated': 'Payment Initiated',
      'Refunded': 'Payment Refunded',
      'Failed': 'Payment Failed',
      'Expired': 'Payment Expired',
      'User Canceled': 'Payment Canceled by User',
    }

    return statusMap[status] || 'Unknown Status'
  }

  /**
   * Validate webhook signature from Khalti
   */
  validateWebhookSignature(
    payload: string,
    signature: string,
    timestamp: string
  ): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.config.secretKey)
        .update(`${timestamp}.${payload}`)
        .digest('hex')

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      )
    } catch (error) {
      console.error('Khalti webhook signature validation error:', error)
      return false
    }
  }

  /**
   * Convert NPR to paisa (Khalti uses paisa)
   */
  convertNprToPaisa(npr: number): number {
    return Math.round(npr * 100)
  }

  /**
   * Convert paisa to NPR
   */
  convertPaisaToNpr(paisa: number): number {
    return paisa / 100
  }
}

// Singleton instance
let khaltiGateway: KhaltiGateway | null = null

export const getKhaltiGateway = (): KhaltiGateway => {
  if (!khaltiGateway) {
    const config: KhaltiConfig = {
      publicKey: process.env.KHALTI_PUBLIC_KEY!,
      secretKey: process.env.KHALTI_SECRET_KEY!,
      baseUrl: process.env.KHALTI_BASE_URL!,
      successUrl: process.env.PAYMENT_SUCCESS_URL!,
      failureUrl: process.env.PAYMENT_FAILURE_URL!,
    }

    // Validate required environment variables
    if (!config.publicKey || !config.secretKey || !config.baseUrl) {
      throw new Error('Khalti configuration is incomplete. Check environment variables.')
    }

    khaltiGateway = new KhaltiGateway(config)
  }

  return khaltiGateway
}

// Helper function to format amount for Khalti (in paisa)
export const formatKhaltiAmount = (npr: number): number => {
  return Math.round(npr * 100) // Convert NPR to paisa
}

// Helper function to format amount for display
export const formatKhaltiAmountForDisplay = (paisa: number): string => {
  const npr = paisa / 100
  return new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    minimumFractionDigits: 2,
  }).format(npr)
}

// Helper function to parse Khalti callback parameters
export const parseKhaltiCallback = (query: Record<string, string | string[]>) => {
  return {
    pidx: Array.isArray(query.pidx) ? query.pidx[0] : query.pidx || '',
    status: Array.isArray(query.status) ? query.status[0] : query.status || '',
    transaction_id: Array.isArray(query.transaction_id) ? query.transaction_id[0] : query.transaction_id || '',
    tidx: Array.isArray(query.tidx) ? query.tidx[0] : query.tidx || '',
    amount: Array.isArray(query.amount) ? query.amount[0] : query.amount || '',
    mobile: Array.isArray(query.mobile) ? query.mobile[0] : query.mobile || '',
    purchase_order_id: Array.isArray(query.purchase_order_id) ? query.purchase_order_id[0] : query.purchase_order_id || '',
    purchase_order_name: Array.isArray(query.purchase_order_name) ? query.purchase_order_name[0] : query.purchase_order_name || '',
  }
}