'use client'

import { useState, useEffect, useRef, useCallback, ReactNode } from 'react';

interface VirtualScrollerProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  overscan?: number; // Number of items to render outside viewport
  onScrollEnd?: () => void; // Callback when user scrolls near the end
  scrollEndThreshold?: number; // Percentage (0-1) of scroll position to trigger onScrollEnd
  className?: string;
  emptyMessage?: string;
}

export default function VirtualScroller<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  onScrollEnd,
  scrollEndThreshold = 0.8,
  className = '',
  emptyMessage = 'No items to display',
}: VirtualScrollerProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);

  // Add overscan
  const startIndex = Math.max(0, visibleStart - overscan);
  const endIndex = Math.min(items.length, visibleEnd + overscan);

  // Get visible items
  const visibleItems = items.slice(startIndex, endIndex);

  // Total height of all items
  const totalHeight = items.length * itemHeight;

  // Offset for visible items
  const offsetY = startIndex * itemHeight;

  // Handle scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      setScrollTop(target.scrollTop);

      // Check if near end
      if (onScrollEnd) {
        const scrollPercentage = (target.scrollTop + containerHeight) / totalHeight;
        if (scrollPercentage >= scrollEndThreshold) {
          onScrollEnd();
        }
      }
    },
    [containerHeight, totalHeight, scrollEndThreshold, onScrollEnd]
  );

  // Reset scroll on items change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [items.length]);

  if (items.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height: containerHeight }}
      >
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Skeleton loader for virtual scroller
export function VirtualScrollerSkeleton({
  itemHeight,
  containerHeight,
  count = 10,
}: {
  itemHeight: number;
  containerHeight: number;
  count?: number;
}) {
  return (
    <div className="space-y-2" style={{ height: containerHeight }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{ height: itemHeight }}
          className="bg-gray-200 animate-pulse rounded"
        />
      ))}
    </div>
  );
}
