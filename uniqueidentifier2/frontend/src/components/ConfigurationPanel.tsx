import React from 'react';
import { useForm } from 'react-hook-form';
import { CogIcon } from '@heroicons/react/24/outline';
import { FormData, Run } from '../types';

interface ConfigurationPanelProps {
  onSubmit: (data: FormData) => void;
  onFileChange: (fileA: string, fileB: string, workingDirectory: string) => void;
  loading: boolean;
  runs: Run[];
  onCloneRun: (runId: string) => void;
  numColumns: number;
  includedCombinations: string[];
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  onSubmit,
  onFileChange,
  loading,
  runs,
  onCloneRun,
  numColumns,
  includedCombinations,
}) => {
  const { register, handleSubmit, watch, setValue } = useForm<FormData>({
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

  React.useEffect(() => {
    if (watchedValues.fileA || watchedValues.fileB) {
      onFileChange(watchedValues.fileA, watchedValues.fileB, watchedValues.workingDirectory);
    }
  }, [watchedValues.fileA, watchedValues.fileB, watchedValues.workingDirectory, onFileChange]);

  const handleCloneRun = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const runId = event.target.value;
    if (runId) {
      onCloneRun(runId);
      event.target.value = '';
    }
  };

  const handleViewRun = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const runId = event.target.value;
    if (runId) {
      window.location.href = `/run/${runId}`;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-2 animate-slide-in text-sm flex-shrink-0 section-card">
      <h2 className="text-sm font-bold text-gray-800 mb-1 flex items-center">
        <CogIcon className="w-3 h-3 mr-1 text-primary" />
        Configuration
      </h2>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* All fields in horizontal rows - More compact */}
        <div className="grid grid-cols-12 gap-1.5 mb-1">
          {/* Row 1: Directory, File A, File B */}
          <div className="col-span-3">
            <label className="block text-gray-700 font-semibold mb-0.5 text-xs">📁 Directory</label>
            <input
              {...register('workingDirectory')}
              placeholder="Default folder"
              className="w-full px-2 py-1 text-xs border-2 border-gray-300 rounded-lg focus:border-primary transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          <div className="col-span-3">
            <label className="block text-gray-700 font-semibold mb-0.5 text-xs">📄 File A</label>
            <input
              {...register('fileA', { required: true })}
              placeholder="file_a.csv"
              className="w-full px-2 py-1 text-xs border-2 border-gray-300 rounded-lg focus:border-primary transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          <div className="col-span-3">
            <label className="block text-gray-700 font-semibold mb-0.5 text-xs">📄 File B</label>
            <input
              {...register('fileB', { required: true })}
              placeholder="file_b.csv"
              className="w-full px-2 py-1 text-xs border-2 border-gray-300 rounded-lg focus:border-primary transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          {/* Row 1: Columns, Row Limit, Analyze Button */}
          <div className="col-span-1">
            <label className="block text-gray-700 font-semibold mb-0.5 text-xs">🔢 Cols</label>
            <input
              {...register('numColumns', { 
                required: true, 
                min: 1,
                valueAsNumber: true 
              })}
              type="number"
              min="1"
              readOnly={includedCombinations.length > 0}
              className={`w-full px-2 py-1 text-xs border-2 border-gray-300 rounded-lg focus:border-primary transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                includedCombinations.length > 0 ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            />
          </div>
          
          <div className="col-span-1">
            <label className="block text-gray-700 font-semibold mb-0.5 text-xs">📊 Rows</label>
            <input
              {...register('maxRows', { valueAsNumber: true })}
              type="number"
              min="0"
              placeholder="0"
              className="w-full px-2 py-1 text-xs border-2 border-gray-300 rounded-lg focus:border-primary transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          <div className="col-span-1 flex items-end">
            <button
              type="submit"
              disabled={loading}
              title="Analyze Files"
              className="w-full btn-primary text-white font-semibold py-1 px-2 rounded-lg text-xs shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ⚡ Analyze
            </button>
          </div>
        </div>
        
        {/* Row 2: Quality Check and Previous Analysis - More compact */}
        <div className="grid grid-cols-12 gap-1.5">
          <div className="col-span-2 flex items-center">
            <label className="flex items-center cursor-pointer text-xs">
              <input
                {...register('dataQualityCheck')}
                type="checkbox"
                className="mr-1 h-3 w-3 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="font-semibold text-gray-700">Quality Check</span>
            </label>
          </div>
          
          {runs.length > 0 && (
            <>
              <div className="col-span-5">
                <select
                  onChange={handleViewRun}
                  className="w-full px-2 py-0.5 text-xs border-2 border-gray-300 rounded-lg focus:border-primary transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">📊 View Results...</option>
                  {runs.map((run) => (
                    <option key={run.id} value={run.id}>
                      {run.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="col-span-5">
                <select
                  onChange={handleCloneRun}
                  className="w-full px-2 py-0.5 text-xs border-2 border-green-400 rounded-lg focus:border-green-500 transition-all bg-green-50 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="">🔄 Clone Settings...</option>
                  {runs.map((run) => (
                    <option key={run.id} value={run.id}>
                      {run.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default ConfigurationPanel;