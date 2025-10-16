'use client'

/**
 * Unified Comparison Viewer
 * Shows BOTH column combination analysis results AND row-by-row file comparison
 * Addresses the requirement to see analysis alongside actual comparison data
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import apiService from '../services/api';
import type { ComparisonSummary, ComparisonDataResponse, AnalysisResult } from '../types';
import toast from 'react-hot-toast';
import ChunkedComparisonViewer from './ChunkedComparisonViewer';

interface UnifiedComparisonViewerProps {
  runId: number;
  columns: string;
  onClose?: () => void;
}

type Category = 'matched' | 'only_a' | 'only_b';

export default function UnifiedComparisonViewer({ runId, columns, onClose }: UnifiedComparisonViewerProps) {
  const [summary, setSummary] = useState<ComparisonSummary | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{ side_a: AnalysisResult | null, side_b: AnalysisResult | null }>({
    side_a: null,
    side_b: null
  });
  const [activeTab, setActiveTab] = useState<Category>('matched');
  const [data, setData] = useState<Record<Category, any[]>>({
    matched: [],
    only_a: [],
    only_b: []
  });
  const [loading, setLoading] = useState<Record<Category, boolean>>({
    matched: false,
    only_a: false,
    only_b: false
  });
  const [hasMore, setHasMore] = useState<Record<Category, boolean>>({
    matched: true,
    only_a: true,
    only_b: true
  });
  const [offset, setOffset] = useState<Record<Category, number>>({
    matched: 0,
    only_a: 0,
    only_b: 0
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAllData();
  }, [runId, columns]);

  useEffect(() => {
    // Load data for active tab if not loaded yet
    if (summary && data[activeTab].length === 0 && !loading[activeTab]) {
      loadData(activeTab);
    }
  }, [activeTab, summary]);

  const loadAllData = async () => {
    await Promise.all([
      loadSummary(),
      loadAnalysisResults()
    ]);
  };

  const loadSummary = async () => {
    try {
      const summaryData = await apiService.getComparisonSummary(runId, columns);
      setSummary(summaryData);
    } catch (error) {
      toast.error('Failed to load comparison summary');
      console.error(error);
    }
  };

  const loadAnalysisResults = async () => {
    try {
      const details = await apiService.getRunDetails(runId);
      
      // Find the analysis result for this column combination
      const resultA = details.results_a.find((r: AnalysisResult) => r.columns === columns);
      const resultB = details.results_b.find((r: AnalysisResult) => r.columns === columns);
      
      setAnalysisResult({
        side_a: resultA || null,
        side_b: resultB || null
      });
    } catch (error) {
      console.error('Failed to load analysis results:', error);
    }
  };

  const loadData = async (category: Category, append: boolean = false) => {
    if (loading[category] || (!hasMore[category] && append)) return;

    try {
      setLoading(prev => ({ ...prev, [category]: true }));
      
      const currentOffset = append ? offset[category] : 0;
      const response = await apiService.getComparisonData(
        runId,
        columns,
        category,
        currentOffset,
        100
      );

      setData(prev => ({
        ...prev,
        [category]: append ? [...prev[category], ...response.records] : response.records
      }));
      
      setOffset(prev => ({
        ...prev,
        [category]: currentOffset + response.records.length
      }));

      setHasMore(prev => ({
        ...prev,
        [category]: response.has_more
      }));
    } catch (error) {
      toast.error(`Failed to load ${category} data`);
      console.error(error);
    } finally {
      setLoading(prev => ({ ...prev, [category]: false }));
    }
  };

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const scrollPosition = scrollTop + clientHeight;
    
    // Load more when 200px from bottom
    if (scrollHeight - scrollPosition < 200) {
      loadData(activeTab, true);
    }
  }, [activeTab, hasMore, loading]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (!summary) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-3 text-lg text-gray-600">Loading comparison...</span>
      </div>
    );
  }

  const currentData = data[activeTab];
  const currentLoading = loading[activeTab];

  return (
    <div className="space-y-6">
      {/* Header with Close Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Unified Comparison View</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
          >
            ← Back to Results
          </button>
        )}
      </div>

      {/* Column Combination Analysis Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          📊 Column Combination Analysis: <span className="text-primary font-mono">{columns}</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Side A Analysis */}
          {analysisResult.side_a && (
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                <span className="mr-2">📘</span> File A Analysis
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Total Rows:</span>
                  <span className="font-bold">{analysisResult.side_a.total_rows.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Unique Rows:</span>
                  <span className="font-bold text-green-600">{analysisResult.side_a.unique_rows.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Duplicate Rows:</span>
                  <span className="font-bold text-red-600">{analysisResult.side_a.duplicate_rows.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Duplicate Count:</span>
                  <span className="font-bold text-orange-600">{analysisResult.side_a.duplicate_count.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-blue-300">
                  <span className="text-gray-700 font-semibold">Uniqueness Score:</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2.5 mr-2">
                      <div
                        className={`h-2.5 rounded-full ${
                          analysisResult.side_a.uniqueness_score === 100
                            ? 'bg-green-500'
                            : analysisResult.side_a.uniqueness_score >= 90
                            ? 'bg-blue-500'
                            : analysisResult.side_a.uniqueness_score >= 70
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${analysisResult.side_a.uniqueness_score}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-lg">{analysisResult.side_a.uniqueness_score.toFixed(2)}%</span>
                  </div>
                </div>
                {analysisResult.side_a.is_unique_key ? (
                  <div className="mt-2 px-3 py-2 bg-green-100 border border-green-300 rounded text-green-800 text-center font-semibold">
                    ✓ Unique Key
                  </div>
                ) : (
                  <div className="mt-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-700 text-center">
                    Has Duplicates
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Side B Analysis */}
          {analysisResult.side_b && (
            <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
              <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
                <span className="mr-2">📙</span> File B Analysis
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Total Rows:</span>
                  <span className="font-bold">{analysisResult.side_b.total_rows.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Unique Rows:</span>
                  <span className="font-bold text-green-600">{analysisResult.side_b.unique_rows.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Duplicate Rows:</span>
                  <span className="font-bold text-red-600">{analysisResult.side_b.duplicate_rows.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Duplicate Count:</span>
                  <span className="font-bold text-orange-600">{analysisResult.side_b.duplicate_count.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-purple-300">
                  <span className="text-gray-700 font-semibold">Uniqueness Score:</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2.5 mr-2">
                      <div
                        className={`h-2.5 rounded-full ${
                          analysisResult.side_b.uniqueness_score === 100
                            ? 'bg-green-500'
                            : analysisResult.side_b.uniqueness_score >= 90
                            ? 'bg-blue-500'
                            : analysisResult.side_b.uniqueness_score >= 70
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${analysisResult.side_b.uniqueness_score}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-lg">{analysisResult.side_b.uniqueness_score.toFixed(2)}%</span>
                  </div>
                </div>
                {analysisResult.side_b.is_unique_key ? (
                  <div className="mt-2 px-3 py-2 bg-green-100 border border-green-300 rounded text-green-800 text-center font-semibold">
                    ✓ Unique Key
                  </div>
                ) : (
                  <div className="mt-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-700 text-center">
                    Has Duplicates
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* File-to-File Row Comparison Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">🔄 File-to-File Row Comparison</h3>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow">
            <div className="text-sm opacity-90">Match Rate</div>
            <div className="text-3xl font-bold">{summary.match_rate}%</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg shadow">
            <div className="text-sm opacity-90">Matched Records</div>
            <div className="text-3xl font-bold">{summary.matched_count.toLocaleString()}</div>
          </div>
          <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white p-4 rounded-lg shadow">
            <div className="text-sm opacity-90">Only in A</div>
            <div className="text-3xl font-bold">{summary.only_a_count.toLocaleString()}</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-lg shadow">
            <div className="text-sm opacity-90">Only in B</div>
            <div className="text-3xl font-bold">{summary.only_b_count.toLocaleString()}</div>
          </div>
        </div>

        {/* File Info */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6 border-l-4 border-primary">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-semibold">File A:</span> {summary.file_a}
              <span className="ml-2 text-gray-600">({summary.file_a_rows.toLocaleString()} rows)</span>
            </div>
            <div>
              <span className="font-semibold">File B:</span> {summary.file_b}
              <span className="ml-2 text-gray-600">({summary.file_b_rows.toLocaleString()} rows)</span>
            </div>
            <div className="md:col-span-2">
              <span className="font-semibold">Key Columns:</span> {columns}
            </div>
          </div>
        </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-4 border-b-2 border-gray-200">
        <button
          onClick={() => setActiveTab('matched')}
          className={`px-6 py-3 font-medium rounded-t-lg transition-colors ${
            activeTab === 'matched'
              ? 'bg-primary text-white border-b-2 border-primary'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          ✅ Matched ({summary.matched_count.toLocaleString()})
        </button>
        <button
          onClick={() => setActiveTab('only_a')}
          className={`px-6 py-3 font-medium rounded-t-lg transition-colors ${
            activeTab === 'only_a'
              ? 'bg-primary text-white border-b-2 border-primary'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📘 Only in A ({summary.only_a_count.toLocaleString()})
        </button>
        <button
          onClick={() => setActiveTab('only_b')}
          className={`px-6 py-3 font-medium rounded-t-lg transition-colors ${
            activeTab === 'only_b'
              ? 'bg-primary text-white border-b-2 border-primary'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📙 Only in B ({summary.only_b_count.toLocaleString()})
        </button>
      </div>

      {/* Pagination Controls - TOP (Sticky) */}
      <div className="sticky top-0 z-20 bg-white border-b-2 border-gray-300 shadow-sm mb-4 p-4 rounded-t-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-gray-700 font-medium">
            Showing <span className="font-bold text-primary">{currentData.length.toLocaleString()}</span> of{' '}
            <span className="font-bold text-primary">
              {(activeTab === 'matched' ? summary.matched_count :
                activeTab === 'only_a' ? summary.only_a_count :
                summary.only_b_count).toLocaleString()}
            </span> records
            {currentData.length < (activeTab === 'matched' ? summary.matched_count :
              activeTab === 'only_a' ? summary.only_a_count :
              summary.only_b_count) && (
              <span className="ml-2 text-orange-600 text-xs">
                • Load more below
              </span>
            )}
          </div>
          
          {/* Pagination Controls */}
          {(activeTab === 'matched' ? summary.matched_count :
            activeTab === 'only_a' ? summary.only_a_count :
            summary.only_b_count) > 100 && (
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                onClick={() => {
                  setData(prev => ({ ...prev, [activeTab]: [] }));
                  setOffset(prev => ({ ...prev, [activeTab]: 0 }));
                  setHasMore(prev => ({ ...prev, [activeTab]: true }));
                  loadData(activeTab, false);
                }}
                className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={offset[activeTab] === 0}
              >
                ⟲ Reset
              </button>
              
              <div className="px-3 py-1.5 text-xs font-semibold bg-gray-100 rounded border border-gray-300">
                Page {Math.floor(offset[activeTab] / 100) + 1}
              </div>
              
              {hasMore[activeTab] && !currentLoading && (
                <button
                  onClick={() => loadData(activeTab, true)}
                  className="px-4 py-1.5 bg-primary text-white rounded hover:bg-primary-dark transition-colors text-xs font-semibold shadow-sm"
                >
                  Load Next 100 →
                </button>
              )}
              
              {!hasMore[activeTab] && offset[activeTab] > 0 && (
                <span className="text-xs text-green-600 font-bold px-2 py-1 bg-green-50 rounded border border-green-200">
                  ✓ All Loaded
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Performance Tip - Compact */}
        {(activeTab === 'matched' ? summary.matched_count :
          activeTab === 'only_a' ? summary.only_a_count :
          summary.only_b_count) > 10000 && currentData.length < 1000 && (
          <div className="mt-2 text-xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded border border-blue-200">
            💡 For {((activeTab === 'matched' ? summary.matched_count :
              activeTab === 'only_a' ? summary.only_a_count :
              summary.only_b_count) / 1000).toFixed(0)}K+ records, use <strong>Enterprise Exports</strong> below for complete CSV files
          </div>
        )}
      </div>

      {/* Data Table */}
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className="overflow-auto max-h-[500px] border rounded-lg"
        >
          {currentData.length === 0 && !currentLoading ? (
            <div className="text-center p-12 text-gray-500">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-semibold mb-2">No Records Found</h3>
              <p>No records found in this category</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  {currentData.length > 0 && Object.keys(currentData[0]).map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border-b-2 border-gray-300"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentData.map((record, idx) => (
                  <tr
                    key={idx}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    {Object.entries(record).map(([key, value], cellIdx) => (
                      <td
                        key={cellIdx}
                        className="px-4 py-3 text-sm cursor-pointer hover:bg-blue-50"
                        onClick={() => copyToClipboard(String(value ?? ''))}
                        title="Click to copy"
                      >
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
          )}

        {/* Loading indicator */}
        {currentLoading && (
          <div className="text-center p-4 text-gray-600">
            <div className="inline-block animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mr-2"></div>
            Loading more records...
          </div>
        )}
      </div>
      </div>

      {/* Enterprise Row-by-Row Export Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">💾 Enterprise Row-by-Row Exports</h3>
        <p className="text-sm text-gray-600 mb-4">
          Generate full CSV exports with ALL rows (no limits) for download and external analysis
        </p>
        <ChunkedComparisonViewer runId={runId} columns={columns} />
      </div>
    </div>
  );
}
