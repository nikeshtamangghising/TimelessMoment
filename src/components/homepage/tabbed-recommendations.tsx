'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import RecommendationGrid from './recommendation-grid'

type TabType = 'trending' | 'personalized' | 'popular'

interface Tab {
  id: TabType
  label: string
  icon: string
  endpoint: string
}

export default function TabbedRecommendations() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<TabType>('trending')

  // Define available tabs
  const getTabs = (): Tab[] => {
    const baseTabs: Tab[] = [
      {
        id: 'trending',
        label: 'Trending Now',
        icon: '🔥',
        endpoint: 'trending'
      },
      {
        id: 'popular',
        label: 'Popular Choices',
        icon: '⭐',
        endpoint: 'popular'
      }
    ]

    // Add personalized tab for logged-in users
    if (session?.user) {
      baseTabs.splice(1, 0, {
        id: 'personalized',
        label: 'For You',
        icon: '✨',
        endpoint: 'personalized'
      })
    }

    return baseTabs
  }

  const tabs = getTabs()

  // Set default active tab
  useEffect(() => {
    if (session?.user) {
      setActiveTab('personalized')
    } else {
      setActiveTab('trending')
    }
  }, [session])

  // Handle tab change
  const handleTabChange = (tabType: TabType) => {
    setActiveTab(tabType)
  }



  if (tabs.length === 0) {
    return null
  }

  // Get the current tab's endpoint
  const currentTab = tabs.find(tab => tab.id === activeTab)
  const userId = session?.user?.id || 'guest'
  const apiEndpoint = currentTab ? `/api/recommendations/${userId}/${currentTab.endpoint}` : null

  return (
    <section className="py-3 bg-white">
      <div className="max-w-full mx-auto px-2 sm:px-3 lg:px-4">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-3">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-full max-w-md">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 px-2 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-1 sm:gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="text-xs sm:text-sm">{tab.icon}</span>
                <span className="hidden xs:inline text-xs sm:text-sm">{tab.label}</span>
                <span className="xs:hidden text-xs">
                  {tab.id === 'trending' ? 'Hot' : 
                   tab.id === 'personalized' ? 'You' : 
                   'Top'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Lazy Loading Recommendations Grid */}
        {apiEndpoint && (
          <RecommendationGrid
            key={activeTab} // Force re-render when tab changes
            apiEndpoint={apiEndpoint}

            compact={true}
          />
        )}
      </div>


    </section>
  )
}