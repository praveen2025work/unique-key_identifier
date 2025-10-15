import React, { useEffect, useState } from 'react';
import apiService from '../services/api';
import type { RunDetails, AnalysisResult, JobStatus } from '../types';
import toast from 'react-hot-toast';
import ComparisonViewer from './ComparisonViewer';
import ChunkedFileListViewer from './ChunkedFileListViewer';
import DataQualityViewer from './DataQualityViewer';
import ModernDropdown from './ui/ModernDropdown';
import WorkflowView from './WorkflowView';

interface EnhancedResultsViewerProps {
  runId: number;
  onBack?: () => void;
}

type Tab = 'analysis' | 'workflow' | 'comparison' | 'quality';

export default function EnhancedResultsViewer({ runId, onBack }: EnhancedResultsViewerProps) {
  const [details, setDetails] = useState<RunDetails | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('analysis');
  const [analysisTab, setAnalysisTab] = useState<'side_a' | 'side_b'>('side_a');
  const [filterText, setFilterText] = useState('');
  const [showUniqueOnly, setShowUniqueOnly] = useState(false);
  const [selectedComboColumns, setSelectedComboColumns] = useState('');
  
  // Lazy loading states
  const [workflowLoaded, setWorkflowLoaded] = useState(false);
  const [analysisLoaded, setAnalysisLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100); // Show 100 results per page

  useEffect(() => {
    loadInitialData();
  }, [runId]);
  
  // Load workflow data only when tab is clicked
  useEffect(() => {
    if (activeTab === 'workflow' && !workflowLoaded) {
      loadWorkflowData();
    }
  }, [activeTab, workflowLoaded]);
  
  // Load analysis data with pagination when tab is clicked
  useEffect(() => {
    if (activeTab === 'analysis' && !analysisLoaded) {
      loadAnalysisData();
    }
  }, [activeTab, analysisLoaded, currentPage, pageSize]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      // Load only summary first (lightweight, fast)
      const summaryUrl = `${apiService['baseUrl']}/api/run/${runId}/summary`;
      const response = await fetch(summaryUrl);
      if (!response.ok) throw new Error('Failed to load summary');
      const summaryData = await response.json();
      
      setDetails({
        ...summaryData,
        results_a: [],
        results_b: []
      });
      
      toast.success('Summary loaded - click tabs to view details', { duration: 2000 });
    } catch (error) {
      toast.error('Failed to load summary');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadWorkflowData = async () => {
    try {
      const statusData = await apiService.getJobStatus(runId);
      setJobStatus(statusData);
      setWorkflowLoaded(true);
    } catch (error) {
      toast.error('Failed to load workflow data');
      console.error(error);
    }
  };
  
  const loadAnalysisData = async () => {
    try {
      toast.loading('Loading analysis results...', { id: 'load-analysis' });
      // Load ALL results without pagination limits
      const detailsData = await apiService.getRunDetails(runId);
      setDetails(detailsData);
      setAnalysisLoaded(true);
      
      // Set default comparison columns
      if (detailsData.results_a.length > 0) {
        setSelectedComboColumns(detailsData.results_a[0].columns);
      }
      const totalResults = Math.max(detailsData.results_a.length, detailsData.results_b.length);
      toast.success(`Loaded ${totalResults} column combinations`, { id: 'load-analysis' });
    } catch (error) {
      toast.error('Failed to load analysis results', { id: 'load-analysis' });
      console.error(error);
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
      <div className="flex items-center justify-center p-8 min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-3 text-xl text-gray-600">Loading analysis results...</span>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="text-center p-8 text-red-500">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-bold">Failed to Load Results</h2>
      </div>
    );
  }

  const currentResults = analysisTab === 'side_a' ? details.results_a : details.results_b;
  
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

  // Sort by column name in ascending order
  filteredResults = [...filteredResults].sort((a, b) => 
    a.columns.localeCompare(b.columns)
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredResults.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedResults = filteredResults.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [showUniqueOnly, filterText, analysisTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-purple-800 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Compact Header - Single Line */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Left Section: Title and Info */}
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              )}
              <div className="flex items-center space-x-2 text-sm">
                <span className="font-bold text-gray-900">Dashboard</span>
                <span className="text-gray-400">/</span>
                <span className="font-semibold text-primary">Analysis Results</span>
                <span className="text-gray-400">•</span>
                <span className="font-bold text-primary">Run #{runId}</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">{details.timestamp}</span>
              </div>
            </div>

            {/* Center Section: Quick Stats */}
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">{details.summary.total_combinations} total</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600 font-semibold">{details.summary.unique_keys_a} A</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-600 font-semibold">{details.summary.unique_keys_b} B</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-orange-600 font-bold">
                  {Math.max(details.summary.best_score_a, details.summary.best_score_b).toFixed(1)}% best
                </span>
              </div>
            </div>

            {/* Right Section: Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownloadCSV}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center"
                title="Download CSV"
              >
                <span className="mr-1">📄</span>
                CSV
              </button>
              <button
                onClick={handleDownloadExcel}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center"
                title="Download Excel"
              >
                <span className="mr-1">📊</span>
                Excel
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow-lg mb-4">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'analysis'
                  ? 'bg-primary text-white border-b-4 border-primary'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              📊 Analysis Results
            </button>
            <button
              onClick={() => setActiveTab('workflow')}
              className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'workflow'
                  ? 'bg-primary text-white border-b-4 border-primary'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              ⚙️ Workflow Stages
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-6 py-4 font-medium transition-colors whitespace-nowrap relative ${
                activeTab === 'comparison'
                  ? 'bg-primary text-white border-b-4 border-primary'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              🔄 File Comparison
              {activeTab !== 'comparison' && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('quality')}
              className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'quality'
                  ? 'bg-primary text-white border-b-4 border-primary'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              ✅ Data Quality
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          
          {/* Analysis Results Tab */}
          {activeTab === 'analysis' && !analysisLoaded && (
            <div className="flex flex-col items-center justify-center p-12">
              <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
              <span className="mt-4 text-lg text-gray-600 font-medium">Loading analysis results...</span>
              <span className="mt-2 text-sm text-gray-500">This may take a moment for large datasets</span>
            </div>
          )}
          
          {activeTab === 'analysis' && analysisLoaded && (
            <div>
              {/* Files Info */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-semibold">File A:</span> {details.file_a}
                    <span className="ml-2 text-sm text-gray-600">
                      ({details.file_a_rows?.toLocaleString() || 'N/A'} rows)
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">File B:</span> {details.file_b}
                    <span className="ml-2 text-sm text-gray-600">
                      ({details.file_b_rows?.toLocaleString() || 'N/A'} rows)
                    </span>
                  </div>
                </div>
              </div>

              {/* Important Notice - File Comparison Available */}
              <div className="mb-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">💡</span>
                    <div>
                      <p className="font-semibold text-blue-900">Want to see file-to-file row comparison?</p>
                      <p className="text-sm text-blue-700">Click any <strong>"Compare"</strong> button below or switch to the <strong>"🔄 File Comparison"</strong> tab above</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (filteredResults.length > 0) {
                        setSelectedComboColumns(filteredResults[0].columns);
                      }
                      setActiveTab('comparison');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-semibold whitespace-nowrap"
                  >
                    Go to File Comparison →
                  </button>
                </div>
              </div>

              {/* Side Tabs and Filters */}
              <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setAnalysisTab('side_a')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      analysisTab === 'side_a'
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Side A ({details.results_a.length})
                  </button>
                  <button
                    onClick={() => setAnalysisTab('side_b')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      analysisTab === 'side_b'
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

              {/* Results Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse table-fixed">
                  <colgroup>
                    <col style={{width: '50%'}} /> {/* Columns - 50% width */}
                    <col style={{width: '10%'}} /> {/* Total */}
                    <col style={{width: '10%'}} /> {/* Unique */}
                    <col style={{width: '10%'}} /> {/* Duplicates */}
                    <col style={{width: '12%'}} /> {/* Score */}
                    <col style={{width: '8%'}} /> {/* Actions */}
                  </colgroup>
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Columns</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Total</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Unique</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Dups</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Uniqueness Score</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedResults.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No results match your filters
                        </td>
                      </tr>
                    ) : (
                      paginatedResults.map((result, index) => (
                        <tr
                          key={index}
                          className={`border-b hover:bg-gray-50 transition-colors ${
                            result.is_unique_key ? 'bg-green-50' : ''
                          }`}
                        >
                          {/* Column names - wrapping text */}
                          <td className="px-4 py-3">
                            <div className="font-mono text-sm break-words">
                              {result.columns}
                            </div>
                            {result.is_unique_key && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                ✓ Unique Key
                              </span>
                            )}
                          </td>
                          
                          <td className="px-4 py-3 text-center text-sm">
                            {result.total_rows.toLocaleString()}
                          </td>
                          
                          <td className="px-4 py-3 text-center text-sm text-green-600 font-semibold">
                            {result.unique_rows.toLocaleString()}
                          </td>
                          
                          <td className="px-4 py-3 text-center text-sm text-red-600 font-semibold">
                            {result.duplicate_count.toLocaleString()}
                          </td>
                          
                          {/* Colored progress bar for score */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    result.uniqueness_score === 100
                                      ? 'bg-gradient-to-r from-green-500 to-green-600'
                                      : result.uniqueness_score >= 90
                                      ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                      : result.uniqueness_score >= 70
                                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                                      : 'bg-gradient-to-r from-red-500 to-red-600'
                                  }`}
                                  style={{ width: `${result.uniqueness_score}%` }}
                                ></div>
                              </div>
                              <span className={`text-xs font-bold ${
                                result.uniqueness_score === 100 ? 'text-green-600' :
                                result.uniqueness_score >= 90 ? 'text-blue-600' :
                                result.uniqueness_score >= 70 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {result.uniqueness_score.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => {
                                setSelectedComboColumns(result.columns);
                                setActiveTab('comparison');
                              }}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors font-semibold shadow-sm"
                              title="View file-to-file row comparison"
                            >
                              🔄 Compare Files
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-4">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredResults.length)} of {filteredResults.length} results
                  {filteredResults.length !== currentResults.length && ` (filtered from ${currentResults.length} total)`}
                </div>
                
                {/* Page Size Selector */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Rows per page:</label>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="250">250</option>
                    <option value="500">500</option>
                  </select>
                </div>

                {/* Pagination Buttons */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Previous
                    </button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 border rounded text-sm ${
                              currentPage === pageNum
                                ? 'bg-primary text-white border-primary'
                                : 'border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Last
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Workflow Tab */}
          {activeTab === 'workflow' && !workflowLoaded && (
            <div className="flex flex-col items-center justify-center p-12">
              <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
              <span className="mt-4 text-lg text-gray-600 font-medium">Loading workflow data...</span>
            </div>
          )}
          
          {activeTab === 'workflow' && workflowLoaded && jobStatus && (
            <WorkflowView jobStatus={jobStatus} compact={true} />
          )}

          {/* Comparison Tab */}
          {activeTab === 'comparison' && (
            <div>
              <div className="mb-4">
                <ModernDropdown
                  label="Select columns to compare:"
                  value={selectedComboColumns}
                  onChange={(value) => setSelectedComboColumns(value as string)}
                  options={[...details.results_a]
                    .sort((a, b) => a.columns.localeCompare(b.columns))
                    .map((result) => ({
                      value: result.columns,
                      label: result.columns,
                      badge: `${result.uniqueness_score.toFixed(1)}% unique`,
                      description: `${result.total_rows.toLocaleString()} total rows`
                    }))}
                  size="md"
                  searchable={true}
                  clearable={true}
                  placeholder="Choose column combination to compare..."
                />
              </div>
              {selectedComboColumns && (
                <ChunkedFileListViewer 
                  runId={runId} 
                  columns={selectedComboColumns}
                  apiEndpoint={apiService['baseUrl']}
                />
              )}
            </div>
          )}

          {/* Quality Tab */}
          {activeTab === 'quality' && <DataQualityViewer runId={runId} />}
        </div>
      </div>
    </div>
  );
}

