'use client'

import { useState, useEffect } from 'react';
import { CpuChipIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface PerformanceMetrics {
  renderTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  itemsRendered: number;
  totalItems: number;
  fps: number;
}

interface PerformanceMonitorProps {
  show?: boolean;
  onClose?: () => void;
}

export default function PerformanceMonitor({ show = false, onClose }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    apiResponseTime: 0,
    memoryUsage: 0,
    itemsRendered: 0,
    totalItems: 0,
    fps: 0,
  });

  useEffect(() => {
    if (!show) return;

    const updateMetrics = () => {
      // Check memory (Chrome only)
      const memory = (performance as any).memory;
      const memoryMB = memory ? memory.usedJSHeapSize / (1024 * 1024) : 0;

      // Calculate FPS
      let lastTime = performance.now();
      let frames = 0;
      let fps = 0;

      const calculateFPS = () => {
        frames++;
        const currentTime = performance.now();
        if (currentTime >= lastTime + 1000) {
          fps = Math.round((frames * 1000) / (currentTime - lastTime));
          frames = 0;
          lastTime = currentTime;
        }
        requestAnimationFrame(calculateFPS);
      };
      calculateFPS();

      setMetrics((prev) => ({
        ...prev,
        memoryUsage: memoryMB,
        fps: fps,
      }));
    };

    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  }, [show]);

  if (!show) return null;

  const getPerformanceColor = (value: number, thresholds: [number, number]) => {
    if (value < thresholds[0]) return 'text-green-600';
    if (value < thresholds[1]) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getFPSColor = (fps: number) => {
    if (fps >= 55) return 'text-green-600';
    if (fps >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl border-2 border-gray-300 p-4 w-72 z-50 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CpuChipIcon className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-sm text-gray-900">Performance Monitor</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Metrics */}
      <div className="space-y-2 text-xs">
        {/* FPS */}
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <span className="text-gray-600 font-medium">FPS:</span>
          <span className={`font-bold ${getFPSColor(metrics.fps)}`}>
            {metrics.fps} fps
          </span>
        </div>

        {/* Memory */}
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <span className="text-gray-600 font-medium">Memory:</span>
          <span className={`font-bold ${getPerformanceColor(metrics.memoryUsage, [100, 200])}`}>
            {metrics.memoryUsage.toFixed(1)} MB
          </span>
        </div>

        {/* Render Time */}
        {metrics.renderTime > 0 && (
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-gray-600 font-medium">Render:</span>
            <span className={`font-bold ${getPerformanceColor(metrics.renderTime, [100, 500])}`}>
              {metrics.renderTime.toFixed(0)} ms
            </span>
          </div>
        )}

        {/* API Response */}
        {metrics.apiResponseTime > 0 && (
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-gray-600 font-medium">API:</span>
            <span className={`font-bold ${getPerformanceColor(metrics.apiResponseTime, [500, 2000])}`}>
              {metrics.apiResponseTime.toFixed(0)} ms
            </span>
          </div>
        )}

        {/* Items Rendered */}
        {metrics.totalItems > 0 && (
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-gray-600 font-medium">Rendered:</span>
            <span className="font-bold text-gray-700">
              {metrics.itemsRendered} / {metrics.totalItems}
            </span>
          </div>
        )}
      </div>

      {/* Performance Tips */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-600 mb-2 font-medium">💡 Tips:</p>
        <ul className="text-xs text-gray-500 space-y-1">
          {metrics.fps < 30 && (
            <li>• Reduce page size for smoother scrolling</li>
          )}
          {metrics.memoryUsage > 200 && (
            <li>• High memory usage - close other tabs</li>
          )}
          {metrics.renderTime > 500 && (
            <li>• Enable virtual scrolling for better performance</li>
          )}
        </ul>
      </div>
    </div>
  );
}

// Export utility function to measure performance
export function measurePerformance(name: string, fn: () => void | Promise<void>) {
  return async () => {
    performance.mark(`${name}-start`);
    const result = await fn();
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name)[0];
    console.log(`⏱️ ${name}: ${measure.duration.toFixed(2)}ms`);
    
    return result;
  };
}

// Hook to track component render time
export function useRenderTime(componentName: string) {
  useEffect(() => {
    performance.mark(`${componentName}-render`);
    return () => {
      try {
        performance.measure(
          `${componentName}-render-time`,
          `${componentName}-render`
        );
      } catch (e) {
        // Mark may not exist
      }
    };
  });
}
