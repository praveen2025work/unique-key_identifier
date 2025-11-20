'use client'

import React, { useEffect, useState } from 'react';
import apiService from '../services/api';
import type { JobStatus } from '../types';

interface ProgressTrackerProps {
  runId: number;
  onComplete?: (status: JobStatus) => void;
}

export default function ProgressTracker({ runId, onComplete }: ProgressTrackerProps) {
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchStatus = async () => {
      try {
        const jobStatus = await apiService.getJobStatus(runId);
        setStatus(jobStatus);
        setLoading(false);

        // If completed, error, or cancelled, stop polling
        if (jobStatus.status === 'completed' || jobStatus.status === 'error' || jobStatus.status === 'cancelled') {
          clearInterval(interval);
          if (onComplete) {
            onComplete(jobStatus);
          }
        }
      } catch (error) {
        console.error('Failed to fetch status:', error);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchStatus();

    // Poll every 2 seconds
    interval = setInterval(fetchStatus, 2000);

    return () => clearInterval(interval);
  }, [runId, onComplete]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-3 text-lg text-gray-600">Loading...</span>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="text-center p-8 text-red-500">
        Failed to load job status
      </div>
    );
  }

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this job?')) {
      return;
    }
    
    try {
      setCancelling(true);
      await apiService.cancelJob(runId);
      // Refresh status to show cancelled state
      const updatedStatus = await apiService.getJobStatus(runId);
      setStatus(updatedStatus);
      if (onComplete) {
        onComplete(updatedStatus);
      }
    } catch (error: any) {
      alert(`Failed to cancel job: ${error.message}`);
    } finally {
      setCancelling(false);
    }
  };

  const getStatusColor = (stageStatus: string) => {
    switch (stageStatus) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500 animate-pulse';
      case 'error':
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusIcon = (stageStatus: string) => {
    switch (stageStatus) {
      case 'completed':
        return '✓';
      case 'in_progress':
        return '⋯';
      case 'error':
      case 'cancelled':
        return '✕';
      default:
        return '○';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-800">
            Analysis Progress
          </h2>
          <div className="flex items-center gap-3">
            {(status.status === 'queued' || status.status === 'running') && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Job'}
              </button>
            )}
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                status.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : status.status === 'error' || status.status === 'cancelled'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {status.status.toUpperCase()}
            </span>
          </div>
        </div>
        <p className="text-gray-600">
          {status.file_a} vs {status.file_b} (Run #{runId})
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-medium text-gray-700">{status.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              status.status === 'error' ? 'bg-red-500' : 'bg-primary'
            }`}
            style={{ width: `${status.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Stages */}
      <div className="space-y-3">
        {status.stages.map((stage, index) => (
          <div
            key={stage.name}
            className={`p-4 rounded-lg border-2 transition-all ${
              stage.status === 'in_progress'
                ? 'border-blue-500 bg-blue-50'
                : stage.status === 'completed'
                ? 'border-green-500 bg-green-50'
                : stage.status === 'error'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-start">
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full ${getStatusColor(
                  stage.status
                )} flex items-center justify-center text-white font-bold mr-3`}
              >
                {getStatusIcon(stage.status)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 capitalize">
                    {stage.name.replace(/_/g, ' ')}
                  </h3>
                  <span className="text-xs text-gray-500">
                    Stage {stage.order}
                  </span>
                </div>
                {stage.details && (
                  <p className="text-sm text-gray-600 mt-1">{stage.details}</p>
                )}
                {stage.started_at && (
                  <p className="text-xs text-gray-500 mt-1">
                    Started: {new Date(stage.started_at).toLocaleTimeString()}
                    {stage.completed_at &&
                      ` • Completed: ${new Date(
                        stage.completed_at
                      ).toLocaleTimeString()}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {status.error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-semibold text-red-800 mb-2">Error</h4>
          <p className="text-sm text-red-700">{status.error}</p>
        </div>
      )}

      {/* Completion Message */}
      {status.status === 'completed' && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">✓ Analysis Complete</h4>
          <p className="text-sm text-green-700">
            Your file comparison is ready! View the results below.
          </p>
        </div>
      )}

      {/* Cancelled Message */}
      {status.status === 'cancelled' && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">⚠ Job Cancelled</h4>
          <p className="text-sm text-yellow-700">
            This job was cancelled. You can start a new analysis if needed.
          </p>
        </div>
      )}
    </div>
  );
}
