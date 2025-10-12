'use client'

import { useState } from 'react'
import { XMarkIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline'
import Button from '@/components/ui/button'
import { formatPrice } from '@/lib/cart-utils'

type ForecastData = {
  date: string
  predictedSales: number
  predictedRevenue: number
  currentStock: number
  recommendedRestock: number
}

interface InventoryForecastModalProps {
  productName: string
  currentInventory: number
  averageDailySales: number
  averageSalePrice: number
  onClose: () => void
}

export default function InventoryForecastModal({ 
  productName, 
  currentInventory, 
  averageDailySales, 
  averageSalePrice,
  onClose 
}: InventoryForecastModalProps) {
  const [forecastPeriod, setForecastPeriod] = useState<number>(30) // days

  // Generate forecast data
  const generateForecastData = (): ForecastData[] => {
    const data: ForecastData[] = []
    let currentStock = currentInventory
    
    for (let i = 1; i <= Math.ceil(forecastPeriod / 7); i++) {
      const weeks = i
      const days = weeks * 7
      const predictedSales = Math.round(averageDailySales * days)
      const predictedRevenue = predictedSales * averageSalePrice
      currentStock = Math.max(0, currentInventory - predictedSales)
      const recommendedRestock = currentStock <= 0 ? Math.ceil(predictedSales * 0.2) : 0 // 20% buffer
      
      data.push({
        date: `${weeks} week${weeks > 1 ? 's' : ''}`,
        predictedSales,
        predictedRevenue,
        currentStock,
        recommendedRestock
      })
    }
    
    return data
  }

  const forecastData = generateForecastData()

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Inventory Forecast: {productName}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Current stock: {currentInventory} units
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <label className="text-sm font-medium text-gray-700">
                Forecast Period:
              </label>
              <select
                value={forecastPeriod}
                onChange={(e) => setForecastPeriod(Number(e.target.value))}
                className="block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time Period
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Predicted Sales
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Level
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recommendation
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {forecastData.map((forecast, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {forecast.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {forecast.predictedSales}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatPrice(forecast.predictedRevenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          forecast.currentStock === 0 
                            ? 'bg-red-100 text-red-800' 
                            : forecast.currentStock <= 10 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                        }`}>
                          {forecast.currentStock}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {forecast.recommendedRestock > 0 ? (
                          <div className="flex items-center">
                            <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                            <span>Restock {forecast.recommendedRestock} units</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">Sufficient stock</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-md mb-6">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Forecast Insights</h4>
            <ul className="text-sm text-blue-700 list-disc pl-5 space-y-1">
              <li>Average daily sales: {averageDailySales.toFixed(1)} units</li>
              <li>Current stock will last approximately {(currentInventory / averageDailySales).toFixed(1)} days</li>
              <li>Recommended safety stock: {Math.ceil(averageDailySales * 7)} units (1 week)</li>
            </ul>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}