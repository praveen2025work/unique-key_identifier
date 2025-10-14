import React, { useEffect, useState } from 'react';
import apiService from '../services/api';
import type { RunDetails, AnalysisResult } from '../types';
import toast from 'react-hot-toast';

interface ResultsViewerProps {
  runId: number;
}

export default function ResultsViewer({ runId }: ResultsViewerProps) {
  const [details, setDetails] = useState<RunDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'side_a' | 'side_b'>('side_a');
  const [filterText, setFilterText] = useState('');
  const [showUniqueOnly, setShowUniqueOnly] = useState(false);

  useEffect(() => {
    loadDetails();
  }, [runId]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const data = await apiService.getRunDetails(runId);
      setDetails(data);
    } catch (error) {
      toast.error('Failed to load results');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      await apiService.downloadCSV(runId);
      toast.success('CSV download started');
    } catch (error) {
      toast.error('Failed to download CSV');
    }
  };

  const handleDownloadExcel = async () => {
    try {
      await apiService.downloadExcel(runId);
      toast.success('Excel download started');
    } catch (error) {
      toast.error('Failed to download Excel');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-3 text-lg text-gray-600">Loading results...</span>
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

  const currentResults = activeTab === 'side_a' ? details.results_a : details.results_b;
  
  // Filter results
  let filteredResults = currentResults;
  if (showUniqueOnly) {
    filteredResults = filteredResults.filter(r => r.is_unique_key);
  }
  if (filterText) {
    filteredResults = filteredResults.filter(r =>
      r.columns.toLowerCase().includes(filterText.toLowerCase())
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Analysis Results</h2>
            <p className="text-gray-600 mt-1">
              Run #{runId} • {details.timestamp}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleDownloadCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
            >
              <span className="mr-2">📄</span>
              Download CSV
            </button>
            <button
              onClick={handleDownloadExcel}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <span className="mr-2">📊</span>
              Download Excel
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">Total Combinations</div>
            <div className="text-2xl font-bold text-blue-800">{details.summary.total_combinations}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-sm text-green-600 font-medium">Unique Keys (A)</div>
            <div className="text-2xl font-bold text-green-800">{details.summary.unique_keys_a}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-sm text-purple-600 font-medium">Unique Keys (B)</div>
            <div className="text-2xl font-bold text-purple-800">{details.summary.unique_keys_b}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="text-sm text-orange-600 font-medium">Best Score</div>
            <div className="text-2xl font-bold text-orange-800">
              {Math.max(details.summary.best_score_a, details.summary.best_score_b).toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Files Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-semibold">File A:</span> {details.file_a}
              <span className="ml-2 text-sm text-gray-600">({details.file_a_rows?.toLocaleString() || 'N/A'} rows)</span>
            </div>
            <div>
              <span className="font-semibold">File B:</span> {details.file_b}
              <span className="ml-2 text-sm text-gray-600">({details.file_b_rows?.toLocaleString() || 'N/A'} rows)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('side_a')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'side_a'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Side A ({details.results_a.length})
            </button>
            <button
              onClick={() => setActiveTab('side_b')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'side_b'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Side B ({details.results_b.length})
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showUniqueOnly}
                onChange={(e) => setShowUniqueOnly(e.target.checked)}
                className="mr-2 h-4 w-4"
              />
              <span className="text-sm font-medium text-gray-700">Show Unique Keys Only</span>
            </label>
            <input
              type="text"
              placeholder="Filter columns..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Columns</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Total Rows</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Unique</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Duplicates</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Score</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No results match your filters
                </td>
              </tr>
            ) : (
              filteredResults.map((result, index) => (
                <tr
                  key={index}
                  className={`border-b hover:bg-gray-50 transition-colors ${
                    result.is_unique_key ? 'bg-green-50' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-sm">{result.columns}</td>
                  <td className="px-4 py-3 text-center">{result.total_rows.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center text-green-600 font-semibold">
                    {result.unique_rows.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center text-red-600">
                    {result.duplicate_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            result.uniqueness_score === 100
                              ? 'bg-green-500'
                              : result.uniqueness_score >= 90
                              ? 'bg-blue-500'
                              : result.uniqueness_score >= 70
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${result.uniqueness_score}%` }}
                        ></div>
                      </div>
                      <span className="font-semibold">{result.uniqueness_score.toFixed(2)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {result.is_unique_key ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        ✓ Unique Key
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        Has Duplicates
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="mt-4 text-sm text-gray-600">
        Showing {filteredResults.length} of {currentResults.length} results
      </div>
    </div>
  );
}

