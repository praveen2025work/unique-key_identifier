'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { FlexGrid, FlexGridColumn } from '@mescius/wijmo.react.grid';
import { FlexGridFilter } from '@mescius/wijmo.react.grid.filter';
import { CollectionView, SortDescription } from '@mescius/wijmo';
import * as wjGrid from '@mescius/wijmo.grid';
import '@mescius/wijmo/styles/wijmo.css';
import toast from 'react-hot-toast';

interface Column {
  binding: string;
  header: string;
  width?: number | string;
  align?: string;
  format?: string;
  visible?: boolean;
  isReadOnly?: boolean;
}

interface WijmoDataGridProps {
  data: any[];
  columns: Column[];
  pageSize?: number;
  allowPaging?: boolean;
  allowSorting?: boolean;
  allowFiltering?: boolean;
  selectionMode?: wjGrid.SelectionMode;
  onSelectionChanged?: (selectedItems: any[]) => void;
  onLoadMoreData?: (pageIndex: number) => void;
  totalItems?: number;
  loading?: boolean;
  height?: number | string;
  frozenColumns?: number;
  className?: string;
  showRowNumbers?: boolean;
  allowAddNew?: boolean;
  allowDelete?: boolean;
  isReadOnly?: boolean;
  alternatingRowStep?: number;
  headersVisibility?: wjGrid.HeadersVisibility;
}

