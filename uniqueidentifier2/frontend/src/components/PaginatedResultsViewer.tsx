'use client'

import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';
import type { RunDetails, AnalysisResult } from '../types';
import toast from 'react-hot-toast';
import Pagination from './ui/Pagination';
import VirtualScroller from './ui/VirtualScroller';
import { 
  MagnifyingGlassIcon, 
  ArrowDownTrayIcon,
  FunnelIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface PaginatedResultsViewerProps {
  runId: number;
  onBack?: () => void;
}

type SideFilter = 'all' | 'A' | 'B';
type UniqueFilter = 'all' | 'unique' | 'duplicates';

export default function PaginatedResultsViewer({ runId, onBack }: PaginatedResultsViewerProps) {
  const [details, setDetails] = useState<RunDetails | null>(null);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPage, setLoadingPage] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  
  // Filter state
  const [sideFilter, setSideFilter] = useState<SideFilter>('all');
  const [uniqueFilter, setUniqueFilter] = useState<UniqueFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Virtual scrolling state
  const [useVirtualScroll, setUseVirtualScroll] = useState(true);

  useEffect(() => {
    loadResults();
  }, [runId, currentPage, pageSize, sideFilter]);

  const loadResults = async () => {
    try {
      if (currentPage === 1) {
        setLoading(true);
      } else {
        setLoadingPage(true);
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: pageSize.toString(),
      });

      if (sideFilter !== 'all') {
        params.append('side', sideFilter);
      }

      const data = await apiService.getRunDetails(runId, params.toString());
      
      setDetails(data);
      
      // Combine results from both sides
      const allResults = [...(data.results_a || []), ...(data.results_b || [])];
      setResults(allResults);
      
      // Update pagination info
      if (data.pagination) {
        setTotalPages(data.pagination.total_pages);
        setTotalResults(data.pagination.total_results);
      }
      
    } catch (error) {
      toast.error('Failed to load results');
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingPage(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page
  };

  const handleSideFilterChange = (side: SideFilter) => {
    setSideFilter(side);
    setCurrentPage(1); // Reset to first page
  };

  // Apply client-side filters
  const getFilteredResults = useCallback(() => {
    let filtered = results;

    // Filter by unique status
    if (uniqueFilter === 'unique') {
      filtered = filtered.filter(r => r.is_unique_key);
    } else if (uniqueFilter === 'duplicates') {
      filtered = filtered.filter(r => !r.is_unique_key);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.columns.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by column name in ascending order
    filtered = [...filtered].sort((a, b) => 
      a.columns.localeCompare(b.columns)
    );

    return filtered;
  }, [results, uniqueFilter, searchTerm]);

  const filteredResults = getFilteredResults();

  const handleDownloadCSV = async () => {
    try {
      toast.loading('Preparing CSV download...', { id: 'download' });
      await apiService.downloadCSV(runId);
      toast.success('CSV download started', { id: 'download' });
    } catch (error) {
      toast.error('Failed to download CSV', { id: 'download' });
    }
  };

  const handleDownloadExcel = async () => {
    try:
      toast.loading('Preparing Excel download...', { id: 'download' });
      await apiService.downloadExcel(runId);
      toast.success('Excel download started', { id: 'download' });
    } catch (error) {
      toast.error('Failed to download Excel', { id: 'download' });
    }
  };

  // Render single result row
  const renderResultRow = (result: AnalysisResult, index: number) => {
    const scoreColor = result.uniqueness_score === 100
      ? 'text-green-600'
      : result.uniqueness_score >= 95
      ? 'text-blue-600'
      : result.uniqueness_score >= 80
      ? 'text-yellow-600'
      : 'text-red-600';

    return (
      <div className="flex items-center border-b border-gray-200 hover:bg-gray-50 transition-colors px-4">
        <div className="w-8 text-xs text-gray-500 font-medium">{index + 1}</div>
        <div className="flex-1 min-w-0 py-3 font-mono text-sm truncate">{result.columns}</div>
        <div className="w-24 text-center text-sm">{result.total_rows.toLocaleString()}</div>
        <div className="w-24 text-center text-sm text-green-600 font-semibold">
          {result.unique_rows.toLocaleString()}
        </div>
        <div className="w-24 text-center text-sm text-red-600">
          {result.duplicate_count.toLocaleString()}
        </div>
        <div className="w-32 flex items-center justify-center">
          <div className="w-full max-w-[80px] bg-gray-200 rounded-full h-2 mr-2">
            <div
              className={`h-2 rounded-full ${
                result.uniqueness_score === 100
                  ? 'bg-green-500'
                  : result.uniqueness_score >= 95
                  ? 'bg-blue-500'
                  : result.uniqueness_score >= 80
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${result.uniqueness_score}%` }}
            ></div>
          </div>
          <span className={`font-bold text-sm ${scoreColor}`}>
            {result.uniqueness_score.toFixed(1)}%
          </span>
        </div>
        <div className="w-32 text-center">
          {result.is_unique_key ? (
            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
              <CheckCircleIcon className="w-3 h-3 mr-1" />
              Unique Key
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
              <XCircleIcon className="w-3 h-3 mr-1" />
              Has Duplicates
            </span>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
        <span className="mt-4 text-lg text-gray-600 font-medium">Loading results...</span>
        <span className="mt-1 text-sm text-gray-500">Preparing {totalResults > 0 ? totalResults.toLocaleString() : ''} results</span>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="text-center p-8 text-red-500">
        Failed to load results
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Analysis Results</h2>
            <p className="text-gray-600 mt-1">
              Run #{runId} • {details.timestamp} • {totalResults.toLocaleString()} combinations
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200">
            <div className="text-sm text-blue-700 font-semibold mb-1">Total Combinations</div>
            <div className="text-3xl font-extrabold text-blue-900">{details.summary.total_combinations}</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200">
            <div className="text-sm text-green-700 font-semibold mb-1">Unique Keys (A)</div>
            <div className="text-3xl font-extrabold text-green-900">{details.summary.unique_keys_a}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-200">
            <div className="text-sm text-purple-700 font-semibold mb-1">Unique Keys (B)</div>
            <div className="text-3xl font-extrabold text-purple-900">{details.summary.unique_keys_b}</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border-2 border-orange-200">
            <div className="text-sm text-orange-700 font-semibold mb-1">Best Score</div>
            <div className="text-3xl font-extrabold text-orange-900">
              {Math.max(details.summary.best_score_a, details.summary.best_score_b).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Side filter */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleSideFilterChange('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                sideFilter === 'all'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleSideFilterChange('A')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                sideFilter === 'A'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Side A
            </button>
            <button
              onClick={() => handleSideFilterChange('B')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                sideFilter === 'B'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Side B
            </button>
          </div>

          {/* Unique filter */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setUniqueFilter('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                uniqueFilter === 'all'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FunnelIcon className="w-4 h-4 inline mr-1" />
              All
            </button>
            <button
              onClick={() => setUniqueFilter('unique')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                uniqueFilter === 'unique'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ✓ Unique
            </button>
            <button
              onClick={() => setUniqueFilter('duplicates')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                uniqueFilter === 'duplicates'
                  ? 'bg-white text-red-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              × Duplicates
            </button>
          </div>

          {/* Virtual scroll toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useVirtualScroll}
              onChange={(e) => setUseVirtualScroll(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">Virtual Scroll</span>
          </label>
        </div>
      </div>

      {/* Results Table */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-300 px-4 py-3">
          <div className="w-8 text-xs font-bold text-gray-600">#</div>
          <div className="flex-1 text-sm font-bold text-gray-700">Columns</div>
          <div className="w-24 text-center text-sm font-bold text-gray-700">Total Rows</div>
          <div className="w-24 text-center text-sm font-bold text-gray-700">Unique</div>
          <div className="w-24 text-center text-sm font-bold text-gray-700">Duplicates</div>
          <div className="w-32 text-center text-sm font-bold text-gray-700">Score</div>
          <div className="w-32 text-center text-sm font-bold text-gray-700">Status</div>
        </div>

        {/* Table Body */}
        {loadingPage ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading page {currentPage}...</p>
            </div>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <ChartBarIcon className="w-16 h-16 mx-auto mb-2 text-gray-400" />
              <p className="text-lg font-medium">No results found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          </div>
        ) : useVirtualScroll && filteredResults.length > 20 ? (
          <VirtualScroller
            items={filteredResults}
            itemHeight={48}
            containerHeight={600}
            renderItem={renderResultRow}
            overscan={10}
            className="flex-1"
            emptyMessage="No results to display"
          />
        ) : (
          <div className="flex-1 overflow-y-auto">
            {filteredResults.map((result, index) => renderResultRow(result, index))}
          </div>
        )}
      </div>

      {/* Footer with Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalResults={totalResults}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          disabled={loadingPage}
          showPageSizeSelector={true}
          pageSizeOptions={[50, 100, 200, 500]}
        />
      )}

      {/* Info banner for large datasets */}
      {totalResults > 1000 && (
        <div className="bg-blue-50 border-t border-blue-200 px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <ChartBarIcon className="w-4 h-4" />
            <span className="font-medium">
              Large dataset detected ({totalResults.toLocaleString()} results).
            </span>
            <span>
              {useVirtualScroll 
                ? 'Virtual scrolling enabled for optimal performance.' 
                : 'Consider enabling virtual scroll for better performance.'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
