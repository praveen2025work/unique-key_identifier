import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface JobStage {
  name: string;
  status: string;
  details: string;
  order: number;
  started_at?: string;
  completed_at?: string;
}

interface JobStatus {
  run_id: number;
  status: string;
  progress: number;
  current_stage: string;
  error: string | null;
  file_a: string;
  file_b: string;
  num_columns: number;
  stages: JobStage[];
  started_at?: string;
  completed_at?: string;
}

// Helper function to calculate duration
const calculateDuration = (start?: string, end?: string): string => {
  if (!start) return '';
  
  const startTime = new Date(start);
  const endTime = end ? new Date(end) : new Date();
  const diffMs = endTime.getTime() - startTime.getTime();
  
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

// Helper function to format time
const formatTime = (timestamp?: string): string => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

interface WorkflowScreenProps {
  runId: number;
  apiEndpoint?: string;
  onBack?: () => void;
  onViewResults?: () => void;
  onAnalysisCompleted?: () => void;
}

export default function WorkflowScreen({ runId, apiEndpoint: apiEndpointProp, onBack, onViewResults, onAnalysisCompleted }: WorkflowScreenProps) {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const apiEndpoint = apiEndpointProp || localStorage.getItem('apiEndpoint') || 'http://localhost:8000';

  useEffect(() => {
    if (!runId) return;
    loadStatus();
    
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadStatus();
    }, 2000);

    return () => clearInterval(interval);
  }, [runId, autoRefresh]);

  const loadStatus = async () => {
    try {
      const response = await fetch(`${apiEndpoint}/api/status/${runId}`);
      if (!response.ok) return;
      
      const data = await response.json();
      setJobStatus(data);

      if (data.status === 'completed' || data.status === 'error') {
        setAutoRefresh(false);
        
        if (data.status === 'completed') {
          toast.success('✓ Analysis completed');
          if (onAnalysisCompleted) onAnalysisCompleted();
          if (onViewResults) {
            setTimeout(() => {
              onViewResults();
            }, 2000);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  const downloadCSV = () => window.open(`${apiEndpoint}/api/download/${runId}/csv`, '_blank');
  const downloadExcel = () => window.open(`${apiEndpoint}/api/download/${runId}/excel`, '_blank');

  if (!jobStatus) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Loading workflow...</p>
        </div>
      </div>
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
    <div className="min-h-screen bg-slate-50">
      
      {/* Compact Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button onClick={onBack} className="p-1.5 hover:bg-slate-100 rounded transition-colors">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-sm font-semibold text-gray-900">Workflow Monitor • Run #{runId}</h1>
                <p className="text-xs text-gray-500">{jobStatus.file_a} vs {jobStatus.file_b}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                jobStatus.status === 'completed' ? 'bg-green-100 text-green-800' :
                jobStatus.status === 'running' ? 'bg-blue-100 text-blue-800' :
                jobStatus.status === 'error' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {jobStatus.status.toUpperCase()}
              </span>
              <span className="text-sm font-semibold text-blue-700">{jobStatus.progress}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-6xl mx-auto">
        
        {/* Progress Bar with Timing */}
        <div className="bg-white rounded-lg shadow border border-slate-200 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900">Overall Progress</h3>
            <span className="text-sm font-bold text-blue-700">{jobStatus.progress}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full transition-all duration-500 ${
                jobStatus.status === 'error' ? 'bg-red-600' : 'bg-blue-600'
              }`}
              style={{ width: `${jobStatus.progress}%` }}
            ></div>
          </div>
          
          {/* Timing Information */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200">
            <div className="text-center">
              <div className="text-xs text-gray-500 font-medium mb-1">Started</div>
              <div className="text-sm font-semibold text-gray-900">
                {formatTime(jobStatus.started_at)}
              </div>
            </div>
            <div className="text-center border-x border-slate-200">
              <div className="text-xs text-gray-500 font-medium mb-1">
                {jobStatus.status === 'completed' ? 'Completed' : jobStatus.status === 'running' ? 'Running' : 'Ended'}
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {jobStatus.status === 'completed' || jobStatus.status === 'error' 
                  ? formatTime(jobStatus.completed_at)
                  : '⟳ In Progress'
                }
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 font-medium mb-1">Duration</div>
              <div className={`text-sm font-semibold ${
                jobStatus.status === 'running' ? 'text-blue-600' : 
                jobStatus.status === 'completed' ? 'text-green-600' : 'text-gray-900'
              }`}>
                {calculateDuration(jobStatus.started_at, jobStatus.completed_at) || 'N/A'}
              </div>
            </div>
          </div>
          
          {autoRefresh && (
            <div className="mt-3 flex items-center justify-center space-x-2 text-xs text-gray-500">
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Auto-refreshing...</span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {jobStatus.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-red-800">Error</h3>
                <p className="text-xs text-red-700 mt-0.5">{jobStatus.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Processing Stages */}
        <div className="bg-white rounded-lg shadow border border-slate-200 p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Processing Stages</h3>
          <div className="space-y-2">
            {jobStatus.stages.map((stage, idx) => (
              <div
                key={idx}
                className={`flex items-center space-x-3 p-3 rounded-lg border ${
                  stage.status === 'in_progress' ? 'border-blue-300 bg-blue-50' :
                  stage.status === 'completed' ? 'border-green-300 bg-green-50' :
                  stage.status === 'error' ? 'border-red-300 bg-red-50' :
                  'border-gray-200 bg-gray-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  stage.status === 'completed' ? 'bg-green-600 text-white' :
                  stage.status === 'in_progress' ? 'bg-blue-600 text-white animate-pulse' :
                  stage.status === 'error' ? 'bg-red-600 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  {stage.status === 'completed' ? '✓' : 
                   stage.status === 'in_progress' ? '⟳' : 
                   stage.status === 'error' ? '✗' : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm text-gray-900">
                      {stageNames[stage.name] || stage.name}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ml-2 ${
                      stage.status === 'completed' ? 'bg-green-200 text-green-800' :
                      stage.status === 'in_progress' ? 'bg-blue-200 text-blue-800' :
                      stage.status === 'error' ? 'bg-red-200 text-red-800' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {stage.status === 'in_progress' ? 'Running' : 
                       stage.status === 'completed' ? 'Done' :
                       stage.status === 'error' ? 'Failed' : 'Pending'}
                    </span>
                  </div>
                  {stage.details && (
                    <div className="text-xs text-gray-600 mt-1 truncate">{stage.details}</div>
                  )}
                  
                  {/* Stage Timing */}
                  {(stage.started_at || stage.completed_at) && (
                    <div className="mt-2 flex items-center space-x-4 text-xs">
                      {stage.started_at && (
                        <div className="flex items-center space-x-1 text-gray-600">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatTime(stage.started_at)}</span>
                        </div>
                      )}
                      {stage.completed_at && (
                        <div className="flex items-center space-x-1 text-gray-600">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatTime(stage.completed_at)}</span>
                        </div>
                      )}
                      {stage.started_at && (
                        <div className={`flex items-center space-x-1 font-semibold ${
                          stage.status === 'in_progress' ? 'text-blue-600' : 'text-green-600'
                        }`}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>{calculateDuration(stage.started_at, stage.completed_at)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow border border-slate-200 p-4">
          <div className="flex flex-wrap gap-2">
            <button onClick={onBack}
              className="px-4 py-2 bg-slate-600 text-white text-sm font-medium rounded hover:bg-slate-700 flex items-center space-x-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Dashboard</span>
            </button>
            
            {jobStatus.status === 'completed' && (
              <>
                <button onClick={onViewResults}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 flex items-center space-x-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>View Results</span>
                </button>
                <button onClick={downloadCSV}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 flex items-center space-x-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>CSV</span>
                </button>
                <button onClick={downloadExcel}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 flex items-center space-x-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Excel</span>
                </button>
              </>
            )}
            
            <button onClick={loadStatus}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300 flex items-center space-x-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
