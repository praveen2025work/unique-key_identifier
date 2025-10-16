'use client'

import React, { useState, useEffect } from 'react';
import ConfigurationPanel from './ConfigurationPanel';
import ColumnBuilder from './ColumnBuilder';
import LoadingOverlay from './LoadingOverlay';
import { useToast } from '../hooks/useToast';
import { useColumnBuilder } from '../hooks/useColumnBuilder';
import { useApi } from '../contexts/ApiContext';
import type { FormData as FormDataType, FileInfo, Run, ProgressStep } from '../types';
import Toast from './Toast';
import toast from 'react-hot-toast';

interface MainAnalysisProps {
  environment: string;
  onAnalysisStarted?: (runId: number) => void;
}

const MainAnalysis: React.FC<MainAnalysisProps> = ({ environment, onAnalysisStarted }) => {
  const { api } = useApi();
  const { toast: toastState, showToast, hideToast } = useToast();
  const columnBuilder = useColumnBuilder();
  
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState<string[]>([]);
  const [columnsLoaded, setColumnsLoaded] = useState(false);
  const [columnsLoading, setColumnsLoading] = useState(false);
  const [fileInfo, setFileInfo] = useState<FileInfo>({ rowsA: 0, rowsB: 0, columns: [] });
  const [runs, setRuns] = useState<Run[]>([]);
  
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([
    { name: 'Reading CSV files', status: 'pending' },
    { name: 'Validating columns', status: 'pending' },
    { name: 'Analyzing combinations', status: 'pending' },
    { name: 'Calculating scores', status: 'pending' },
    { name: 'Storing results', status: 'pending' }
  ]);

  // Load previous runs on mount
  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    try {
      const response = await api.get('/api/runs');
      setRuns(response.data);
    } catch (error) {
      console.error('Failed to load runs:', error);
    }
  };

  const loadColumns = async (fileA: string, fileB: string, workingDirectory: string) => {
    if (!fileA || !fileB) {
      toast.error('Please enter both file names');
      return;
    }

    setColumnsLoading(true);
    setColumnsLoaded(false);
    toast.loading('Loading file columns...', { id: 'load-columns' });

    try {
      const params = new URLSearchParams({
        file_a: fileA,
        file_b: fileB,
      });
      
      if (workingDirectory) {
        params.append('working_directory', workingDirectory);
      }

      const response = await api.get(`/api/preview-columns?${params.toString()}`);
      const data = response.data;

      setColumnsLoading(false);

      if (data.error) {
        toast.error(data.error, { id: 'load-columns' });
        setColumnsLoaded(false);
        return;
      }

      setColumns(data.columns);
      setFileInfo({
        rowsA: data.file_a_rows,
        rowsB: data.file_b_rows,
        columns: data.columns,
        fileASize: data.file_a_size_mb ? `${data.file_a_size_mb}MB` : undefined,
        fileBSize: data.file_b_size_mb ? `${data.file_b_size_mb}MB` : undefined,
        warnings: data.warnings,
        estimatedTime: data.estimated_time,
      });
      setColumnsLoaded(true);

      // Show success message
      toast.success(
        `Loaded ${data.column_count} columns | ${data.file_a_rows.toLocaleString()} & ${data.file_b_rows.toLocaleString()} rows`,
        { id: 'load-columns', duration: 3000 }
      );

      // Show warnings if any
      if (data.warnings && data.warnings.length > 0) {
        setTimeout(() => {
          data.warnings.forEach((warning: string) => {
            toast(warning, { icon: '⚠️', duration: 5000 });
          });
        }, 500);
      }

    } catch (error: any) {
      setColumnsLoading(false);
      toast.error(error.message || 'Failed to load columns', { id: 'load-columns' });
      setColumnsLoaded(false);
    }
  };

  const cloneRun = async (runId: string) => {
    try {
      toast.loading(`Loading settings from Run #${runId}...`, { id: 'clone-run' });
      
      const response = await api.get(`/api/clone/${runId}`);
      const data = response.data;
      
      if (data.error) {
        toast.error(data.error, { id: 'clone-run' });
        return;
      }
      
      // Load cloned data into column builder
      columnBuilder.loadState({
        includedCombinations: data.expected_combinations ? 
          data.expected_combinations.split('
').filter((line: string) => line.trim()) : [],
        excludedCombinations: data.excluded_combinations ? 
          data.excluded_combinations.split('
').filter((line: string) => line.trim()) : [],
      });
      
      toast.success(`Settings cloned from Run #${runId}!`, { id: 'clone-run' });
      
      return data;
    } catch (error: any) {
      toast.error(error.message || 'Failed to clone run', { id: 'clone-run' });
    }
  };

  const submitAnalysis = async (formData: FormDataType) => {
    if (!columnsLoaded) {
      toast.error('Please load columns first before analyzing');
      return;
    }

    setLoading(true);
    animateProgressSteps();
    toast.loading('Starting analysis...', { id: 'analysis' });

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file_a', formData.fileA);
      formDataToSend.append('file_b', formData.fileB);
      formDataToSend.append('num_columns', formData.numColumns.toString());
      formDataToSend.append('max_rows', (formData.maxRows || 0).toString());
      formDataToSend.append('expected_combinations', columnBuilder.includedCombinations.join('
'));
      formDataToSend.append('excluded_combinations', columnBuilder.excludedCombinations.join('
'));
      formDataToSend.append('working_directory', formData.workingDirectory || '');
      formDataToSend.append('data_quality_check', formData.dataQualityCheck.toString());
      formDataToSend.append('environment', environment);

      const response = await api.post('/compare', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data;

      if (data.run_id) {
        toast.success(`Analysis started! Run ID: ${data.run_id}`, { 
          id: 'analysis',
          duration: 5000 
        });
        // Call callback to trigger progress tracker
        if (onAnalysisStarted) {
          onAnalysisStarted(data.run_id);
        }
        // Reload runs to show the new one
        await loadRuns();
      } else if (data.error) {
        toast.error(data.error, { id: 'analysis' });
      } else {
        toast.error('Unexpected error occurred', { id: 'analysis' });
      }
    } catch (error: any) {
      toast.error(error.message || 'Analysis failed', { id: 'analysis' });
    } finally {
      setLoading(false);
      // Reset progress steps
      setProgressSteps(progressSteps.map(step => ({ ...step, status: 'pending' })));
    }
  };

  const animateProgressSteps = () => {
    const delays = [100, 800, 1500, 2500, 3500];
    const newSteps = [...progressSteps];
    
    delays.forEach((delay, index) => {
      setTimeout(() => {
        if (loading) {
          newSteps[index].status = 'active';
          if (index > 0) {
            newSteps[index - 1].status = 'completed';
          }
          setProgressSteps([...newSteps]);
        }
      }, delay);
    });

    // Complete the last step
    setTimeout(() => {
      if (loading) {
        newSteps[newSteps.length - 1].status = 'completed';
        setProgressSteps([...newSteps]);
      }
    }, delays[delays.length - 1] + 500);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Toast toast={toastState} onClose={hideToast} />
      <LoadingOverlay show={loading} steps={progressSteps} />
      
      {/* Main Content */}
      <div className="flex-1 w-full px-4 py-4 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-4 h-full flex flex-col">
          
          {/* Configuration Panel */}
          <ConfigurationPanel
            onSubmit={submitAnalysis}
            onLoadColumns={loadColumns}
            loading={loading}
            runs={runs}
            onCloneRun={cloneRun}
            numColumns={columnBuilder.includedCombinations.length > 0 ? 1 : 3}
            includedCombinations={columnBuilder.includedCombinations}
            columnsLoaded={columnsLoaded}
          />

          {/* Column Builder */}
          <ColumnBuilder
            columns={columns}
            columnsLoaded={columnsLoaded}
            columnsLoading={columnsLoading}
            fileInfo={fileInfo}
            columnBuilder={columnBuilder}
            onReset={() => {
              columnBuilder.resetAll();
              setColumnsLoaded(false);
              setColumns([]);
              toast.success('Reset complete - all combinations cleared');
            }}
          />
          
        </div>
      </div>
    </div>
  );
};

export default MainAnalysis;
