'use client'

import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import ModernDropdown from './ui/ModernDropdown';
import ChunkedFileListViewer, { Category } from './ChunkedFileListViewer';
import WorkflowView from './WorkflowView';
import DataQualityViewer from './DataQualityViewer';
import AboutDialog from './AboutDialog';
import type { JobStatus } from '../types';

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
  const [apiEndpoint, setApiEndpoint] = useState(() => 
    typeof window !== 'undefined' ? localStorage.getItem('apiEndpoint') || 'http://localhost:8000' : 'http://localhost:8000'
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [tempEndpoint, setTempEndpoint] = useState(apiEndpoint);
  const [backendHealthy, setBackendHealthy] = useState(false);
  
  const [fileA, setFileA] = useState('');
  const [fileB, setFileB] = useState('');
  const [workingDir, setWorkingDir] = useState('');
  const [numColumns, setNumColumns] = useState(2);
  const [maxRows, setMaxRows] = useState(0);
  const [dataQualityCheck, setDataQualityCheck] = useState(false);
  const [generateColumnCombinations, setGenerateColumnCombinations] = useState(true);
  const [generateFileComparison, setGenerateFileComparison] = useState(true);
  const [useIntelligentDiscovery, setUseIntelligentDiscovery] = useState(true);  // NEW: Intelligent discovery toggle
  
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
  const [chunkHeaderData, setChunkHeaderData] = useState<{matched: number, only_a: number, only_b: number, totalChunks: number} | null>(null);
  const [dataQualityReport, setDataQualityReport] = useState<any>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  
  // State for Column Combination Results tab header
  const [comparisonHeaderData, setComparisonHeaderData] = useState<{ matched: number; only_a: number; only_b: number; totalChunks: number }>({ matched: 0, only_a: 0, only_b: 0, totalChunks: 0 });
  const [comparisonActiveCategory, setComparisonActiveCategory] = useState<Category>('matched');

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
      formData.append('generate_column_combinations', generateColumnCombinations.toString());
      formData.append('generate_file_comparison', generateFileComparison.toString());
      formData.append('use_intelligent_discovery', useIntelligentDiscovery.toString());  // NEW
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
      
      {/* Compact Modern Header */}
      <div className="sticky top-0 z-50 glass-card-dark border-b border-white/10 shadow-hard backdrop-blur-xl">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-primary-500 blur-sm opacity-50 rounded-full"></div>
              <svg className="w-6 h-6 text-primary-400 relative" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.65 10C11.7 7.31 8.9 5.5 5.77 6.12c-2.29.46-4.15 2.29-4.63 4.58C.32 14.57 3.26 18 7 18c2.61 0 4.83-1.67 5.65-4H17v2c0 1.1.9 2 2 2s2-.9 2-2v-2c1.1 0 2-.9 2-2s-.9-2-2-2h-8.35zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">Unique Key Identifier</h1>
              <p className="text-[10px] font-medium text-gray-400">Enterprise Edition v2.0</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {backendHealthy ? (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-success-500/20 border border-success-400/30">
                <div className="w-1.5 h-1.5 rounded-full bg-success-400 animate-pulse"></div>
                <span className="text-[10px] font-semibold text-success-300">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-500/20 border border-red-400/30">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                <span className="text-[10px] font-semibold text-red-300">Offline</span>
              </div>
            )}
            <button 
              onClick={() => setShowAbout(true)} 
              className="p-1.5 hover:bg-white/10 rounded-lg transition-all duration-200 group"
              title="About & User Guide"
            >
              <InformationCircleIcon className="w-4 h-4 text-gray-300 group-hover:text-white transition-colors duration-200" />
            </button>
            <button 
              onClick={() => setShowSettings(true)} 
              className="p-1.5 hover:bg-white/10 rounded-lg transition-all duration-200 group"
            >
              <svg className="w-4 h-4 text-gray-300 group-hover:text-white group-hover:rotate-90 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Compact Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
          <div className="card-modern max-w-md w-full mx-4 p-4 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary-100 rounded-lg">
                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-gray-900">Settings</h2>
              </div>
              <button 
                onClick={() => setShowSettings(false)} 
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-all duration-200 group"
              >
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:rotate-90 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Backend Endpoint</label>
                <input 
                  type="text" 
                  value={tempEndpoint} 
                  onChange={(e) => setTempEndpoint(e.target.value)}
                  className="input-modern text-sm"
                  placeholder="http://localhost:8000"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={saveEndpoint} 
                  className="btn-primary flex-1 text-sm"
                >
                  Save Changes
                </button>
                <button 
                  onClick={() => setShowSettings(false)} 
                  className="btn-ghost px-4 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - No extra padding */}
      <div className="min-h-screen bg-slate-50">
        
        {/* Dashboard View */}
        {!showResults && (
          <div className="h-screen flex flex-col">
            
            {/* Modern File Selection Card - 22% */}
            <div className="px-4 pt-3 pb-2" style={{ height: '22%', minHeight: '240px' }}>
              <div className="h-full bg-gradient-to-br from-white to-slate-50 rounded-xl shadow-lg border border-slate-200/60 p-4 flex flex-col gap-3 backdrop-blur-sm overflow-visible">
                
                {/* Row 1: Clean File Inputs with Icons */}
                <div className="grid grid-cols-12 gap-3 items-end flex-shrink-0">
                  {/* Working Directory */}
                  <div className="col-span-3">
                    <div className="px-3 py-2 bg-slate-50/60 rounded-lg border border-slate-200">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      Working Directory
                    </label>
                    <input 
                      type="text" 
                      value={workingDir} 
                      onChange={(e) => setWorkingDir(e.target.value)}
                      className="w-full h-[36px] px-3 text-xs border-2 border-slate-200 bg-white rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
                      placeholder="Optional directory path" 
                    />
                    </div>
                  </div>

                  {/* File A */}
                  <div className="col-span-3">
                    <div className="px-3 py-2 bg-blue-50/40 rounded-lg border border-blue-200">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Source File A
                      <span className="text-red-500 text-sm">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={fileA} 
                      onChange={(e) => setFileA(e.target.value)}
                      className="w-full h-[36px] px-3 text-xs border-2 border-slate-200 bg-white rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      placeholder="file_a.csv" 
                    />
                    </div>
                  </div>

                  {/* File B */}
                  <div className="col-span-3">
                    <div className="px-3 py-2 bg-purple-50/40 rounded-lg border border-purple-200">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Source File B
                      <span className="text-red-500 text-sm">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={fileB} 
                      onChange={(e) => setFileB(e.target.value)}
                      className="w-full h-[36px] px-3 text-xs border-2 border-slate-200 bg-white rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                      placeholder="file_b.csv" 
                    />
                    </div>
                  </div>

                  {/* Recent Runs Dropdown */}
                  <div className="col-span-3">
                    <div className="px-3 py-2 bg-slate-50/60 rounded-lg border border-slate-200">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Recent Runs
                    </label>
                    <ModernDropdown
                      value={selectedRunId || ''}
                      onChange={(value) => setSelectedRunId(value ? parseInt(value as string) : null)}
                      options={previousRuns.map(run => ({
                        value: run.id,
                        label: `Run #${run.id} - ${run.timestamp.slice(0, 16)}`,
                        badge: run.status
                      }))}
                      placeholder="Select previous run..."
                      size="sm"
                      searchable={true}
                      clearable={true}
                    />
                    </div>
                  </div>
                </div>

                {/* Row 2: Settings Bar with Better Spacing */}
                <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
                  {/* Max Rows */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border-2 border-slate-200">
                    <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Max Rows:</label>
                    <input 
                      type="number" 
                      value={maxRows} 
                      onChange={(e) => setMaxRows(parseInt(e.target.value) || 0)}
                      className="w-20 h-[28px] px-2 text-xs border-2 border-slate-200 rounded focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-100 transition-all" 
                      placeholder="0" 
                    />
                  </div>

                  {/* Feature Toggles - Modernized */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border-2 border-slate-200">
                    {/* Quality Check */}
                    <label className="flex items-center gap-1.5 cursor-pointer group" title="Data Quality Check">
                      <input 
                        type="checkbox" 
                        checked={dataQualityCheck} 
                        onChange={(e) => setDataQualityCheck(e.target.checked)} 
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 transition-all" 
                      />
                      <span className="text-xs font-semibold text-slate-700 group-hover:text-emerald-600 transition-colors">Quality</span>
                    </label>

                    <div className="w-px h-4 bg-slate-200"></div>

                    {/* Column Combos */}
                    <label className="flex items-center gap-1.5 cursor-pointer group" title="Generate Column Combinations">
                      <input 
                        type="checkbox" 
                        checked={generateColumnCombinations} 
                        onChange={(e) => setGenerateColumnCombinations(e.target.checked)} 
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-all" 
                      />
                      <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">Combos</span>
                    </label>

                    <div className="w-px h-4 bg-slate-200"></div>

                    {/* File Compare */}
                    <label className="flex items-center gap-1.5 cursor-pointer group" title="File A-B Comparison">
                      <input 
                        type="checkbox" 
                        checked={generateFileComparison} 
                        onChange={(e) => setGenerateFileComparison(e.target.checked)} 
                        className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 transition-all" 
                      />
                      <span className="text-xs font-semibold text-slate-700 group-hover:text-amber-600 transition-colors">Compare</span>
                    </label>

                    <div className="w-px h-4 bg-slate-200"></div>

                    {/* Intelligent Discovery */}
                    <label className="flex items-center gap-1.5 cursor-pointer group" title="Intelligent Key Discovery">
                      <input 
                        type="checkbox" 
                        checked={useIntelligentDiscovery} 
                        onChange={(e) => setUseIntelligentDiscovery(e.target.checked)} 
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 transition-all" 
                      />
                      <span className="text-xs font-bold text-indigo-700 group-hover:text-indigo-800 transition-colors">Smart Keys</span>
                      <span className="px-1.5 py-0.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[9px] rounded-full font-bold shadow-sm">NEW</span>
                    </label>
                  </div>

                  {/* Load Columns Button - Enhanced */}
                  <button 
                    onClick={handleLoadColumns} 
                    disabled={loadingColumns || !backendHealthy}
                    className="h-[36px] px-5 bg-gradient-to-r from-[#337ab7] to-[#2868a0] text-white text-xs font-bold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all whitespace-nowrap shadow-md hover:scale-105"
                  >
                    {loadingColumns ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>{columnsLoaded ? 'Columns Loaded' : 'Load Columns'}</span>
                      </>
                    )}
                  </button>

                  {/* Action Buttons - When Run Selected */}
                  {selectedRunId && (
                    <div className="flex items-center gap-2 ml-auto">
                      <button 
                        onClick={() => handleViewResults(selectedRunId)}
                        className="h-[36px] px-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs font-bold rounded-lg hover:shadow-lg flex items-center gap-2 transition-all whitespace-nowrap shadow-md hover:scale-105"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>View Results</span>
                      </button>
                      <button 
                        onClick={() => handleCloneRun(selectedRunId)}
                        className="h-[36px] px-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white text-xs font-bold rounded-lg hover:shadow-lg flex items-center gap-2 transition-all whitespace-nowrap shadow-md hover:scale-105"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Clone Settings</span>
                      </button>
                    </div>
                  )}
                </div>
                
                {/* File Info Stats - Clean Display */}
                {fileInfo && columnsLoaded && (
                  <div className="flex items-center justify-end gap-4 text-xs px-2 pt-2 flex-shrink-0">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-100 rounded-md shadow-sm">
                      <span className="font-bold text-blue-700">{fileInfo.column_count}</span>
                      <span className="text-blue-600">columns</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-100 rounded-md shadow-sm">
                      <span className="font-bold text-emerald-700">{fileInfo.file_a_rows.toLocaleString()}</span>
                      <span className="text-emerald-600">rows (A)</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-100 rounded-md shadow-sm">
                      <span className="font-bold text-purple-700">{fileInfo.file_b_rows.toLocaleString()}</span>
                      <span className="text-purple-600">rows (B)</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-100 rounded-md shadow-sm">
                      <svg className="w-3 h-3 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-bold text-amber-700">{fileInfo.estimated_time}</span>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Column Builder Section - 78% - MODERN REDESIGN */}
            {columnsLoaded && (
              <div className="flex-1 px-4 pb-3 overflow-hidden">
                <div className="h-full bg-gradient-to-br from-slate-50 to-white rounded-xl shadow-2xl border border-slate-300/50 overflow-hidden flex flex-col backdrop-blur-xl">
                  
                  {/* Modern Header with Glassmorphism */}
                  <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
                    {/* Animated Background Pattern */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]"></div>
                    </div>
                    
                    <div className="relative flex items-center justify-between">
                      <div className="text-white">
                        <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
                          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                          <span>Column Combination Builder</span>
                          <div className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-medium">
                            v2.0
                          </div>
                        </h2>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="font-semibold">{includedCombinations.length}</span>
                            <span className="text-white/80">included</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                            <span className="font-semibold">{excludedCombinations.length}</span>
                            <span className="text-white/80">excluded</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <span className="font-semibold">{availableColumns.length}</span>
                            <span className="text-white/80">columns</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={handleAnalyze} disabled={submitting || !backendHealthy}
                        className="group relative px-8 py-3 bg-white text-indigo-600 text-sm font-bold rounded-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 transition-all duration-300 hover:scale-105 disabled:hover:scale-100 overflow-hidden">
                        {/* Button Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                        
                        <div className="relative flex items-center gap-3">
                          {submitting ? (
                            <>
                              <div className="w-5 h-5 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <span>Start Analysis</span>
                              <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Main Builder Area with Modern Layout */}
                  <div className="flex-1 flex overflow-hidden">
                    
                    {/* Left Panel - Modern Column Selector */}
                    <div className="w-[30%] flex flex-col bg-gradient-to-br from-slate-50 to-slate-100/50">
                      
                      {/* Modern Mode Toggle with Pill Design */}
                      <div className="p-4 border-b border-slate-200/80 bg-white/50 backdrop-blur-sm">
                        <div className="relative bg-slate-200 rounded-2xl p-1 grid grid-cols-2 gap-1">
                          {/* Sliding Background */}
                          <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-gradient-to-br ${builderMode === 'include' ? 'from-emerald-500 to-green-600' : 'from-rose-500 to-red-600'} rounded-xl shadow-lg transition-all duration-300 ease-out ${builderMode === 'include' ? 'left-1' : 'left-[calc(50%+2px)]'}`}></div>
                          
                          <button onClick={() => { setBuilderMode('include'); setSelectedColumns([]); }}
                            className={`relative z-10 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 ${
                              builderMode === 'include' ? 'text-white' : 'text-slate-600 hover:text-slate-800'
                            }`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Include</span>
                          </button>
                          <button onClick={() => { setBuilderMode('exclude'); setSelectedColumns([]); }}
                            className={`relative z-10 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 ${
                              builderMode === 'exclude' ? 'text-white' : 'text-slate-600 hover:text-slate-800'
                            }`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span>Exclude</span>
                          </button>
                        </div>
                        
                        {/* Mode Description with Animation */}
                        <div className={`mt-3 text-xs p-3 rounded-lg transition-all duration-300 ${
                          builderMode === 'include' 
                            ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-800 border border-emerald-200' 
                            : 'bg-gradient-to-r from-rose-50 to-red-50 text-rose-800 border border-rose-200'
                        }`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${builderMode === 'include' ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`}></div>
                            <span className="font-semibold">
                              {builderMode === 'include' ? 'Click columns to include in analysis' : 'Click columns to exclude from analysis'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Modern Column List with Hover Effects */}
                      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-2 flex items-center gap-2">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
                          <span>Available Columns</span>
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
                        </div>
                        {availableColumns.map(col => (
                          <button key={col} onClick={() => toggleColumnSelection(col)}
                            className={`group w-full px-3 py-2 rounded-lg text-left text-xs font-medium transition-all duration-200 ${
                              selectedColumns.includes(col)
                                ? builderMode === 'include'
                                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg scale-105 ring-2 ring-emerald-300'
                                  : 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg scale-105 ring-2 ring-rose-300'
                                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 hover:shadow-md hover:scale-102'
                            }`}>
                            <div className="flex items-center gap-2">
                              {selectedColumns.includes(col) ? (
                                <div className="w-5 h-5 flex items-center justify-center bg-white/20 rounded">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              ) : (
                                <div className={`w-5 h-5 flex items-center justify-center rounded border-2 transition-all ${
                                  builderMode === 'include' 
                                    ? 'border-slate-300 group-hover:border-emerald-400' 
                                    : 'border-slate-300 group-hover:border-rose-400'
                                }`}>
                                  <svg className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                </div>
                              )}
                              <span className="flex-1">{col}</span>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Modern Add Button with Animation */}
                      {selectedColumns.length > 0 && (
                        <div className="p-4 bg-white/50 backdrop-blur-sm border-t border-slate-200/80 space-y-2 animate-in slide-in-from-bottom duration-300">
                          <button onClick={addCombination}
                            className={`group w-full px-4 py-3 rounded-xl text-sm font-bold text-white transition-all duration-300 hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2 ${
                              builderMode === 'include' 
                                ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700' 
                                : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700'
                            }`}>
                            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Add Combination ({selectedColumns.length})</span>
                          </button>
                          <div className="text-xs text-slate-600 font-mono bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Preview:</div>
                            <div className="truncate">{selectedColumns.join(', ')}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Panel - Modern Combination Lists */}
                    <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-br from-white to-slate-50/30">
                      <div className="grid grid-cols-2 gap-4 h-full">
                        
                        {/* Included Combinations - Modern Card */}
                        <div className="flex flex-col bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden">
                          {/* Card Header */}
                          <div className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <h3 className="text-sm font-bold">Included</h3>
                              </div>
                              <div className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold">
                                {includedCombinations.length}
                              </div>
                            </div>
                          </div>
                          
                          {/* Card Content */}
                          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gradient-to-br from-emerald-50/30 to-green-50/30">
                            {includedCombinations.length === 0 ? (
                              <div className="text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-100 flex items-center justify-center">
                                  <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <p className="text-sm font-semibold text-slate-600">No combinations yet</p>
                                <p className="text-xs text-slate-400 mt-1">Select columns and click Add</p>
                              </div>
                            ) : (
                              includedCombinations.map((combo, i) => (
                                <div key={i} className="group relative bg-white hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 rounded-lg border border-emerald-200 hover:border-emerald-400 p-3 transition-all duration-200 hover:shadow-lg hover:scale-102">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Combination {i + 1}</span>
                                      </div>
                                      <div className="font-mono text-xs text-slate-700 break-all leading-relaxed">
                                        {combo}
                                      </div>
                                    </div>
                                    <button onClick={() => removeCombination(combo, 'include')}
                                      className="flex-shrink-0 w-7 h-7 bg-rose-500 hover:bg-rose-600 text-white rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 hover:rotate-90 shadow-md">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Excluded Combinations - Modern Card */}
                        <div className="flex flex-col bg-white rounded-2xl shadow-xl border border-rose-100 overflow-hidden">
                          {/* Card Header */}
                          <div className="px-4 py-3 bg-gradient-to-r from-rose-500 to-red-600 text-white">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </div>
                                <h3 className="text-sm font-bold">Excluded</h3>
                              </div>
                              <div className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold">
                                {excludedCombinations.length}
                              </div>
                            </div>
                          </div>
                          
                          {/* Card Content */}
                          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gradient-to-br from-rose-50/30 to-red-50/30">
                            {excludedCombinations.length === 0 ? (
                              <div className="text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-100 flex items-center justify-center">
                                  <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                  </svg>
                                </div>
                                <p className="text-sm font-semibold text-slate-600">No exclusions yet</p>
                                <p className="text-xs text-slate-400 mt-1">Select columns and click Add</p>
                              </div>
                            ) : (
                              excludedCombinations.map((combo, i) => (
                                <div key={i} className="group relative bg-white hover:bg-gradient-to-r hover:from-rose-50 hover:to-red-50 rounded-lg border border-rose-200 hover:border-rose-400 p-3 transition-all duration-200 hover:shadow-lg hover:scale-102">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                                        <span className="text-[10px] font-bold text-rose-600 uppercase">Exclusion {i + 1}</span>
                                      </div>
                                      <div className="font-mono text-xs text-slate-700 break-all leading-relaxed">
                                        {combo}
                                      </div>
                                    </div>
                                    <button onClick={() => removeCombination(combo, 'exclude')}
                                      className="flex-shrink-0 w-7 h-7 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 hover:rotate-90 shadow-md">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
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

        {/* Compact Results View */}
        {showResults && results && (
          <div className="p-3 space-y-2 animate-fade-in">
            
            {/* Compact Results Header */}
            <div className="glass-card p-3 shadow-soft animate-slide-in" style={{ position: 'relative', zIndex: 10 }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={backToDashboard}
                    className="btn-ghost px-3 py-1.5 text-xs flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="font-semibold">Dashboard</span>
                  </button>
                  <div className="h-6 w-px bg-gray-300"></div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse"></span>
                      Analysis Results
                      <span className="badge-primary text-[10px] px-1.5 py-0.5">Run #{results.run_id}</span>
                    </h2>
                    <p className="text-[10px] font-medium text-gray-500 mt-0.5 flex items-center gap-0.5">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {results.timestamp}
                    </p>
                  </div>
                  <div className="min-w-[220px]" style={{ position: 'relative', zIndex: 1000 }}>
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
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 min-w-[70px]">
                      <span className="text-lg font-bold text-primary-700">{results.summary.total_combinations}</span>
                      <span className="text-[9px] font-semibold text-gray-600 uppercase tracking-wide">Total</span>
                    </div>
                    <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-gradient-to-br from-success-50 to-success-100 border border-success-200 min-w-[70px]">
                      <span className="text-lg font-bold text-success-700">{results.summary.unique_keys_a}</span>
                      <span className="text-[9px] font-semibold text-gray-600 uppercase tracking-wide">File A</span>
                    </div>
                    <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-gradient-to-br from-secondary-50 to-secondary-100 border border-secondary-200 min-w-[70px]">
                      <span className="text-lg font-bold text-secondary-700">{results.summary.unique_keys_b}</span>
                      <span className="text-[9px] font-semibold text-gray-600 uppercase tracking-wide">File B</span>
                    </div>
                    <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 min-w-[70px]">
                      <span className="text-lg font-bold text-amber-700">{Math.max(results.summary.best_score_a, results.summary.best_score_b).toFixed(1)}%</span>
                      <span className="text-[9px] font-semibold text-gray-600 uppercase tracking-wide">Best</span>
                    </div>
                  </div>
                  <div className="h-10 w-px bg-gray-300"></div>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={downloadCSV} 
                      className="btn-success px-3 py-1.5 text-xs flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-semibold">CSV</span>
                    </button>
                    <button 
                      onClick={downloadExcel} 
                      className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-semibold">Excel</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Tabs */}
            <div className="glass-card p-2 shadow-soft" style={{ position: 'relative', zIndex: 1 }}>
              {/* Main Tabs Row */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button 
                  onClick={() => setResultsTab('analysis')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    resultsTab === 'analysis' 
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-medium scale-105' 
                      : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-soft border border-gray-200'
                  }`}
                >
                  📊 Analysis
                </button>
                {jobStatus && (
                  <button 
                    onClick={() => setResultsTab('workflow')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      resultsTab === 'workflow' 
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-medium scale-105' 
                        : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-soft border border-gray-200'
                    }`}
                  >
                    ⚙️ Workflow
                  </button>
                )}
                <button 
                  onClick={() => { setResultsTab('fileComparison'); if (selectedComparisonColumn) loadFileComparisonData(selectedComparisonColumn); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    resultsTab === 'fileComparison' 
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-medium scale-105' 
                      : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-soft border border-gray-200'
                  }`}
                >
                  🔄 Column Combination Results
                </button>
                <button 
                  onClick={() => setResultsTab('fullFileComparison')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    resultsTab === 'fullFileComparison' 
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-medium scale-105' 
                      : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-soft border border-gray-200'
                  }`}
                >
                  📁 Full File A-B Comparison
                </button>
                {dataQualityReport && (
                  <button 
                    onClick={() => setResultsTab('dataQuality')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      resultsTab === 'dataQuality' 
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-medium scale-105' 
                        : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-soft border border-gray-200'
                    }`}
                  >
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
                  <table className="w-full text-xs table-fixed">
                    <thead className="bg-slate-700 text-white sticky top-0" style={{ zIndex: 5 }}>
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold sticky left-0 bg-slate-700" style={{ width: '55%', minWidth: '55%', maxWidth: '55%', zIndex: 6 }}>Combination</th>
                        <th colSpan={3} className="px-3 py-2 text-center font-semibold border-x border-[#337ab7] bg-[#337ab7]" style={{ width: '22.5%' }}>File A</th>
                        <th colSpan={3} className="px-3 py-2 text-center font-semibold bg-purple-700" style={{ width: '22.5%' }}>File B</th>
                      </tr>
                      <tr className="bg-slate-600" style={{ zIndex: 5 }}>
                        <th className="px-3 py-1.5 sticky left-0 bg-slate-600" style={{ zIndex: 6 }}></th>
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
                        
                        const copyToClipboard = (text: string) => {
                          navigator.clipboard.writeText(text);
                          toast.success('Combination copied to clipboard!');
                        };
                        
                        return (
                          <tr key={i} className="hover:bg-slate-50">
                            <td 
                              className="px-3 py-2 font-mono text-xs font-medium sticky left-0 bg-white group cursor-pointer hover:bg-primary-50 transition-colors"
                              style={{ width: '55%', minWidth: '55%', maxWidth: '55%', zIndex: 4 }}
                              onClick={() => copyToClipboard(combo)}
                              title="Click to copy combination"
                            >
                              <div className="flex items-start gap-2">
                                <span className="break-words whitespace-normal leading-relaxed">{combo}</span>
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary-500 text-[10px] flex-shrink-0 mt-0.5">📋</span>
                              </div>
                            </td>
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
              
              {/* Workflow Tab - Unified View */}
              {resultsTab === 'workflow' && jobStatus && (
                <div className="p-3 overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                  <WorkflowView jobStatus={jobStatus} compact={true} />
                </div>
              )}
              
              {/* File Comparison Tab - Column Combination Results */}
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
                        <div className="glass-card px-4 py-2 shadow-soft">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">Matching Key:</span>
                            <div style={{ width: '50%' }}>
                              <ModernDropdown
                                value={selectedComparisonColumn || bestKey?.columns || ''}
                                onChange={(value) => setSelectedComparisonColumn(value as string)}
                                options={results.results_a.map(r => ({
                                  value: r.columns,
                                  label: r.columns,
                                  badge: r.is_unique_key ? '✓ Unique' : `${r.uniqueness_score.toFixed(1)}%`,
                                  description: `${r.unique_rows?.toLocaleString() || 0} unique`
                                }))}
                                size="sm"
                                searchable={true}
                                clearable={true}
                                placeholder="Select key columns..."
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Comparison Viewer - With visible clickable category tabs */}
                        <ChunkedFileListViewer 
                          runId={currentRunId!} 
                          columns={comparisonKey}
                          apiEndpoint={apiEndpoint}
                          hideHeader={false}
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
                        {/* Full File Comparison Viewer - Clean view without extra info text */}
                        <ChunkedFileListViewer 
                          runId={currentRunId!} 
                          columns={allColumnsKey}
                          apiEndpoint={apiEndpoint}
                          hideHeader={false}
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
              
              {/* Data Quality Tab - Using Full DataQualityViewer Component */}
              {resultsTab === 'dataQuality' && currentRunId && (
                <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                  <DataQualityViewer runId={currentRunId} />
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      <AboutDialog open={showAbout} onOpenChange={setShowAbout} />
    </>
  );
}
