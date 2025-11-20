'use client'

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import WorkflowView from './WorkflowView';
import type { JobStatus } from '../types';

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
  const apiEndpoint = apiEndpointProp || (typeof window !== 'undefined' ? localStorage.getItem('apiEndpoint') : null) || 'http://localhost:8000';

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
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(`${apiEndpoint}/api/status/${runId}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn('Status check failed:', response.status);
        return;
      }
      
      const data = await response.json();
      setJobStatus(data);

      if (data.status === 'completed' || data.status === 'error' || data.status === 'cancelled') {
        setAutoRefresh(false);
        
        if (data.status === 'completed') {
          toast.success('✓ Analysis completed');
          if (onAnalysisCompleted) onAnalysisCompleted();
          if (onViewResults) {
            setTimeout(() => {
              onViewResults();
            }, 2000);
          }
        } else if (data.status === 'error') {
          toast.error(`Analysis failed: ${data.error || 'Unknown error'}`);
        } else if (data.status === 'cancelled') {
          toast.info('Job cancelled');
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch status:', error);
      if (error.name === 'AbortError') {
        console.warn('Status check timed out - backend may be busy');
        // Don't show toast for every timeout, just log it
      }
    }
  };

  const downloadCSV = () => window.open(`${apiEndpoint}/api/download/${runId}/csv`, '_blank');
  const downloadExcel = () => window.open(`${apiEndpoint}/api/download/${runId}/excel`, '_blank');

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this job?')) {
      return;
    }
    
    try {
      const response = await fetch(`${apiEndpoint}/api/run/${runId}/cancel`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel job');
      }
      
      const result = await response.json();
      toast.success(result.message || 'Job cancelled');
      setAutoRefresh(false);
      // Refresh status to show cancelled state
      loadStatus();
    } catch (error: any) {
      toast.error(`Failed to cancel job: ${error.message}`);
    }
  };

  if (!jobStatus) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Loading workflow for Run #{runId}...</p>
          <p className="text-xs text-gray-500 mt-2">If this takes too long, the backend may be processing large data or not responding.</p>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
            >
              ← Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow border border-slate-200 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Processing Workflow</h2>
              <p className="text-sm text-gray-600 mt-1">
                Run #{runId} • {jobStatus.file_a} vs {jobStatus.file_b}
              </p>
            </div>
            {autoRefresh && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Auto-refreshing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Use shared WorkflowView component */}
        <WorkflowView jobStatus={jobStatus} compact={false} />

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow border border-slate-200 p-4 mt-4">
          <div className="flex flex-wrap gap-2">
            {onBack && (
              <button onClick={onBack}
                className="px-4 py-2 bg-slate-600 text-white text-sm font-medium rounded hover:bg-slate-700 flex items-center space-x-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Dashboard</span>
              </button>
            )}
            
            {(jobStatus.status === 'queued' || jobStatus.status === 'running') && (
              <button onClick={handleCancel}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 flex items-center space-x-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Cancel Job</span>
              </button>
            )}
            
            {jobStatus.status === 'completed' && (
              <>
                {onViewResults && (
                  <button onClick={onViewResults}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 flex items-center space-x-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>View Results</span>
                  </button>
                )}
                <button onClick={downloadCSV}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 flex items-center space-x-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download CSV</span>
                </button>
                <button onClick={downloadExcel}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 flex items-center space-x-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download Excel</span>
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
