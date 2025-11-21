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
  const [columnSearchText, setColumnSearchText] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [issuesTab, setIssuesTab] = useState<'fileA' | 'fileB'>('fileA');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all'); // Filter by type
  const [selectedColumnForPanel, setSelectedColumnForPanel] = useState<string | null>(null); // Column selected for right panel

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
    <div className="w-full mx-auto p-4 space-y-4">
      
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

      {/* File Summary Comparison Table - MOVED TO TOP */}
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

      {/* Column-by-Column Comparison Table - WITH SEARCH, SORTING, TYPE FILTER, AND RIGHT PANEL */}
      {file1_report?.columns && file2_report?.columns && (() => {
        // Collect all unique types from both files
        const allTypes = new Set<string>();
        Object.values(file1_report.columns || {}).forEach(col => {
          if (col.pattern_type) allTypes.add(col.pattern_type);
        });
        Object.values(file2_report.columns || {}).forEach(col => {
          if (col.pattern_type) allTypes.add(col.pattern_type);
        });
        const sortedTypes = Array.from(allTypes).sort();

        // Get selected column's discrepancy for right panel
        const selectedDiscrepancy = selectedColumnForPanel 
          ? discrepancies?.find(d => d.column === selectedColumnForPanel && d.type === 'pattern_mismatch')
          : null;

        return (
          <div className="flex gap-4">
            {/* Main Grid - Left Side */}
            <div className={`bg-white border border-gray-300 rounded-lg overflow-hidden transition-all ${selectedColumnForPanel ? 'flex-1' : 'flex-1'}`}>
              <div className="px-4 py-3 bg-gray-100 border-b border-gray-300">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900">Column Quality Comparison</h3>
                    {selectedColumnForPanel && (
                      <button
                        onClick={() => setSelectedColumnForPanel(null)}
                        className="text-xs text-gray-600 hover:text-gray-800"
                      >
                        ✕ Close Panel
                      </button>
                    )}
                  </div>
                  
                  {/* Type Filter - Show all types at top */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-gray-700">Filter by Type:</span>
                    <button
                      onClick={() => setSelectedTypeFilter('all')}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        selectedTypeFilter === 'all'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      All Types
                    </button>
                    {sortedTypes.map(type => (
                      <button
                        key={type}
                        onClick={() => setSelectedTypeFilter(type)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          selectedTypeFilter === type
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  {/* Search */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search columns..."
                      value={columnSearchText}
                      onChange={(e) => setColumnSearchText(e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                    />
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr>
                  <th 
                    className="px-4 py-2 text-left text-xs font-bold text-gray-700 sticky left-0 bg-gray-50 cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      if (sortColumn === 'name') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortColumn('name');
                        setSortDirection('asc');
                      }
                    }}
                  >
                    Column {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
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
                  let allColumns = Array.from(new Set([
                    ...Object.keys(file1_report.columns || {}),
                    ...Object.keys(file2_report.columns || {})
                  ]));

                  // Filter by search text
                  if (columnSearchText) {
                    allColumns = allColumns.filter(col => 
                      col.toLowerCase().includes(columnSearchText.toLowerCase())
                    );
                  }

                  // Filter by type
                  if (selectedTypeFilter !== 'all') {
                    allColumns = allColumns.filter(col => {
                      const col1 = file1_report.columns?.[col];
                      const col2 = file2_report.columns?.[col];
                      return col1?.pattern_type === selectedTypeFilter || col2?.pattern_type === selectedTypeFilter;
                    });
                  }

                  // Sort columns
                  allColumns.sort((a, b) => {
                    if (sortColumn === 'name') {
                      return sortDirection === 'asc' 
                        ? a.localeCompare(b)
                        : b.localeCompare(a);
                    }
                    return 0;
                  });

                  return allColumns.map((columnName) => {
                    const col1 = file1_report.columns?.[columnName];
                    const col2 = file2_report.columns?.[columnName];
                    
                    // Find discrepancy for this column
                    const discrepancy = discrepancies?.find(d => d.column === columnName && d.type === 'pattern_mismatch');
                    const hasSampleRecords = discrepancy?.sample_records && discrepancy.sample_records.length > 0;
                    
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
                      <tr 
                        key={columnName} 
                        className={`border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedColumnForPanel === columnName ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => {
                          if (hasSampleRecords) {
                            setSelectedColumnForPanel(selectedColumnForPanel === columnName ? null : columnName);
                          }
                        }}
                      >
                          <td className="px-4 py-2 text-sm font-mono font-medium text-gray-900 sticky left-0 bg-white">
                            <div className="flex items-center gap-2">
                              {hasSampleRecords && (
                                <span className="text-xs text-blue-600 font-normal" title="Click to view sample records">
                                  📊 ({discrepancy.sample_records?.length || 0} samples)
                                </span>
                              )}
                              {columnName}
                            </div>
                          </td>
                          
                          {/* Pattern Types */}
                          <td className={`px-3 py-2 text-sm ${col1 ? 'text-gray-700' : 'text-gray-400'}`}>
                            <div className="flex flex-col">
                              <span>{col1?.pattern_type || 'N/A'}</span>
                              {col1?.sample_values && col1.sample_values.length > 0 && (
                                <span className="text-xs text-gray-500 mt-0.5">
                                  Sample: {String(col1.sample_values[0]).substring(0, 20)}
                                  {String(col1.sample_values[0]).length > 20 ? '...' : ''}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className={`px-3 py-2 text-sm ${col2 ? (typesMatch ? 'text-gray-700' : 'text-orange-600 font-semibold') : 'text-gray-400'}`}>
                            <div className="flex flex-col">
                              <span>
                                {col2?.pattern_type || 'N/A'}
                                {col1 && col2 && !typesMatch && <span className="ml-1 text-orange-600">⚠️</span>}
                              </span>
                              {col2?.sample_values && col2.sample_values.length > 0 && (
                                <span className="text-xs text-gray-500 mt-0.5">
                                  Sample: {String(col2.sample_values[0]).substring(0, 20)}
                                  {String(col2.sample_values[0]).length > 20 ? '...' : ''}
                                </span>
                              )}
                            </div>
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

            {/* Right Panel - Sample Records */}
            {selectedColumnForPanel && selectedDiscrepancy?.sample_records && (
              <div className="w-96 bg-white border border-gray-300 rounded-lg overflow-hidden flex flex-col">
                <div className="px-4 py-3 bg-blue-600 text-white border-b border-blue-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">Sample Records</h3>
                    <button
                      onClick={() => setSelectedColumnForPanel(null)}
                      className="text-white hover:text-gray-200"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-xs mt-1 text-blue-100">
                    Column: <span className="font-mono">{selectedColumnForPanel}</span>
                  </p>
                  <p className="text-xs mt-0.5 text-blue-100">
                    {selectedDiscrepancy.file1_pattern} vs {selectedDiscrepancy.file2_pattern}
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="text-xs font-semibold text-gray-700 mb-3">
                    Showing {selectedDiscrepancy.sample_records.length} sample records
                  </div>
                  <div className="space-y-3">
                    {selectedDiscrepancy.sample_records.map((record, idx) => (
                      <div key={idx} className="border border-gray-300 rounded p-3 bg-gray-50">
                        <div className="text-xs font-semibold text-gray-600 mb-2">Record #{idx + 1}</div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs font-semibold text-blue-700 mb-1">File A</div>
                            <div className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">
                              {record.file1_value}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              Type: {record.file1_type} • Row: {record.file1_row_index}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-purple-700 mb-1">File B</div>
                            <div className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">
                              {record.file2_value}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              Type: {record.file2_type} • Row: {record.file2_row_index}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Overall Issues - WITH TABS FOR FILE A/B */}
      <div className="bg-white border border-gray-300 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900">All Issues</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setIssuesTab('fileA')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                issuesTab === 'fileA'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              File A ({file1_report?.overall_issues.length || 0})
            </button>
            <button
              onClick={() => setIssuesTab('fileB')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                issuesTab === 'fileB'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              File B ({file2_report?.overall_issues.length || 0})
            </button>
          </div>
        </div>
        
        {/* File A Issues Tab */}
        {issuesTab === 'fileA' && (
          <>
            {file1_report && file1_report.overall_issues.length > 0 ? (
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
            ) : (
              <p className="text-sm text-gray-600 text-center py-4">No issues detected in File A</p>
            )}
          </>
        )}
        
        {/* File B Issues Tab */}
        {issuesTab === 'fileB' && (
          <>
            {file2_report && file2_report.overall_issues.length > 0 ? (
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
            ) : (
              <p className="text-sm text-gray-600 text-center py-4">No issues detected in File B</p>
            )}
          </>
        )}
      </div>

      {/* Cross-File Discrepancies - MOVED TO BOTTOM */}
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

      {/* Footer */}
      <div className="text-center text-xs text-gray-500">
        End of Report • Run #{runId}
      </div>
    </div>
  );
}
