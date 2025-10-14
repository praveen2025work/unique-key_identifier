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
    <div className="bg-white rounded-xl shadow-lg p-4 animate-slide-in flex-shrink-0">
      <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
        <CogIcon className="w-5 h-5 mr-2 text-primary" />
        Configuration
      </h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* File Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-gray-700 font-semibold mb-1.5 text-sm">
              📁 Working Directory
            </label>
            <input
              {...register('workingDirectory')}
              placeholder="Leave empty for current directory"
              className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:border-primary transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-semibold mb-1.5 text-sm">
              📄 File A <span className="text-red-500">*</span>
            </label>
            <input
              {...register('fileA', { required: true })}
              placeholder="trading_system_a.csv"
              className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:border-primary transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-semibold mb-1.5 text-sm">
              📄 File B <span className="text-red-500">*</span>
            </label>
            <input
              {...register('fileB', { required: true })}
              placeholder="trading_system_b.csv"
              className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:border-primary transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Analysis Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-gray-700 font-semibold mb-1.5 text-sm">
              🔢 Number of Columns
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
              className={`w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:border-primary transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                includedCombinations.length > 0 ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            />
            {includedCombinations.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">Auto-set by combinations</p>
            )}
          </div>
          
          <div>
            <label className="block text-gray-700 font-semibold mb-1.5 text-sm">
              📊 Max Rows (0 = all)
            </label>
            <input
              {...register('maxRows', { valueAsNumber: true })}
              type="number"
              min="0"
              placeholder="0"
              className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:border-primary transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          <div className="flex items-end">
            <label className="flex items-center cursor-pointer">
              <input
                {...register('dataQualityCheck')}
                type="checkbox"
                className="mr-2 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="font-semibold text-gray-700 text-sm">Quality Check</span>
            </label>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleLoadColumns}
              disabled={!watchedValues.fileA || !watchedValues.fileB || columnsLoaded}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg text-sm shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
              <span>{columnsLoaded ? '✓ Loaded' : 'Load Columns'}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading || !columnsLoaded}
            className="flex-1 min-w-[200px] btn-primary text-white font-bold py-3 px-6 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-xl flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>Start Analysis</span>
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
                placeholder="📊 View Previous Results..."
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
                placeholder="🔄 Clone Settings..."
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