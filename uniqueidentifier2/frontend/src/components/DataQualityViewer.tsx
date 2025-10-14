import React, { useEffect, useState } from 'react';
import apiService from '../services/api';
import type { DataQualityReport } from '../types';
import toast from 'react-hot-toast';

interface DataQualityViewerProps {
  runId: number;
}

export default function DataQualityViewer({ runId }: DataQualityViewerProps) {
  const [report, setReport] = useState<DataQualityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadReport();
  }, [runId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await apiService.getDataQualityResults(runId);
      setReport(data);
    } catch (error) {
      if (error instanceof Error && error.message.includes('No quality check')) {
        // No quality check was performed, don't show error
        setReport(null);
      } else {
        toast.error('Failed to load data quality report');
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-3 text-lg text-gray-600">Loading quality report...</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Quality Check Available</h3>
        <p className="text-gray-600">
          Data quality check was not performed for this analysis run.
          Enable it in the configuration to see quality insights.
        </p>
      </div>
    );
  }

  const { summary, file1_report, file2_report, discrepancies } = report;
  
  const statusColors = {
    pass: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-800', icon: '✅' },
    minor: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-800', icon: 'ℹ️' },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-800', icon: '⚠️' },
    critical: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-800', icon: '⚠️' },
  };

  const colors = statusColors[summary.status as keyof typeof statusColors] || statusColors.minor;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-400 text-red-800';
      case 'medium': return 'bg-yellow-50 border-yellow-400 text-yellow-800';
      default: return 'bg-blue-50 border-blue-400 text-blue-800';
    }
  };

  const getConsistencyColor = (consistency: number) => {
    if (consistency >= 95) return 'text-green-600';
    if (consistency >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Data Quality Check</h3>

      {/* Status Summary */}
      <div className={`${colors.bg} border-l-4 ${colors.border} p-6 rounded-r-lg mb-6`}>
        <h3 className={`${colors.text} font-bold text-xl mb-4 flex items-center`}>
          <span className="mr-2 text-2xl">{colors.icon}</span>
          {summary.status_message}
        </h3>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Total Issues</div>
            <div className="text-3xl font-bold text-gray-800">{summary.total_issues}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">High Severity</div>
            <div className="text-3xl font-bold text-red-600">{summary.high_severity_count}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Medium Severity</div>
            <div className="text-3xl font-bold text-yellow-600">{summary.medium_severity_count}</div>
          </div>
        </div>
      </div>

      {/* Cross-file Discrepancies */}
      {discrepancies && discrepancies.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xl font-bold text-gray-800 mb-4">
            🚨 Cross-File Issues ({discrepancies.length})
          </h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {discrepancies.map((disc, idx) => (
              <div
                key={idx}
                className={`${getSeverityColor(disc.severity)} border-l-4 p-4 rounded-r-lg`}
              >
                <div className="font-semibold">
                  {disc.type.replace(/_/g, ' ').toUpperCase()}
                </div>
                {disc.column && (
                  <div className="text-sm mt-1">
                    Column: <strong>{disc.column}</strong>
                  </div>
                )}
                <div className="mt-2">{disc.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File-specific Issues */}
      {[file1_report, file2_report].map((fileReport) => {
        if (!fileReport || fileReport.overall_issues.length === 0) return null;
        
        return (
          <div key={fileReport.file_name} className="mb-6">
            <h4 className="text-xl font-bold text-gray-800 mb-4">
              ⚠️ {fileReport.file_name} - {fileReport.overall_issues.length} Issues
            </h4>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Total Rows:</strong> {fileReport.total_rows.toLocaleString()}
                </div>
                <div>
                  <strong>Total Columns:</strong> {fileReport.total_columns}
                </div>
              </div>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {fileReport.overall_issues.map((issue, idx) => (
                <div
                  key={idx}
                  className={`${getSeverityColor(issue.severity)} border-l-4 p-3 rounded-r-lg`}
                >
                  <div className="font-semibold">{issue.column}</div>
                  <div className="text-sm mt-1">{issue.issue}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Detailed Column Analysis (Expandable) */}
      <div className="mt-6">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center justify-between w-full text-lg font-semibold text-primary hover:text-primary-dark transition-colors p-4 bg-gray-50 rounded-lg"
        >
          <span>📊 View Detailed Column Analysis</span>
          <svg
            className={`w-6 h-6 transform transition-transform ${showDetails ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDetails && (
          <div className="mt-4 space-y-6">
            {[file1_report, file2_report].map((fileReport) => {
              if (!fileReport) return null;
              
              return (
                <div key={fileReport.file_name}>
                  <h5 className="text-lg font-bold text-gray-800 mb-3">{fileReport.file_name}</h5>
                  <div className="grid gap-3">
                    {Object.entries(fileReport.columns).map(([colName, colData]) => (
                      <div key={colName} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="font-semibold text-gray-800 mb-2">{colName}</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <div className="text-gray-600">Pattern</div>
                            <div className="font-semibold">{colData.pattern_type}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Consistency</div>
                            <div className={`font-semibold ${getConsistencyColor(colData.consistency)}`}>
                              {colData.consistency}%
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">Nulls</div>
                            <div className="font-semibold">{colData.null_percentage}%</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Values</div>
                            <div className="font-semibold">{colData.non_null_values.toLocaleString()}</div>
                          </div>
                        </div>
                        {colData.issues.length > 0 && (
                          <div className="mt-2 text-sm text-red-600">
                            {colData.issues.map((issue, idx) => (
                              <div key={idx}>• {issue}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

