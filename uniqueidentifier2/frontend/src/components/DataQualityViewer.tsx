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
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

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
      <div className="flex flex-col items-center justify-center p-12 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl">
        <div className="relative">
          <div className="animate-spin h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
          <ShieldCheckIcon className="w-8 h-8 text-indigo-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <span className="mt-4 text-lg font-medium text-gray-700">Loading quality report...</span>
        <span className="mt-1 text-sm text-gray-500">Analyzing data quality metrics</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
        <div className="flex justify-center mb-4">
          <div className="bg-white p-4 rounded-full shadow-md">
            <ChartBarIcon className="w-16 h-16 text-gray-400" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-3">No Quality Check Available</h3>
        <p className="text-gray-600 max-w-md mx-auto mb-6">
          Data quality check was not performed for this analysis run.
          Enable it in the configuration to see quality insights.
        </p>
        <div className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg">
          <ShieldCheckIcon className="w-5 h-5 mr-2" />
          <span className="text-sm font-medium">Enable quality check in settings</span>
        </div>
      </div>
    );
  }

  const { summary, file1_report, file2_report, discrepancies } = report;
  
  const statusColors = {
    pass: { 
      bg: 'bg-gradient-to-r from-green-50 to-emerald-50', 
      border: 'border-green-500', 
      text: 'text-green-800', 
      icon: <CheckCircleIcon className="w-8 h-8 text-green-600" />,
      badge: 'bg-green-500'
    },
    minor: { 
      bg: 'bg-gradient-to-r from-blue-50 to-indigo-50', 
      border: 'border-blue-500', 
      text: 'text-blue-800', 
      icon: <ShieldCheckIcon className="w-8 h-8 text-blue-600" />,
      badge: 'bg-blue-500'
    },
    warning: { 
      bg: 'bg-gradient-to-r from-yellow-50 to-amber-50', 
      border: 'border-yellow-500', 
      text: 'text-yellow-800', 
      icon: <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />,
      badge: 'bg-yellow-500'
    },
    critical: { 
      bg: 'bg-gradient-to-r from-red-50 to-rose-50', 
      border: 'border-red-500', 
      text: 'text-red-800', 
      icon: <XCircleIcon className="w-8 h-8 text-red-600" />,
      badge: 'bg-red-500'
    },
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
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-8 space-y-8 animate-fade-in border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b-2 border-gradient-to-r from-indigo-200 to-purple-200">
        <div className="flex items-center">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl mr-4 shadow-lg transform hover:scale-105 transition-transform">
            <ShieldCheckIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Data Quality Report
            </h3>
            <p className="text-sm text-gray-600 mt-1 font-medium">Comprehensive data analysis & validation results</p>
          </div>
        </div>
        <div className={`px-6 py-3 ${colors.badge} rounded-full shadow-lg transform hover:scale-105 transition-transform`}>
          <span className="text-white font-extrabold text-base uppercase tracking-wide">{summary.status}</span>
        </div>
      </div>

      {/* Status Summary */}
      <div className={`${colors.bg} border-2 ${colors.border} p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}>
        <div className="flex items-center mb-8">
          <div className="bg-white/80 p-3 rounded-xl shadow-md mr-4">
            {colors.icon}
          </div>
          <h3 className={`${colors.text} font-extrabold text-3xl`}>
            {summary.status_message}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-2 border-gray-200 hover:shadow-xl hover:border-gray-300 transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="text-gray-700 text-sm font-bold uppercase tracking-wide">Total Issues</div>
              <div className={`w-4 h-4 rounded-full shadow-md ${summary.total_issues === 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            </div>
            <div className="text-5xl font-extrabold text-gray-800 mb-2">{summary.total_issues}</div>
            <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Detected problems</div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-2 border-red-200 hover:shadow-xl hover:border-red-300 transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="text-gray-700 text-sm font-bold uppercase tracking-wide">High Severity</div>
              <div className="bg-red-100 p-2 rounded-lg">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="text-5xl font-extrabold text-red-600 mb-2">{summary.high_severity_count}</div>
            <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Critical issues</div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-2 border-yellow-200 hover:shadow-xl hover:border-yellow-300 transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="text-gray-700 text-sm font-bold uppercase tracking-wide">Medium Severity</div>
              <div className="bg-yellow-100 p-2 rounded-lg">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <div className="text-5xl font-extrabold text-yellow-600 mb-2">{summary.medium_severity_count}</div>
            <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Warning issues</div>
          </div>
        </div>
      </div>

      {/* Cross-file Discrepancies */}
      {discrepancies && discrepancies.length > 0 && (
        <div className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-8 rounded-2xl border-2 border-red-300 shadow-xl animate-fade-in">
          <div className="flex items-center mb-6">
            <div className="bg-gradient-to-br from-red-500 to-orange-600 p-3 rounded-2xl mr-4 shadow-lg transform hover:scale-105 transition-transform">
              <ExclamationTriangleIcon className="w-7 h-7 text-white" />
            </div>
            <h4 className="text-2xl font-extrabold text-gray-900">
              Cross-File Discrepancies
            </h4>
            <span className="ml-4 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-full text-sm font-extrabold shadow-lg transform hover:scale-105 transition-transform">
              {discrepancies.length}
            </span>
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {discrepancies.map((disc, idx) => (
              <div
                key={idx}
                className={`${getSeverityColor(disc.severity)} border-l-4 p-5 rounded-r-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-x-1`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-extrabold text-base uppercase tracking-wide mb-2 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
                      {disc.type.replace(/_/g, ' ')}
                    </div>
                    {disc.column && (
                      <div className="text-sm mt-2 flex items-center">
                        <span className="text-gray-700 font-semibold">Column:</span>
                        <span className="ml-2 px-3 py-1 bg-white rounded-lg font-mono text-sm font-bold shadow-sm">
                          {disc.column}
                        </span>
                      </div>
                    )}
                    <div className="mt-3 text-sm leading-relaxed font-medium">{disc.message}</div>
                  </div>
                  <span className={`ml-4 px-3 py-2 rounded-lg text-xs font-extrabold uppercase shadow-md ${
                    disc.severity === 'high' ? 'bg-red-600 text-white' :
                    disc.severity === 'medium' ? 'bg-yellow-600 text-white' :
                    'bg-blue-600 text-white'
                  }`}>
                    {disc.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File-specific Issues */}
      {[file1_report, file2_report].map((fileReport, index) => {
        if (!fileReport || fileReport.overall_issues.length === 0) return null;
        
        const fileColors = index === 0 ? 'from-blue-50 via-cyan-50 to-blue-50 border-blue-300' : 'from-purple-50 via-pink-50 to-purple-50 border-purple-300';
        const fileIcon = index === 0 ? '📄' : '📋';
        
        return (
          <div key={fileReport.file_name} className={`bg-gradient-to-br ${fileColors} p-8 rounded-2xl border-2 shadow-xl hover:shadow-2xl transition-all duration-300 animate-fade-in`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="text-5xl mr-4 transform hover:scale-110 transition-transform">{fileIcon}</div>
                <div>
                  <h4 className="text-2xl font-extrabold text-gray-900">
                    {fileReport.file_name}
                  </h4>
                  <p className="text-sm text-gray-700 mt-1 font-medium">
                    {fileReport.overall_issues.length} issue{fileReport.overall_issues.length !== 1 ? 's' : ''} detected
                  </p>
                </div>
              </div>
              <div className="px-5 py-3 bg-white rounded-2xl shadow-lg border-2 border-orange-200">
                <span className="text-orange-600 font-extrabold text-2xl">{fileReport.overall_issues.length}</span>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl mb-6 shadow-lg border border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center bg-gradient-to-br from-indigo-50 to-blue-50 p-3 rounded-xl">
                  <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                    <ChartBarIcon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-indigo-600 text-xs font-semibold uppercase">Total Rows</div>
                    <div className="font-extrabold text-gray-900 text-lg">{fileReport.total_rows.toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center bg-gradient-to-br from-purple-50 to-pink-50 p-3 rounded-xl">
                  <div className="bg-purple-100 p-2 rounded-lg mr-3">
                    <ChartBarIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-purple-600 text-xs font-semibold uppercase">Total Columns</div>
                    <div className="font-extrabold text-gray-900 text-lg">{fileReport.total_columns}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {fileReport.overall_issues.map((issue, idx) => (
                <div
                  key={idx}
                  className={`${getSeverityColor(issue.severity)} border-l-4 p-5 rounded-r-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-x-1`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-extrabold text-sm mb-2 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
                        <span className="px-3 py-1 bg-white rounded-lg font-mono text-sm shadow-sm">
                          {issue.column}
                        </span>
                      </div>
                      <div className="text-sm leading-relaxed mt-3 font-medium">{issue.issue}</div>
                    </div>
                    <span className={`ml-4 px-3 py-2 rounded-lg text-xs font-extrabold uppercase shadow-md ${
                      issue.severity === 'high' ? 'bg-red-600 text-white' :
                      issue.severity === 'medium' ? 'bg-yellow-600 text-white' :
                      'bg-blue-600 text-white'
                    }`}>
                      {issue.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Detailed Column Analysis (Expandable) */}
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border-2 border-indigo-300 overflow-hidden shadow-xl hover:shadow-2xl transition-shadow">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center justify-between w-full text-xl font-bold hover:bg-white/60 transition-all p-6 group"
        >
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl mr-4 shadow-lg group-hover:scale-110 transition-transform">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent font-extrabold">
              Detailed Column Analysis
            </span>
          </div>
          {showDetails ? (
            <ChevronUpIcon className="w-7 h-7 text-indigo-600 transition-transform group-hover:-translate-y-1" />
          ) : (
            <ChevronDownIcon className="w-7 h-7 text-indigo-600 transition-transform group-hover:translate-y-1" />
          )}
        </button>

        {showDetails && (
          <div className="p-6 bg-white/60 backdrop-blur space-y-6 animate-fade-in">
            {[file1_report, file2_report].map((fileReport, fileIndex) => {
              if (!fileReport) return null;
              
              const fileGradient = fileIndex === 0 ? 'from-blue-500 to-cyan-500' : 'from-purple-500 to-pink-500';
              
              return (
                <div key={fileReport.file_name} className="space-y-3">
                  <div className={`bg-gradient-to-r ${fileGradient} p-4 rounded-lg shadow-md`}>
                    <h5 className="text-lg font-bold text-white flex items-center">
                      <span className="mr-2">{fileIndex === 0 ? '📄' : '📋'}</span>
                      {fileReport.file_name}
                    </h5>
                    <p className="text-white/80 text-sm mt-1">
                      {Object.keys(fileReport.columns).length} columns analyzed
                    </p>
                  </div>
                  
                  <div className="grid gap-4">
                    {Object.entries(fileReport.columns).map(([colName, colData]) => (
                      <div key={colName} className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-indigo-400 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-4">
                          <div className="font-extrabold text-lg text-gray-900 flex items-center">
                            <span className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mr-3 shadow-md"></span>
                            {colName}
                          </div>
                          <span className="px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 rounded-full text-sm font-extrabold shadow-md">
                            {colData.pattern_type}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                            <div className="text-green-600 text-xs font-medium mb-1">Consistency</div>
                            <div className={`font-bold text-lg ${getConsistencyColor(colData.consistency)}`}>
                              {colData.consistency}%
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                              <div 
                                className={`h-1.5 rounded-full ${getConsistencyColor(colData.consistency).replace('text-', 'bg-')}`}
                                style={{ width: `${colData.consistency}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
                            <div className="text-blue-600 text-xs font-medium mb-1">Null Values</div>
                            <div className="font-bold text-lg text-gray-800">{colData.null_percentage}%</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {colData.non_null_values.toLocaleString()} valid
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-200">
                            <div className="text-purple-600 text-xs font-medium mb-1">Total Values</div>
                            <div className="font-bold text-lg text-gray-800">
                              {colData.non_null_values.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">non-null</div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-3 rounded-lg border border-orange-200">
                            <div className="text-orange-600 text-xs font-medium mb-1">Data Type</div>
                            <div className="font-bold text-sm text-gray-800 truncate">
                              {colData.pattern_type}
                            </div>
                          </div>
                        </div>
                        
                        {colData.issues.length > 0 && (
                          <div className="mt-5 p-4 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-r-2xl shadow-md">
                            <div className="flex items-center mb-3">
                              <div className="bg-red-100 p-2 rounded-lg mr-2">
                                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                              </div>
                              <span className="text-red-900 font-extrabold text-base">Issues Found</span>
                              <span className="ml-2 px-2 py-1 bg-red-600 text-white rounded-full text-xs font-bold">
                                {colData.issues.length}
                              </span>
                            </div>
                            <div className="space-y-2">
                              {colData.issues.map((issue, idx) => (
                                <div key={idx} className="text-sm text-red-800 flex items-start font-medium bg-white/60 p-2 rounded-lg">
                                  <span className="text-red-600 font-bold mr-2">•</span>
                                  <span>{issue}</span>
                                </div>
                              ))}
                            </div>
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
