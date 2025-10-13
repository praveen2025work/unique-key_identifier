import React from 'react';
import { Squares2X2Icon, PlusIcon } from '@heroicons/react/24/outline';
import { BuilderMode, FileInfo } from '../types';

interface ColumnBuilderProps {
  columns: string[];
  fileInfo: FileInfo;
  columnsLoading: boolean;
  columnsLoaded: boolean;
  activeBuilder: BuilderMode;
  includeBuilder: string[];
  excludeBuilder: string[];
  includedCombinations: string[];
  excludedCombinations: string[];
  onSetActiveBuilder: (mode: BuilderMode) => void;
  onAddColumn: (column: string) => void;
  onRemoveFromBuilder: (index: number, mode: BuilderMode) => void;
  onAddIncludeCombination: () => void;
  onAddExcludeCombination: () => void;
  onRemoveCombination: (index: number, type: 'include' | 'exclude') => void;
  onClearBuilder: (mode: BuilderMode) => void;
  onResetAll: () => void;
}

const ColumnBuilder: React.FC<ColumnBuilderProps> = ({
  columns,
  fileInfo,
  columnsLoading,
  columnsLoaded,
  activeBuilder,
  includeBuilder,
  excludeBuilder,
  includedCombinations,
  excludedCombinations,
  onSetActiveBuilder,
  onAddColumn,
  onRemoveFromBuilder,
  onAddIncludeCombination,
  onAddExcludeCombination,
  onRemoveCombination,
  onClearBuilder,
  onResetAll,
}) => {
  if (!columnsLoaded && !columnsLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-2 animate-slide-in text-sm flex-1 flex flex-col overflow-hidden section-card">
        <h2 className="text-sm font-bold text-gray-800 mb-1 flex items-center flex-shrink-0">
          <Squares2X2Icon className="w-3 h-3 mr-1 text-primary" />
          Available Columns & Combination Builder
        </h2>
        
        <div className="text-center py-16 animate-fade-in">
          <svg className="w-20 h-20 mx-auto text-gray-300 mb-4 animate-pulse-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <h3 className="text-lg font-bold gradient-text mb-2">No Files Selected</h3>
          <p className="text-gray-500 text-sm">📝 Enter file names in the configuration panel to see available columns</p>
        </div>
      </div>
    );
  }

  if (columnsLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-2 animate-slide-in text-sm flex-1 flex flex-col overflow-hidden section-card">
        <h2 className="text-sm font-bold text-gray-800 mb-1 flex items-center flex-shrink-0">
          <Squares2X2Icon className="w-3 h-3 mr-1 text-primary" />
          Available Columns & Combination Builder
        </h2>
        
        <div className="text-center py-12 animate-scale-in">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <div 
                className="absolute inset-0 w-16 h-16 border-4 border-secondary border-b-transparent rounded-full animate-spin"
                style={{ animationDirection: 'reverse', animationDuration: '1s' }}
              ></div>
            </div>
            <div>
              <h3 className="text-xl font-bold gradient-text">🔍 Loading Files...</h3>
              <p className="text-gray-600 mt-2 text-sm font-medium">Reading headers and counting rows</p>
              <p className="text-xs text-gray-500 mt-1 italic">This may take a few seconds for large files</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-2 animate-slide-in text-sm flex-1 flex flex-col overflow-hidden section-card">
      <h2 className="text-sm font-bold text-gray-800 mb-1 flex items-center flex-shrink-0">
        <Squares2X2Icon className="w-3 h-3 mr-1 text-primary" />
        Available Columns & Combination Builder
      </h2>
      
      {/* Info Bar */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white px-2 py-1.5 flex-shrink-0 rounded-lg shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span className="font-semibold">File A:</span>
              <span>{fileInfo.rowsA.toLocaleString()} rows</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span className="font-semibold">File B:</span>
              <span>{fileInfo.rowsB.toLocaleString()} rows</span>
            </div>
            <div className="flex items-center space-x-1">
              <Squares2X2Icon className="w-3 h-3" />
              <span className="font-semibold">Columns:</span>
              <span className="font-bold text-yellow-300">{columns.length}</span>
            </div>
          </div>
          <button
            onClick={onResetAll}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-lg font-semibold transition-all flex items-center space-x-1 hover:shadow-md hover:scale-105"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <span>Reset All</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-12 gap-2 flex-1 overflow-hidden">
        {/* Column Pool */}
        <div className="col-span-3 p-2 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex flex-col overflow-hidden shadow-inner">
          {/* Builder Toggle */}
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <span className="text-xs font-bold text-gray-700 flex items-center space-x-1">
              <span className={`inline-block w-2 h-2 rounded-full animate-pulse ${activeBuilder === 'include' ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className={activeBuilder === 'include' ? 'text-green-600' : 'text-red-600'}>
                {activeBuilder === 'include' ? '✅ Include Mode' : '❌ Exclude Mode'}
              </span>
            </span>
            <button
              onClick={() => onSetActiveBuilder(activeBuilder === 'include' ? 'exclude' : 'include')}
              className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 toggle-switch ${
                activeBuilder === 'include' ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition-all duration-200 ease-in-out ${
                activeBuilder === 'include' ? 'translate-x-5' : 'translate-x-0'
              }`}></span>
            </button>
          </div>
          
          {/* Columns List */}
          <div className="flex flex-wrap gap-1.5 overflow-y-auto p-2 bg-white rounded-lg border-2 border-gray-200 flex-1 shadow-sm">
            {columns.map((col) => (
              <button
                key={col}
                onClick={() => onAddColumn(col)}
                className="column-btn px-2.5 py-1 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-primary hover:to-secondary hover:text-white rounded-lg text-xs font-semibold border border-gray-300 hover:border-primary transition-all whitespace-nowrap shadow-sm hover:shadow-md"
              >
                <span className="relative z-10">{col}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Include Panel */}
        <div className="col-span-4 p-2 bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex flex-col overflow-hidden panel-glow-green shadow-md">
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <span className="text-xs font-bold text-green-700 flex items-center space-x-1.5">
              <span className="text-sm">✅</span>
              <span>Include Combinations</span>
              <span className="badge bg-green-500 text-white px-2 py-0.5 rounded-full text-xs shadow-sm">
                {includedCombinations.length}
              </span>
            </span>
          </div>
          
          {/* Builder */}
          <div className="bg-white border-2 border-green-300 rounded-lg p-2 mb-2 flex-shrink-0 shadow-sm">
            <div className={`min-h-12 max-h-32 overflow-y-auto rounded-lg p-2 mb-2 ${
              includeBuilder.length > 0 ? 'has-items bg-green-50' : 'bg-gradient-to-br from-green-50 to-white'
            } border-2 border-dashed border-green-300`}>
              {includeBuilder.length === 0 ? (
                <p className="text-gray-400 text-xs text-center py-2 italic">👆 Click columns to add...</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {includeBuilder.map((col, idx) => (
                    <div
                      key={idx}
                      className="bg-gradient-to-r from-green-500 to-green-600 text-white px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-md hover:shadow-lg transition-all hover:scale-105 animate-scale-in"
                    >
                      <span>{col}</span>
                      <button
                        onClick={() => onRemoveFromBuilder(idx, 'include')}
                        className="hover:text-red-200 font-bold text-base leading-none hover:scale-125 transition-transform"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={onAddIncludeCombination}
                title="Add this combination to the list"
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-1.5 rounded-lg text-xs font-semibold transition-all shadow-md hover:shadow-lg hover:scale-105"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => onClearBuilder('include')}
                title="Clear the builder"
                className="flex-1 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white px-2 py-1 rounded-lg text-xs font-semibold transition-all shadow-md hover:shadow-lg"
              >
                🗑️ Clear
              </button>
            </div>
          </div>
          
          {/* Saved Combinations */}
          <div className="bg-white rounded-lg p-2 overflow-y-auto flex-1 shadow-inner border border-green-200">
            {includedCombinations.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-4 italic">📝 No combinations added yet</p>
            ) : (
              <div className="space-y-1.5">
                {includedCombinations.map((combo, idx) => (
                  <div
                    key={idx}
                    className="combo-chip bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-2 flex justify-between items-center shadow-sm hover:border-green-400 animate-scale-in"
                  >
                    <span className="text-xs font-semibold text-gray-700 break-all flex items-center">
                      <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                      <span>{combo}</span>
                    </span>
                    <button
                      onClick={() => onRemoveCombination(idx, 'include')}
                      title="Remove this combination"
                      className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-lg text-xs transition-all flex-shrink-0 ml-2 shadow-sm hover:shadow-md hover:scale-110 font-bold"
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
        <div className="col-span-5 p-2 bg-gradient-to-br from-red-50 to-red-100 rounded-xl flex flex-col overflow-hidden panel-glow-red shadow-md">
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <span className="text-xs font-bold text-red-700 flex items-center space-x-1.5">
              <span className="text-sm">❌</span>
              <span>Exclude Combinations</span>
              <span className="badge bg-red-500 text-white px-2 py-0.5 rounded-full text-xs shadow-sm">
                {excludedCombinations.length}
              </span>
            </span>
          </div>
          
          {/* Builder */}
          <div className="bg-white border-2 border-red-300 rounded-lg p-2 mb-2 flex-shrink-0 shadow-sm">
            <div className={`min-h-12 max-h-32 overflow-y-auto rounded-lg p-2 mb-2 ${
              excludeBuilder.length > 0 ? 'has-items bg-red-50' : 'bg-gradient-to-br from-red-50 to-white'
            } border-2 border-dashed border-red-300`}>
              {excludeBuilder.length === 0 ? (
                <p className="text-gray-400 text-xs text-center py-2 italic">👆 Click columns to add...</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {excludeBuilder.map((col, idx) => (
                    <div
                      key={idx}
                      className="bg-gradient-to-r from-red-500 to-red-600 text-white px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-md hover:shadow-lg transition-all hover:scale-105 animate-scale-in"
                    >
                      <span>{col}</span>
                      <button
                        onClick={() => onRemoveFromBuilder(idx, 'exclude')}
                        className="hover:text-yellow-200 font-bold text-base leading-none hover:scale-125 transition-transform"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={onAddExcludeCombination}
                title="Add this combination to the list"
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-1.5 rounded-lg text-xs font-semibold transition-all shadow-md hover:shadow-lg hover:scale-105"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => onClearBuilder('exclude')}
                title="Clear the builder"
                className="flex-1 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white px-2 py-1 rounded-lg text-xs font-semibold transition-all shadow-md hover:shadow-lg"
              >
                🗑️ Clear
              </button>
            </div>
          </div>
          
          {/* Saved Combinations */}
          <div className="bg-white rounded-lg p-2 overflow-y-auto flex-1 shadow-inner border border-red-200">
            {excludedCombinations.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-4 italic">📝 No combinations added yet</p>
            ) : (
              <div className="space-y-1.5">
                {excludedCombinations.map((combo, idx) => (
                  <div
                    key={idx}
                    className="combo-chip bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-lg p-2 flex justify-between items-center shadow-sm hover:border-red-400 animate-scale-in"
                  >
                    <span className="text-xs font-semibold text-gray-700 break-all flex items-center">
                      <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                      <span>{combo}</span>
                    </span>
                    <button
                      onClick={() => onRemoveCombination(idx, 'exclude')}
                      title="Remove this combination"
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-lg text-xs transition-all flex-shrink-0 ml-2 shadow-sm hover:shadow-md hover:scale-110 font-bold"
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
  );
};

export default ColumnBuilder;