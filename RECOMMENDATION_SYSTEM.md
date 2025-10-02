# 🤖 Intelligent E-commerce Recommendation System

## Overview

This document outlines the comprehensive intelligent product recommendation system with scoring algorithms, clean delivery-focused UI, and complete e-commerce features that have been implemented.

## 🏗️ System Architecture

### Database Schema Enhancements

#### Updated `products` table:
```sql
ALTER TABLE products ADD COLUMN:
- view_count INTEGER DEFAULT 0
- order_count INTEGER DEFAULT 0  
- favorite_count INTEGER DEFAULT 0
- cart_count INTEGER DEFAULT 0
- popularity_score DECIMAL DEFAULT 0
- last_score_update TIMESTAMP DEFAULT NOW()
```

#### New Tables:
- `user_activities` - Tracks all user interactions
- `user_interests` - User preference profiling by category
- `cart` - Session and user-based shopping cart
- `favorites` - User wishlist functionality
- `order_tracking` - Enhanced order status tracking

### 📊 Scoring Algorithm

**Base Formula:**
```javascript
score = (views × 1) + (cart_adds × 3) + (favorites × 5) + (orders × 10)
```

**Recency Boost:**
- New products (< 7 days): `score × 1.5`
- Automatic updates every hour via cron job

## 🔧 Backend Services

### RecommendationEngine (`src/lib/recommendation-engine.ts`)
- **Popular Products**: Based on popularity scores
- **Trending Products**: High activity in last 7 days
- **Personalized**: User interest matching + collaborative filtering
- **Similar Products**: Same category + similar price range (±30%)

### ActivityTracker (`src/lib/activity-tracker.ts`)
- Tracks: VIEW, CART_ADD, FAVORITE, ORDER
- Updates product counters automatically
- Builds user interest profiles
- Privacy-conscious (90-day retention)

### Repository Classes
- **CartRepository**: Session + user cart management
- **FavoritesRepository**: Wishlist with availability tracking
- **Enhanced order tracking with status updates**

## 🚀 API Endpoints

### Recommendations
```
GET /api/recommendations/{userId}
- Returns personalized, popular, and trending products
- Supports guest users with 'guest' userId
- Customizable limits via query params
```

### Activity Tracking
```
POST /api/track/activity
- Single or batch activity tracking
- Supports both authenticated and guest users
- Real-time counter updates
```

### Cart Management
```
GET|POST|PUT|DELETE /api/cart
- Full CRUD operations
- Session-based guest support
- Inventory validation
- Activity tracking integration
```

### Favorites
```
GET|POST|DELETE /api/favorites
- Toggle favorite functionality
- Category-based filtering
- Availability status checking
```

### Similar Products
```
GET /api/products/{id}/similar
- Same category products
- Price range filtering (±30%)
- Popularity-based ranking
```

## 🎨 Frontend Enhancements

### Enhanced Product Cards
- **Favorites Button**: Heart icon with toggle functionality
- **Activity Tracking**: Intersection Observer for view tracking
- **Modern Design**: Hover effects, badges, smooth animations
- **Responsive Images**: Lazy loading with skeleton states
- **Stock Indicators**: Low stock warnings and sold out states

### Intelligent Homepage
- **Trending Now**: Hot products everyone is talking about
- **Picked For You**: Personalized recommendations (logged-in users)
- **Popular Choices**: Overall best-sellers
- **Dynamic Sections**: Conditional rendering based on user status

### Cart Sidebar
- **Slide Animation**: Smooth right-side slide-in
- **Quantity Controls**: +/- buttons with instant feedback
- **Real-time Updates**: Syncs with backend API
- **Empty State**: Encouraging messaging with CTA

## 📱 Responsive Design

### Mobile-First Approach
- **Grid System**: 2-col mobile → 3-col tablet → 4-col desktop
- **Touch Targets**: Minimum 44px for accessibility
- **Smooth Scrolling**: Enhanced user experience
- **Reduced Motion**: Respects user preferences

### Performance Features
- **Lazy Loading**: Images load as needed
- **Intersection Observer**: Efficient view tracking
- **Skeleton States**: Loading indicators
- **Debounced Search**: 500ms delay for optimal UX

## 🔄 User Interest Profiling

### Interest Scoring
```javascript
Weights:
- VIEW: +1 point
- CART_ADD: +3 points  
- FAVORITE: +5 points
- ORDER: +10 points
```

### Personalization
- Category-based interest tracking
- Weighted recommendations based on user behavior
- Excludes already purchased items
- Fallback to popular products for new users

## ⚙️ Automated Systems

### Cron Jobs (Vercel)
```json
{
  "path": "/api/cron/update-scores",
  "schedule": "0 * * * *"  // Every hour
}
```

### Background Processes
- **Score Updates**: Hourly recalculation of all product scores
- **Data Cleanup**: Weekly removal of old activity data (90+ days)
- **Cache Warming**: Preparation of recommendation data

## 🎯 Success Metrics

### Implementation Checklist
- ✅ Homepage loads personalized + popular + trending products
- ✅ Products tracked when viewed (50% visibility threshold)
- ✅ Cart/favorites work smoothly with real-time updates
- ✅ Recommendations update based on user behavior
- ✅ Responsive on mobile/tablet/desktop
- ✅ Smooth animations and interactions
- ✅ Order tracking functional
- ✅ "Similar products" shown on detail pages
- ✅ Scores update automatically via cron

### Key Features
1. **🎯 Intelligent Scoring**: Multi-factor product popularity calculation
2. **👤 User Profiling**: Category-based interest tracking
3. **🔄 Real-time Updates**: Instant cart/favorite synchronization
4. **📊 Activity Analytics**: Comprehensive user interaction tracking
5. **🎨 Modern UI**: Clean, professional design focused on conversion
6. **📱 Mobile-Optimized**: Touch-friendly responsive design
7. **⚡ Performance**: Optimized loading and smooth animations
8. **🤖 Automation**: Self-maintaining scoring system

## 🚦 Usage Examples

### Tracking a Product View
```javascript
import { trackActivity } from '@/lib/activity-utils'

// Automatic via Intersection Observer
// or manual:
trackActivity({
  productId: 'product-123',
  activityType: 'VIEW',
  userId: session?.user?.id
})
```

### Getting Recommendations
```javascript
const recommendations = await fetch(`/api/recommendations/${userId}?personalizedLimit=8`)
const data = await recommendations.json()
// Returns: { personalized: [], popular: [], trending: [] }
```

### Managing Favorites
```javascript
const { toggleFavorite, isInFavorites } = useFavorites()

// Toggle favorite status
await toggleFavorite(productId)

// Check if favorited
const isFavorited = isInFavorites(productId)
```

## 🔧 Configuration

### Environment Variables
```env
# Cron job security (optional)
CRON_SECRET="your-cron-secret-here"
ADMIN_SECRET="your-admin-secret-here"

# Activity tracking settings
ACTIVITY_RETENTION_DAYS=90
SCORE_UPDATE_FREQUENCY="hourly"
```

### Customization Options
- **Scoring weights**: Modify in `RecommendationEngine`
- **Trending timeframe**: Default 7 days, configurable
- **Recommendation limits**: API query parameters
- **View tracking threshold**: 50% visibility, adjustable

This intelligent recommendation system provides a comprehensive, scalable foundation for modern e-commerce personalization while maintaining clean, professional aesthetics and optimal user experience across all devices.