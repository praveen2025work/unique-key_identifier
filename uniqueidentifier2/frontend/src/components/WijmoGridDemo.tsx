'use client';

import React, { useState, useMemo } from 'react';
import WijmoDataGrid from './WijmoDataGrid';
import toast from 'react-hot-toast';

/**
 * Demo component to test Wijmo Grid functionality
 * This shows how the grid handles large datasets with pagination
 */
export default function WijmoGridDemo() {
  const [recordCount, setRecordCount] = useState(1000);
  const [pageSize, setPageSize] = useState(100);
  const [loading, setLoading] = useState(false);

  // Generate sample data
  const sampleData = useMemo(() => {
    console.time('Generating sample data');
    const data = [];
    for (let i = 1; i <= recordCount; i++) {
      data.push({
        id: i,
        name: `Record ${i}`,
        email: `user${i}@example.com`,
        department: ['Sales', 'Marketing', 'Engineering', 'HR'][i % 4],
        salary: Math.floor(Math.random() * 100000) + 50000,
        status: i % 3 === 0 ? 'Active' : i % 3 === 1 ? 'Inactive' : 'Pending',
        joinDate: new Date(2020 + (i % 5), (i % 12), (i % 28) + 1).toISOString().split('T')[0],
        score: (Math.random() * 100).toFixed(2),
      });
    }
    console.timeEnd('Generating sample data');
    return data;
  }, [recordCount]);

  const columns = [
    { binding: 'id', header: 'ID', width: 80, align: 'center' },
    { binding: 'name', header: 'Name', width: 200 },
    { binding: 'email', header: 'Email', width: 250 },
    { binding: 'department', header: 'Department', width: 150 },
    { binding: 'salary', header: 'Salary', width: 120, format: 'c0', align: 'right' },
    { binding: 'status', header: 'Status', width: 120, align: 'center' },
    { binding: 'joinDate', header: 'Join Date', width: 130, align: 'center' },
    { binding: 'score', header: 'Score', width: 100, align: 'center' },
  ];

  const handleGenerateMore = (count: number) => {
    setLoading(true);
    toast.loading('Generating data...', { id: 'generate' });
    
    setTimeout(() => {
      setRecordCount(count);
      setLoading(false);
      toast.success(`Generated ${count.toLocaleString()} records`, { id: 'generate' });
    }, 100);
  };

  const handleLoadMore = (page: number) => {
    console.log(`Loading page ${page}`);
    // In a real app, you would fetch data from API here
  };

  const handleSelectionChanged = (items: any[]) => {
    console.log('Selected items:', items);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Wijmo FlexGrid Demo
          </h1>
          <p className="text-gray-600">
            Test the performance and memory optimization with large datasets
          </p>

          {/* Controls */}
          <div className="mt-6 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Dataset Size:
              </label>
              <select
                value={recordCount}
                onChange={(e) => handleGenerateMore(Number(e.target.value))}
                disabled={loading}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
              >
                <option value={100}>100 records</option>
                <option value={500}>500 records</option>
                <option value={1000}>1,000 records</option>
                <option value={5000}>5,000 records</option>
                <option value={10000}>10,000 records</option>
                <option value={50000}>50,000 records</option>
                <option value={100000}>100,000 records</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Page Size:
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
                <option value={200}>200 per page</option>
                <option value={500}>500 per page</option>
              </select>
            </div>

            <div className="flex items-center gap-4 ml-auto">
              <div className="text-sm text-gray-600">
                Total Records: <span className="font-bold text-indigo-600">{recordCount.toLocaleString()}</span>
              </div>
              <button
                onClick={() => {
                  console.log('Current memory usage:', performance.memory);
                  toast.success('Check browser console for memory info');
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Check Memory
              </button>
            </div>
          </div>

          {/* Performance Info */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900">Performance Optimization</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Wijmo FlexGrid uses virtual scrolling - only {pageSize} rows are rendered at a time, 
                  even with {recordCount.toLocaleString()} total records. This ensures smooth performance 
                  and prevents memory issues.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Data Grid ({sampleData.length.toLocaleString()} records)
          </h2>
          
          <WijmoDataGrid
            data={sampleData}
            columns={columns}
            pageSize={pageSize}
            allowPaging={true}
            allowSorting={true}
            allowFiltering={true}
            loading={loading}
            totalItems={sampleData.length}
            onLoadMoreData={handleLoadMore}
            onSelectionChanged={handleSelectionChanged}
            height={600}
            showRowNumbers={true}
            frozenColumns={1}
            className="border rounded-lg"
          />
        </div>

        {/* Feature Highlights */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h3 className="font-semibold text-green-900">Virtual Scrolling</h3>
            </div>
            <p className="text-sm text-green-700">
              Only visible rows are rendered, providing smooth scrolling for millions of records.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              <h3 className="font-semibold text-blue-900">Built-in Filtering</h3>
            </div>
            <p className="text-sm text-blue-700">
              Click column headers to access powerful filtering options.
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
              </svg>
              <h3 className="font-semibold text-purple-900">Memory Optimized</h3>
            </div>
            <p className="text-sm text-purple-700">
              Efficient memory usage prevents browser crashes with large datasets.
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-gray-100 border border-gray-300 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Try These Features:
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">1.</span>
              <span>Click column headers to sort data ascending/descending</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">2.</span>
              <span>Use the filter icon in column headers to filter data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">3.</span>
              <span>Try generating 50,000+ records to test performance</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">4.</span>
              <span>Use pagination controls at the bottom to navigate pages</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">5.</span>
              <span>Click "Check Memory" and open DevTools Console to see memory usage</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

