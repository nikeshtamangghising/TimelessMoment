import {
  performanceMonitor,
  measurePerformance,
  ResourceLoader,
  LoadingStateManager,
} from '@/lib/performance'

// Mock Performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
}

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
})

describe('Performance Monitoring', () => {
  beforeEach(() => {
    performanceMonitor.clearMetrics()
    jest.clearAllMocks()
  })

  describe('PerformanceMonitor', () => {
    it('should start and end measurements', () => {
      const id = performanceMonitor.startMeasurement('test-operation')
      
      expect(id).toBeTruthy()
      expect(mockPerformance.mark).toHaveBeenCalledWith(`${id}-start`)
      
      const metric = performanceMonitor.endMeasurement(id)
      
      expect(metric).toBeTruthy()
      expect(metric?.name).toBe(id)
      expect(metric?.duration).toBeGreaterThanOrEqual(0)
      expect(mockPerformance.mark).toHaveBeenCalledWith(`${id}-end`)
      expect(mockPerformance.measure).toHaveBeenCalledWith(id, `${id}-start`, `${id}-end`)
    })

    it('should return null for non-existent measurement', () => {
      const result = performanceMonitor.endMeasurement('non-existent-id')
      expect(result).toBeNull()
    })

    it('should store metadata with measurements', () => {
      const metadata = { userId: '123', action: 'load' }
      const id = performanceMonitor.startMeasurement('test-with-metadata', metadata)
      const metric = performanceMonitor.endMeasurement(id)
      
      expect(metric?.metadata).toEqual(metadata)
    })

    it('should get metrics by name pattern', () => {
      performanceMonitor.startMeasurement('api-call-1')
      performanceMonitor.startMeasurement('api-call-2')
      performanceMonitor.startMeasurement('render-component')
      
      const apiMetrics = performanceMonitor.getMetricsByName('api-call')
      expect(apiMetrics).toHaveLength(2)
    })

    it('should clear all metrics', () => {
      performanceMonitor.startMeasurement('test-1')
      performanceMonitor.startMeasurement('test-2')
      
      expect(performanceMonitor.getMetrics()).toHaveLength(2)
      
      performanceMonitor.clearMetrics()
      
      expect(performanceMonitor.getMetrics()).toHaveLength(0)
    })

    it('should warn about slow operations', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      // Mock slow operation (> 1000ms)
      mockPerformance.now
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(1500)
      
      const id = performanceMonitor.startMeasurement('slow-operation')
      performanceMonitor.endMeasurement(id)
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow operation detected'),
        expect.stringContaining(id),
        expect.stringContaining('1500')
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('measurePerformance decorator', () => {
    it('should measure method performance', async () => {
      class TestClass {
        @measurePerformance('custom-name')
        async testMethod(param: string) {
          await new Promise(resolve => setTimeout(resolve, 10))
          return `result-${param}`
        }
      }

      const instance = new TestClass()
      const result = await instance.testMethod('test')
      
      expect(result).toBe('result-test')
      
      const metrics = performanceMonitor.getMetricsByName('custom-name')
      expect(metrics).toHaveLength(1)
      expect(metrics[0].metadata).toEqual({
        args: 1,
        className: 'TestClass',
        methodName: 'testMethod',
      })
    })

    it('should handle method errors and still record metrics', async () => {
      class TestClass {
        @measurePerformance()
        async errorMethod() {
          throw new Error('Test error')
        }
      }

      const instance = new TestClass()
      
      await expect(instance.errorMethod()).rejects.toThrow('Test error')
      
      const metrics = performanceMonitor.getMetricsByName('TestClass.errorMethod')
      expect(metrics).toHaveLength(1)
    })
  })

  describe('ResourceLoader', () => {
    beforeEach(() => {
      // Reset static properties
      ResourceLoader['loadedResources'] = new Set()
      ResourceLoader['loadingPromises'] = new Map()
    })

    it('should preload resources', () => {
      // Mock document
      const mockLink = {
        rel: '',
        href: '',
        as: '',
        crossOrigin: '',
      }
      const mockDocument = {
        createElement: jest.fn(() => mockLink),
        head: {
          appendChild: jest.fn(),
        },
      }
      
      Object.defineProperty(global, 'document', {
        value: mockDocument,
        writable: true,
      })

      ResourceLoader.preloadResource('/test.js', 'script', 'anonymous')
      
      expect(mockDocument.createElement).toHaveBeenCalledWith('link')
      expect(mockLink.rel).toBe('preload')
      expect(mockLink.href).toBe('/test.js')
      expect(mockLink.as).toBe('script')
      expect(mockLink.crossOrigin).toBe('anonymous')
      expect(mockDocument.head.appendChild).toHaveBeenCalledWith(mockLink)
    })

    it('should not preload same resource twice', () => {
      const mockDocument = {
        createElement: jest.fn(() => ({})),
        head: { appendChild: jest.fn() },
      }
      
      Object.defineProperty(global, 'document', {
        value: mockDocument,
        writable: true,
      })

      ResourceLoader.preloadResource('/test.js', 'script')
      ResourceLoader.preloadResource('/test.js', 'script')
      
      expect(mockDocument.createElement).toHaveBeenCalledTimes(1)
    })

    it('should load modules with caching', async () => {
      const mockModule = { default: 'test-module' }
      const importFn = jest.fn().mockResolvedValue(mockModule)
      
      // First call
      const result1 = await ResourceLoader.loadModule(importFn)
      
      // Second call (should use cached promise)
      const result2 = await ResourceLoader.loadModule(importFn)
      
      expect(result1).toBe(mockModule)
      expect(result2).toBe(mockModule)
      expect(importFn).toHaveBeenCalledTimes(1)
    })

    it('should handle module loading errors', async () => {
      const error = new Error('Module load failed')
      const importFn = jest.fn().mockRejectedValue(error)
      
      await expect(ResourceLoader.loadModule(importFn)).rejects.toThrow('Module load failed')
      
      // Should not cache failed promises
      await expect(ResourceLoader.loadModule(importFn)).rejects.toThrow('Module load failed')
      expect(importFn).toHaveBeenCalledTimes(2)
    })
  })

  describe('LoadingStateManager', () => {
    beforeEach(() => {
      // Reset static properties
      LoadingStateManager['loadingStates'] = new Map()
      LoadingStateManager['listeners'] = new Map()
    })

    it('should manage loading states', () => {
      expect(LoadingStateManager.isLoading('test-key')).toBe(false)
      
      LoadingStateManager.setLoading('test-key', true)
      expect(LoadingStateManager.isLoading('test-key')).toBe(true)
      
      LoadingStateManager.setLoading('test-key', false)
      expect(LoadingStateManager.isLoading('test-key')).toBe(false)
    })

    it('should notify listeners of state changes', () => {
      const listener = jest.fn()
      
      const unsubscribe = LoadingStateManager.subscribe('test-key', listener)
      
      LoadingStateManager.setLoading('test-key', true)
      expect(listener).toHaveBeenCalledWith(true)
      
      LoadingStateManager.setLoading('test-key', false)
      expect(listener).toHaveBeenCalledWith(false)
      
      unsubscribe()
      
      LoadingStateManager.setLoading('test-key', true)
      expect(listener).toHaveBeenCalledTimes(2) // Should not be called after unsubscribe
    })

    it('should get global loading state', () => {
      expect(LoadingStateManager.getGlobalLoadingState()).toBe(false)
      
      LoadingStateManager.setLoading('key1', true)
      expect(LoadingStateManager.getGlobalLoadingState()).toBe(true)
      
      LoadingStateManager.setLoading('key2', true)
      expect(LoadingStateManager.getGlobalLoadingState()).toBe(true)
      
      LoadingStateManager.setLoading('key1', false)
      expect(LoadingStateManager.getGlobalLoadingState()).toBe(true) // key2 still loading
      
      LoadingStateManager.setLoading('key2', false)
      expect(LoadingStateManager.getGlobalLoadingState()).toBe(false)
    })

    it('should clean up listeners when all are removed', () => {
      const listener1 = jest.fn()
      const listener2 = jest.fn()
      
      const unsubscribe1 = LoadingStateManager.subscribe('test-key', listener1)
      const unsubscribe2 = LoadingStateManager.subscribe('test-key', listener2)
      
      unsubscribe1()
      unsubscribe2()
      
      // Should clean up the listeners map entry
      expect(LoadingStateManager['listeners'].has('test-key')).toBe(false)
    })
  })
})