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
    <div className="max-w-7xl mx-auto p-3 space-y-3">
      
      {/* Ultra Compact Single-Line Header */}
      <div className={`${statusConfig.bg} border-l-4 ${statusConfig.border} rounded-lg p-2.5 shadow-sm`}>
        <div className="flex items-center justify-between gap-3">
          {/* Left: Title + Icon + Status */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5 text-slate-600 flex-shrink-0" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900 whitespace-nowrap">Data Quality Report</span>
                <span className="text-xs text-gray-500 hidden sm:inline">• v2.0</span>
              </div>
          </div>
            <div className="flex items-center gap-2 flex-1">
              <span className={`text-xs font-semibold ${statusConfig.text} truncate`}>{summary.status_message}</span>
            </div>
          </div>
          
          {/* Center: Stats */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1 px-2 py-1 bg-white rounded border border-gray-200">
              <span className="text-sm font-bold text-gray-800">{summary.total_issues}</span>
              <span className="text-[10px] text-gray-600">Total</span>
        </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-red-50 rounded border border-red-300">
              <span className="text-sm font-bold text-red-700">{summary.high_severity_count}</span>
              <span className="text-[10px] text-red-700">High</span>
      </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded border border-amber-300">
              <span className="text-sm font-bold text-amber-700">{summary.medium_severity_count}</span>
              <span className="text-[10px] text-amber-700">Medium</span>
            </div>
          </div>
          
          {/* Right: Export Dropdown */}
          <div className="relative flex-shrink-0">
          <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-xs font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg flex-shrink-0"
            >
              <ClipboardDocumentIcon className="w-3.5 h-3.5" />
              <span>📋 Export</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
          </button>
            
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)}></div>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20">
                  <button
                    onClick={() => { copyReportAsJSON(); setShowExportMenu(false); }}
                    className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <div>Copy as JSON</div>
                      <div className="text-[9px] text-gray-500">Structured format</div>
              </div>
                  </button>
                  <button
                    onClick={() => { copyReportAsCSV(); setShowExportMenu(false); }}
                    className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <div>Copy as CSV</div>
                      <div className="text-[9px] text-gray-500">Excel compatible</div>
            </div>
                  </button>
          </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Compact Cross-File Discrepancies Section */}
      {discrepancies && discrepancies.length > 0 && (
        <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
              <h3 className="text-sm font-bold text-gray-900">Cross-File Issues</h3>
              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                {discrepancies.length}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(JSON.stringify(discrepancies, null, 2), 'All Discrepancies')}
              className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100 transition-all"
            >
              <DocumentDuplicateIcon className="w-3.5 h-3.5" />
              Copy
            </button>
          </div>

          <div className="space-y-2">
            {discrepancies.map((disc, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border-l-2 ${
                  disc.severity === 'high' ? 'bg-red-50 border-red-500' :
                  disc.severity === 'medium' ? 'bg-amber-50 border-amber-500' :
                  'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        disc.severity === 'high' ? 'bg-red-600 text-white' :
                        disc.severity === 'medium' ? 'bg-amber-600 text-white' :
                        'bg-blue-600 text-white'
                      }`}>
                        {disc.severity}
                      </span>
                      <span className="font-bold text-xs">{(disc.type || 'ISSUE').replace(/_/g, ' ').toUpperCase()}</span>
                    {disc.column && (
                        <span className="px-1.5 py-0.5 bg-white rounded border border-gray-300 text-[10px] font-mono">
                          {disc.column}
                        </span>
                      )}
                      </div>
                    <p className="text-xs text-gray-700 leading-snug">{disc.message || disc.issue}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(disc, null, 2), 'Discrepancy')}
                    className="flex-shrink-0 p-1 hover:bg-white rounded transition-all"
                    title="Copy this issue"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4 text-gray-600 hover:text-primary-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compact File-Specific Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {[
          { report: file1_report, title: 'File A Issues', icon: '📘', color: 'blue' },
          { report: file2_report, title: 'File B Issues', icon: '📙', color: 'purple' }
        ].map(({ report: fileReport, title, icon, color }, index) => {
          if (!fileReport || fileReport.overall_issues.length === 0) {
        return (
              <div key={index} className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-200">
                <div className="text-3xl mb-2">✅</div>
                <h3 className="text-sm font-bold text-gray-800">{title}</h3>
                <p className="text-xs text-gray-600">No issues detected</p>
              </div>
            );
          }

          return (
            <div key={index} className={`bg-white rounded-lg p-3 shadow-sm border-l-4 border-${color}-500`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{icon}</span>
                  <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                  <span className={`px-2 py-0.5 bg-${color}-100 text-${color}-700 rounded-full text-xs font-bold`}>
                    {fileReport.overall_issues.length}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(fileReport, null, 2), title)}
                  className={`flex items-center gap-1.5 px-3 py-1 bg-${color}-50 text-${color}-700 rounded-lg text-xs font-semibold hover:bg-${color}-100 transition-all`}
                >
                  <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                  Copy
                </button>
            </div>
            
              {/* Overall Issues - Compact */}
              <div className="space-y-1.5 mb-3">
              {fileReport.overall_issues.map((issue, idx) => (
                <div
                  key={idx}
                    className={`p-2 rounded-lg border-l-2 ${
                      issue.severity === 'high' ? 'bg-red-50 border-red-500' :
                      issue.severity === 'medium' ? 'bg-amber-50 border-amber-500' :
                      'bg-blue-50 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase flex-shrink-0 ${
                            issue.severity === 'high' ? 'bg-red-600 text-white' :
                            issue.severity === 'medium' ? 'bg-amber-600 text-white' :
                            'bg-blue-600 text-white'
                          }`}>
                            {issue.severity}
                          </span>
                          {issue.column && (
                            <span className="px-1.5 py-0.5 bg-white rounded border border-gray-300 text-[9px] font-mono truncate">
                          {issue.column}
                        </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-700 leading-tight">{issue.message || issue.issue}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(issue, null, 2), 'Issue')}
                        className="flex-shrink-0 p-1 hover:bg-white rounded transition-all"
                        title="Copy"
                      >
                        <DocumentDuplicateIcon className="w-3.5 h-3.5 text-gray-600 hover:text-primary-600" />
                      </button>
                  </div>
                </div>
              ))}
            </div>

              {/* Column-Specific Issues - Compact Collapsible */}
              {fileReport.column_issues && Object.keys(fileReport.column_issues).length > 0 && (
                <details className="mt-2 pt-2 border-t border-gray-200">
                  <summary className="cursor-pointer text-xs font-bold text-gray-800 hover:text-primary-600 flex items-center gap-1.5">
                    <span>Column Details ({Object.keys(fileReport.column_issues).length})</span>
        <button
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(JSON.stringify(fileReport.column_issues, null, 2), 'Column Issues'); }}
                      className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-0.5"
                    >
                      <DocumentDuplicateIcon className="w-3 h-3" />
        </button>
                  </summary>
                  <div className="space-y-1.5 mt-2">
                    {Object.entries(fileReport.column_issues).map(([column, issues]: [string, any[]]) => (
                      <div key={column} className="bg-gray-50 rounded p-2 border border-gray-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[10px] font-bold text-gray-800 truncate">{column}</span>
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full text-[9px] font-bold">
                              {issues.length}
                            </span>
                        </div>
                        {issues.slice(0, 3).map((iss, i) => (
                          <div key={i} className="text-[9px] text-gray-600 ml-1 leading-tight">
                            • {iss.message || iss.issue}
                          </div>
                        ))}
                        {issues.length > 3 && (
                          <div className="text-[9px] text-gray-500 ml-1 mt-0.5">+{issues.length - 3} more</div>
                        )}
                                </div>
                              ))}
                            </div>
                </details>
                        )}

              {/* Consistency Metrics - Compact */}
              {fileReport.consistency_metrics && (
                <details className="mt-2 pt-2 border-t border-gray-200">
                  <summary className="cursor-pointer text-xs font-bold text-gray-800 hover:text-primary-600 flex items-center gap-1.5">
                    <span>Metrics ({Object.keys(fileReport.consistency_metrics).length})</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(JSON.stringify(fileReport.consistency_metrics, null, 2), 'Metrics'); }}
                      className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-0.5"
                    >
                      <DocumentDuplicateIcon className="w-3 h-3" />
                    </button>
                  </summary>
                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    {Object.entries(fileReport.consistency_metrics).map(([key, value]) => (
                      <div key={key} className="bg-white rounded p-1.5 border border-gray-200">
                        <div className="text-[9px] text-gray-600 uppercase font-semibold truncate">
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div className={`text-sm font-bold ${
                          typeof value === 'number' && value >= 95 ? 'text-success-700' :
                          typeof value === 'number' && value >= 80 ? 'text-amber-700' :
                          typeof value === 'number' ? 'text-red-700' :
                          'text-gray-700'
                        }`}>
                          {typeof value === 'number' ? `${value.toFixed(1)}%` : value}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
                </div>
              );
            })}
          </div>

      {/* Compact Report Footer */}
      <div className="bg-slate-50 rounded-lg p-2 border border-slate-200 text-center">
        <p className="text-xs text-gray-600">
          End of Report • Run #{runId}
        </p>
      </div>
    </div>
  );
}
