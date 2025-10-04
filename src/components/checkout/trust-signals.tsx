'use client'

import { ShieldCheckIcon, TruckIcon, ArrowPathIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline'

export default function TrustSignals() {
  const features = [
    {
      icon: ShieldCheckIcon,
      title: "Secure Payment",
      description: "256-bit SSL encryption & PCI compliance"
    },
    {
      icon: TruckIcon,
      title: "Free Shipping",
      description: "On orders over ₹ 7,500 within Nepal"
    },
    {
      icon: ArrowPathIcon,
      title: "Easy Returns",
      description: "30-day hassle-free return policy"
    },
    {
      icon: ChatBubbleLeftEllipsisIcon,
      title: "24/7 Support",
      description: "Customer service always available"
    }
  ]

  const paymentMethods = [
    { name: 'Visa', logo: '/payment-logos/visa.svg' },
    { name: 'Mastercard', logo: '/payment-logos/mastercard.svg' },
    { name: 'American Express', logo: '/payment-logos/amex.svg' },
    { name: 'PayPal', logo: '/payment-logos/paypal.svg' },
    { name: 'Apple Pay', logo: '/payment-logos/apple-pay.svg' },
    { name: 'Google Pay', logo: '/payment-logos/google-pay.svg' }
  ]

  return (
    <div className="space-y-6">
      {/* Security Features */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="grid grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <feature.icon className="h-5 w-5 text-green-600 mt-0.5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">{feature.title}</h4>
                <p className="text-xs text-gray-600 mt-0.5">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Badges */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <ShieldCheckIcon className="h-4 w-4 text-green-600" />
            <span>SSL Secured</span>
          </div>
          <div className="w-px h-4 bg-gray-300"></div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <span>Powered by Stripe</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <p className="text-xs text-gray-500 mb-3">We accept all major payment methods</p>
          <div className="flex items-center justify-center space-x-3 flex-wrap">
            {/* Credit Card Icons */}
            <div className="flex items-center space-x-1 bg-white rounded border px-2 py-1">
              <div className="w-6 h-4 bg-blue-600 rounded-sm flex items-center justify-center">
                <span className="text-white text-xs font-bold">V</span>
              </div>
              <div className="w-6 h-4 bg-red-600 rounded-sm flex items-center justify-center">
                <span className="text-white text-xs font-bold">M</span>
              </div>
              <div className="w-6 h-4 bg-blue-800 rounded-sm flex items-center justify-center">
                <span className="text-white text-xs font-bold">A</span>
              </div>
            </div>
            
            {/* Digital Wallets */}
            <div className="flex items-center space-x-1 bg-white rounded border px-2 py-1">
              <div className="w-6 h-4 bg-black rounded-sm flex items-center justify-center">
                <span className="text-white text-xs">🍎</span>
              </div>
              <div className="w-6 h-4 bg-blue-500 rounded-sm flex items-center justify-center">
                <span className="text-white text-xs">G</span>
              </div>
              <div className="w-6 h-4 bg-blue-700 rounded-sm flex items-center justify-center">
                <span className="text-white text-xs">P</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews Score */}
        <div className="bg-white border rounded-lg p-3">
          <div className="flex items-center justify-center space-x-2">
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm font-medium text-gray-900">4.8</span>
            <span className="text-xs text-gray-500">(12,483 reviews)</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Trusted by thousands of happy customers</p>
        </div>
      </div>
    </div>
  )
}