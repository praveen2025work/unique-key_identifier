import React, { useEffect, useState, useRef, useCallback } from 'react';
import apiService from '../services/api';
import type { ComparisonSummary, ComparisonDataResponse } from '../types';
import toast from 'react-hot-toast';

interface ComparisonViewerProps {
  runId: number;
  columns: string;
}

type Category = 'matched' | 'only_a' | 'only_b';

export default function ComparisonViewer({ runId, columns }: ComparisonViewerProps) {
  const [summary, setSummary] = useState<ComparisonSummary | null>(null);
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
    loadSummary();
  }, [runId, columns]);

  useEffect(() => {
    // Load data for active tab if not loaded yet
    if (summary && data[activeTab].length === 0 && !loading[activeTab]) {
      loadData(activeTab);
    }
  }, [activeTab, summary]);

  const loadSummary = async () => {
    try {
      const summaryData = await apiService.getComparisonSummary(runId, columns);
      setSummary(summaryData);
    } catch (error) {
      toast.error('Failed to load comparison summary');
      console.error(error);
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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">File Comparison</h3>

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
      <div className="flex space-x-2 mb-6 border-b-2 border-gray-200">
        <button
          onClick={() => setActiveTab('matched')}
          className={`px-6 py-3 font-medium rounded-t-lg transition-colors ${
            activeTab === 'matched'
              ? 'bg-primary text-white border-b-2 border-primary'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          ✅ Matched ({summary.matched_count})
        </button>
        <button
          onClick={() => setActiveTab('only_a')}
          className={`px-6 py-3 font-medium rounded-t-lg transition-colors ${
            activeTab === 'only_a'
              ? 'bg-primary text-white border-b-2 border-primary'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📘 Only in A ({summary.only_a_count})
        </button>
        <button
          onClick={() => setActiveTab('only_b')}
          className={`px-6 py-3 font-medium rounded-t-lg transition-colors ${
            activeTab === 'only_b'
              ? 'bg-primary text-white border-b-2 border-primary'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📙 Only in B ({summary.only_b_count})
        </button>
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

      {/* Footer */}
      <div className="mt-4 text-sm text-gray-600 flex justify-between items-center">
        <span>
          Showing {currentData.length} of {
            activeTab === 'matched' ? summary.matched_count :
            activeTab === 'only_a' ? summary.only_a_count :
            summary.only_b_count
          } records
        </span>
        {hasMore[activeTab] && !currentLoading && (
          <button
            onClick={() => loadData(activeTab, true)}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
}