const WijmoDataGrid: React.FC<WijmoDataGridProps> = ({
  data = [],
  columns = [],
  pageSize = 100,
  allowPaging = true,
  allowSorting = true,
  allowFiltering = true,
  selectionMode = wjGrid.SelectionMode.Row,
  onSelectionChanged,
  onLoadMoreData,
  totalItems,
  loading = false,
  height = 600,
  frozenColumns = 0,
  className = '',
  showRowNumbers = false,
  allowAddNew = false,
  allowDelete = false,
  isReadOnly = true,
  alternatingRowStep = 1,
  headersVisibility = wjGrid.HeadersVisibility.Column,
}) => {
  const gridRef = useRef<FlexGrid>(null);
  const [view, setView] = useState<CollectionView | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Create CollectionView with pagination
  useEffect(() => {
    // MEMORY FIX: Clear previous view before creating new one
    if (view) {
      try {
        view.sourceCollection = [];
        view.clearChanges();
      } catch (e) {
        // Ignore cleanup errors
      }
      setView(null);
    }
    
    if (data && data.length > 0) {
      try {
        const cv = new CollectionView(data, {
          pageSize: allowPaging ? pageSize : 0,
          trackChanges: false, // Improves performance by not tracking changes
        });

        // Set initial page
        if (cv.pageCount > 0 && currentPage > cv.pageCount) {
          setCurrentPage(1);
          cv.moveToFirstPage();
        }

        setView(cv);
      } catch (error) {
        console.error('Error creating CollectionView:', error);
        toast.error('Failed to create data view');
      }
    } else {
      setView(null);
    }

    // Cleanup on unmount
    return () => {
      if (view) {
        try {
          view.sourceCollection = [];
          view.clearChanges();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [data, pageSize, allowPaging]);

  // Handle grid initialization
  const handleInitialized = (grid: wjGrid.FlexGrid) => {
    if (!grid) return;

    // Configure grid for optimal performance and memory management
    grid.deferResizing = true; // Improves performance during resizing
    grid.quickAutoSize = true; // Faster auto-sizing
    grid.lazyRender = true; // MEMORY FIX: Only render visible rows
    grid.alternatingRowStep = alternatingRowStep;
    grid.headersVisibility = headersVisibility;
    grid.isReadOnly = isReadOnly;
    grid.allowAddNew = allowAddNew;
    grid.allowDelete = allowDelete;
    grid.frozenColumns = frozenColumns;

    // Add row numbers if requested
    if (showRowNumbers) {
      grid.rowHeaders.columns.splice(0, 0, new wjGrid.Column());
      grid.rowHeaders.columns[0].width = 50;
    }

    // Handle selection changes
    if (onSelectionChanged) {
      grid.selectionChanged.addHandler(() => {
        const selectedItems = grid.rows
          .filter(row => row.isSelected)
          .map(row => row.dataItem);
        onSelectionChanged(selectedItems);
      });
    }

    // Handle scrolling for infinite loading
    if (onLoadMoreData && allowPaging) {
      grid.scrollPositionChanged.addHandler((s: wjGrid.FlexGrid) => {
        const scrollPos = s.scrollPosition;
        const viewRange = s.viewRange;
        const lastVisibleRow = viewRange.bottomRow;
        
        // Load more when scrolling near the bottom
        if (view && lastVisibleRow >= view.items.length - 10) {
          const nextPage = currentPage + 1;
          const maxPages = totalItems ? Math.ceil(totalItems / pageSize) : 1;
          
          if (nextPage <= maxPages && !loading) {
            setCurrentPage(nextPage);
            onLoadMoreData(nextPage);
          }
        }
      });
    }

    // Format cells with row numbers
    if (showRowNumbers) {
      grid.formatItem.addHandler((s: wjGrid.FlexGrid, e: wjGrid.FormatItemEventArgs) => {
        if (e.panel === s.rowHeaders && e.col === 0) {
          e.cell.textContent = (e.row + 1).toString();
        }
      });
    }
  };

  // Handle page changes
  const handlePageChanged = (cv: CollectionView) => {
    const newPage = cv.pageIndex + 1;
    setCurrentPage(newPage);
    
    if (onLoadMoreData && newPage > currentPage) {
      onLoadMoreData(newPage);
    }
  };

  // Memoize grid configuration for performance
  const gridConfig = useMemo(() => ({
    allowSorting,
    selectionMode,
    autoGenerateColumns: false,
  }), [allowSorting, selectionMode]);

  if (!view) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`wijmo-grid-container ${className}`} style={{ position: 'relative' }}>
      {loading && (
        <div className="absolute top-2 right-2 z-10">
          <div className="flex items-center gap-2 bg-white px-3 py-1 rounded shadow-md border border-gray-200">
            <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
            <span className="text-xs text-gray-600">Loading...</span>
          </div>
        </div>
      )}
      
      <FlexGrid
        ref={gridRef}
        itemsSource={view}
        initialized={handleInitialized}
        style={{ height }}
        {...gridConfig}
      >
        {/* Enable filtering if requested */}
        {allowFiltering && <FlexGridFilter />}
        
        {/* Render columns */}
        {columns.map((col, index) => (
          <FlexGridColumn
            key={`${col.binding}-${index}`}
            binding={col.binding}
            header={col.header}
            width={col.width || '*'}
            align={col.align}
            format={col.format}
            visible={col.visible !== false}
            isReadOnly={col.isReadOnly !== false}
          />
        ))}
      </FlexGrid>

      {/* Pagination Info */}
      {allowPaging && view && view.pageCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Page {view.pageIndex + 1} of {view.pageCount}
            </span>
            <span className="text-sm text-gray-600">
              Showing {view.items.length} of {totalItems || data.length} records
            </span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => {
                view.moveToFirstPage();
                handlePageChanged(view);
              }}
              disabled={view.pageIndex === 0 || loading}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First
            </button>
            <button
              onClick={() => {
                view.moveToPreviousPage();
                handlePageChanged(view);
              }}
              disabled={view.pageIndex === 0 || loading}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => {
                view.moveToNextPage();
                handlePageChanged(view);
              }}
              disabled={view.pageIndex >= view.pageCount - 1 || loading}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              onClick={() => {
                view.moveToLastPage();
                handlePageChanged(view);
              }}
              disabled={view.pageIndex >= view.pageCount - 1 || loading}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .wj-flexgrid {
          border: 1px solid #e5e7eb;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        
        .wj-cell {
          border-color: #e5e7eb;
          padding: 8px;
        }
        
        .wj-header {
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
        }
        
        .wj-alt {
          background: #f9fafb;
        }
        
        .wj-state-selected {
          background: #eef2ff !important;
          color: #312e81;
        }
        
        .wj-state-multi-selected {
          background: #e0e7ff !important;
        }
      `}</style>
    </div>
  );
};

export default WijmoDataGrid;

