import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';
import type { RunDetails, AnalysisResult } from '../types';
import toast from 'react-hot-toast';

interface UsePaginatedResultsOptions {
  runId: number;
  initialPageSize?: number;
  side?: 'A' | 'B';
  autoLoad?: boolean;
}

interface UsePaginatedResultsReturn {
  // Data
  details: RunDetails | null;
  results: AnalysisResult[];
  
  // Pagination state
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalResults: number;
  hasNext: boolean;
  hasPrev: boolean;
  
  // Loading states
  loading: boolean;
  loadingPage: boolean;
  error: string | null;
  
  // Actions
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;
  refresh: () => void;
  
  // Utility
  isFirstPage: boolean;
  isLastPage: boolean;
}

export function usePaginatedResults({
  runId,
  initialPageSize = 100,
  side,
  autoLoad = true,
}: UsePaginatedResultsOptions): UsePaginatedResultsReturn {
  const [details, setDetails] = useState<RunDetails | null>(null);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [loadingPage, setLoadingPage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadResults = useCallback(async () => {
    try {
      const isInitialLoad = currentPage === 1 && !details;
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setLoadingPage(true);
      }
      
      setError(null);

      const data = await apiService.getRunDetailsWithPagination(
        runId,
        currentPage,
        pageSize,
        side
      );
      
      setDetails(data);
      
      // Combine results from both sides
      const allResults = [...(data.results_a || []), ...(data.results_b || [])];
      setResults(allResults);
      
      // Update pagination info
      if (data.pagination) {
        setTotalPages(data.pagination.total_pages);
        setTotalResults(data.pagination.total_results);
        setHasNext(data.pagination.has_next);
        setHasPrev(data.pagination.has_prev);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load results';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingPage(false);
    }
  }, [runId, currentPage, pageSize, side, details]);

  // Auto-load on mount and when dependencies change
  useEffect(() => {
    if (autoLoad) {
      loadResults();
    }
  }, [runId, currentPage, pageSize, side]);

  // Navigation functions
  const nextPage = useCallback(() => {
    if (hasNext) {
      setCurrentPage((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [hasNext]);

  const prevPage = useCallback(() => {
    if (hasPrev) {
      setCurrentPage((prev) => Math.max(1, prev - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [hasPrev]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const refresh = useCallback(() => {
    loadResults();
  }, [loadResults]);

  return {
    // Data
    details,
    results,
    
    // Pagination state
    currentPage,
    pageSize,
    totalPages,
    totalResults,
    hasNext,
    hasPrev,
    
    // Loading states
    loading,
    loadingPage,
    error,
    
    // Actions
    nextPage,
    prevPage,
    goToPage,
    setPageSize,
    refresh,
    
    // Utility
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages,
  };
}

export default usePaginatedResults;

