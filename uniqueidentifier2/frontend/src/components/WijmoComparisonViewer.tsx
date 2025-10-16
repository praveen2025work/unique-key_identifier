'use client';

import React, { useState, useEffect, useMemo } from 'react';
import WijmoDataGrid from './WijmoDataGrid';
import apiService from '@/services/api';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface WijmoComparisonViewerProps {
  runId: number;
  columns: string;
  onClose?: () => void;
}

type Category = 'matched' | 'only_a' | 'only_b';

interface ComparisonSummary {
  matched_count: number;
  only_a_count: number;
  only_b_count: number;
  match_percentage?: number;
}

const WijmoComparisonViewer: React.FC<WijmoComparisonViewerProps> = ({
  runId,
  columns,
  onClose,
}) => {
  const [summary, setSummary] = useState<ComparisonSummary | null>(null);
  const [activeTab, setActiveTab] = useState<Category>('matched');
  const [data, setData] = useState<Record<Category, any[]>>({
    matched: [],
    only_a: [],
    only_b: [],
  });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState<Record<Category, boolean>>({
    matched: false,
    only_a: false,
    only_b: false,
  });
  const [currentOffset, setCurrentOffset] = useState<Record<Category, number>>({
    matched: 0,
    only_a: 0,
    only_b: 0,
  });
  const [exportsAvailable, setExportsAvailable] = useState(false);

  const pageSize = 100;

  useEffect(() => {
    loadInitialData();
  }, [runId, columns]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Check if exports exist
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const statusResp = await fetch(
        `${apiBaseUrl}/api/comparison-export/${runId}/status?columns=${encodeURIComponent(columns)}`
      );
      const statusData = await statusResp.json();

      if (statusData.exports_available) {
        setExportsAvailable(true);
        
        // Load summary
        if (statusData.summary) {
          setSummary(statusData.summary);
        }

        // Load initial data for matched records
        await loadCategoryData('matched', 0);
      } else {
        // Generate exports first
        await generateExports();
      }
    } catch (error) {
      console.error('Error loading comparison data:', error);
      toast.error('Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  };

  const generateExports = async () => {
    try {
      toast.loading('Generating comparison exports...', { id: 'export-generate' });
      
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(
        `${apiBaseUrl}/api/comparison-export/${runId}/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ columns }),
        }
      );

      if (!response.ok) throw new Error('Failed to generate exports');

      const result = await response.json();
      
      if (result.summary) {
        setSummary(result.summary);
      }
      
      setExportsAvailable(true);
      toast.success('Exports generated successfully', { id: 'export-generate' });
      
      // Load initial data
      await loadCategoryData('matched', 0);
    } catch (error) {
      console.error('Error generating exports:', error);
      toast.error('Failed to generate exports', { id: 'export-generate' });
    }
  };

  const loadCategoryData = async (category: Category, offset: number) => {
    if (!exportsAvailable) return;

    setPageLoading(prev => ({ ...prev, [category]: true }));
    
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(
        `${apiBaseUrl}/api/comparison-export/${runId}/data?` +
        `columns=${encodeURIComponent(columns)}&category=${category}&offset=${offset}&limit=${pageSize}`
      );

      if (!response.ok) throw new Error('Failed to load data');

      const result = await response.json();
      const newRecords = result.records || [];

      // Append new data to existing data
      setData(prev => ({
        ...prev,
        [category]: offset === 0 ? newRecords : [...prev[category], ...newRecords],
      }));

      setCurrentOffset(prev => ({ ...prev, [category]: offset + newRecords.length }));
    } catch (error) {
      console.error(`Error loading ${category} data:`, error);
      toast.error(`Failed to load ${category} records`);
    } finally {
      setPageLoading(prev => ({ ...prev, [category]: false }));
    }
  };

  const handleLoadMore = (category: Category) => {
    return (pageIndex: number) => {
      const offset = (pageIndex - 1) * pageSize;
      loadCategoryData(category, offset);
    };
  };

  const handleTabChange = async (category: Category) => {
    setActiveTab(category);
    
    // Load data if not loaded yet
    if (data[category].length === 0 && !pageLoading[category]) {
      await loadCategoryData(category, 0);
    }
  };

  const handleExportCategory = async (category: Category) => {
    try {
      toast.loading(`Exporting ${category} records...`, { id: 'export' });
      
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(
        `${apiBaseUrl}/api/comparison-export/${runId}/download?` +
        `columns=${encodeURIComponent(columns)}&category=${category}`
      );

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${category}_${columns.replace(/,/g, '_')}_${runId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Export downloaded successfully', { id: 'export' });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data', { id: 'export' });
    }
  };

  // Generate columns dynamically from data
  const gridColumns = useMemo(() => {
    const currentData = data[activeTab];
    if (!currentData || currentData.length === 0) return [];

    const firstRecord = currentData[0];
    return Object.keys(firstRecord).map(key => ({
      binding: key,
      header: key.replace(/_/g, ' ').toUpperCase(),
      width: 150,
    }));
  }, [data, activeTab]);

  const getTotalCount = (category: Category): number => {
    switch (category) {
      case 'matched': return summary?.matched_count || 0;
      case 'only_a': return summary?.only_a_count || 0;
      case 'only_b': return summary?.only_b_count || 0;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading comparison data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">File Comparison</h2>
            <p className="mt-1 text-sm text-gray-500">
              Comparing by: {columns.replace(/,/g, ', ')}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm font-medium text-green-800">Matched Records</div>
              <div className="mt-1 text-2xl font-semibold text-green-900">
                {summary.matched_count.toLocaleString()}
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-800">Only in File A</div>
              <div className="mt-1 text-2xl font-semibold text-blue-900">
                {summary.only_a_count.toLocaleString()}
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-sm font-medium text-orange-800">Only in File B</div>
              <div className="mt-1 text-2xl font-semibold text-orange-900">
                {summary.only_b_count.toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => handleTabChange('matched')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'matched'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Matched ({summary?.matched_count.toLocaleString() || 0})
          </button>
          <button
            onClick={() => handleTabChange('only_a')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'only_a'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Only in A ({summary?.only_a_count.toLocaleString() || 0})
          </button>
          <button
            onClick={() => handleTabChange('only_b')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'only_b'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Only in B ({summary?.only_b_count.toLocaleString() || 0})
          </button>
        </nav>
      </div>

      {/* Export Button */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex justify-end">
        <button
          onClick={() => handleExportCategory(activeTab)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          Export {activeTab.replace('_', ' ').toUpperCase()}
        </button>
      </div>

      {/* Wijmo Grid */}
      <div className="p-6">
        {data[activeTab].length > 0 ? (
          <WijmoDataGrid
            data={data[activeTab]}
            columns={gridColumns}
            pageSize={pageSize}
            allowPaging={true}
            allowSorting={true}
            allowFiltering={true}
            loading={pageLoading[activeTab]}
            totalItems={getTotalCount(activeTab)}
            onLoadMoreData={handleLoadMore(activeTab)}
            height={600}
            showRowNumbers={true}
            className="border rounded-lg"
          />
        ) : (
          <div className="flex items-center justify-center h-96">
            <div className="text-center text-gray-500">
              <p className="text-lg">No {activeTab.replace('_', ' ')} records found</p>
              <p className="text-sm mt-2">Try switching to another tab</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WijmoComparisonViewer;

