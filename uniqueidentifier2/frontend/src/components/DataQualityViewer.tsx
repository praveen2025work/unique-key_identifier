'use client'

import { useEffect, useState } from 'react';
import apiService from '../services/api';
import type { DataQualityReport } from '../types';
import toast from 'react-hot-toast';
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';

interface DataQualityViewerProps {
  runId: number;
}

export default function DataQualityViewer({ runId }: DataQualityViewerProps) {
  const [report, setReport] = useState<DataQualityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);

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
        setReport(null);
      } else {
        toast.error('Failed to load data quality report');
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string = 'Content') => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`, { duration: 2000 });
  };

  const copyReportAsJSON = () => {
    if (!report) return;
    
    const structuredReport = {
      metadata: {
        title: 'Data Quality Report',
        version: '2.0',
        generated_at: new Date().toISOString(),
        run_id: runId
      },
      summary: {
        status: report.summary.status,
        status_message: report.summary.status_message,
        total_issues: report.summary.total_issues,
        high_severity_count: report.summary.high_severity_count,
        medium_severity_count: report.summary.medium_severity_count,
        file1_issues: report.summary.file1_issues,
        file2_issues: report.summary.file2_issues,
        cross_file_issues: report.summary.cross_file_issues
      },
      cross_file_discrepancies: report.discrepancies || [],
      file_a_report: report.file1_report ? {
        file_name: report.file1_report.file_name,
        total_rows: report.file1_report.total_rows,
        total_columns: report.file1_report.total_columns,
        overall_issues: report.file1_report.overall_issues,
        column_issues: report.file1_report.column_issues || {},
        consistency_metrics: report.file1_report.consistency_metrics || {}
      } : null,
      file_b_report: report.file2_report ? {
        file_name: report.file2_report.file_name,
        total_rows: report.file2_report.total_rows,
        total_columns: report.file2_report.total_columns,
        overall_issues: report.file2_report.overall_issues,
        column_issues: report.file2_report.column_issues || {},
        consistency_metrics: report.file2_report.consistency_metrics || {}
      } : null
    };

    copyToClipboard(JSON.stringify(structuredReport, null, 2), 'JSON Report');
  };

  const copyReportAsCSV = () => {
    if (!report) return;
    
    // CSV format for all issues
    let csv = 'Category,File,Severity,Type,Column,Issue/Message\n';
    
    // Cross-file discrepancies
    if (report.discrepancies && report.discrepancies.length > 0) {
      report.discrepancies.forEach(disc => {
        const type = (disc.type || 'ISSUE').replace(/,/g, ';');
        const message = (disc.message || disc.issue || '').replace(/,/g, ';').replace(/\n/g, ' ');
        const column = (disc.column || '').replace(/,/g, ';');
        csv += `Cross-File,Both,${disc.severity},${type},${column},"${message}"\n`;
      });
    }
    
    // File A issues
    if (report.file1_report && report.file1_report.overall_issues.length > 0) {
      report.file1_report.overall_issues.forEach(issue => {
        const type = (issue.type || 'ISSUE').replace(/,/g, ';');
        const message = (issue.message || issue.issue || '').replace(/,/g, ';').replace(/\n/g, ' ');
        const column = (issue.column || '').replace(/,/g, ';');
        csv += `File-Specific,File A,${issue.severity},${type},${column},"${message}"\n`;
      });
    }
    
    // File B issues
    if (report.file2_report && report.file2_report.overall_issues.length > 0) {
      report.file2_report.overall_issues.forEach(issue => {
        const type = (issue.type || 'ISSUE').replace(/,/g, ';');
        const message = (issue.message || issue.issue || '').replace(/,/g, ';').replace(/\n/g, ' ');
        const column = (issue.column || '').replace(/,/g, ';');
        csv += `File-Specific,File B,${issue.severity},${type},${column},"${message}"\n`;
      });
    }

    copyToClipboard(csv, 'CSV Report');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16">
        <div className="relative">
          <div className="animate-spin h-12 w-12 border-4 border-primary-200 border-t-primary-600 rounded-full"></div>
          <ShieldCheckIcon className="w-6 h-6 text-primary-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <span className="mt-4 text-sm font-semibold text-gray-700">Loading Data Quality Report...</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="card-modern p-12 text-center">
        <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-800 mb-2">No Quality Check Available</h3>
        <p className="text-sm text-gray-600">
          Data quality check was not performed for this analysis run.
        </p>
      </div>
    );
  }

  const { summary, file1_report, file2_report, discrepancies } = report;
  
  const getStatusConfig = () => {
    switch (summary.status) {
      case 'pass':
        return { icon: '✅', color: 'success', bg: 'bg-success-50', border: 'border-success-500', text: 'text-success-800' };
      case 'warning':
        return { icon: '⚠️', color: 'amber', bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-800' };
      case 'critical':
        return { icon: '❌', color: 'red', bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-800' };
      default:
        return { icon: 'ℹ️', color: 'primary', bg: 'bg-primary-50', border: 'border-primary-500', text: 'text-primary-800' };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      
      {/* Simple Header */}
      <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="w-5 h-5 text-gray-600" />
            <div>
              <h2 className="text-base font-bold text-gray-900">Data Quality Report</h2>
              <p className="text-sm text-gray-600">{summary.status_message}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-gray-600">Total Issues: <span className="font-bold text-gray-900">{summary.total_issues}</span></div>
              <div className="text-xs text-gray-500">High: {summary.high_severity_count} • Medium: {summary.medium_severity_count}</div>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 border border-gray-300 rounded text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Export ▼
              </button>
              
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)}></div>
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded border border-gray-300 shadow-lg py-1 z-20">
                    <button
                      onClick={() => { copyReportAsJSON(); setShowExportMenu(false); }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Copy as JSON
                    </button>
                    <button
                      onClick={() => { copyReportAsCSV(); setShowExportMenu(false); }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Copy as CSV
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cross-File Issues - Simple List */}
      {discrepancies && discrepancies.length > 0 && (
        <div className="bg-white border border-gray-300 rounded-lg p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Cross-File Discrepancies ({discrepancies.length})</h3>
          <div className="space-y-2">
            {discrepancies.map((disc, idx) => (
              <div key={idx} className="border-l-3 border-gray-400 pl-3 py-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-700 uppercase">{disc.severity}</span>
                      {disc.column && (
                        <span className="text-xs font-mono text-gray-600 border border-gray-300 px-1 rounded">{disc.column}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-800">{disc.message || disc.issue}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Summary Comparison Table */}
      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-300">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">File A</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">File B</th>
            </tr>
          </thead>
          <tbody>
            {/* File Names */}
            <tr className="border-b border-gray-200">
              <td className="px-4 py-2 text-sm text-gray-700">{file1_report?.file_name || 'N/A'}</td>
              <td className="px-4 py-2 text-sm text-gray-700">{file2_report?.file_name || 'N/A'}</td>
            </tr>
            
            {/* Row Count */}
            <tr className="border-b border-gray-200">
              <td className="px-4 py-2 text-sm">
                <span className="text-gray-600">Rows: </span>
                <span className="font-medium text-gray-900">{file1_report?.total_rows.toLocaleString() || 0}</span>
              </td>
              <td className="px-4 py-2 text-sm">
                <span className="text-gray-600">Rows: </span>
                <span className="font-medium text-gray-900">{file2_report?.total_rows.toLocaleString() || 0}</span>
              </td>
            </tr>
            
            {/* Column Count */}
            <tr className="border-b border-gray-200">
              <td className="px-4 py-2 text-sm">
                <span className="text-gray-600">Columns: </span>
                <span className="font-medium text-gray-900">{file1_report?.total_columns || 0}</span>
              </td>
              <td className="px-4 py-2 text-sm">
                <span className="text-gray-600">Columns: </span>
                <span className="font-medium text-gray-900">{file2_report?.total_columns || 0}</span>
              </td>
            </tr>
            
            {/* Issues Count */}
            <tr className="border-b border-gray-200">
              <td className="px-4 py-2 text-sm">
                <span className="text-gray-600">Issues: </span>
                <span className={`font-bold ${(file1_report?.overall_issues.length || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {file1_report?.overall_issues.length || 0}
                </span>
              </td>
              <td className="px-4 py-2 text-sm">
                <span className="text-gray-600">Issues: </span>
                <span className={`font-bold ${(file2_report?.overall_issues.length || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {file2_report?.overall_issues.length || 0}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Column-by-Column Comparison Table */}
      {file1_report?.columns && file2_report?.columns && (
        <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-100 border-b border-gray-300">
            <h3 className="text-sm font-bold text-gray-900">Column Quality Comparison</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 sticky left-0 bg-gray-50">Column</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">File A - Type</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">File B - Type</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">File A - Consistency</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">File B - Consistency</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">File A - Null %</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">File B - Null %</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Issues</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Get all unique column names from both files
                  const allColumns = new Set([
                    ...Object.keys(file1_report.columns || {}),
                    ...Object.keys(file2_report.columns || {})
                  ]);

                  return Array.from(allColumns).sort().map((columnName) => {
                    const col1 = file1_report.columns?.[columnName];
                    const col2 = file2_report.columns?.[columnName];
                    
                    // Helper to get color based on value
                    const getConsistencyColor = (value: number | undefined) => {
                      if (value === undefined) return 'text-gray-400';
                      if (value >= 95) return 'text-green-600 font-semibold';
                      if (value >= 80) return 'text-amber-600 font-semibold';
                      return 'text-red-600 font-semibold';
                    };

                    const getNullColor = (value: number | undefined) => {
                      if (value === undefined) return 'text-gray-400';
                      if (value === 0) return 'text-green-600 font-semibold';
                      if (value < 10) return 'text-amber-600 font-semibold';
                      return 'text-red-600 font-semibold';
                    };

                    const typesMatch = col1?.pattern_type === col2?.pattern_type;
                    const hasIssues = (col1?.issues?.length || 0) + (col2?.issues?.length || 0) > 0;

                    return (
                      <tr key={columnName} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-mono font-medium text-gray-900 sticky left-0 bg-white">{columnName}</td>
                        
                        {/* Pattern Types */}
                        <td className={`px-3 py-2 text-sm ${col1 ? 'text-gray-700' : 'text-gray-400'}`}>
                          {col1?.pattern_type || 'N/A'}
                        </td>
                        <td className={`px-3 py-2 text-sm ${col2 ? (typesMatch ? 'text-gray-700' : 'text-orange-600 font-semibold') : 'text-gray-400'}`}>
                          {col2?.pattern_type || 'N/A'}
                          {col1 && col2 && !typesMatch && <span className="ml-1 text-orange-600">⚠️</span>}
                        </td>
                        
                        {/* Consistency */}
                        <td className={`px-3 py-2 text-sm text-right ${getConsistencyColor(col1?.consistency)}`}>
                          {col1?.consistency !== undefined ? `${col1.consistency.toFixed(1)}%` : 'N/A'}
                        </td>
                        <td className={`px-3 py-2 text-sm text-right ${getConsistencyColor(col2?.consistency)}`}>
                          {col2?.consistency !== undefined ? `${col2.consistency.toFixed(1)}%` : 'N/A'}
                        </td>
                        
                        {/* Null Percentage */}
                        <td className={`px-3 py-2 text-sm text-right ${getNullColor(col1?.null_percentage)}`}>
                          {col1?.null_percentage !== undefined ? `${col1.null_percentage.toFixed(1)}%` : 'N/A'}
                        </td>
                        <td className={`px-3 py-2 text-sm text-right ${getNullColor(col2?.null_percentage)}`}>
                          {col2?.null_percentage !== undefined ? `${col2.null_percentage.toFixed(1)}%` : 'N/A'}
                        </td>
                        
                        {/* Issues */}
                        <td className="px-3 py-2 text-center">
                          {hasIssues ? (
                            <span className="text-red-600 font-bold text-sm">
                              {(col1?.issues?.length || 0) + (col2?.issues?.length || 0)}
                            </span>
                          ) : (
                            <span className="text-green-600 text-sm">✓</span>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Overall Issues - Simple List */}
      <div className="bg-white border border-gray-300 rounded-lg p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-3">All Issues</h3>
        
        {/* File A Issues */}
        {file1_report && file1_report.overall_issues.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">File A ({file1_report.overall_issues.length})</h4>
            <div className="space-y-1">
              {file1_report.overall_issues.map((issue, idx) => (
                <div key={idx} className="border-l-2 border-gray-300 pl-3 py-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-gray-600 uppercase">{issue.severity}</span>
                    {issue.column && (
                      <span className="text-xs font-mono text-gray-600">{issue.column}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800">{issue.message || issue.issue}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* File B Issues */}
        {file2_report && file2_report.overall_issues.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">File B ({file2_report.overall_issues.length})</h4>
            <div className="space-y-1">
              {file2_report.overall_issues.map((issue, idx) => (
                <div key={idx} className="border-l-2 border-gray-300 pl-3 py-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-gray-600 uppercase">{issue.severity}</span>
                    {issue.column && (
                      <span className="text-xs font-mono text-gray-600">{issue.column}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800">{issue.message || issue.issue}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {(!file1_report || file1_report.overall_issues.length === 0) && 
         (!file2_report || file2_report.overall_issues.length === 0) && (
          <p className="text-sm text-gray-600 text-center py-4">No issues detected</p>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500">
        End of Report • Run #{runId}
      </div>
    </div>
  );
}
