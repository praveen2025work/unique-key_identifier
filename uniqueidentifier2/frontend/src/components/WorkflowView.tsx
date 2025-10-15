/**
 * Shared Workflow View Component
 * Used in both processing screen and results page for consistency
 */
import React from 'react';

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

interface WorkflowViewProps {
  jobStatus: JobStatus;
  compact?: boolean;  // If true, use compact style for results page
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

// Stage name mapping
const stageNames: Record<string, string> = {
  'reading_files': 'Reading Files',
  'data_quality_check': 'Quality Check',
  'validating_data': 'Validating',
  'analyzing_file_a': 'Analyzing A',
  'analyzing_file_b': 'Analyzing B',
  'storing_results': 'Storing Results',
};

export default function WorkflowView({ jobStatus, compact = false }: WorkflowViewProps) {
  const containerClass = compact ? "space-y-4" : "space-y-4";
  const headingClass = compact ? "text-xl font-bold text-gray-800 mb-4" : "text-2xl font-bold text-gray-800 mb-6";

  return (
    <div className={containerClass}>
      {!compact && (
        <h3 className={headingClass}>Processing Workflow</h3>
      )}
      
      {/* Progress Bar with Timing */}
      <div className={`bg-white rounded-lg shadow ${compact ? 'border border-slate-200 p-4' : 'p-4'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`${compact ? 'text-sm' : 'text-sm'} font-semibold text-gray-700`}>
            Overall Progress
          </span>
          <span className={`${compact ? 'text-sm' : 'text-sm'} font-bold text-blue-700`}>
            {jobStatus.progress}%
          </span>
        </div>
        <div className={`${compact ? 'h-3' : 'h-3'} bg-gray-200 rounded-full overflow-hidden mb-3`}>
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
            <div className={`${compact ? 'text-sm' : 'text-sm'} font-semibold text-gray-900`}>
              {formatTime(jobStatus.started_at)}
            </div>
          </div>
          <div className="text-center border-x border-slate-200">
            <div className="text-xs text-gray-500 font-medium mb-1">
              {jobStatus.status === 'completed' ? 'Completed' : jobStatus.status === 'running' ? 'Running' : 'Ended'}
            </div>
            <div className={`${compact ? 'text-sm' : 'text-sm'} font-semibold text-gray-900`}>
              {jobStatus.status === 'completed' || jobStatus.status === 'error' 
                ? formatTime(jobStatus.completed_at)
                : '⟳ In Progress'
              }
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 font-medium mb-1">Duration</div>
            <div className={`${compact ? 'text-sm' : 'text-sm'} font-semibold ${
              jobStatus.status === 'running' ? 'text-blue-600' : 
              jobStatus.status === 'completed' ? 'text-green-600' : 'text-gray-900'
            }`}>
              {calculateDuration(jobStatus.started_at, jobStatus.completed_at) || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div>
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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

      {/* Processing Stages */}
      <div className={`bg-white rounded-lg shadow ${compact ? 'border border-slate-200 p-4' : 'p-4'}`}>
        <h4 className={`${compact ? 'text-sm' : 'text-sm'} font-semibold text-gray-900 mb-3`}>
          Processing Stages
        </h4>
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
              <div className={`${compact ? 'w-8 h-8' : 'w-8 h-8'} rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
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
                  <div className={`font-semibold ${compact ? 'text-sm' : 'text-sm'} text-gray-900`}>
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
    </div>
  );
}

