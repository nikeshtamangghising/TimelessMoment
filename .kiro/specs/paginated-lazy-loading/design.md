# Design Document

## Overview

The paginated lazy loading system will enhance the existing product listing components by implementing scroll-based pagination that loads products in batches of 12. This design leverages the existing API pagination infrastructure while adding client-side scroll detection and state management to provide a seamless browsing experience.

The system will work across all product listing pages including categories, search results, and homepage recommendations, maintaining consistency with existing filters and sorting functionality.

## Architecture

### High-Level Flow
1. **Initial Load**: Component loads first 12 products and displays them
2. **Scroll Detection**: Intersection Observer monitors when user approaches bottom
3. **Batch Loading**: Automatically fetch next 12 products when threshold reached
4. **State Management**: Append new products to existing list and update pagination state
5. **End State**: Display completion message when all products loaded

### Component Structure
```
LazyProductList (New Hook/Component)
├── useInfiniteScroll (Custom Hook)
├── ProductGrid (Existing)
├── LoadingIndicator (New)
└── EndMessage (New)
```

## Components and Interfaces

### 1. useInfiniteScroll Hook
**Purpose**: Manage pagination state and scroll-triggered loading

```typescript
interface UseInfiniteScrollOptions {
  initialData: ProductsData
  fetchUrl: string
  pageSize: number
  enabled: boolean
}

interface UseInfiniteScrollReturn {
  products: ProductWithCategory[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  error: string | null
  retry: () => void
}
```

**Key Features**:
- Intersection Observer for scroll detection
- Debounced loading to prevent duplicate requests
- Error handling with retry capability
- Automatic cleanup on unmount

### 2. LazyProductGrid Component
**Purpose**: Wrapper component that integrates lazy loading with existing ProductCard grid

```typescript
interface LazyProductGridProps {
  initialData: ProductsData
  searchParams: SearchParams
  apiEndpoint: string
  className?: string
  gridColumns?: number
  viewMode?: 'grid' | 'list'
}
```

**Responsibilities**:
- Render product grid using existing ProductCard components
- Display loading states (initial, more loading, error)
- Show end-of-results message
- Handle filter/sort changes by resetting pagination

### 3. ScrollSentinel Component
**Purpose**: Invisible element that triggers loading when scrolled into view

```typescript
interface ScrollSentinelProps {
  onIntersect: () => void
  loading: boolean
  hasMore: boolean
  threshold?: string // default: "200px"
}
```

## Data Models

### Enhanced ProductsData Interface
```typescript
interface ProductsData {
  data: ProductWithCategory[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean // New field
  }
  meta?: {
    loadedCount: number // New field
    remainingCount: number // New field
  }
}
```

### Loading States
```typescript
type LoadingState = 
  | 'initial' // First load
  | 'loading-more' // Loading additional pages
  | 'error' // Error occurred
  | 'complete' // All products loaded
  | 'idle' // Ready for next load
```

## Error Handling

### Error Types
1. **Network Errors**: Connection issues, timeouts
2. **API Errors**: Server errors, invalid responses
3. **Validation Errors**: Invalid pagination parameters

### Error Recovery
- **Retry Button**: Allow users to retry failed requests
- **Graceful Degradation**: Show existing products even if new ones fail to load
- **Error Messages**: Clear, actionable error descriptions
- **Timeout Handling**: 10-second timeout with retry option

### Error UI States
```typescript
interface ErrorState {
  type: 'network' | 'api' | 'timeout'
  message: string
  retryable: boolean
  retryCount: number
}
```

## Testing Strategy

### Unit Tests
1. **useInfiniteScroll Hook**
   - Pagination state management
   - Scroll detection logic
   - Error handling and retry
   - Cleanup on unmount

2. **LazyProductGrid Component**
   - Initial render with products
   - Loading state displays
   - Error state handling
   - Filter/sort reset behavior

3. **ScrollSentinel Component**
   - Intersection Observer setup
   - Threshold detection
   - Loading state prevention

### Integration Tests
1. **API Integration**
   - Pagination parameter handling
   - Response data structure
   - Error response handling

2. **Component Integration**
   - Product grid rendering
   - Scroll-triggered loading
   - Filter/sort interactions

### Performance Tests
1. **Memory Usage**: Ensure large product lists don't cause memory leaks
2. **Scroll Performance**: Smooth scrolling with many products
3. **Network Efficiency**: Prevent duplicate requests

## Implementation Details

### Scroll Detection
- **Intersection Observer**: Monitor sentinel element 200px from bottom
- **Debouncing**: 300ms delay to prevent rapid-fire requests
- **Threshold**: Trigger loading when 200px from bottom of current content

### State Management
- **Local State**: Use React useState for component-level state
- **URL Sync**: Maintain current page in URL for browser back/forward
- **Cache Strategy**: Keep loaded products in memory during session

### Performance Optimizations
1. **Virtual Scrolling**: Not implemented initially (future enhancement)
2. **Image Lazy Loading**: Leverage existing ProductCard lazy loading
3. **Request Deduplication**: Prevent multiple simultaneous requests
4. **Memory Management**: Clear old products after reaching threshold (future)

### Mobile Considerations
- **Touch Scrolling**: Ensure smooth touch scroll detection
- **Viewport Detection**: Accurate intersection detection on mobile
- **Loading Indicators**: Mobile-friendly loading states
- **Error Handling**: Touch-friendly retry buttons

### Accessibility
- **Screen Readers**: Announce loading states and new content
- **Keyboard Navigation**: Ensure keyboard users can navigate loaded content
- **Focus Management**: Maintain focus context during loading
- **ARIA Labels**: Proper labeling for loading indicators

## Integration Points

### Existing Components
1. **CategoriesClient**: Replace current loadMore function
2. **SearchPageClient**: Integrate lazy loading for search results
3. **ProductCard**: No changes needed, works with lazy loading
4. **RecommendedProducts**: Already has infinite scroll, may standardize

### API Endpoints
- **GET /api/products**: Already supports pagination, no changes needed
- **Response Format**: Current pagination structure is compatible

### URL Management
- **Search Params**: Maintain existing filter/sort parameters
- **Page Tracking**: Optional page parameter for deep linking
- **Browser History**: Preserve back/forward navigation

## Migration Strategy

### Phase 1: Core Implementation
1. Create useInfiniteScroll hook
2. Build LazyProductGrid component
3. Implement ScrollSentinel

### Phase 2: Integration
1. Update CategoriesClient to use lazy loading
2. Update SearchPageClient for search results
3. Test with existing filters and sorting

### Phase 3: Enhancement
1. Add loading animations
2. Implement error recovery
3. Performance optimizations

### Backward Compatibility
- Existing API endpoints remain unchanged
- Current filter/sort functionality preserved
- Progressive enhancement approach