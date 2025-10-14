import React, { useEffect, useState } from 'react';
import apiService from '../services/api';
import type { RunDetails, AnalysisResult, JobStatus } from '../types';
import toast from 'react-hot-toast';
import ComparisonViewer from './ComparisonViewer';
import DataQualityViewer from './DataQualityViewer';
import ModernDropdown from './ui/ModernDropdown';

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

  useEffect(() => {
    loadAllData();
  }, [runId]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [detailsData, statusData] = await Promise.all([
        apiService.getRunDetails(runId),
        apiService.getJobStatus(runId).catch(() => null)
      ]);
      setDetails(detailsData);
      setJobStatus(statusData);
      
      // Set default comparison columns (best match from analysis)
      if (detailsData.results_a.length > 0) {
        setSelectedComboColumns(detailsData.results_a[0].columns);
      }
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

  const stageNames: Record<string, string> = {
    'reading_files': 'Reading Files',
    'data_quality_check': 'Quality Check',
    'validating_data': 'Validating',
    'analyzing_file_a': 'Analyzing A',
    'analyzing_file_b': 'Analyzing B',
    'storing_results': 'Storing Results',
  };

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
              className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'comparison'
                  ? 'bg-primary text-white border-b-4 border-primary'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              🔄 File Comparison
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
          {activeTab === 'analysis' && (
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
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Columns</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Total Rows</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Unique</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Duplicates</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Score</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
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
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => {
                                setSelectedComboColumns(result.columns);
                                setActiveTab('comparison');
                              }}
                              className="px-3 py-1 bg-primary text-white rounded text-xs hover:bg-primary-dark transition-colors"
                            >
                              Compare
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-sm text-gray-600">
                Showing {filteredResults.length} of {currentResults.length} results
              </div>
            </div>
          )}

          {/* Workflow Tab */}
          {activeTab === 'workflow' && jobStatus && (
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Processing Workflow</h3>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
                  <span className="text-sm font-bold text-primary">{jobStatus.progress}%</span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      jobStatus.status === 'error' ? 'bg-red-600' : 'bg-primary'
                    }`}
                    style={{ width: `${jobStatus.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-6">
                <span
                  className={`inline-block px-4 py-2 rounded-lg font-semibold ${
                    jobStatus.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : jobStatus.status === 'running'
                      ? 'bg-blue-100 text-blue-800'
                      : jobStatus.status === 'error'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {jobStatus.status.toUpperCase()}
                </span>
              </div>

              {/* Error Message */}
              {jobStatus.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-2">
                    <svg
                      className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <h4 className="text-sm font-semibold text-red-800">Error</h4>
                      <p className="text-sm text-red-700 mt-1">{jobStatus.error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Stages */}
              <div className="space-y-3">
                {jobStatus.stages.map((stage, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center space-x-4 p-4 rounded-lg border-2 ${
                      stage.status === 'in_progress'
                        ? 'border-blue-300 bg-blue-50'
                        : stage.status === 'completed'
                        ? 'border-green-300 bg-green-50'
                        : stage.status === 'error'
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                        stage.status === 'completed'
                          ? 'bg-green-600 text-white'
                          : stage.status === 'in_progress'
                          ? 'bg-blue-600 text-white animate-pulse'
                          : stage.status === 'error'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {stage.status === 'completed'
                        ? '✓'
                        : stage.status === 'in_progress'
                        ? '⟳'
                        : stage.status === 'error'
                        ? '✗'
                        : idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-gray-900">
                          {stageNames[stage.name] || stage.name}
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            stage.status === 'completed'
                              ? 'bg-green-200 text-green-800'
                              : stage.status === 'in_progress'
                              ? 'bg-blue-200 text-blue-800'
                              : stage.status === 'error'
                              ? 'bg-red-200 text-red-800'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {stage.status === 'in_progress'
                            ? 'Running'
                            : stage.status === 'completed'
                            ? 'Done'
                            : stage.status === 'error'
                            ? 'Failed'
                            : 'Pending'}
                        </span>
                      </div>
                      {stage.details && (
                        <div className="text-sm text-gray-600 mt-1">{stage.details}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comparison Tab */}
          {activeTab === 'comparison' && (
            <div>
              <div className="mb-4">
                <ModernDropdown
                  label="Select columns to compare:"
                  value={selectedComboColumns}
                  onChange={(value) => setSelectedComboColumns(value as string)}
                  options={details.results_a.map((result) => ({
                    value: result.columns,
                    label: result.columns,
                    badge: `${result.uniqueness_score.toFixed(1)}% unique`,
                    description: `${result.count_a.toLocaleString()} records in Side A`
                  }))}
                  size="md"
                  searchable={true}
                  clearable={true}
                  placeholder="Choose column combination to compare..."
                />
              </div>
              {selectedComboColumns && (
                <ComparisonViewer runId={runId} columns={selectedComboColumns} />
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

