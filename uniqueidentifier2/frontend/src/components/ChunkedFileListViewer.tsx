/**
 * Chunked File List Viewer
 * Shows list of pre-generated chunk files (10k records each)
 * Lets users click to view specific chunk files
 */
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface ChunkedFileListViewerProps {
  runId: number;
  columns: string;
  apiEndpoint?: string;
  onClose?: () => void;
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

type Category = 'matched' | 'only_a' | 'only_b';

export default function ChunkedFileListViewer({ runId, columns, apiEndpoint, onClose }: ChunkedFileListViewerProps) {
  const apiBaseUrl = apiEndpoint || 'http://localhost:8000';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chunkFiles, setChunkFiles] = useState<ChunkFilesByCategory>({
    matched: [],
    only_a: [],
    only_b: []
  });
  const [activeCategory, setActiveCategory] = useState<Category>('matched');
  const [selectedChunk, setSelectedChunk] = useState<ChunkFile | null>(null);
  const [chunkData, setChunkData] = useState<any[]>([]);
  const [loadingChunk, setLoadingChunk] = useState(false);

  useEffect(() => {
    loadChunkFiles();
  }, [runId, columns]);

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
        setError('No chunk files available. Make sure "Generate Comparisons" was enabled when running the analysis.');
      }
    } catch (error: any) {
      console.error('Error loading chunk files:', error);
      setError(error.message || 'Failed to load chunk files');
      toast.error(error.message || 'Failed to load chunk files');
    } finally {
      setLoading(false);
    }
  };

  const loadChunkData = async (chunk: ChunkFile) => {
    try {
      setLoadingChunk(true);
      setSelectedChunk(chunk);
      
      const response = await fetch(
        `${apiBaseUrl}/api/comparison-export/${runId}/chunk-file?` +
        `columns=${encodeURIComponent(columns)}&` +
        `category=${chunk.category}&` +
        `chunk_index=${chunk.chunk_index}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load chunk data');
      }

      const data = await response.json();
      setChunkData(data.records || []);
      toast.success(`Loaded ${data.record_count?.toLocaleString() || 0} records from ${chunk.chunk_name}`);
    } catch (error: any) {
      console.error('Error loading chunk data:', error);
      toast.error(error.message || 'Failed to load chunk data');
    } finally {
      setLoadingChunk(false);
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
      {/* Ultra Compact Single-Row Header with Tabs and Stats */}
      <div className="flex items-center justify-between bg-white border rounded-lg px-3 py-2 shadow-sm">
        {/* Left: Category Tabs */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveCategory('matched')}
            className={`px-3 py-1 font-medium rounded transition-colors text-xs ${
              activeCategory === 'matched'
                ? 'bg-green-600 text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ✅ Matched ({chunkFiles.matched.length})
          </button>
          <button
            onClick={() => setActiveCategory('only_a')}
            className={`px-3 py-1 font-medium rounded transition-colors text-xs ${
              activeCategory === 'only_a'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📘 Only A ({chunkFiles.only_a.length})
          </button>
          <button
            onClick={() => setActiveCategory('only_b')}
            className={`px-3 py-1 font-medium rounded transition-colors text-xs ${
              activeCategory === 'only_b'
                ? 'bg-orange-600 text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📙 Only B ({chunkFiles.only_b.length})
          </button>
        </div>

        {/* Right: Stats & Back Button */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-3 text-xs text-gray-600">
            <span><strong>Total:</strong> {totalChunks} chunks</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-500">10k records/chunk</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs transition-colors"
            >
              ← Back
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
        {/* Chunk Files List - Compact */}
        <div className="lg:col-span-1 bg-white border rounded-lg p-2 max-h-[70vh] overflow-y-auto">
          <h3 className="font-semibold text-gray-800 mb-2 text-sm px-1">Files ({currentChunks.length})</h3>
          
          {currentChunks.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm">
              <p>No chunks</p>
            </div>
          ) : (
            <div className="space-y-1">
              {currentChunks.map((chunk) => (
                <div
                  key={chunk.file_id}
                  className={`border rounded p-2 cursor-pointer transition-all text-xs ${
                    selectedChunk?.file_id === chunk.file_id
                      ? 'bg-primary text-white border-primary shadow'
                      : 'bg-gray-50 hover:bg-gray-100 border-gray-300'
                  }`}
                  onClick={() => loadChunkData(chunk)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{chunk.chunk_name}</div>
                      <div className={`text-xs mt-0.5 ${
                        selectedChunk?.file_id === chunk.file_id ? 'text-white/80' : 'text-gray-600'
                      }`}>
                        {chunk.row_count.toLocaleString()} rows
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadChunkFile(chunk);
                      }}
                      className={`ml-1 px-1.5 py-0.5 rounded text-xs ${
                        selectedChunk?.file_id === chunk.file_id
                          ? 'bg-white text-primary hover:bg-gray-100'
                          : 'bg-primary text-white hover:bg-primary-dark'
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

        {/* Chunk Data View - More Space */}
        <div className="lg:col-span-3 bg-white border rounded-lg p-2">
          <div className="flex items-center justify-between mb-2 px-2">
            <h3 className="font-semibold text-gray-800 text-sm">
              {selectedChunk ? selectedChunk.chunk_name : 'Select a chunk to view'}
            </h3>
            {selectedChunk && (
              <div className="text-xs text-gray-600">
                {chunkData.length.toLocaleString()} records
              </div>
            )}
          </div>

          {loadingChunk ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
              <span className="ml-2 text-sm text-gray-600">Loading...</span>
            </div>
          ) : chunkData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📂</div>
              <p className="text-sm">Select a chunk file to view</p>
            </div>
          ) : (
            <div className="overflow-auto border rounded-lg" style={{ maxHeight: 'calc(100vh - 250px)' }}>
              <table className="w-full border-collapse text-xs">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    {Object.keys(chunkData[0] || {}).map((col) => (
                      <th
                        key={col}
                        className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-b-2 border-gray-300 whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chunkData.map((record, idx) => (
                    <tr
                      key={idx}
                      className="border-b hover:bg-blue-50 transition-colors"
                    >
                      {Object.entries(record).map(([key, value], cellIdx) => (
                        <td
                          key={cellIdx}
                          className="px-3 py-1.5 text-xs cursor-pointer hover:bg-blue-100"
                          onClick={() => copyToClipboard(String(value ?? ''))}
                          title="Click to copy"
                        >
                          {value === null || value === undefined ? (
                            <span className="text-gray-400 italic">null</span>
                          ) : (
                            String(value)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

