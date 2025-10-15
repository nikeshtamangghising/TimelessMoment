import crypto from 'crypto'

export interface ESewaConfig {
  merchantId: string
  secretKey: string
  baseUrl: string
  successUrl: string
  failureUrl: string
}

export interface ESewaPaymentData {
  amount: number
  productId: string
  productName: string
  orderId: string
  customerEmail?: string
  customerPhone?: string
}

export interface ESewaPaymentRequest {
  tAmt: string // Total amount
  amt: string // Product amount
  txAmt: string // Tax amount
  psc: string // Service charge
  pdc: string // Delivery charge
  scd: string // Merchant ID
  pid: string // Product ID
  su: string // Success URL
  fu: string // Failure URL
}

export interface ESewaVerificationResponse {
  response_code: string
  status: string
  transaction_uuid: string
  product_code: string
  signed_field_names: string
  signature: string
}

export class ESewaGateway {
  private config: ESewaConfig

  constructor(config: ESewaConfig) {
    this.config = config
  }

  /**
   * Create payment request data for eSewa
   */
  createPaymentRequest(paymentData: ESewaPaymentData): ESewaPaymentRequest {
    const { amount, productId, productName, orderId } = paymentData
    
    // eSewa expects amounts as strings
    const amt = amount.toFixed(2)
    const txAmt = '0' // Tax amount (you can calculate if needed)
    const psc = '0' // Service charge
    const pdc = '0' // Delivery charge
    const tAmt = (parseFloat(amt) + parseFloat(txAmt) + parseFloat(psc) + parseFloat(pdc)).toFixed(2)

    return {
      tAmt,
      amt,
      txAmt,
      psc,
      pdc,
      scd: this.config.merchantId,
      pid: `${productId}-${orderId}-${Date.now()}`,
      su: this.config.successUrl,
      fu: this.config.failureUrl,
    }
  }

  /**
   * Generate eSewa payment URL
   */
  getPaymentUrl(paymentRequest: ESewaPaymentRequest): string {
    const params = new URLSearchParams(paymentRequest as unknown as Record<string, string>)
    return `${this.config.baseUrl}/epay/main?${params.toString()}`
  }

  /**
   * Verify payment from eSewa callback
   */
  async verifyPayment(
    oid: string, // Transaction reference ID
    amt: string, // Amount
    refId: string // eSewa reference ID
  ): Promise<boolean> {
    try {
      const verificationUrl = `${this.config.baseUrl}/epay/transrec`
      const verificationData = {
        oid,
        amt,
        rid: refId,
      }

      const response = await fetch(verificationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(verificationData).toString(),
      })

      if (!response.ok) {
        throw new Error(`eSewa verification failed: ${response.status}`)
      }

      const responseText = await response.text()
      
      // eSewa returns different response formats
      // Success response usually contains "Success" or transaction details
      return responseText.includes('Success') || responseText.includes(refId)
    } catch (error) {
      console.error('eSewa payment verification error:', error)
      return false
    }
  }

  /**
   * Generate signature for secure payments (if using eSewa API v2)
   */
  generateSignature(data: Record<string, string>): string {
    const signedFieldNames = Object.keys(data).sort().join(',')
    const message = Object.keys(data)
      .sort()
      .map(key => `${key}=${data[key]}`)
      .join(',')

    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(message)
      .digest('base64')
  }

  /**
   * Validate webhook signature
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
      console.error('eSewa webhook signature validation error:', error)
      return false
    }
  }
}

// Singleton instance
let esewaGateway: ESewaGateway | null = null

export const getESewaGateway = (): ESewaGateway => {
  if (!esewaGateway) {
    const config: ESewaConfig = {
      merchantId: process.env.ESEWA_MERCHANT_ID!,
      secretKey: process.env.ESEWA_SECRET_KEY!,
      baseUrl: process.env.ESEWA_BASE_URL!,
      successUrl: process.env.PAYMENT_SUCCESS_URL!,
      failureUrl: process.env.PAYMENT_FAILURE_URL!,
    }

    // Validate required environment variables
    if (!config.merchantId || !config.secretKey || !config.baseUrl) {
      throw new Error('eSewa configuration is incomplete. Check environment variables.')
    }

    esewaGateway = new ESewaGateway(config)
  }

  return esewaGateway
}

// Helper function to format amount for eSewa
export const formatESewaAmount = (amount: number): string => {
  return amount.toFixed(2)
}

// Helper function to parse eSewa callback parameters
export const parseESewaCallback = (query: Record<string, string | string[]>) => {
  return {
    oid: Array.isArray(query.oid) ? query.oid[0] : query.oid || '',
    amt: Array.isArray(query.amt) ? query.amt[0] : query.amt || '',
    refId: Array.isArray(query.refId) ? query.refId[0] : query.refId || '',
  }
}