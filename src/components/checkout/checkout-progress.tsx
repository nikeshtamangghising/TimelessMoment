'use client'

interface CheckoutProgressProps {
  currentStep: 1 | 2 | 3
  steps?: { 
    id: number
    name: string 
    description: string
  }[]
}

export default function CheckoutProgress({ 
  currentStep,
  steps = [
    { id: 1, name: 'Cart', description: 'Review your items' },
    { id: 2, name: 'Checkout', description: 'Payment & shipping' },
    { id: 3, name: 'Complete', description: 'Order confirmation' }
  ]
}: CheckoutProgressProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav aria-label="Progress">
          <ol role="list" className="flex items-center justify-center py-6 space-x-8">
            {steps.map((step, stepIdx) => (
              <li key={step.name} className="flex items-center">
                <div className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 font-medium text-sm
                    ${step.id <= currentStep
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-gray-300 bg-white text-gray-500'
                    }
                  `}>
                    {step.id < currentStep ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span>{step.id}</span>
                    )}
                  </div>
                  <div className="ml-3 text-left hidden sm:block">
                    <div className={`text-sm font-medium ${
                      step.id <= currentStep ? 'text-indigo-600' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {step.description}
                    </div>
                  </div>
                </div>
                
                {stepIdx < steps.length - 1 && (
                  <div className={`
                    hidden sm:block ml-8 w-16 h-0.5
                    ${step.id < currentStep ? 'bg-indigo-600' : 'bg-gray-300'}
                  `} />
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  )
}