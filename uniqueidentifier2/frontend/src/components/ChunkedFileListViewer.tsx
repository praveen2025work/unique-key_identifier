'use client'

/**
 * Chunked File List Viewer with Progressive Loading
 * Shows list of pre-generated chunk files (200k records each)
 * Lets users click to view specific chunk files
 * Supports real-time polling to show new chunks as they're created during processing
 */
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface ChunkedFileListViewerProps {
  runId: number;
  columns: string;
  apiEndpoint?: string;
  onClose?: () => void;
  hideHeader?: boolean;
  onHeaderDataChange?: (data: { matched: number; only_a: number; only_b: number; totalChunks: number }) => void;
  externalCategory?: Category;
  onCategoryChange?: (category: Category) => void;
}

interface ChunkFile {
  file_id: number;
  columns: string;
  category: string;
  file_path: string;
  file_size_mb: number;
  row_count: number;
  created_at: string;
  chunk_index: number;
  chunk_name: string;
  exists: boolean;
}

interface ChunkFilesByCategory {
  matched: ChunkFile[];
  only_a: ChunkFile[];
  only_b: ChunkFile[];
}

export type Category = 'matched' | 'only_a' | 'only_b';

export default function ChunkedFileListViewer({ runId, columns, apiEndpoint, onClose, hideHeader, onHeaderDataChange, externalCategory, onCategoryChange }: ChunkedFileListViewerProps) {
  const apiBaseUrl = apiEndpoint || 'http://localhost:8000';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chunkFiles, setChunkFiles] = useState<ChunkFilesByCategory>({
    matched: [],
    only_a: [],
    only_b: []
  });
  const [internalCategory, setInternalCategory] = useState<Category>('matched');
  const activeCategory = externalCategory !== undefined ? externalCategory : internalCategory;
  const setActiveCategory = (category: Category) => {
    if (onCategoryChange) {
      onCategoryChange(category);
    } else {
      setInternalCategory(category);
    }
  };
  const [selectedChunk, setSelectedChunk] = useState<ChunkFile | null>(null);
  const [chunkData, setChunkData] = useState<any[]>([]);
  const [loadingChunk, setLoadingChunk] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100); // Reduced from 1000 to 100 for better memory management
  const [pagination, setPagination] = useState<{
    offset: number;
    limit: number;
    total_records: number;
    total_pages: number;
    current_page: number;
    has_more: boolean;
  } | null>(null);
  
  // Progressive loading state
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastChunkId, setLastChunkId] = useState(0);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadChunkFiles();
    
    // MEMORY FIX: Cleanup on unmount
    return () => {
      setChunkData([]); // Clear data when component unmounts
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [runId, columns]);
  
  // Poll for new chunks when processing
  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        pollForNewChunks();
      }, 2000); // Poll every 2 seconds
      setPollingInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  }, [isProcessing, lastChunkId]);

  // Notify parent about header data changes
  useEffect(() => {
    if (onHeaderDataChange) {
      const totalChunks = chunkFiles.matched.length + chunkFiles.only_a.length + chunkFiles.only_b.length;
      onHeaderDataChange({
        matched: chunkFiles.matched.length,
        only_a: chunkFiles.only_a.length,
        only_b: chunkFiles.only_b.length,
        totalChunks
      });
    }
  }, [chunkFiles, onHeaderDataChange]);

  const pollForNewChunks = async () => {
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/comparison-export/${runId}/available-chunks?` +
        `columns=${encodeURIComponent(columns)}&` +
        `last_chunk_id=${lastChunkId}`
      );
      
      if (!response.ok) return;
      
      const data = await response.json();
      console.log('New chunks poll:', data);
      
      if (data.new_chunks && data.new_chunks.length > 0) {
        // Update chunk files with new chunks
        setChunkFiles(prev => ({
          matched: [...prev.matched, ...data.chunks_by_category.matched],
          only_a: [...prev.only_a, ...data.chunks_by_category.only_a],
          only_b: [...prev.only_b, ...data.chunks_by_category.only_b]
        }));
        
        // Update last chunk ID
        setLastChunkId(data.last_chunk_id);
        
        // Show toast notification
        toast.success(`${data.total_new_chunks} new chunk(s) available!`, {
          icon: '🎉',
          duration: 2000
        });
      }
      
      // Update processing status
      if (data.processing_status) {
        setIsProcessing(data.processing_status.is_processing);
      }
    } catch (error: any) {
      console.error('Error polling for new chunks:', error);
    }
  };

  const loadChunkFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Loading chunk files for run ${runId}, columns: ${columns}`);
      
      const response = await fetch(
        `${apiBaseUrl}/api/comparison-export/${runId}/status?columns=${encodeURIComponent(columns)}`
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Chunk files response:', data);
      
      if (data.exports_available && data.files_by_category) {
        setChunkFiles(data.files_by_category);
        
        // Track the highest chunk ID for polling
        const allFiles = [...data.files_by_category.matched, ...data.files_by_category.only_a, ...data.files_by_category.only_b];
        if (allFiles.length > 0) {
          const maxId = Math.max(...allFiles.map((f: ChunkFile) => f.file_id));
          setLastChunkId(maxId);
        }
        
        // Start polling if processing
        // Check job status to determine if still processing
        const statusResponse = await fetch(`${apiBaseUrl}/api/run/${runId}/status`);
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          const isStillProcessing = statusData.status === 'running' || statusData.current_stage === 'generating_comparisons';
          setIsProcessing(isStillProcessing);
          
          if (isStillProcessing) {
            toast.success('Processing in progress - new chunks will appear automatically', {
              icon: '⚡',
              duration: 3000
            });
          }
        }
        
        // Auto-select first chunk of matched if available
        if (data.files_by_category.matched && data.files_by_category.matched.length > 0) {
          loadChunkData(data.files_by_category.matched[0]);
        } else if (data.files_by_category.only_a && data.files_by_category.only_a.length > 0) {
          setActiveCategory('only_a');
          loadChunkData(data.files_by_category.only_a[0]);
        } else if (data.files_by_category.only_b && data.files_by_category.only_b.length > 0) {
          setActiveCategory('only_b');
          loadChunkData(data.files_by_category.only_b[0]);
        }
      } else {
        setError('No chunk files available yet. Make sure "Generate Comparisons" was enabled. Processing may still be in progress...');
        // Check if processing
        const statusResponse = await fetch(`${apiBaseUrl}/api/run/${runId}/status`);
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          const isStillProcessing = statusData.status === 'running' || statusData.current_stage === 'generating_comparisons';
          setIsProcessing(isStillProcessing);
        }
      }
    } catch (error: any) {
      console.error('Error loading chunk files:', error);
      setError(error.message || 'Failed to load chunk files');
      toast.error(error.message || 'Failed to load chunk files');
    } finally {
      setLoading(false);
    }
  };

  const loadChunkData = async (chunk: ChunkFile, page: number = 1) => {
    try {
      setLoadingChunk(true);
      
      // MEMORY FIX: Clear previous data immediately to free memory
      setChunkData([]);
      
      setSelectedChunk(chunk);
      setCurrentPage(page);
      
      // MEMORY FIX: Reduced from 1000 to 100 for better memory management
      const limit = pageSize; // Use configurable page size (default: 100)
      const offset = (page - 1) * limit;
      
      const response = await fetch(
        `${apiBaseUrl}/api/comparison-export/${runId}/chunk-file?` +
        `columns=${encodeURIComponent(columns)}&` +
        `category=${chunk.category}&` +
        `chunk_index=${chunk.chunk_index}&` +
        `offset=${offset}&` +
        `limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load chunk data');
      }

      const data = await response.json();
      
      // MEMORY FIX: Only set new data after clearing old
      setChunkData(data.records || []);
      setPagination(data.pagination || null);
      
      const pageInfo = data.pagination 
        ? ` (Page ${data.pagination.current_page}/${data.pagination.total_pages})`
        : '';
      toast.success(`Loaded ${data.record_count?.toLocaleString() || 0} records${pageInfo} from ${chunk.chunk_name}`);
    } catch (error: any) {
      console.error('Error loading chunk data:', error);
      toast.error(error.message || 'Failed to load chunk data');
      setChunkData([]); // Clear on error
    } finally {
      setLoadingChunk(false);
    }
  };
  
  const handleNextPage = () => {
    if (selectedChunk && pagination && pagination.has_more) {
      loadChunkData(selectedChunk, currentPage + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (selectedChunk && currentPage > 1) {
      loadChunkData(selectedChunk, currentPage - 1);
    }
  };
  
  const handlePageJump = (page: number) => {
    if (selectedChunk && page >= 1 && pagination && page <= pagination.total_pages) {
      loadChunkData(selectedChunk, page);
    }
  };

  const downloadChunkFile = async (chunk: ChunkFile) => {
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/comparison-export/${runId}/download?` +
        `columns=${encodeURIComponent(columns)}&` +
        `category=${chunk.category}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to download chunk');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = chunk.chunk_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Downloaded ${chunk.chunk_name}`);
    } catch (error: any) {
      console.error('Error downloading chunk:', error);
      toast.error(error.message || 'Failed to download chunk');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-3 text-lg text-gray-600">Loading chunk files...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg">
        <div className="flex items-start">
          <div className="text-4xl mr-4">⚠️</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-yellow-800 mb-2">No Chunk Files Available</h3>
            <p className="text-sm text-yellow-700 mb-4">{error}</p>
            <div className="bg-white p-4 rounded border border-yellow-300">
              <p className="text-sm font-semibold text-gray-800 mb-2">To generate chunk files:</p>
              <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                <li>Go back and run a new analysis</li>
                <li>Make sure "Generate Comparisons" checkbox is enabled</li>
                <li>Wait for the workflow to complete</li>
                <li>Chunk files will be pre-generated automatically</li>
              </ol>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors"
              >
                ← Go Back
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentChunks = chunkFiles[activeCategory];
  const totalChunks = chunkFiles.matched.length + chunkFiles.only_a.length + chunkFiles.only_b.length;

  return (
    <div className="space-y-1">
      {/* Compact Header with Clickable Category Tabs */}
      {!hideHeader && (
        <div className="glass-card px-3 py-2 shadow-soft animate-fade-in">
          <div className="flex items-center justify-between">
            {/* Left: Clickable Category Tabs */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveCategory('matched')}
                className={`px-3 py-1.5 font-semibold rounded-lg text-xs transition-all duration-200 ${
                  activeCategory === 'matched'
                    ? 'bg-gradient-to-r from-success-500 to-success-600 text-white shadow-medium scale-105'
                    : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-soft border border-gray-200'
                }`}
              >
                ✅ Matched ({chunkFiles.matched.length})
              </button>
              <button
                onClick={() => setActiveCategory('only_a')}
                className={`px-3 py-1.5 font-semibold rounded-lg text-xs transition-all duration-200 ${
                  activeCategory === 'only_a'
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-medium scale-105'
                    : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-soft border border-gray-200'
                }`}
              >
                📘 Only A ({chunkFiles.only_a.length})
              </button>
              <button
                onClick={() => setActiveCategory('only_b')}
                className={`px-3 py-1.5 font-semibold rounded-lg text-xs transition-all duration-200 ${
                  activeCategory === 'only_b'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-medium scale-105'
                    : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-soft border border-gray-200'
                }`}
              >
                📙 Only B ({chunkFiles.only_b.length})
              </button>
            </div>

            {/* Right: Stats & Back Button */}
            <div className="flex items-center gap-2">
              {isProcessing && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="text-[10px] font-semibold text-blue-700">Processing... New chunks appearing</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-[10px] font-medium text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="text-gray-500">Total:</span>
                  <span className="badge-primary text-[9px] px-1.5 py-0.5">{totalChunks} chunks</span>
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-500">200k records/chunk</span>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="btn-ghost px-2 py-1 text-xs"
                >
                  ← Back
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
        {/* Chunk Files List - Compact */}
        <div className="lg:col-span-1 card-modern p-2 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <h3 className="font-bold text-gray-800 mb-2 text-xs flex items-center gap-1.5">
            <span className="text-primary-600 text-sm">📁</span>
            Files ({currentChunks.length})
          </h3>
          
          {currentChunks.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <div className="text-2xl mb-1">📂</div>
              <p className="text-xs">No chunks available</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {currentChunks.map((chunk) => (
                <div
                  key={chunk.file_id}
                  className={`rounded-lg p-2 cursor-pointer transition-all duration-200 text-xs ${
                    selectedChunk?.file_id === chunk.file_id
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-medium scale-[1.02]'
                      : 'bg-gradient-to-br from-white to-gray-50 hover:from-primary-50 hover:to-blue-50 border border-gray-200 hover:border-primary-200 hover:shadow-soft'
                  }`}
                  onClick={() => loadChunkData(chunk)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate text-[11px]">{chunk.chunk_name}</div>
                      <div className={`text-[10px] mt-0.5 flex items-center gap-0.5 ${
                        selectedChunk?.file_id === chunk.file_id ? 'text-white/90' : 'text-gray-500'
                      }`}>
                        <span className="inline-block w-1 h-1 rounded-full bg-current"></span>
                        {chunk.row_count.toLocaleString()} rows
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadChunkFile(chunk);
                      }}
                      className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium transition-all duration-200 ${
                        selectedChunk?.file_id === chunk.file_id
                          ? 'bg-white text-primary-600 hover:bg-gray-100'
                          : 'bg-primary-500 text-white hover:bg-primary-600'
                      }`}
                      title="Download"
                    >
                      ⬇
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chunk Data View - Compact */}
        <div className="lg:col-span-3 card-modern p-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
              <span className="text-primary-600 text-sm">📄</span>
              {selectedChunk ? selectedChunk.chunk_name : 'Select a chunk to view'}
            </h3>
            <div className="flex items-center gap-2">
              {pagination && (
                <div className="flex items-center gap-2 text-[10px] font-medium text-gray-600">
                  <span className="badge-primary px-2 py-0.5">
                    Page {pagination.current_page} of {pagination.total_pages}
                  </span>
                  <span className="text-gray-500">
                    ({pagination.total_records.toLocaleString()} total records)
                  </span>
                </div>
              )}
              {selectedChunk && !pagination && (
                <div className="badge-primary text-[10px] px-2 py-0.5">
                  {chunkData.length.toLocaleString()} records
                </div>
              )}
            </div>
          </div>

          {loadingChunk ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative">
                <div className="animate-spin h-8 w-8 border-3 border-primary-200 border-t-primary-600 rounded-full"></div>
                <div className="absolute inset-0 animate-ping h-8 w-8 border-3 border-primary-400 rounded-full opacity-20"></div>
              </div>
              <span className="mt-3 text-xs font-medium text-gray-600">Loading chunk data...</span>
            </div>
          ) : chunkData.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <div className="text-4xl mb-2">📂</div>
              <p className="text-sm font-semibold text-gray-600">Select a chunk file to view</p>
              <p className="text-xs mt-0.5">Click on any file from the list to view its contents</p>
            </div>
          ) : (
            <>
              <div className="overflow-auto rounded-xl border border-gray-200" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                <table className="table-modern">
                  <thead>
                    <tr>
                      {Object.keys(chunkData[0] || {}).map((col) => (
                        <th key={col} className="sticky top-0 bg-gradient-to-r from-gray-50 to-blue-50 backdrop-blur-sm">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* MEMORY FIX: Only render current page data, use stable keys */}
                    {chunkData.slice(0, pageSize).map((record, idx) => (
                      <tr key={`row-${currentPage}-${idx}`}>
                        {Object.entries(record).map(([key, value], cellIdx) => (
                          <td
                            key={`${key}-${cellIdx}`}
                            className="group cursor-pointer"
                            onClick={() => copyToClipboard(String(value ?? ''))}
                            title="Click to copy"
                          >
                            <div className="flex items-center gap-2">
                              {value === null || value === undefined ? (
                                <span className="text-gray-400 italic text-xs">null</span>
                              ) : (
                                <>
                                  <span>{String(value).substring(0, 200)}</span>
                                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary-500 text-xs">📋</span>
                                </>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Compact Pagination Controls */}
              {pagination && pagination.total_pages > 1 && (
                <div className="mt-2 space-y-2">
                  {/* Page Size Selector - MEMORY FIX */}
                  <div className="flex items-center justify-between px-2 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-xs font-medium text-gray-700">Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        const newSize = Number(e.target.value);
                        setPageSize(newSize);
                        // Reload current chunk with new page size
                        if (selectedChunk) {
                          loadChunkData(selectedChunk, 1);
                        }
                      }}
                      className="text-xs px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value={50}>50 (Fastest)</option>
                      <option value={100}>100 (Recommended)</option>
                      <option value={250}>250</option>
                      <option value={500}>500</option>
                      <option value={1000}>1000 (Slower)</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="px-2 py-1 text-xs font-semibold rounded bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        ← Prev
                      </button>
                      <button
                        onClick={handleNextPage}
                        disabled={!pagination.has_more}
                        className="px-2 py-1 text-xs font-semibold rounded bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        Next →
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-gray-600">
                        Showing {((currentPage - 1) * pageSize + 1).toLocaleString()} - {Math.min(currentPage * pageSize, pagination.total_records).toLocaleString()} of {pagination.total_records.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-medium text-gray-500">Jump to:</span>
                        <input
                          type="number"
                          min="1"
                          max={pagination.total_pages}
                          value={currentPage}
                          onChange={(e) => {
                            const page = parseInt(e.target.value);
                            if (page && page >= 1 && page <= pagination.total_pages) {
                              handlePageJump(page);
                            }
                          }}
                          className="w-14 px-1.5 py-0.5 text-[10px] text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                        <span className="text-[10px] font-medium text-gray-500">/ {pagination.total_pages}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handlePageJump(1)}
                        disabled={currentPage === 1}
                        className="px-2 py-1 text-[10px] font-semibold rounded bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        First
                      </button>
                      <button
                        onClick={() => handlePageJump(pagination.total_pages)}
                        disabled={currentPage === pagination.total_pages}
                        className="px-2 py-1 text-[10px] font-semibold rounded bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        Last
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

