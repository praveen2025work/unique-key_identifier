import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ConfigurationPanel from './components/ConfigurationPanel';
import ColumnBuilder from './components/ColumnBuilder';
import Toast from './components/Toast';
import LoadingOverlay from './components/LoadingOverlay';
import { useToast } from './hooks/useToast';
import { useColumnBuilder } from './hooks/useColumnBuilder';
import { apiService } from './services/api';
import { FormData, Run, FileInfo, ProgressStep } from './types';

function App() {
  // State
  const [columns, setColumns] = useState<string[]>([]);
  const [fileInfo, setFileInfo] = useState<FileInfo>({ rowsA: 0, rowsB: 0, columns: [] });
  const [columnsLoaded, setColumnsLoaded] = useState(false);
  const [columnsLoading, setColumnsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [runs, setRuns] = useState<Run[]>([]);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([
    { name: 'Reading CSV files', status: 'pending' },
    { name: 'Validating columns', status: 'pending' },
    { name: 'Analyzing combinations', status: 'pending' },
    { name: 'Calculating scores', status: 'pending' },
    { name: 'Storing results', status: 'pending' }
  ]);

  // Custom hooks
  const { toast, showToast, hideToast } = useToast();
  const columnBuilder = useColumnBuilder();

  // Load previous runs on mount
  useEffect(() => {
    const loadRuns = async () => {
      try {
        const runsData = await apiService.getRuns();
        setRuns(runsData);
      } catch (error) {
        console.error('Failed to load runs:', error);
      }
    };
    loadRuns();
  }, []);

  // Debounced preview function
  const debounceTimer = React.useRef<NodeJS.Timeout>();
  const previewColumns = useCallback(async (fileA: string, fileB: string, workingDirectory: string) => {
    if (!fileA || !fileB) {
      setColumnsLoaded(false);
      setColumnsLoading(false);
      return;
    }

    setColumnsLoading(true);
    setColumnsLoaded(false);
    showToast('info', 'Loading Files...', 'Reading file headers and counting rows...');

    try {
      const data = await apiService.previewColumns(fileA, fileB, workingDirectory);
      
      setColumnsLoading(false);
      
      if (data.error) {
        showToast('error', 'Preview Error', data.error);
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

      // Show success with file size info
      let message = `Found ${data.column_count} columns | ${data.file_a_rows.toLocaleString()} & ${data.file_b_rows.toLocaleString()} rows`;
      if (data.file_a_size_mb) {
        message += ` | ${data.file_a_size_mb}MB & ${data.file_b_size_mb}MB`;
      }
      showToast('success', 'Files Loaded', message);

      // Show warnings if any
      if (data.warnings && data.warnings.length > 0) {
        setTimeout(() => {
          data.warnings!.forEach(warning => {
            showToast('warning', 'Performance Notice', warning);
          });
          if (data.estimated_time) {
            showToast('info', 'Estimated Time', `Expected processing time: ${data.estimated_time}`);
          }
        }, 2000);
      }

    } catch (error) {
      setColumnsLoading(false);
      showToast('error', 'Network Error', error instanceof Error ? error.message : 'Unknown error');
      setColumnsLoaded(false);
    }
  }, [showToast]);

  const handleFileChange = useCallback((fileA: string, fileB: string, workingDirectory: string) => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      previewColumns(fileA, fileB, workingDirectory);
    }, 800);
  }, [previewColumns]);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    animateProgressSteps();

    try {
      const analysisData = {
        file_a: formData.fileA,
        file_b: formData.fileB,
        num_columns: formData.numColumns,
        max_rows: formData.maxRows || 0,
        expected_combinations: columnBuilder.includedCombinations.join('\n'),
        excluded_combinations: columnBuilder.excludedCombinations.join('\n'),
        working_directory: formData.workingDirectory || '',
        data_quality_check: formData.dataQualityCheck,
      };

      const response = await apiService.submitAnalysis(analysisData);

      if (response.run_id) {
        showToast('success', 'Analysis Started', 'Redirecting to workflow page...');
        setTimeout(() => {
          window.location.href = `/workflow/${response.run_id}`;
        }, 1000);
      } else if (response.error) {
        showToast('error', 'Analysis Error', response.error);
        setLoading(false);
      } else {
        showToast('error', 'Unexpected Error', 'Please check the console for details');
        setLoading(false);
      }
    } catch (error) {
      showToast('error', 'Network Error', error instanceof Error ? error.message : 'Unknown error');
      setLoading(false);
    }
  };

  const handleCloneRun = async (runId: string) => {
    try {
      showToast('info', 'Cloning Run...', `Loading settings from Run #${runId}`);
      
      const data = await apiService.cloneRun(runId);
      
      if (data.expected_combinations) {
        const includedCombinations = data.expected_combinations.split('\n').filter(line => line.trim());
        columnBuilder.loadState({ includedCombinations });
      }
      
      if (data.excluded_combinations) {
        const excludedCombinations = data.excluded_combinations.split('\n').filter(line => line.trim());
        columnBuilder.loadState({ excludedCombinations });
      }

      // Trigger column preview if files are provided
      if (data.file_a && data.file_b) {
        await previewColumns(data.file_a, data.file_b, data.working_directory || '');
      }

      showToast('success', 'Settings Cloned!', `Run #${runId} settings loaded. Modify and re-analyze!`);
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      showToast('error', 'Network Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const animateProgressSteps = () => {
    const delays = [100, 800, 1500, 2500, 3500];
    delays.forEach((delay, index) => {
      setTimeout(() => {
        setProgressSteps(prev => prev.map((step, i) => {
          if (i === index) return { ...step, status: 'active' };
          if (i < index) return { ...step, status: 'completed' };
          return step;
        }));
      }, delay);
    });
  };

  return (
    <div className="bg-gradient-to-br from-primary to-secondary min-h-screen">
      <Toast toast={toast} onClose={hideToast} />
      <LoadingOverlay show={loading} steps={progressSteps} />
      
      <div className="h-screen flex flex-col overflow-hidden">
        <Header />
        
        <div className="flex-1 w-full px-2 py-2 overflow-y-auto">
          <div className="space-y-1 h-full flex flex-col">
            <ConfigurationPanel
              onSubmit={handleSubmit}
              onFileChange={handleFileChange}
              loading={loading}
              runs={runs}
              onCloneRun={handleCloneRun}
              numColumns={columnBuilder.includedCombinations.length > 0 ? 1 : 3}
              includedCombinations={columnBuilder.includedCombinations}
            />
            
            <ColumnBuilder
              columns={columns}
              fileInfo={fileInfo}
              columnsLoading={columnsLoading}
              columnsLoaded={columnsLoaded}
              activeBuilder={columnBuilder.activeBuilder}
              includeBuilder={columnBuilder.includeBuilder}
              excludeBuilder={columnBuilder.excludeBuilder}
              includedCombinations={columnBuilder.includedCombinations}
              excludedCombinations={columnBuilder.excludedCombinations}
              onSetActiveBuilder={columnBuilder.setActiveBuilder}
              onAddColumn={columnBuilder.addColumnToActiveBuilder}
              onRemoveFromBuilder={columnBuilder.removeColumnFromBuilder}
              onAddIncludeCombination={() => {
                columnBuilder.addIncludeCombination();
                if (columnBuilder.includeBuilder.length > 0) {
                  showToast('success', 'Combination Added', `Added: ${columnBuilder.includeBuilder.join(',')}`);
                }
              }}
              onAddExcludeCombination={() => {
                columnBuilder.addExcludeCombination();
                if (columnBuilder.excludeBuilder.length > 0) {
                  showToast('success', 'Combination Added', `Excluded: ${columnBuilder.excludeBuilder.join(',')}`);
                }
              }}
              onRemoveCombination={columnBuilder.removeCombination}
              onClearBuilder={columnBuilder.clearBuilder}
              onResetAll={() => {
                columnBuilder.resetAll();
                showToast('info', 'Reset Complete', 'All combinations cleared');
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;