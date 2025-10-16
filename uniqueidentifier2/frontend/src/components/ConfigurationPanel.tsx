'use client'

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CogIcon, MagnifyingGlassIcon, DocumentTextIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import type { FormData as FormDataType, Run } from '../types';
import ModernDropdown from './ui/ModernDropdown';

interface ConfigurationPanelProps {
  onSubmit: (data: FormDataType) => void;
  onLoadColumns: (fileA: string, fileB: string, workingDirectory: string) => void;
  loading: boolean;
  runs: Run[];
  onCloneRun: (runId: string) => Promise<any>;
  numColumns: number;
  includedCombinations: string[];
  columnsLoaded: boolean;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  onSubmit,
  onLoadColumns,
  loading,
  runs,
  onCloneRun,
  numColumns,
  includedCombinations,
  columnsLoaded,
}) => {
  const { register, handleSubmit, watch, setValue } = useForm<FormDataType>({
    defaultValues: {
      fileA: '',
      fileB: '',
      workingDirectory: '',
      numColumns: 3,
      maxRows: 0,
      dataQualityCheck: false,
      useIntelligentDiscovery: true,  // Default to intelligent discovery
    },
  });

  const watchedValues = watch();

  // Update numColumns when includedCombinations change
  useEffect(() => {
    setValue('numColumns', numColumns);
  }, [numColumns, setValue]);

  const handleLoadColumns = () => {
    if (watchedValues.fileA && watchedValues.fileB) {
      onLoadColumns(watchedValues.fileA, watchedValues.fileB, watchedValues.workingDirectory);
    }
  };

  const handleCloneRun = async (runId: string | number | (string | number)[]) => {
    if (runId && typeof runId === 'string') {
      const clonedData = await onCloneRun(runId);
      if (clonedData) {
        setValue('fileA', clonedData.file_a);
        setValue('fileB', clonedData.file_b);
        setValue('numColumns', clonedData.num_columns);
        setValue('maxRows', clonedData.max_rows || 0);
        setValue('workingDirectory', clonedData.working_directory || '');
        setValue('dataQualityCheck', clonedData.data_quality_check || false);
      }
    }
  };

  const handleViewRun = (runId: string | number | (string | number)[]) => {
    if (runId && typeof runId === 'string') {
      alert(`Viewing results for run ${runId} - Results viewer coming soon!`);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl shadow-xl border border-slate-200/60 p-5 animate-slide-in flex-shrink-0">
      <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-md">
          <CogIcon className="w-5 h-5 text-white" />
        </div>
        <span>File Configuration</span>
      </h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* File Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-700 font-bold mb-2 text-sm flex items-center gap-1.5">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Working Directory
            </label>
            <input
              {...register('workingDirectory')}
              placeholder="Optional directory path"
              className="w-full px-4 py-2.5 text-sm border-2 border-slate-200 bg-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all shadow-sm hover:border-slate-300"
            />
          </div>
          
          <div>
            <label className="block text-slate-700 font-bold mb-2 text-sm flex items-center gap-1.5">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Source File A <span className="text-red-500">*</span>
            </label>
            <input
              {...register('fileA', { required: true })}
              placeholder="trading_system_a.csv"
              className="w-full px-4 py-2.5 text-sm border-2 border-slate-200 bg-white rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm hover:border-slate-300"
            />
          </div>
          
          <div>
            <label className="block text-slate-700 font-bold mb-2 text-sm flex items-center gap-1.5">
              <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Source File B <span className="text-red-500">*</span>
            </label>
            <input
              {...register('fileB', { required: true })}
              placeholder="trading_system_b.csv"
              className="w-full px-4 py-2.5 text-sm border-2 border-slate-200 bg-white rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all shadow-sm hover:border-slate-300"
            />
          </div>
        </div>

        {/* Analysis Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-slate-700 font-bold mb-2 text-sm flex items-center gap-1.5">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              Number of Columns
            </label>
            <input
              {...register('numColumns', { 
                required: true, 
                min: 1,
                valueAsNumber: true 
              })}
              type="number"
              min="1"
              readOnly={includedCombinations.length > 0}
              className={`w-full px-4 py-2.5 text-sm border-2 border-slate-200 bg-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all shadow-sm ${
                includedCombinations.length > 0 ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'hover:border-slate-300'
              }`}
            />
            {includedCombinations.length > 0 && (
              <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Auto-set by combinations
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-slate-700 font-bold mb-2 text-sm flex items-center gap-1.5">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Max Rows
            </label>
            <input
              {...register('maxRows', { valueAsNumber: true })}
              type="number"
              min="0"
              placeholder="0 (all rows)"
              className="w-full px-4 py-2.5 text-sm border-2 border-slate-200 bg-white rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all shadow-sm hover:border-slate-300"
            />
          </div>
          
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer px-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg hover:border-emerald-500 transition-all group">
              <input
                {...register('dataQualityCheck')}
                type="checkbox"
                className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 transition-all"
              />
              <span className="font-bold text-slate-700 text-sm group-hover:text-emerald-600 transition-colors">Quality Check</span>
            </label>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleLoadColumns}
              disabled={!watchedValues.fileA || !watchedValues.fileB || columnsLoaded}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-lg text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
            >
              {columnsLoaded ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Loaded</span>
                </>
              ) : (
                <>
                  <MagnifyingGlassIcon className="w-4 h-4" />
                  <span>Load Columns</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Intelligent Discovery Toggle */}
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 rounded-xl border-2 border-indigo-200 shadow-sm">
          <label className="flex items-center cursor-pointer flex-1 gap-4">
            <div className="relative inline-block w-14 h-7 flex-shrink-0">
              <input
                {...register('useIntelligentDiscovery')}
                type="checkbox"
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-md peer-checked:bg-gradient-to-r peer-checked:from-indigo-500 peer-checked:to-blue-600"></div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                </svg>
                <span className="font-bold text-slate-800 text-sm">Intelligent Key Discovery</span>
                <span className="px-2.5 py-0.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs rounded-full font-bold shadow-sm">RECOMMENDED</span>
              </div>
              <p className="text-xs text-slate-700 font-medium">
                {watchedValues.useIntelligentDiscovery 
                  ? '✓ Auto-discovers optimal keys, prevents combinatorial explosion with 300+ columns' 
                  : '⚠️ Manual mode only - may fail with large column sets'}
              </p>
            </div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading || !columnsLoaded}
            className="flex-1 min-w-[200px] bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-slate-300 disabled:to-slate-400 text-white font-bold py-3.5 px-6 rounded-xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-2xl hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="text-base">Analyzing...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-base">Start Analysis</span>
              </>
            )}
          </button>

          {runs.length > 0 && (
            <>
              <ModernDropdown
                options={runs.map(run => ({ 
                  value: run.id, 
                  label: run.label,
                  icon: <ChartBarIcon className="w-4 h-4" />
                }))}
                onChange={handleViewRun}
                placeholder="View Previous Results"
                size="sm"
                searchable={true}
                clearable={true}
                className="min-w-[200px]"
              />
              
              <ModernDropdown
                options={runs.map(run => ({ 
                  value: run.id, 
                  label: run.label,
                  icon: <DocumentTextIcon className="w-4 h-4" />
                }))}
                onChange={handleCloneRun}
                placeholder="Clone Settings"
                size="sm"
                variant="success"
                searchable={true}
                clearable={true}
                className="min-w-[200px]"
              />
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default ConfigurationPanel;
