/**
 * Chunked Comparison Viewer Component
 * Enterprise-level component for viewing row-by-row, column-by-column comparison results
 * Handles matched, only_a, only_b categories with pagination
 */
import React, { useState, useEffect } from 'react';
import { useApi } from '../contexts/ApiContext';
import { Download, CheckCircle, AlertCircle, FileText, Loader } from 'lucide-react';

interface ComparisonExportFile {
  file_id: number;
  columns: string;
  category: string;
  file_path: string;
  file_size: number;
  file_size_mb: number;
  row_count: number;
  created_at: string;
  exists: boolean;
}

interface ComparisonSummary {
  matched_count: number;
  only_a_count: number;
  only_b_count: number;
  total_a: number;
  total_b: number;
  match_rate: number;
  processing_time: number;
}

interface PaginationInfo {
  total: number;
  offset: number;
  limit: number;
  showing: number;
  has_more: boolean;
  total_pages: number;
  current_page: number;
}

interface ChunkedComparisonViewerProps {
  runId: number;
  columns: string;
}

const ChunkedComparisonViewer: React.FC<ChunkedComparisonViewerProps> = ({ runId, columns }) => {
  const { apiBaseUrl } = useApi();
  
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [exportFiles, setExportFiles] = useState<ComparisonExportFile[]>([]);
  const [summary, setSummary] = useState<ComparisonSummary | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'matched' | 'only_a' | 'only_b'>('matched');
  const [records, setRecords] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [error, setError] = useState<string | null>(null);

  // Load comparison summary from cache on component mount (instant, no file processing!)
  useEffect(() => {
    loadComparisonSummary();
    checkExportStatus();
  }, [runId, columns]);

  // Load data when category or page changes
  useEffect(() => {
    if (exportFiles.length > 0) {
      loadCategoryData();
    }
  }, [selectedCategory, currentPage, pageSize, exportFiles]);

  const loadComparisonSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to load from pre-generated cache (created during analysis workflow)
      const response = await fetch(
        `${apiBaseUrl}/api/comparison-v2/${runId}/summary?columns=${encodeURIComponent(columns)}`
      );
      const data = await response.json();

      if (data.summary) {
        // Summary loaded from cache - instant, no file processing!
        setSummary({
          matched_count: data.summary.matched_count || 0,
          only_a_count: data.summary.only_a_count || 0,
          only_b_count: data.summary.only_b_count || 0,
          total_a: data.summary.total_a || 0,
          total_b: data.summary.total_b || 0,
          match_rate: ((data.summary.matched_count / Math.max(data.summary.total_a + data.summary.total_b, 1)) * 100 * 2) || 0,
          processing_time: 0
        });
        console.log('✅ Loaded comparison summary from cache (no file processing)');
      } else {
        // No cache available - might need to generate
        console.log('⚠️ No cached comparison summary found');
      }
    } catch (err) {
      console.error('Error loading comparison summary:', err);
      // Don't set error - this is not critical, just means cache not available
    } finally {
      setLoading(false);
    }
  };

  const checkExportStatus = async () => {
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/comparison-export/${runId}/status?columns=${encodeURIComponent(columns)}`
      );
      const data = await response.json();

      if (data.exports_available) {
        setExportFiles(data.files);
        console.log('✅ Full export files are available for download');
      }
    } catch (err) {
      console.error('Error checking export status:', err);
      // Don't set error - exports are optional
    }
  };

  const generateComparison = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      const response = await fetch(
        `${apiBaseUrl}/api/comparison-export/${runId}/generate?columns=${encodeURIComponent(columns)}`,
        { method: 'POST' }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Comparison response:', data);
      
      if (data.success) {
        setSummary(data.summary);
        await checkExportStatus(); // Refresh export files list
        setCurrentPage(1); // Reset to first page
      } else {
        setError(data.error || 'Failed to generate comparison');
      }
    } catch (err) {
      console.error('Error generating comparison:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate comparison');
    } finally {
      setGenerating(false);
    }
  };

  const loadCategoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const offset = (currentPage - 1) * pageSize;
      const response = await fetch(
        `${apiBaseUrl}/api/comparison-export/${runId}/data?` +
        `columns=${encodeURIComponent(columns)}&` +
        `category=${selectedCategory}&` +
        `offset=${offset}&` +
        `limit=${pageSize}`
      );
      
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setRecords([]);
        setPagination(null);
      } else {
        setRecords(data.records);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Error loading category data:', err);
      setError('Failed to load data');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadCategory = async (category: string) => {
    try {
      const url = `${apiBaseUrl}/api/comparison-export/${runId}/download?` +
        `columns=${encodeURIComponent(columns)}&` +
        `category=${category}`;
      
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Failed to download file');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'matched': return 'Matched Records';
      case 'only_a': return 'Only in File A';
      case 'only_b': return 'Only in File B';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'matched': return 'text-green-600 bg-green-50 border-green-200';
      case 'only_a': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'only_b': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCurrentFile = () => {
    return exportFiles.find(f => f.category === selectedCategory);
  };

  const currentFile = getCurrentFile();

  // Show summary from cache if available (instant, no file processing!)
  if (!loading && exportFiles.length === 0 && summary) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Comparison Summary</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-600">✅ Loaded from analysis workflow</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-600">Instant load, no file processing</span>
          </div>
        </div>

        {/* Summary Cards - Show cached data immediately */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Matched</p>
                <p className="text-2xl font-bold text-green-700">
                  {summary.matched_count.toLocaleString()}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-green-600 mt-2">
              {summary.match_rate.toFixed(2)}% match rate
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Only in A</p>
                <p className="text-2xl font-bold text-blue-700">
                  {summary.only_a_count.toLocaleString()}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Only in B</p>
                <p className="text-2xl font-bold text-purple-700">
                  {summary.only_b_count.toLocaleString()}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Optional: Generate full exports */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Need to view or download full records?</h4>
              <p className="text-sm text-blue-700">
                Generate full CSV exports to browse paginated records and download files
              </p>
            </div>
            <button
              onClick={generateComparison}
              disabled={generating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap ml-4"
            >
              {generating ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Generate Full Exports
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If no exports AND no cache, show generate button (shouldn't happen if workflow completed)
  if (!loading && exportFiles.length === 0 && !summary) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Row-by-Row Comparison</h2>
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">
            No comparison data available for these columns.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            The comparison cache was not generated during analysis. Generate it now to view results.
          </p>
          <button
            onClick={generateComparison}
            disabled={generating}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {generating ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Generate Comparison
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold">Row-by-Row Comparison</h2>
            <p className="text-sm text-gray-600 mt-1">
              Columns: <span className="font-mono">{columns}</span>
            </p>
          </div>
          <button
            onClick={generateComparison}
            disabled={generating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm flex items-center gap-2"
          >
            {generating ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              'Regenerate'
            )}
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Matched</p>
                  <p className="text-2xl font-bold text-green-700">
                    {summary.matched_count.toLocaleString()}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-xs text-green-600 mt-2">
                {summary.match_rate.toFixed(2)}% match rate
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Only in A</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {summary.only_a_count.toLocaleString()}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Only in B</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {summary.only_b_count.toLocaleString()}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="border-b">
        <div className="flex gap-2 px-6 pt-4">
          {['matched', 'only_a', 'only_b'].map((category) => {
            const file = exportFiles.find(f => f.category === category);
            if (!file) return null;
            
            return (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category as any);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-t-lg border-t border-l border-r transition-colors ${
                  selectedCategory === category
                    ? `${getCategoryColor(category)} border-b-0`
                    : 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{getCategoryLabel(category)}</span>
                  <span className="text-xs bg-white px-2 py-0.5 rounded-full">
                    {file.row_count.toLocaleString()}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Actions */}
      {currentFile && (
        <div className="px-6 py-3 bg-gray-50 border-b flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{currentFile.row_count.toLocaleString()}</span> records •{' '}
            <span className="font-medium">{currentFile.file_size_mb.toFixed(2)} MB</span>
          </div>
          <button
            onClick={() => downloadCategory(selectedCategory)}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Data Table */}
      {loading ? (
        <div className="p-12 text-center">
          <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading data...</p>
        </div>
      ) : records.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {Object.keys(records[0]).map((key) => (
                  <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {records.map((record, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {Object.values(record).map((value: any, colIdx) => (
                    <td key={colIdx} className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {value === null || value === undefined ? (
                        <span className="text-gray-400 italic">null</span>
                      ) : (
                        String(value)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center text-gray-500">
          No records found in this category.
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of{' '}
              {pagination.total.toLocaleString()} records
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Previous
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                  let pageNum: number;
                  if (pagination.total_pages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= pagination.total_pages - 2) {
                    pageNum = pagination.total_pages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 border rounded-lg text-sm ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.has_more}
                className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Rows per page:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border rounded-lg px-2 py-1 text-sm"
              >
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="250">250</option>
                <option value="500">500</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChunkedComparisonViewer;

