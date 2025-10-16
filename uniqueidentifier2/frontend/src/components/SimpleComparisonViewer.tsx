'use client'

/**
 * Simple Comparison Viewer with Pagination - FULL FILE COMPARISON
 * Shows ALL columns from both files, not just key columns
 * Uses Enterprise Export API for complete data
 */
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface SimpleComparisonViewerProps {
  runId: number;
  columns: string;
  apiEndpoint: string;
  onClose?: () => void;
}

type Category = 'matched' | 'only_a' | 'only_b';

export default function SimpleComparisonViewer({ runId, columns, apiEndpoint, onClose }: SimpleComparisonViewerProps) {
  const [summary, setSummary] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Category>('matched');
  const [data, setData] = useState<Record<Category, any[]>>({
    matched: [],
    only_a: [],
    only_b: []
  });
  const [loading, setLoading] = useState(false);
  const [exportsAvailable, setExportsAvailable] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 100;

  useEffect(() => {
    checkExportsAndLoad();
  }, [runId, columns]);

  useEffect(() => {
    if (exportsAvailable) {
      // Reset and load data when tab changes
      setOffset(0);
      setCurrentPage(1);
      setData(prev => ({ ...prev, [activeTab]: [] }));
      setHasMore(true);
      loadData(activeTab, 0);
    }
  }, [activeTab, exportsAvailable]);

  const checkExportsAndLoad = async () => {
    try {
      // Check if exports exist
      const statusResp = await fetch(
        `${apiEndpoint}/api/comparison-export/${runId}/status?columns=${encodeURIComponent(columns)}`
      );
      const statusData = await statusResp.json();
      
      if (statusData.exports_available) {
        setExportsAvailable(true);
        loadSummaryFromExports(statusData);
        loadData('matched', 0);
      } else {
        // Exports don't exist, generate them
        await generateExports();
      }
    } catch (error: any) {
      console.error('Error checking exports:', error);
      toast.error('Failed to load file comparison');
    }
  };

  const loadSummaryFromExports = (statusData: any) => {
    const matchedFile = statusData.files?.find((f: any) => f.category === 'matched');
    const onlyAFile = statusData.files?.find((f: any) => f.category === 'only_a');
    const onlyBFile = statusData.files?.find((f: any) => f.category === 'only_b');
    
    const totalA = (matchedFile?.row_count || 0) + (onlyAFile?.row_count || 0);
    const totalB = (matchedFile?.row_count || 0) + (onlyBFile?.row_count || 0);
    const matchRate = totalA + totalB > 0 
      ? ((matchedFile?.row_count || 0) / (totalA + totalB) * 100 * 2)
      : 0;
    
    setSummary({
      matched_count: matchedFile?.row_count || 0,
      only_a_count: onlyAFile?.row_count || 0,
      only_b_count: onlyBFile?.row_count || 0,
      total_a: totalA,
      total_b: totalB,
      match_rate: matchRate.toFixed(1),
      file_a: statusData.files?.[0]?.file_path || '',
      file_b: statusData.files?.[0]?.file_path || '',
      file_a_rows: totalA,
      file_b_rows: totalB
    });
  };

  const generateExports = async () => {
    try {
      setGenerating(true);
      toast.loading('Generating full file comparison with ALL columns...', { id: 'generate' });
      
      const response = await fetch(
        `${apiEndpoint}/api/comparison-export/${runId}/generate?columns=${encodeURIComponent(columns)}`,
        { method: 'POST' }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Comparison response:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Comparison generation failed');
      }
      
      setExportsAvailable(true);
      setSummary({
        matched_count: result.summary.matched_count,
        only_a_count: result.summary.only_a_count,
        only_b_count: result.summary.only_b_count,
        total_a: result.summary.total_a,
        total_b: result.summary.total_b,
        match_rate: result.summary.match_rate,
        file_a: result.export_info?.export_dir || '',
        file_b: result.export_info?.export_dir || '',
        file_a_rows: result.summary.total_a,
        file_b_rows: result.summary.total_b
      });
      
      toast.success('✓ Full comparison generated with ALL columns!', { id: 'generate' });
      loadData('matched', 0);
    } catch (error: any) {
      const errorMsg = error?.message || 'Failed to generate comparison';
      toast.error(errorMsg, { id: 'generate' });
      console.error('Error generating exports:', error);
    } finally {
      setGenerating(false);
    }
  };

  const loadData = async (category: Category, fromOffset: number) => {
    if (loading || !exportsAvailable) return;
    
    try {
      setLoading(true);
      // Use EXPORT endpoint which returns ALL columns from files
      const response = await fetch(
        `${apiEndpoint}/api/comparison-export/${runId}/data?columns=${encodeURIComponent(columns)}&category=${category}&offset=${fromOffset}&limit=${pageSize}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load data');
      }
      
      const result = await response.json();
      console.log('Loaded data with ALL columns:', result.records[0]);
      
      setData(prev => ({
        ...prev,
        [category]: result.records || []
      }));
      
      setTotalRecords(result.pagination?.total || 0);
      setTotalPages(result.pagination?.total_pages || 0);
      setHasMore(result.pagination?.has_more || false);
    } catch (error: any) {
      toast.error(`Failed to load ${category} data`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadNextPage = () => {
    const newOffset = offset + pageSize;
    setOffset(newOffset);
    setCurrentPage(currentPage + 1);
    loadData(activeTab, newOffset);
  };

  const loadPreviousPage = () => {
    const newOffset = Math.max(0, offset - pageSize);
    setOffset(newOffset);
    setCurrentPage(Math.max(1, currentPage - 1));
    loadData(activeTab, newOffset);
  };

  const resetToFirst = () => {
    setOffset(0);
    setCurrentPage(1);
    loadData(activeTab, 0);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-[#337ab7] border-t-transparent rounded-full"></div>
        <p className="mt-3 text-sm text-gray-600 font-semibold">Generating Full File Comparison...</p>
        <p className="text-xs text-gray-500 mt-1">Creating export files with ALL columns from both files</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin h-6 w-6 border-4 border-[#337ab7] border-t-transparent rounded-full"></div>
        <span className="ml-2 text-xs text-gray-600">Loading comparison...</span>
      </div>
    );
  }

  const currentData = data[activeTab] || [];
  const displayTotal = activeTab === 'matched' ? summary.matched_count :
                       activeTab === 'only_a' ? summary.only_a_count :
                       summary.only_b_count;
  
  // Check if dealing with very large files (> 1M records)
  const isVeryLargeFile = displayTotal > 1000000;

  return (
    <div className="space-y-2">
      {/* Compact Header - Single Row */}
      <div className="bg-blue-50 border-l-4 border-blue-500 px-3 py-2 rounded">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-blue-600 text-sm">ℹ️</span>
          <span className="text-xs font-bold text-blue-900">Full File Comparison - ALL Columns</span>
          <span className="text-xs text-blue-700">•</span>
          <span className="text-xs text-blue-700">Showing <strong>COMPLETE row data</strong> from both files</span>
          <span className="text-xs text-blue-700">•</span>
          <span className="text-xs text-blue-700">Matching key: <span className="font-mono bg-blue-100 px-1 rounded font-semibold text-[10px]">{columns}</span></span>
          {isVeryLargeFile && (
            <>
              <span className="text-xs text-blue-700">•</span>
              <span className="text-xs font-semibold text-blue-700 bg-blue-200 px-2 py-0.5 rounded">⚡ Optimized for {displayTotal.toLocaleString()} records</span>
            </>
          )}
        </div>
      </div>

      {/* Compact Summary Bar */}
      <div className="flex items-center justify-between bg-gradient-to-r from-slate-700 to-slate-600 text-white px-3 py-1.5 rounded text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1" title="Percentage of records that exist in both files">
            <span className="opacity-75">Match Rate:</span>
            <span className="font-bold text-blue-300">{summary.match_rate}%</span>
          </div>
          <div className="flex items-center gap-1" title="Complete records found in both File A and File B">
            <span className="opacity-75">✅ Matched:</span>
            <span className="font-bold text-green-300">{summary.matched_count.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1" title="Complete records only in File A (missing in File B)">
            <span className="opacity-75">📘 Only A:</span>
            <span className="font-bold text-cyan-300">{summary.only_a_count.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1" title="Complete records only in File B (missing in File A)">
            <span className="opacity-75">📙 Only B:</span>
            <span className="font-bold text-orange-300">{summary.only_b_count.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs opacity-90">
          <span>A: {summary.file_a_rows?.toLocaleString() || 0} rows</span>
          <span>•</span>
          <span>B: {summary.file_b_rows?.toLocaleString() || 0} rows</span>
        </div>
      </div>

      {/* Compact Tabs + Pagination Combined */}
      <div className="flex items-center justify-between bg-white border border-gray-300 rounded px-2 py-1.5">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('matched')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'matched'
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
            title="Complete rows that exist in BOTH files (ALL columns shown)"
          >
            ✅ Matched ({summary.matched_count.toLocaleString()})
          </button>
          <button
            onClick={() => setActiveTab('only_a')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'only_a'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
            title="Complete rows ONLY in File A with ALL columns (missing from File B)"
          >
            📘 Only A ({summary.only_a_count.toLocaleString()})
          </button>
          <button
            onClick={() => setActiveTab('only_b')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'only_b'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
            title="Complete rows ONLY in File B with ALL columns (missing from File A)"
          >
            📙 Only B ({summary.only_b_count.toLocaleString()})
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">
            {offset + 1}-{Math.min(offset + pageSize, displayTotal)} of {displayTotal.toLocaleString()}
            {totalPages > 0 && <span className="ml-1 text-gray-500">({totalPages.toLocaleString()} pages)</span>}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={resetToFirst}
              disabled={offset === 0 || loading}
              className="px-2 py-1 text-xs font-medium border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="First page"
            >
              ⟲
            </button>
            <button
              onClick={loadPreviousPage}
              disabled={offset === 0 || loading}
              className="px-2 py-1 text-xs font-medium border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous page"
            >
              ←
            </button>
            <span className="px-2 py-1 text-xs font-semibold bg-gray-100 rounded border border-gray-300 min-w-[80px] text-center">
              Page {currentPage.toLocaleString()}{totalPages > 0 ? ` / ${totalPages.toLocaleString()}` : ''}
            </span>
            <button
              onClick={loadNextPage}
              disabled={!hasMore || loading}
              className="px-2 py-1 text-xs font-medium border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next page"
            >
              →
            </button>
            {!hasMore && offset > 0 && (
              <span className="text-xs text-green-600 font-bold px-2 py-1 bg-green-50 rounded border border-green-200">
                ✓ Last
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Data Table - Maximized */}
      <div className="overflow-auto border rounded-lg" style={{ maxHeight: 'calc(100vh - 300px)', minHeight: '400px' }}>
        {loading ? (
          <div className="text-center p-6">
            <div className="inline-block animate-spin h-6 w-6 border-4 border-[#337ab7] border-t-transparent rounded-full"></div>
            <p className="mt-2 text-xs text-gray-600">Loading...</p>
          </div>
        ) : currentData.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <h3 className="text-sm font-semibold mb-1">No Records Found</h3>
            <p className="text-xs">No records in this category</p>
          </div>
        ) : (
          <>
            {/* Description of current view */}
            <div className={`px-3 py-2 text-xs border-b-2 sticky top-0 z-20 ${
              activeTab === 'matched' ? 'bg-green-50 border-green-500 text-green-900' :
              activeTab === 'only_a' ? 'bg-cyan-50 border-cyan-500 text-cyan-900' :
              'bg-orange-50 border-orange-500 text-orange-900'
            }`}>
              <strong>Showing:</strong> {
                activeTab === 'matched' ? 'Complete records (ALL columns) that exist in BOTH files' :
                activeTab === 'only_a' ? 'Complete records (ALL columns) ONLY in File A - not found in File B' :
                'Complete records (ALL columns) ONLY in File B - not found in File A'
              } • <span className="font-mono font-semibold">{displayTotal.toLocaleString()}</span> total records • Page {currentPage}
            </div>
            <table className="w-full border-collapse text-xs">
              <thead className="bg-slate-700 text-white sticky top-0 z-10">
                <tr>
                  {Object.keys(currentData[0] || {}).map((col) => (
                    <th
                      key={col}
                      className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider border-r border-slate-600 last:border-r-0 whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {currentData.map((record: any, idx: number) => (
                  <tr key={idx} className="hover:bg-blue-50 transition-colors">
                    {Object.entries(record).map(([key, value], cellIdx) => (
                      <td
                        key={cellIdx}
                        className="px-3 py-1.5 text-xs cursor-pointer border-r border-gray-100 last:border-r-0"
                        onClick={() => copyToClipboard(String(value ?? ''))}
                        title="Click to copy"
                      >
                        {value === null || value === undefined ? (
                          <span className="text-gray-400 italic">null</span>
                        ) : (
                          <span className="font-mono text-gray-800">{String(value)}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
