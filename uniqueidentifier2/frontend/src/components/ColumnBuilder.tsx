import React from 'react';
import { Squares2X2Icon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { FileInfo, ColumnBuilderState } from '../types';

interface ColumnBuilderProps {
  columns: string[];
  columnsLoaded: boolean;
  columnsLoading: boolean;
  fileInfo: FileInfo;
  columnBuilder: ColumnBuilderState & {
    setActiveBuilder: (mode: 'include' | 'exclude') => void;
    addColumnToActiveBuilder: (column: string) => void;
    removeColumnFromBuilder: (index: number, mode: 'include' | 'exclude') => void;
    addIncludeCombination: () => void;
    addExcludeCombination: () => void;
    removeCombination: (index: number, type: 'include' | 'exclude') => void;
    clearBuilder: (mode: 'include' | 'exclude') => void;
  };
  onReset: () => void;
}

const ColumnBuilder: React.FC<ColumnBuilderProps> = ({
  columns,
  columnsLoaded,
  columnsLoading,
  fileInfo,
  columnBuilder,
  onReset,
}) => {
  const {
    activeBuilder,
    includeBuilder,
    excludeBuilder,
    includedCombinations,
    excludedCombinations,
    setActiveBuilder,
    addColumnToActiveBuilder,
    removeColumnFromBuilder,
    addIncludeCombination,
    addExcludeCombination,
    removeCombination,
    clearBuilder,
  } = columnBuilder;

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 animate-slide-in flex-1 flex flex-col overflow-hidden">
      <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center">
          <Squares2X2Icon className="w-5 h-5 mr-2 text-primary" />
          <span>Column Combination Builder</span>
        </div>
        {columnsLoaded && (
          <button
            onClick={onReset}
            className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center space-x-1.5"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>Reset All</span>
          </button>
        )}
      </h2>
      
      {/* Initial State */}
      {!columnsLoaded && !columnsLoading && (
        <div className="text-center py-20 animate-fade-in">
          <div className="max-w-md mx-auto">
            <svg className="w-24 h-24 mx-auto text-gray-300 mb-6 animate-pulse-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <h3 className="text-2xl font-bold gradient-text mb-3">Ready to Start</h3>
            <p className="text-gray-600 text-base leading-relaxed">
              Enter your file names above and click <span className="font-semibold text-blue-600">"Load Columns"</span> to begin
            </p>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                💡 <span className="font-semibold">Tip:</span> Make sure your CSV files are in the specified directory
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {columnsLoading && (
        <div className="text-center py-16">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-secondary border-b-transparent rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
            </div>
            <div>
              <h3 className="text-2xl font-bold gradient-text">Loading Files...</h3>
              <p className="text-gray-600 mt-3 text-base font-medium">Reading headers and counting rows</p>
              <p className="text-sm text-gray-500 mt-2 italic">This may take a few seconds for large files</p>
            </div>
          </div>
        </div>
      )}

      {/* Column Selector */}
      {columnsLoaded && !columnsLoading && (
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Info Bar */}
          <div className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-3 flex-shrink-0 rounded-lg shadow-md mb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <span className="font-semibold">File A:</span>
                  <span className="font-bold">{fileInfo.rowsA.toLocaleString()} rows</span>
                  {fileInfo.fileASize && <span className="text-sm opacity-90">({fileInfo.fileASize})</span>}
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <span className="font-semibold">File B:</span>
                  <span className="font-bold">{fileInfo.rowsB.toLocaleString()} rows</span>
                  {fileInfo.fileBSize && <span className="text-sm opacity-90">({fileInfo.fileBSize})</span>}
                </div>
                <div className="flex items-center space-x-2">
                  <Squares2X2Icon className="w-5 h-5" />
                  <span className="font-semibold">Columns:</span>
                  <span className="font-bold text-yellow-300">{columns.length}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 overflow-hidden">
            
            {/* Column Pool */}
            <div className="lg:col-span-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex flex-col overflow-hidden shadow-inner">
              {/* Builder Toggle */}
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <span className="text-sm font-bold text-gray-700 flex items-center space-x-2">
                  <span className={`inline-block w-3 h-3 rounded-full animate-pulse ${activeBuilder === 'include' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className={activeBuilder === 'include' ? 'text-green-600' : 'text-red-600'}>
                    {activeBuilder === 'include' ? '✅ Include Mode' : '❌ Exclude Mode'}
                  </span>
                </span>
                <button 
                  onClick={() => setActiveBuilder(activeBuilder === 'include' ? 'exclude' : 'include')}
                  className={`relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    activeBuilder === 'include' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  title="Toggle between Include and Exclude modes"
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-all duration-200 ease-in-out ${
                    activeBuilder === 'include' ? 'translate-x-6' : 'translate-x-0'
                  }`}></span>
                </button>
              </div>
              
              <p className="text-xs text-gray-600 mb-3 flex-shrink-0">
                Click columns below to add them to the {activeBuilder === 'include' ? 'include' : 'exclude'} builder
              </p>
              
              {/* Columns List with better scrolling */}
              <div className="flex flex-wrap gap-2 overflow-y-auto p-3 bg-white rounded-lg border-2 border-gray-200 flex-1 shadow-sm" style={{maxHeight: 'calc(100vh - 400px)'}}>
                {columns.map((col) => (
                  <button 
                    key={col}
                    onClick={() => addColumnToActiveBuilder(col)}
                    className="column-btn px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-primary hover:to-secondary hover:text-white rounded-lg text-sm font-semibold border border-gray-300 hover:border-primary transition-all whitespace-nowrap shadow-sm hover:shadow-md"
                    title={`Add ${col} to ${activeBuilder} builder`}
                  >
                    <span className="relative z-10">{col}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Include Panel */}
            <div className="lg:col-span-4 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex flex-col overflow-hidden panel-glow-green shadow-md">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <span className="text-sm font-bold text-green-700 flex items-center space-x-2">
                  <span className="text-lg">✅</span>
                  <span>Include Combinations</span>
                  <span className="badge bg-green-500 text-white px-2.5 py-0.5 rounded-full text-xs shadow-sm">{includedCombinations.length}</span>
                </span>
              </div>
              
              {/* Builder */}
              <div className="bg-white border-2 border-green-300 rounded-lg p-3 mb-3 flex-shrink-0 shadow-sm">
                <div className={`builder-area min-h-16 max-h-40 overflow-y-auto rounded-lg p-3 mb-3 ${
                  includeBuilder.length > 0 ? 'has-items bg-green-50' : 'bg-gradient-to-br from-green-50 to-white'
                }`}>
                  {includeBuilder.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4 italic">
                      👆 Click columns from the left panel to add them here
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {includeBuilder.map((col, idx) => (
                        <div key={idx} className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center space-x-2 shadow-md hover:shadow-lg transition-all hover:scale-105 animate-scale-in">
                          <span>{col}</span>
                          <button 
                            onClick={() => removeColumnFromBuilder(idx, 'include')}
                            className="hover:text-red-200 font-bold text-lg leading-none hover:scale-125 transition-transform"
                            title="Remove column"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={addIncludeCombination}
                    disabled={includeBuilder.length === 0}
                    title="Add this combination to the list"
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white p-2 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg hover:scale-105 flex items-center justify-center"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                  </button>
                  <button 
                    onClick={() => clearBuilder('include')}
                    disabled={includeBuilder.length === 0}
                    title="Clear the builder"
                    className="flex-1 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 disabled:from-gray-200 disabled:to-gray-300 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg"
                  >
                    🗑️ Clear Builder
                  </button>
                </div>
              </div>
              
              {/* Saved Combinations with better scrolling */}
              <div className="bg-white rounded-lg p-3 overflow-y-auto flex-1 shadow-inner border border-green-200" style={{maxHeight: 'calc(100vh - 500px)'}}>
                {includedCombinations.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8 italic">
                    📝 No combinations added yet<br/>
                    <span className="text-xs mt-2 block">Build a combination above and click the + button</span>
                  </p>
                ) : (
                  <div className="space-y-2">
                    {includedCombinations.map((combo, idx) => (
                      <div key={idx} className="combo-chip bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-3 flex justify-between items-center shadow-sm hover:border-green-400 animate-scale-in">
                        <span className="text-sm font-semibold text-gray-700 break-all flex items-center">
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 flex-shrink-0"></span>
                          <span>{combo}</span>
                        </span>
                        <button 
                          onClick={() => removeCombination(idx, 'include')}
                          title="Remove this combination"
                          className="bg-green-500 hover:bg-green-600 text-white px-2.5 py-1 rounded-lg text-sm transition-all flex-shrink-0 ml-3 shadow-sm hover:shadow-md hover:scale-110 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Exclude Panel */}
            <div className="lg:col-span-4 p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl flex flex-col overflow-hidden panel-glow-red shadow-md">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <span className="text-sm font-bold text-red-700 flex items-center space-x-2">
                  <span className="text-lg">❌</span>
                  <span>Exclude Combinations</span>
                  <span className="badge bg-red-500 text-white px-2.5 py-0.5 rounded-full text-xs shadow-sm">{excludedCombinations.length}</span>
                </span>
              </div>
              
              {/* Builder */}
              <div className="bg-white border-2 border-red-300 rounded-lg p-3 mb-3 flex-shrink-0 shadow-sm">
                <div className={`builder-area min-h-16 max-h-40 overflow-y-auto rounded-lg p-3 mb-3 ${
                  excludeBuilder.length > 0 ? 'has-items bg-red-50' : 'bg-gradient-to-br from-red-50 to-white'
                }`}>
                  {excludeBuilder.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4 italic">
                      👆 Click columns from the left panel to add them here
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {excludeBuilder.map((col, idx) => (
                        <div key={idx} className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center space-x-2 shadow-md hover:shadow-lg transition-all hover:scale-105 animate-scale-in">
                          <span>{col}</span>
                          <button 
                            onClick={() => removeColumnFromBuilder(idx, 'exclude')}
                            className="hover:text-yellow-200 font-bold text-lg leading-none hover:scale-125 transition-transform"
                            title="Remove column"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={addExcludeCombination}
                    disabled={excludeBuilder.length === 0}
                    title="Add this combination to the list"
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white p-2 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg hover:scale-105 flex items-center justify-center"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                  </button>
                  <button 
                    onClick={() => clearBuilder('exclude')}
                    disabled={excludeBuilder.length === 0}
                    title="Clear the builder"
                    className="flex-1 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 disabled:from-gray-200 disabled:to-gray-300 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg"
                  >
                    🗑️ Clear Builder
                  </button>
                </div>
              </div>
              
              {/* Saved Combinations */}
              <div className="bg-white rounded-lg p-3 overflow-y-auto flex-1 shadow-inner border border-red-200" style={{maxHeight: 'calc(100vh - 500px)'}}>
                {excludedCombinations.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8 italic">
                    📝 No combinations added yet<br/>
                    <span className="text-xs mt-2 block">Build a combination above and click the + button</span>
                  </p>
                ) : (
                  <div className="space-y-2">
                    {excludedCombinations.map((combo, idx) => (
                      <div key={idx} className="combo-chip bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-lg p-3 flex justify-between items-center shadow-sm hover:border-red-400 animate-scale-in">
                        <span className="text-sm font-semibold text-gray-700 break-all flex items-center">
                          <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2 flex-shrink-0"></span>
                          <span>{combo}</span>
                        </span>
                        <button 
                          onClick={() => removeCombination(idx, 'exclude')}
                          title="Remove this combination"
                          className="bg-red-500 hover:bg-red-600 text-white px-2.5 py-1 rounded-lg text-sm transition-all flex-shrink-0 ml-3 shadow-sm hover:shadow-md hover:scale-110 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnBuilder;