import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import ModernDropdown from './ui/ModernDropdown';
import ChunkedFileListViewer from './ChunkedFileListViewer';

interface FileInfo {
  columns: string[];
  column_count: number;
  file_a_rows: number;
  file_b_rows: number;
  file_a_size_mb: number;
  file_b_size_mb: number;
  warnings: string[];
  estimated_time: string;
}

interface AnalysisResult {
  columns: string;
  total_rows: number;
  unique_rows: number;
  duplicate_rows: number;
  duplicate_count: number;
  uniqueness_score: number;
  is_unique_key: boolean;
}

interface RunDetails {
  run_id: number;
  timestamp: string;
  file_a: string;
  file_b: string;
  num_columns: number;
  file_a_rows: number;
  file_b_rows: number;
  results_a: AnalysisResult[];
  results_b: AnalysisResult[];
  summary: {
    total_combinations: number;
    unique_keys_a: number;
    unique_keys_b: number;
    best_score_a: number;
    best_score_b: number;
  };
}

interface Run {
  id: number;
  label: string;
  timestamp: string;
  file_a: string;
  file_b: string;
  num_columns: number;
  status: string;
}

interface FileComparisonAppProps {
  onAnalysisStarted?: (runId: number) => void;
  initialRunId?: number;
}

export default function FileComparisonApp({ onAnalysisStarted, initialRunId }: FileComparisonAppProps) {
  const [apiEndpoint, setApiEndpoint] = useState(() => localStorage.getItem('apiEndpoint') || 'http://localhost:8000');
  const [showSettings, setShowSettings] = useState(false);
  const [tempEndpoint, setTempEndpoint] = useState(apiEndpoint);
  const [backendHealthy, setBackendHealthy] = useState(false);
  
  const [fileA, setFileA] = useState('');
  const [fileB, setFileB] = useState('');
  const [workingDir, setWorkingDir] = useState('');
  const [numColumns, setNumColumns] = useState(2);
  const [maxRows, setMaxRows] = useState(0);
  const [dataQualityCheck, setDataQualityCheck] = useState(false);
  const [generateComparisons, setGenerateComparisons] = useState(true);
  
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [includedCombinations, setIncludedCombinations] = useState<string[]>([]);
  const [excludedCombinations, setExcludedCombinations] = useState<string[]>([]);
  const [builderMode, setBuilderMode] = useState<'include' | 'exclude'>('include');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [columnsLoaded, setColumnsLoaded] = useState(false);
  const [loadingColumns, setLoadingColumns] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<number | null>(null);
  const [results, setResults] = useState<RunDetails | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [comparisonView, setComparisonView] = useState<'sidebyside' | 'matched' | 'only_a' | 'only_b' | 'neither'>('sidebyside');
  const [submitting, setSubmitting] = useState(false);
  
  const [previousRuns, setPreviousRuns] = useState<Run[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);

  // New state for enhanced features
  const [resultsTab, setResultsTab] = useState<'analysis' | 'workflow' | 'fileComparison' | 'fullFileComparison' | 'dataQuality'>('analysis');
  const [selectedComparisonColumn, setSelectedComparisonColumn] = useState<string>('');
  const [comparisonSummary, setComparisonSummary] = useState<any>(null);
  const [comparisonData, setComparisonData] = useState<any>({ matched: [], only_a: [], only_b: [] });
  const [comparisonCategory, setComparisonCategory] = useState<'matched' | 'only_a' | 'only_b'>('matched');
  const [dataQualityReport, setDataQualityReport] = useState<any>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);

  useEffect(() => {
    if (initialRunId) {
      handleViewResults(initialRunId);
    }
  }, [initialRunId]);

  useEffect(() => { checkBackendHealth(); }, [apiEndpoint]);

  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${apiEndpoint}/health`);
      const data = await response.json();
      setBackendHealthy(data.status === 'healthy');
    } catch (error) {
      setBackendHealthy(false);
    }
  };

  const saveEndpoint = () => {
    localStorage.setItem('apiEndpoint', tempEndpoint);
    setApiEndpoint(tempEndpoint);
    setShowSettings(false);
    toast.success('Backend endpoint updated!');
    checkBackendHealth();
    loadPreviousRuns();
  };

  useEffect(() => { if (backendHealthy) loadPreviousRuns(); }, [backendHealthy]);

  const loadPreviousRuns = async () => {
    try {
      const response = await fetch(`${apiEndpoint}/api/runs?limit=50`);
      if (!response.ok) throw new Error('Failed to fetch runs');
      const data = await response.json();
      setPreviousRuns(data);
    } catch (error) {
      console.error('Failed to load runs:', error);
    }
  };

  const handleCloneRun = async (runId: number) => {
    try {
      toast.loading(`Cloning Run #${runId}...`, { id: 'clone' });
      const response = await fetch(`${apiEndpoint}/api/clone/${runId}`);
      if (!response.ok) throw new Error('Failed to clone run');
      const data = await response.json();
      
      const newFileA = data.file_a || '';
      const newFileB = data.file_b || '';
      const newWorkingDir = data.working_directory || '';
      const newNumColumns = data.num_columns || 2;
      const newMaxRows = data.max_rows || 0;
      
      setFileA(newFileA);
      setFileB(newFileB);
      setWorkingDir(newWorkingDir);
      setNumColumns(newNumColumns);
      setMaxRows(newMaxRows);
      
      const includedList: string[] = [];
      const excludedList: string[] = [];
      
      if (data.expected_combinations) {
        data.expected_combinations.split('\n').forEach((line: string) => {
          const trimmed = line.trim();
          if (trimmed) includedList.push(trimmed);
        });
      }
      
      if (data.excluded_combinations) {
        data.excluded_combinations.split('\n').forEach((line: string) => {
          const trimmed = line.trim();
          if (trimmed) excludedList.push(trimmed);
        });
      }
      
      setIncludedCombinations(includedList);
      setExcludedCombinations(excludedList);
      setSelectedRunId(null);
      
      toast.success(`✓ Cloned Run #${runId}`, { id: 'clone' });
      
      setTimeout(async () => {
        try {
          const params = new URLSearchParams({ file_a: newFileA, file_b: newFileB });
          if (newWorkingDir) params.append('working_directory', newWorkingDir);

          const colResponse = await fetch(`${apiEndpoint}/api/preview-columns?${params}`);
          if (!colResponse.ok) {
            const errorData = await colResponse.json().catch(() => ({}));
            toast.error(errorData.error || 'Failed to load columns');
            return;
          }
          
          const colData = await colResponse.json();
          setFileInfo(colData);
          setAvailableColumns(colData.columns);
          setColumnsLoaded(true);
          toast.success(`✓ ${colData.column_count} columns loaded`);
        } catch (error: any) {
          toast.error('Failed to auto-load columns');
        }
      }, 500);
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to clone run', { id: 'clone' });
    }
  };

  const handleViewResults = async (runId: number) => {
    try {
      toast.loading(`Loading Run #${runId}...`, { id: 'load-results' });
      
      // Add timeout to fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${apiEndpoint}/api/run/${runId}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || 'Failed to load results');
      }
      const data = await response.json();
      
      setResults(data);
      setCurrentRunId(runId);
      setShowResults(true);
      setResultsTab('analysis');
      
      // Set default comparison column (but don't load data yet - wait for user to click tab)
      if (data.results_a && data.results_a.length > 0) {
        const bestColumn = data.results_a[0].columns;
        setSelectedComparisonColumn(bestColumn);
      }
      
      // Load workflow status (lightweight)
      try {
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 10000);
        
        const statusResp = await fetch(`${apiEndpoint}/api/status/${runId}`, {
          signal: controller2.signal
        });
        clearTimeout(timeoutId2);
        
        if (statusResp.ok) {
          const statusData = await statusResp.json();
          setJobStatus(statusData);
        }
      } catch (err) {
        console.log('No workflow status available');
      }
      
      // Data quality check is also lightweight (from database), OK to load
      try {
        const controller3 = new AbortController();
        const timeoutId3 = setTimeout(() => controller3.abort(), 10000);
        
        const qualityResp = await fetch(`${apiEndpoint}/api/data-quality/${runId}`, {
          signal: controller3.signal
        });
        clearTimeout(timeoutId3);
        
        if (qualityResp.ok) {
          const qualityData = await qualityResp.json();
          setDataQualityReport(qualityData);
        }
      } catch (err) {
        console.log('No quality data available');
        setDataQualityReport(null);
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success('✓ Results loaded', { id: 'load-results' });
    } catch (error: any) {
      console.error('Error loading results:', error);
      if (error.name === 'AbortError') {
        toast.error('Request timed out. The backend may be processing a large dataset or is not responding.', { id: 'load-results', duration: 5000 });
      } else {
        toast.error(error.message || 'Failed to load results', { id: 'load-results' });
      }
    }
  };

  const loadFileComparisonData = async (columns: string) => {
    if (!currentRunId) {
      toast.error('No run ID available');
      return;
    }
    
    try {
      toast.loading('Loading comparison data...', { id: 'load-comparison' });
      
      // TRY NEW OPTIMIZED ENDPOINT FIRST (instant, from cache!)
      try {
        const summaryResp = await fetch(
          `${apiEndpoint}/api/comparison-v2/${currentRunId}/summary?columns=${encodeURIComponent(columns)}`
        );
        
        if (summaryResp.ok) {
          const summary = await summaryResp.json();
          
          // Check if cache exists
          if (summary.summary) {
            setComparisonSummary(summary.summary);
            
            // Load data from cache (instant!)
            const [matchedResp, onlyAResp, onlyBResp] = await Promise.all([
              fetch(`${apiEndpoint}/api/comparison-v2/${currentRunId}/data?columns=${encodeURIComponent(columns)}&category=matched&offset=0&limit=100`),
              fetch(`${apiEndpoint}/api/comparison-v2/${currentRunId}/data?columns=${encodeURIComponent(columns)}&category=only_a&offset=0&limit=100`),
              fetch(`${apiEndpoint}/api/comparison-v2/${currentRunId}/data?columns=${encodeURIComponent(columns)}&category=only_b&offset=0&limit=100`)
            ]);
            
            const matchedData = matchedResp.ok ? await matchedResp.json() : { records: [] };
            const onlyAData = onlyAResp.ok ? await onlyAResp.json() : { records: [] };
            const onlyBData = onlyBResp.ok ? await onlyBResp.json() : { records: [] };
            
            setComparisonData({
              matched: matchedData.records || [],
              only_a: onlyAData.records || [],
              only_b: onlyBData.records || []
            });
            
            toast.success('✓ Comparison loaded (from cache)', { id: 'load-comparison' });
            return; // Success! Exit early
          }
        }
      } catch (cacheErr) {
        console.log('Cache not available, using message-only mode');
      }
      
      // FALLBACK: Show message that comparison is not available for large files
      toast.error(
        'Comparison data not available for this run. For large files, only counts are shown to prevent memory issues.', 
        { id: 'load-comparison', duration: 5000 }
      );
      
      // Set empty data
      setComparisonSummary(null);
      setComparisonData({ matched: [], only_a: [], only_b: [] });
      
    } catch (err: any) {
      console.error('Failed to load file comparison', err);
      toast.error('Failed to load comparison data', { id: 'load-comparison' });
      setComparisonSummary(null);
      setComparisonData({ matched: [], only_a: [], only_b: [] });
    }
  };

  const loadComparisonCategory = async (category: 'matched' | 'only_a' | 'only_b') => {
    if (!currentRunId || !selectedComparisonColumn) return;
    
    try {
      const dataResp = await fetch(`${apiEndpoint}/api/comparison/${currentRunId}/data?columns=${encodeURIComponent(selectedComparisonColumn)}&category=${category}&offset=0&limit=50`);
      if (dataResp.ok) {
        const data = await dataResp.json();
        setComparisonData((prev: any) => ({ ...prev, [category]: data.records }));
      }
    } catch (err) {
      console.error('Failed to load comparison category', err);
    }
  };

  const handleLoadColumns = async () => {
    if (!fileA || !fileB) {
      toast.error('Please enter both File A and File B paths');
      return;
    }
    setLoadingColumns(true);
    toast.loading('Loading...', { id: 'load-columns' });
    try {
      const params = new URLSearchParams({ file_a: fileA, file_b: fileB });
      if (workingDir) params.append('working_directory', workingDir);
      const response = await fetch(`${apiEndpoint}/api/preview-columns?${params}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to preview columns');
      }
      const data = await response.json();
      setFileInfo(data);
      setAvailableColumns(data.columns);
      setColumnsLoaded(true);
      toast.success(`✓ ${data.column_count} columns`, { id: 'load-columns' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to load columns', { id: 'load-columns' });
      setColumnsLoaded(false);
    } finally {
      setLoadingColumns(false);
    }
  };

  const handleAnalyze = async () => {
    if (!columnsLoaded) {
      toast.error('Please load columns first');
      return;
    }
    setSubmitting(true);
    setShowResults(false);
    toast.loading('Starting...', { id: 'analyze' });
    try {
      const formData = new FormData();
      formData.append('file_a', fileA);
      formData.append('file_b', fileB);
      formData.append('num_columns', numColumns.toString());
      formData.append('max_rows', maxRows.toString());
      formData.append('expected_combinations', includedCombinations.join('\n'));
      formData.append('excluded_combinations', excludedCombinations.join('\n'));
      formData.append('working_directory', workingDir);
      formData.append('data_quality_check', dataQualityCheck.toString());
      formData.append('generate_comparisons', generateComparisons.toString());
      formData.append('environment', 'default');
      const response = await fetch(`${apiEndpoint}/compare`, { method: 'POST', body: formData });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Analysis failed');
      }
      const data = await response.json();
      setCurrentRunId(data.run_id);
      toast.success(`✓ Started Run #${data.run_id}`, { id: 'analyze' });
      loadPreviousRuns();
      
      if (onAnalysisStarted) {
        onAnalysisStarted(data.run_id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Analysis failed', { id: 'analyze' });
      setSubmitting(false);
    }
  };

  const toggleColumnSelection = (column: string) => {
    if (selectedColumns.includes(column)) {
      setSelectedColumns(selectedColumns.filter(c => c !== column));
    } else {
      setSelectedColumns([...selectedColumns, column]);
    }
  };

  const addCombination = () => {
    if (selectedColumns.length === 0) {
      toast.error('Select at least one column');
      return;
    }
    const combo = selectedColumns.sort().join(',');
    if (builderMode === 'include') {
      if (includedCombinations.includes(combo)) {
        toast.error('Already included');
        return;
      }
      setIncludedCombinations([...includedCombinations, combo]);
      toast.success(`✓ Included`);
    } else {
      if (excludedCombinations.includes(combo)) {
        toast.error('Already excluded');
        return;
      }
      setExcludedCombinations([...excludedCombinations, combo]);
      toast.success(`✗ Excluded`);
    }
    setSelectedColumns([]);
  };

  const removeCombination = (combo: string, type: 'include' | 'exclude') => {
    if (type === 'include') {
      setIncludedCombinations(includedCombinations.filter(c => c !== combo));
    } else {
      setExcludedCombinations(excludedCombinations.filter(c => c !== combo));
    }
  };

  const downloadCSV = () => currentRunId && window.open(`${apiEndpoint}/api/download/${currentRunId}/csv`, '_blank');
  const downloadExcel = () => currentRunId && window.open(`${apiEndpoint}/api/download/${currentRunId}/excel`, '_blank');

  const backToDashboard = () => {
    setShowResults(false);
    setResults(null);
    setCurrentRunId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getComparisonData = () => {
    if (!results) return { matched: [], onlyA: [], onlyB: [], neither: [] };
    
    const allCombos = new Set([...results.results_a.map(r => r.columns), ...results.results_b.map(r => r.columns)]);
    const matched: string[] = [];
    const onlyA: string[] = [];
    const onlyB: string[] = [];
    const neither: string[] = [];
    
    allCombos.forEach(combo => {
      const resultA = results.results_a.find(r => r.columns === combo);
      const resultB = results.results_b.find(r => r.columns === combo);
      
      const isUniqueA = resultA?.is_unique_key || false;
      const isUniqueB = resultB?.is_unique_key || false;
      
      if (isUniqueA && isUniqueB) {
        matched.push(combo);
      } else if (isUniqueA && !isUniqueB) {
        onlyA.push(combo);
      } else if (!isUniqueA && isUniqueB) {
        onlyB.push(combo);
      } else {
        neither.push(combo);
      }
    });
    
    return { matched, onlyA, onlyB, neither };
  };

  const keyComparisonData = getComparisonData();

  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { fontSize: '13px' } }} />
      
      {/* Fixed Header - Compact */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 shadow-md border-b border-slate-600">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-7 h-7 text-[#337ab7]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.65 10C11.7 7.31 8.9 5.5 5.77 6.12c-2.29.46-4.15 2.29-4.63 4.58C.32 14.57 3.26 18 7 18c2.61 0 4.83-1.67 5.65-4H17v2c0 1.1.9 2 2 2s2-.9 2-2v-2c1.1 0 2-.9 2-2s-.9-2-2-2h-8.35zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            </svg>
            <div>
              <h1 className="text-sm font-semibold text-white">Unique Key Identifier</h1>
              <p className="text-xs text-slate-300">Enterprise Edition v2.0</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1.5 px-2 py-1 rounded ${backendHealthy ? 'bg-green-900/40' : 'bg-red-900/40'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${backendHealthy ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className={`text-xs font-medium ${backendHealthy ? 'text-green-300' : 'text-red-300'}`}>
                {backendHealthy ? 'Online' : 'Offline'}
              </span>
            </div>
            <button onClick={() => setShowSettings(true)} className="p-1.5 hover:bg-slate-600 rounded transition-colors">
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Backend Endpoint</label>
                <input type="text" value={tempEndpoint} onChange={(e) => setTempEndpoint(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#337ab7] focus:border-[#337ab7]" />
              </div>
              <div className="flex space-x-2">
                <button onClick={saveEndpoint} className="flex-1 px-4 py-2 bg-[#337ab7] text-white text-sm font-medium rounded hover:bg-[#286090] transition-colors">Save</button>
                <button onClick={() => setShowSettings(false)} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="min-h-screen bg-slate-50">
        
        {/* Dashboard View */}
        {!showResults && (
          <div className="h-screen flex flex-col">
            
            {/* Top Configuration Card - Multi-row, 18% */}
            <div className="px-4 pt-3 pb-2" style={{ height: '18%', minHeight: '140px' }}>
              <div className="h-full bg-white rounded-lg shadow border border-slate-200 p-3 flex flex-col justify-between">
                
                {/* Row 1: File paths */}
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">📁 Working Directory</label>
                    <input type="text" value={workingDir} onChange={(e) => setWorkingDir(e.target.value)}
                      className="w-full h-[30px] px-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#337ab7] focus:border-transparent"
                      placeholder="/path/to/files (optional)" />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">📄 File A</label>
                    <input type="text" value={fileA} onChange={(e) => setFileA(e.target.value)}
                      className="w-full h-[30px] px-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#337ab7] focus:border-transparent"
                      placeholder="file_a.csv" />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">📄 File B</label>
                    <input type="text" value={fileB} onChange={(e) => setFileB(e.target.value)}
                      className="w-full h-[30px] px-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#337ab7] focus:border-transparent"
                      placeholder="file_b.csv" />
                  </div>
                  <div className="col-span-3">
                    <ModernDropdown
                      label="📋 Recent Runs"
                      value={selectedRunId || ''}
                      onChange={(value) => setSelectedRunId(value ? parseInt(value as string) : null)}
                      options={previousRuns.map(run => ({
                        value: run.id,
                        label: `#${run.id} • ${run.timestamp.slice(0, 16)}`,
                        badge: run.status
                      }))}
                      placeholder="Select run..."
                      size="sm"
                      searchable={true}
                      clearable={true}
                    />
                  </div>
                </div>

                {/* Row 2: Settings + Load Columns Button */}
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">📊 Columns</label>
                    <div className="relative">
                      <select value={numColumns} onChange={(e) => setNumColumns(parseInt(e.target.value))}
                        className="w-full h-[30px] px-2 pr-6 text-xs border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#337ab7] focus:border-transparent bg-white appearance-none cursor-pointer transition-all shadow-sm hover:shadow-md font-medium">
                        {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                      <svg className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">📝 Max Rows</label>
                    <input type="number" value={maxRows} onChange={(e) => setMaxRows(parseInt(e.target.value) || 0)}
                      className="w-full h-[30px] px-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#337ab7] focus:border-transparent" 
                      placeholder="0 (all)" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">✅ Quality Check</label>
                    <label className="flex items-center h-[30px] cursor-pointer bg-[#337ab7]/10 px-3 py-1.5 rounded border border-[#337ab7]/30 hover:bg-[#337ab7]/20 transition-colors">
                      <input type="checkbox" checked={dataQualityCheck} onChange={(e) => setDataQualityCheck(e.target.checked)} 
                        className="w-4 h-4 text-[#337ab7] border-gray-300 rounded focus:ring-[#337ab7] mr-2" />
                      <span className="text-xs font-semibold text-gray-700">Enable</span>
                    </label>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">📊 Comparisons</label>
                    <label className="flex items-center h-[30px] cursor-pointer bg-green-50 px-3 py-1.5 rounded border border-green-300 hover:bg-green-100 transition-colors">
                      <input type="checkbox" checked={generateComparisons} onChange={(e) => setGenerateComparisons(e.target.checked)} 
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 mr-2" />
                      <span className="text-xs font-semibold text-gray-700">Enable</span>
                    </label>
                  </div>
                  <div className="col-span-2">
                    <button onClick={handleLoadColumns} disabled={loadingColumns || !backendHealthy}
                      className="w-full h-[30px] bg-[#337ab7] text-white text-xs font-medium rounded hover:bg-[#286090] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>{columnsLoaded ? '✓ Loaded' : 'Load'}</span>
                    </button>
                  </div>
                  <div className="col-span-4 flex items-end justify-end space-x-2">
                    {selectedRunId && (
                      <>
                        <button onClick={() => handleViewResults(selectedRunId)}
                          className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 flex items-center space-x-1 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>View</span>
                        </button>
                        <button onClick={() => handleCloneRun(selectedRunId)}
                          className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded hover:bg-purple-700 flex items-center space-x-1 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Clone</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Row 3: File Info (only show when columns loaded) */}
                {fileInfo && columnsLoaded && (
                  <div className="flex items-center justify-end space-x-4 text-xs text-gray-600 px-2">
                    <span className="font-semibold text-[#337ab7]">{fileInfo.column_count} cols</span>
                    <span>A: {fileInfo.file_a_rows.toLocaleString()} rows</span>
                    <span>B: {fileInfo.file_b_rows.toLocaleString()} rows</span>
                    <span className="text-gray-500">~{fileInfo.estimated_time}</span>
                  </div>
                )}

              </div>
            </div>

            {/* Column Builder Section - 82% */}
            {columnsLoaded && (
              <div className="flex-1 px-4 pb-3 overflow-hidden">
                <div className="h-full bg-white rounded-lg shadow border border-slate-200 overflow-hidden flex flex-col">
                  
                  {/* Header with Analyze Button */}
                  <div className="px-4 py-2 bg-slate-700 flex items-center justify-between border-b border-slate-600">
                    <div className="text-white">
                      <h2 className="text-sm font-semibold">Column Combination Builder</h2>
                      <p className="text-xs text-slate-300">
                        {includedCombinations.length} included • {excludedCombinations.length} excluded
                      </p>
                    </div>
                    <button onClick={handleAnalyze} disabled={submitting || !backendHealthy}
                      className="px-5 py-2 bg-[#337ab7] text-white text-sm font-semibold rounded hover:bg-[#286090] disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>{submitting ? 'Starting...' : 'Analyze Now'}</span>
                    </button>
                  </div>

                  {/* Main Builder Area */}
                  <div className="flex-1 flex overflow-hidden">
                    
                    {/* Left Panel - 30% */}
                    <div className="w-[30%] border-r border-slate-200 flex flex-col">
                      
                      {/* Toggle */}
                      <div className="p-2 bg-slate-50 border-b border-slate-200">
                        <div className="grid grid-cols-2 gap-1.5">
                          <button onClick={() => { setBuilderMode('include'); setSelectedColumns([]); }}
                            className={`px-2 py-1.5 rounded text-xs font-semibold transition-all ${
                              builderMode === 'include' ? 'bg-green-600 text-white shadow' : 'bg-white border border-gray-300 text-gray-700'
                            }`}>
                            ✓ Include
                          </button>
                          <button onClick={() => { setBuilderMode('exclude'); setSelectedColumns([]); }}
                            className={`px-2 py-1.5 rounded text-xs font-semibold transition-all ${
                              builderMode === 'exclude' ? 'bg-red-600 text-white shadow' : 'bg-white border border-gray-300 text-gray-700'
                            }`}>
                            ✗ Exclude
                          </button>
                        </div>
                        <div className={`mt-1.5 text-xs p-1.5 rounded ${
                          builderMode === 'include' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                        }`}>
                          {builderMode === 'include' ? 'Select to include' : 'Select to exclude'}
                        </div>
                      </div>

                      {/* Column List */}
                      <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {availableColumns.map(col => (
                          <button key={col} onClick={() => toggleColumnSelection(col)}
                            className={`w-full px-2 py-1.5 rounded text-left text-xs font-medium transition-all ${
                              selectedColumns.includes(col)
                                ? builderMode === 'include'
                                  ? 'bg-green-600 text-white'
                                  : 'bg-red-600 text-white'
                                : 'bg-gray-50 text-gray-800 hover:bg-gray-100 border border-gray-200'
                            }`}>
                            {col}
                          </button>
                        ))}
                      </div>

                      {/* Add Button */}
                      {selectedColumns.length > 0 && (
                        <div className="p-2 bg-slate-50 border-t border-slate-200 space-y-1.5">
                          <button onClick={addCombination}
                            className={`w-full px-3 py-2 rounded text-xs font-semibold text-white ${
                              builderMode === 'include' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                            }`}>
                            Add ({selectedColumns.length})
                          </button>
                          <div className="text-xs text-gray-600 font-mono bg-white p-1.5 rounded border border-gray-200 truncate">
                            {selectedColumns.join(', ')}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Panel - 70% */}
                    <div className="flex-1 p-3 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-3 h-full">
                        
                        {/* Included */}
                        <div className="flex flex-col">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-semibold text-green-800 flex items-center">
                              <span className="w-5 h-5 bg-green-600 text-white rounded flex items-center justify-center mr-1.5 text-xs">✓</span>
                              Included
                            </h3>
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-semibold">{includedCombinations.length}</span>
                          </div>
                          <div className="flex-1 overflow-y-auto space-y-1 p-2 bg-green-50 rounded border border-green-200">
                            {includedCombinations.length === 0 ? (
                              <div className="text-center py-8 text-gray-400 text-xs">
                                <div className="text-2xl mb-1">📝</div>
                                <p>No included combinations</p>
                              </div>
                            ) : (
                              includedCombinations.map((combo, i) => (
                                <div key={i} className="flex items-center justify-between p-1.5 bg-white rounded border border-green-300 text-xs">
                                  <span className="font-mono text-gray-800 truncate">{combo}</span>
                                  <button onClick={() => removeCombination(combo, 'include')}
                                    className="w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs">×</button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Excluded */}
                        <div className="flex flex-col">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-semibold text-red-800 flex items-center">
                              <span className="w-5 h-5 bg-red-600 text-white rounded flex items-center justify-center mr-1.5 text-xs">✗</span>
                              Excluded
                            </h3>
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-semibold">{excludedCombinations.length}</span>
                          </div>
                          <div className="flex-1 overflow-y-auto space-y-1 p-2 bg-red-50 rounded border border-red-200">
                            {excludedCombinations.length === 0 ? (
                              <div className="text-center py-8 text-gray-400 text-xs">
                                <div className="text-2xl mb-1">🚫</div>
                                <p>No excluded combinations</p>
                              </div>
                            ) : (
                              excludedCombinations.map((combo, i) => (
                                <div key={i} className="flex items-center justify-between p-1.5 bg-white rounded border border-red-300 text-xs">
                                  <span className="font-mono text-gray-800 truncate">{combo}</span>
                                  <button onClick={() => removeCombination(combo, 'exclude')}
                                    className="w-4 h-4 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center text-xs">×</button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!columnsLoaded && (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-6xl mb-3">📁</div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-1">Ready to Analyze</h3>
                  <p className="text-sm">Enter file paths and click Load Columns</p>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Results View - Compact */}
        {showResults && results && (
          <div className="p-4 space-y-3">
            
            {/* Compact Header */}
            <div className="bg-white rounded-lg shadow border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button onClick={backToDashboard}
                    className="px-3 py-1.5 bg-slate-700 text-white text-xs font-medium rounded hover:bg-slate-800 flex items-center space-x-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Dashboard</span>
                  </button>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Analysis Results • Run #{results.run_id}</h2>
                    <p className="text-xs text-gray-500">{results.timestamp}</p>
                  </div>
                  <div className="ml-4 min-w-[250px]">
                    <ModernDropdown
                      value={results.run_id}
                      onChange={(value) => handleViewResults(parseInt(value as string))}
                      options={previousRuns.map(run => ({
                        value: run.id,
                        label: `#${run.id} • ${run.timestamp.slice(0, 16)}`,
                        badge: run.status,
                        description: `${run.file_a?.split('/').pop() || 'N/A'} vs ${run.file_b?.split('/').pop() || 'N/A'}`
                      }))}
                      size="sm"
                      searchable={true}
                      placeholder="📋 Switch Run..."
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3 text-xs">
                    <div><span className="font-semibold text-[#337ab7]">{results.summary.total_combinations}</span> <span className="text-gray-600">total</span></div>
                    <div><span className="font-semibold text-green-700">{results.summary.unique_keys_a}</span> <span className="text-gray-600">A</span></div>
                    <div><span className="font-semibold text-purple-700">{results.summary.unique_keys_b}</span> <span className="text-gray-600">B</span></div>
                    <div><span className="font-semibold text-orange-700">{Math.max(results.summary.best_score_a, results.summary.best_score_b).toFixed(1)}%</span> <span className="text-gray-600">best</span></div>
                  </div>
                  <div className="flex space-x-1.5">
                    <button onClick={downloadCSV} className="px-2.5 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 flex items-center space-x-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>CSV</span>
                    </button>
                    <button onClick={downloadExcel} className="px-2.5 py-1.5 bg-[#337ab7] text-white text-xs font-medium rounded hover:bg-[#286090] flex items-center space-x-1 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Excel</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Tabs */}
            <div className="bg-white rounded-lg shadow border border-slate-200 p-2">
              {/* Main Tabs Row */}
              <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                <button onClick={() => setResultsTab('analysis')}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    resultsTab === 'analysis' ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  📊 Analysis
                </button>
                {jobStatus && (
                  <button onClick={() => setResultsTab('workflow')}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      resultsTab === 'workflow' ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}>
                    ⚙️ Workflow
                  </button>
                )}
                <button onClick={() => { setResultsTab('fileComparison'); if (selectedComparisonColumn) loadFileComparisonData(selectedComparisonColumn); }}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    resultsTab === 'fileComparison' ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  🔄 Column Combination Results
                </button>
                <button onClick={() => setResultsTab('fullFileComparison')}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    resultsTab === 'fullFileComparison' ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  📁 Full File A-B Comparison
                </button>
                {dataQualityReport && (
                  <button onClick={() => setResultsTab('dataQuality')}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      resultsTab === 'dataQuality' ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}>
                    ✅ Data Quality
                  </button>
                )}
              </div>
              
              {/* Sub-tabs for Analysis */}
              {resultsTab === 'analysis' && (
                <div className="flex items-center space-x-1.5 mt-2 pt-2 border-t flex-wrap gap-1">
                {[
                  { key: 'sidebyside', label: 'Side-by-Side', count: null },
                    { key: 'matched', label: 'Matched', count: keyComparisonData.matched.length },
                    { key: 'only_a', label: 'A Only', count: keyComparisonData.onlyA.length },
                    { key: 'only_b', label: 'B Only', count: keyComparisonData.onlyB.length },
                    { key: 'neither', label: 'Neither', count: keyComparisonData.neither.length },
                ].map(view => (
                  <button key={view.key} onClick={() => setComparisonView(view.key as any)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      comparisonView === view.key
                        ? view.key === 'matched' ? 'bg-green-600 text-white' :
                          view.key === 'only_a' ? 'bg-[#337ab7] text-white' :
                          view.key === 'only_b' ? 'bg-purple-600 text-white' :
                          view.key === 'neither' ? 'bg-gray-600 text-white' :
                          'bg-slate-700 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}>
                    {view.label} {view.count !== null && `(${view.count})`}
                  </button>
                ))}
              </div>
              )}
            </div>

            {/* All Tab Content */}
            <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              
              {/* Analysis Tab - Existing Table */}
              {resultsTab === 'analysis' && (
              <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                
                {comparisonView === 'sidebyside' && (
                  <table className="w-full text-xs">
                    <thead className="bg-slate-700 text-white sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold sticky left-0 bg-slate-700 z-10">Combination</th>
                        <th colSpan={3} className="px-3 py-2 text-center font-semibold border-x border-[#337ab7] bg-[#337ab7]">File A</th>
                        <th colSpan={3} className="px-3 py-2 text-center font-semibold bg-purple-700">File B</th>
                      </tr>
                      <tr className="bg-slate-600">
                        <th className="px-3 py-1.5 sticky left-0 bg-slate-600 z-10"></th>
                        <th className="px-2 py-1.5 text-xs border-l border-[#337ab7]">Unique</th>
                        <th className="px-2 py-1.5 text-xs">Dups</th>
                        <th className="px-2 py-1.5 text-xs border-r border-[#337ab7]">Score</th>
                        <th className="px-2 py-1.5 text-xs">Unique</th>
                        <th className="px-2 py-1.5 text-xs">Dups</th>
                        <th className="px-2 py-1.5 text-xs">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Array.from(new Set([...results.results_a.map(r => r.columns), ...results.results_b.map(r => r.columns)])).map((combo, i) => {
                        const resultA = results.results_a.find(r => r.columns === combo);
                        const resultB = results.results_b.find(r => r.columns === combo);
                        return (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-mono text-xs font-medium sticky left-0 bg-white">{combo}</td>
                            <td className={`px-2 py-2 text-center border-l border-[#337ab7]/20 ${resultA?.is_unique_key ? 'bg-green-50 font-semibold text-green-700' : ''}`}>
                              {resultA?.unique_rows.toLocaleString() || '-'}
                            </td>
                            <td className={`px-2 py-2 text-center text-red-600 ${resultA?.is_unique_key ? 'bg-green-50' : ''}`}>
                              {resultA?.duplicate_count.toLocaleString() || '-'}
                            </td>
                            <td className={`px-2 py-2 text-center border-r border-[#337ab7]/20 ${resultA?.is_unique_key ? 'bg-green-50' : ''}`}>
                              {resultA?.uniqueness_score.toFixed(1) || '-'}%
                            </td>
                            <td className={`px-2 py-2 text-center ${resultB?.is_unique_key ? 'bg-purple-50 font-semibold text-purple-700' : ''}`}>
                              {resultB?.unique_rows.toLocaleString() || '-'}
                            </td>
                            <td className={`px-2 py-2 text-center text-red-600 ${resultB?.is_unique_key ? 'bg-purple-50' : ''}`}>
                              {resultB?.duplicate_count.toLocaleString() || '-'}
                            </td>
                            <td className={`px-2 py-2 text-center ${resultB?.is_unique_key ? 'bg-purple-50' : ''}`}>
                              {resultB?.uniqueness_score.toFixed(1) || '-'}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {comparisonView !== 'sidebyside' && (
                  <div className="p-4">
                    <div className="flex flex-wrap gap-1.5">
                        {comparisonView === 'matched' && keyComparisonData.matched.map((combo, i) => (
                        <div key={i} className="px-2 py-1 bg-green-100 border border-green-400 text-green-900 rounded text-xs font-mono">{combo}</div>
                      ))}
                        {comparisonView === 'only_a' && keyComparisonData.onlyA.map((combo, i) => (
                        <div key={i} className="px-2 py-1 bg-[#337ab7]/10 border border-[#337ab7] text-[#337ab7] rounded text-xs font-mono">{combo}</div>
                      ))}
                        {comparisonView === 'only_b' && keyComparisonData.onlyB.map((combo, i) => (
                        <div key={i} className="px-2 py-1 bg-purple-100 border border-purple-400 text-purple-900 rounded text-xs font-mono">{combo}</div>
                      ))}
                        {comparisonView === 'neither' && keyComparisonData.neither.map((combo, i) => (
                        <div key={i} className="px-2 py-1 bg-gray-100 border border-gray-300 text-gray-700 rounded text-xs font-mono">{combo}</div>
                      ))}
                    </div>
                  </div>
                )}

                </div>
              )}
              
              {/* Workflow Tab - NEW */}
              {resultsTab === 'workflow' && jobStatus && (
                <div className="p-3 overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                  <h3 className="text-sm font-bold mb-2">Processing Workflow</h3>
                  
                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold">Overall Progress</span>
                      <span className="font-bold text-[#337ab7]">{jobStatus.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full transition-all ${jobStatus.status === 'error' ? 'bg-red-600' : 'bg-[#337ab7]'}`} style={{ width: `${jobStatus.progress}%` }}></div>
              </div>
            </div>

                  <div className="mb-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                      jobStatus.status === 'completed' ? 'bg-green-100 text-green-800' :
                      jobStatus.status === 'running' ? 'bg-[#337ab7]/10 text-[#337ab7]' :
                      jobStatus.status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {jobStatus.status.toUpperCase()}
                    </span>
          </div>
                  
                  {jobStatus.error && (
                    <div className="bg-red-50 border border-red-200 rounded p-2 mb-2 text-xs text-red-700">{jobStatus.error}</div>
                  )}
                  
                  <div className="space-y-1.5">
                    {jobStatus.stages && jobStatus.stages.map((stage: any, idx: number) => (
                      <div key={idx} className={`flex items-center space-x-2 p-2 rounded border text-xs ${
                        stage.status === 'in_progress' ? 'border-[#337ab7]/30 bg-[#337ab7]/5' :
                        stage.status === 'completed' ? 'border-green-300 bg-green-50' :
                        stage.status === 'error' ? 'border-red-300 bg-red-50' :
                        'border-gray-200 bg-gray-50'
                      }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          stage.status === 'completed' ? 'bg-green-600 text-white' :
                          stage.status === 'in_progress' ? 'bg-[#337ab7] text-white' :
                          stage.status === 'error' ? 'bg-red-600 text-white' :
                          'bg-gray-300 text-gray-600'
                        }`}>
                          {stage.status === 'completed' ? '✓' : stage.status === 'in_progress' ? '⟳' : stage.status === 'error' ? '✗' : idx + 1}
      </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <div className="font-semibold truncate">{stage.name.replace(/_/g, ' ').toUpperCase()}</div>
                            <span className={`px-1.5 py-0.5 rounded text-xs flex-shrink-0 ml-2 ${
                              stage.status === 'completed' ? 'bg-green-200 text-green-800' :
                              stage.status === 'in_progress' ? 'bg-[#337ab7]/20 text-[#337ab7]' :
                              stage.status === 'error' ? 'bg-red-200 text-red-800' :
                              'bg-gray-200 text-gray-600'
                            }`}>
                              {stage.status === 'in_progress' ? 'Running' : stage.status === 'completed' ? 'Done' : stage.status === 'error' ? 'Failed' : 'Pending'}
                            </span>
                          </div>
                          {stage.details && <div className="text-xs text-gray-600 mt-0.5 truncate">{stage.details}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* File Comparison Tab - AUTO-SELECTS BEST KEY */}
              {resultsTab === 'fileComparison' && (() => {
                // Auto-select best unique key (highest score)
                const bestKey = results.results_a.reduce((best, current) => 
                  current.uniqueness_score > (best?.uniqueness_score || 0) ? current : best
                , results.results_a[0]);
                
                const comparisonKey = selectedComparisonColumn || bestKey?.columns || '';
                
                return (
                  <div className="p-3 overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                    {comparisonKey ? (
                      <div className="space-y-2">
                        {/* Compact Key Selector Bar */}
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded border border-slate-300">
                          <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">Matching Key:</span>
                          <div className="flex-shrink" style={{ minWidth: '200px', maxWidth: '300px' }}>
                            <ModernDropdown
                              value={selectedComparisonColumn || bestKey?.columns}
                              onChange={(value) => setSelectedComparisonColumn(value as string)}
                              options={results.results_a.map(r => ({
                                value: r.columns,
                                label: r.columns,
                                badge: r.is_unique_key ? '✓ Unique' : `${r.uniqueness_score.toFixed(1)}%`,
                                description: `${r.unique_rows?.toLocaleString() || 0} unique`
                              }))}
                              size="sm"
                              searchable={true}
                              placeholder="Select key columns..."
                            />
                          </div>
                          <span className="text-xs text-gray-500 italic whitespace-nowrap">
                            (Auto-selected best unique key)
                          </span>
                        </div>
                        
                        {/* Comparison Viewer */}
                        <ChunkedFileListViewer 
                          runId={currentRunId!} 
                          columns={comparisonKey}
                          apiEndpoint={apiEndpoint}
                          onClose={() => setSelectedComparisonColumn('')}
                        />
                      </div>
                    ) : (
                      <div className="text-center p-8 text-gray-500">
                        <div className="text-4xl mb-2">⚠️</div>
                        <p className="text-sm font-semibold">No comparison data available</p>
                        <p className="text-xs">Run an analysis first to see file comparison</p>
                      </div>
                    )}
                  </div>
                );
              })()}
              
              {/* Full File A-B Comparison Tab - Shows ALL data from both files */}
              {resultsTab === 'fullFileComparison' && (() => {
                // Find the combination with the most columns (that's all columns)
                const allColumnsResult = results?.results_a?.reduce((max, current) => {
                  const maxCols = max?.columns?.split(',').length || 0;
                  const currentCols = current?.columns?.split(',').length || 0;
                  return currentCols > maxCols ? current : max;
                }, results.results_a[0]);
                
                const allColumnsKey = allColumnsResult?.columns || '';
                
                return (
                  <div className="p-3 overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                    {allColumnsKey ? (
                      <div className="space-y-1">
                        {/* Compact Info Banner */}
                        <div className="bg-blue-50 border-l-4 border-blue-500 px-3 py-2 rounded-r flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600">📁</span>
                            <p className="text-xs font-semibold text-blue-900">
                              Full File A-B Comparison
                            </p>
                            <span className="text-gray-400">|</span>
                            <p className="text-xs text-blue-700">
                              ALL rows with ALL columns • Key: <span className="font-mono bg-blue-100 px-1 rounded">{allColumnsKey}</span>
                            </p>
                          </div>
                        </div>
                        
                        {/* Full File Comparison Viewer */}
                        <ChunkedFileListViewer 
                          runId={currentRunId!} 
                          columns={allColumnsKey}
                          apiEndpoint={apiEndpoint}
                        />
                      </div>
                    ) : (
                      <div className="text-center p-8 text-gray-500">
                        <div className="text-4xl mb-2">⚠️</div>
                        <p className="text-sm font-semibold">No file data available</p>
                        <p className="text-xs">Run an analysis first to see full file comparison</p>
                      </div>
                    )}
                  </div>
                );
              })()}
              
              {/* Data Quality Tab - NEW - ENHANCED WITH FULL DETAILS */}
              {resultsTab === 'dataQuality' && dataQualityReport && (
                <div className="p-3 overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                  <h3 className="text-sm font-bold mb-2">📋 Data Quality Check - Detailed Report</h3>
                  
                  {/* Status Summary */}
                  <div className={`p-2 rounded border-l-4 mb-2 ${
                    dataQualityReport.summary.status === 'pass' ? 'bg-green-50 border-green-500' :
                    dataQualityReport.summary.status === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                    'bg-red-50 border-red-500'
                  }`}>
                    <h4 className="font-bold text-xs mb-1">{dataQualityReport.summary.status_message}</h4>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="bg-white p-1.5 rounded shadow-sm">
                        <div className="text-xs text-gray-600">Total Issues</div>
                        <div className="text-lg font-bold">{dataQualityReport.summary.total_issues}</div>
                      </div>
                      <div className="bg-white p-1.5 rounded shadow-sm">
                        <div className="text-xs text-gray-600">High Severity</div>
                        <div className="text-lg font-bold text-red-600">{dataQualityReport.summary.high_severity_count}</div>
                      </div>
                      <div className="bg-white p-1.5 rounded shadow-sm">
                        <div className="text-xs text-gray-600">Medium Severity</div>
                        <div className="text-lg font-bold text-yellow-600">{dataQualityReport.summary.medium_severity_count}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Cross-File Discrepancies */}
                  {dataQualityReport.discrepancies && dataQualityReport.discrepancies.length > 0 && (
                    <div className="mb-3">
                      <h4 className="font-bold text-sm mb-2 text-red-700">🚨 Cross-File Issues ({dataQualityReport.discrepancies.length})</h4>
                      <div className="space-y-2 max-h-60 overflow-auto">
                        {dataQualityReport.discrepancies.map((disc: any, i: number) => (
                          <div key={i} className={`p-3 rounded-lg border-l-4 text-xs shadow-sm ${
                            disc.severity === 'high' ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'
                          }`}>
                            <div className="flex items-start justify-between mb-1">
                              <div className="font-bold text-sm">{disc.type.replace(/_/g, ' ').toUpperCase()}</div>
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                disc.severity === 'high' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                              }`}>{disc.severity.toUpperCase()}</span>
                            </div>
                            {disc.column && (
                              <div className="text-gray-700 font-semibold text-xs mb-1">
                                📊 Column: <span className="font-bold text-[#337ab7]">{disc.column}</span>
                              </div>
                            )}
                            <div className="text-gray-700 mt-1 leading-relaxed">{disc.message}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* File-Specific Issues */}
                  {[dataQualityReport.file1_report, dataQualityReport.file2_report].map((fileReport: any) => {
                    if (!fileReport || !fileReport.overall_issues || fileReport.overall_issues.length === 0) return null;
                    
                    return (
                      <div key={fileReport.file_name} className="mb-3">
                        <h4 className="font-bold text-sm mb-2 text-orange-700">
                          ⚠️ {fileReport.file_name} - {fileReport.overall_issues.length} Issues
                        </h4>
                        <div className="bg-gray-50 p-2 rounded mb-2 text-xs">
                          <span className="font-semibold">Rows:</span> {fileReport.total_rows.toLocaleString()} | 
                          <span className="font-semibold ml-2">Columns:</span> {fileReport.total_columns}
                        </div>
                        <div className="space-y-1.5 max-h-60 overflow-auto">
                          {fileReport.overall_issues.map((issue: any, idx: number) => (
                            <div key={idx} className={`p-2 rounded border-l-4 text-xs shadow-sm ${
                              issue.severity === 'high' ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'
                            }`}>
                              <div className="flex items-start justify-between mb-1">
                                <div className="font-semibold text-[#337ab7]">{issue.column}</div>
                                <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                                  issue.severity === 'high' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                                }`}>{issue.severity.toUpperCase()}</span>
                              </div>
                              <div className="text-gray-700">{issue.issue}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {(!dataQualityReport.discrepancies || dataQualityReport.discrepancies.length === 0) && 
                   dataQualityReport.summary.total_issues === 0 && (
                    <div className="text-center p-8 text-green-600">
                      <div className="text-5xl mb-3">✅</div>
                      <p className="text-sm font-bold">Perfect! No quality issues found!</p>
                      <p className="text-xs text-gray-600 mt-1">Both files have consistent data patterns</p>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </>
  );
}
