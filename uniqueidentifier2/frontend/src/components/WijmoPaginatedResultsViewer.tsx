'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import apiService from '../services/api';
import type { RunDetails, AnalysisResult } from '../types';
import toast from 'react-hot-toast';
import WijmoDataGrid from './WijmoDataGrid';
import { 
  MagnifyingGlassIcon, 
  ArrowDownTrayIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface WijmoPaginatedResultsViewerProps {
  runId: number;
  onBack?: () => void;
}

type SideFilter = 'all' | 'A' | 'B';
type UniqueFilter = 'all' | 'unique' | 'duplicates';

export default function WijmoPaginatedResultsViewer({ runId, onBack }: WijmoPaginatedResultsViewerProps) {
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSideFilterChange = (side: SideFilter) => {
    setSideFilter(side);
    setCurrentPage(1);
  };

  // Apply client-side filters
  const filteredResults = useMemo(() => {
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

    return filtered.sort((a, b) => a.columns.localeCompare(b.columns));
  }, [results, uniqueFilter, searchTerm]);

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
    try {
      toast.loading('Preparing Excel download...', { id: 'download' });
      await apiService.downloadExcel(runId);
      toast.success('Excel download started', { id: 'download' });
    } catch (error) {
      toast.error('Failed to download Excel', { id: 'download' });
    }
  };

  // Transform data for Wijmo grid
  const gridData = useMemo(() => {
    return filteredResults.map((result, index) => ({
      index: index + 1,
      columns: result.columns,
      total_rows: result.total_rows,
      unique_rows: result.unique_rows,
      duplicate_count: result.duplicate_count,
      uniqueness_score: result.uniqueness_score.toFixed(1) + '%',
      score_value: result.uniqueness_score, // For sorting
      is_unique_key: result.is_unique_key ? 'Yes' : 'No',
      status_badge: result.is_unique_key,
    }));
  }, [filteredResults]);

  // Define grid columns
  const gridColumns = useMemo(() => [
    { binding: 'index', header: '#', width: 60, isReadOnly: true },
    { binding: 'columns', header: 'Columns', width: '*', isReadOnly: true },
    { binding: 'total_rows', header: 'Total Rows', width: 120, align: 'center', format: 'n0', isReadOnly: true },
    { binding: 'unique_rows', header: 'Unique', width: 120, align: 'center', format: 'n0', isReadOnly: true },
    { binding: 'duplicate_count', header: 'Duplicates', width: 120, align: 'center', format: 'n0', isReadOnly: true },
    { binding: 'uniqueness_score', header: 'Score', width: 120, align: 'center', isReadOnly: true },
    { binding: 'is_unique_key', header: 'Unique Key', width: 140, align: 'center', isReadOnly: true },
  ], []);

  const handleLoadMore = useCallback((pageIndex: number) => {
    setCurrentPage(pageIndex);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
        <span className="mt-4 text-lg text-gray-600 font-medium">Loading results...</span>
        <span className="mt-1 text-sm text-gray-500">
          {totalResults > 0 ? `Preparing ${totalResults.toLocaleString()} results` : 'Please wait...'}
        </span>
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
              <CheckCircleIcon className="w-4 h-4 inline mr-1" />
              Unique
            </button>
            <button
              onClick={() => setUniqueFilter('duplicates')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                uniqueFilter === 'duplicates'
                  ? 'bg-white text-red-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <XCircleIcon className="w-4 h-4 inline mr-1" />
              Duplicates
            </button>
          </div>
        </div>
      </div>

      {/* Wijmo Grid */}
      <div className="flex-1 p-6">
        <WijmoDataGrid
          data={gridData}
          columns={gridColumns}
          pageSize={pageSize}
          allowPaging={true}
          allowSorting={true}
          allowFiltering={true}
          loading={loadingPage}
          totalItems={totalResults}
          onLoadMoreData={handleLoadMore}
          height={600}
          showRowNumbers={false}
          className="border rounded-lg"
        />
      </div>

      {/* Info banner for large datasets */}
      {totalResults > 1000 && (
        <div className="bg-blue-50 border-t border-blue-200 px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">
              Large dataset detected ({totalResults.toLocaleString()} results).
            </span>
            <span>
              Wijmo FlexGrid provides optimized virtual scrolling and memory management for best performance.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

