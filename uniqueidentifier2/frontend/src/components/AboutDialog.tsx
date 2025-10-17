import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { 
  InformationCircleIcon, 
  CpuChipIcon, 
  BookOpenIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ChartBarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AboutDialog: React.FC<AboutDialogProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <InformationCircleIcon className="w-7 h-7 text-blue-600" />
            About Unique Key Identifier
          </DialogTitle>
          <DialogDescription>
            Enterprise File Comparison & Data Reconciliation Platform v2.0
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Use Case Section */}
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
              Use Case & Purpose
            </h3>
            <p className="text-gray-700 mb-4">
              A high-performance data comparison platform that helps organizations identify unique keys 
              (combinations of columns) that can distinguish records between two large CSV/Excel files.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <h4 className="font-semibold text-gray-900 mb-2">Perfect For:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Trading Systems Reconciliation</strong> - Comparing trades from different systems</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Data Migration Validation</strong> - Ensuring data integrity after migrations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Database Reconciliation</strong> - Finding discrepancies between databases</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Audit & Compliance</strong> - Identifying data quality issues</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>ETL Validation</strong> - Verifying Extract, Transform, Load processes</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <h4 className="font-semibold text-gray-900 mb-2">Key Features:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Handles <strong>millions of records</strong> with intelligent chunking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Smart Keys AI:</strong> Discovers 2-10 column combinations (100-150 total) for optimal key discovery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Guided Discovery:</strong> Provide business hints - system enhances with intelligent variations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Optimized for <strong>300+ column datasets</strong> with combinatorial explosion prevention</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Identifies matching, unique, and duplicate records with full row-by-row comparison</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Comprehensive exports with data quality metrics and progressive loading</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Real-time progress tracking and background processing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Smart sampling strategies for files &gt;1M rows with adaptive thresholds</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Tech Stack Section */}
          <section className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CpuChipIcon className="w-6 h-6 text-purple-600" />
              Technology Stack
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Backend */}
              <div className="bg-white p-5 rounded-lg border border-purple-100">
                <h4 className="font-bold text-gray-900 mb-3 text-lg">Backend (Python/FastAPI)</h4>
                
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-sm text-gray-700 mb-1">Core Framework:</p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• FastAPI 0.103.2 - Modern REST API framework</li>
                      <li>• Uvicorn 0.22.0 - ASGI server</li>
                      <li>• SQLite - Embedded database for job tracking</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-sm text-gray-700 mb-1">Data Processing:</p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Pandas 1.3.5 - Data manipulation & analysis</li>
                      <li>• NumPy 1.21.6 - Numerical computations</li>
                      <li>• XlsxWriter 3.0.9 - Excel file generation</li>
                      <li>• OpenPyXL 3.0.10 - Excel file reading</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-sm text-gray-700 mb-1">AI & Advanced Features:</p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• <strong>Intelligent Key Discovery</strong> - AI-powered 2-10 column search</li>
                      <li>• <strong>Guided Discovery</strong> - Business hint enhancement</li>
                      <li>• Background job processing with threading</li>
                      <li>• Chunked comparison engine for large files</li>
                      <li>• Smart caching & progressive loading</li>
                      <li>• Audit logging & notification system</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Frontend */}
              <div className="bg-white p-5 rounded-lg border border-purple-100">
                <h4 className="font-bold text-gray-900 mb-3 text-lg">Frontend (Next.js/React)</h4>
                
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-sm text-gray-700 mb-1">Core Framework:</p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Next.js 14.2.0 - React framework with SSR/SSG</li>
                      <li>• React 18.2.0 - UI library</li>
                      <li>• TypeScript 5.8.2 - Type safety</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-sm text-gray-700 mb-1">UI Components:</p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Tailwind CSS 3.4.1 - Utility-first styling</li>
                      <li>• Radix UI - Accessible component primitives</li>
                      <li>• Framer Motion - Smooth animations</li>
                      <li>• Lucide React - Modern icon library</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-sm text-gray-700 mb-1">Enterprise Grid:</p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Wijmo FlexGrid 5.20252.42</li>
                      <li>• High-performance data grid with virtualization</li>
                      <li>• Handles millions of rows efficiently</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-sm text-gray-700 mb-1">State & Forms:</p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• React Hook Form - Form management</li>
                      <li>• Zod - Schema validation</li>
                      <li>• Axios - HTTP client</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* User Guide Section */}
          <section className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpenIcon className="w-6 h-6 text-green-600" />
              User Guide
            </h3>

            <div className="space-y-4">
              <div className="bg-white p-5 rounded-lg border border-green-100">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                  Upload Files
                </h4>
                <p className="text-gray-600 text-sm ml-8">
                  Upload two CSV or Excel files you want to compare. The system supports files with millions of records.
                  Supported formats: .csv, .txt, .dat, .xlsx, .xls
                </p>
              </div>

              <div className="bg-white p-5 rounded-lg border border-green-100">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                  Configure Analysis
                </h4>
                <div className="ml-8 space-y-3 text-sm text-gray-600">
                  <div>
                    <p className="font-semibold text-gray-800 mb-1">🤖 Smart Keys (Recommended for 300+ columns):</p>
                    <ul className="space-y-1 ml-4">
                      <li>• <strong>Without combinations:</strong> Auto discovers 2-10 column keys (100-150 total)</li>
                      <li>• <strong>With base hint:</strong> Each combination used as business base, system adds 2-10 columns</li>
                      <li>• <strong>Multiple combinations:</strong> ALL enhanced with AI (each gets ~100-150 variations)</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 mb-1">⚙️ Manual Mode (Smart Keys OFF):</p>
                    <ul className="space-y-1 ml-4">
                      <li>• Specify exact column combinations to analyze</li>
                      <li>• Number of Columns field controls combination size</li>
                      <li>• No AI enhancement - analyzes only what you specify</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 mb-1">🔧 Other Options:</p>
                    <ul className="space-y-1 ml-4">
                      <li>• <strong>Max Rows Limit:</strong> Optionally limit rows to process</li>
                      <li>• <strong>Data Quality Check:</strong> Comprehensive data quality metrics</li>
                      <li>• <strong>Exclude Combinations:</strong> Skip specific column combinations</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg border border-green-100">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                  Run Analysis
                </h4>
                <p className="text-gray-600 text-sm ml-8">
                  Click "Run Analysis" to start the comparison. The system will process files in the background and 
                  show real-time progress through multiple stages: Upload → Analysis → Comparison → Export.
                </p>
              </div>

              <div className="bg-white p-5 rounded-lg border border-green-100">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
                  View Results
                </h4>
                <p className="text-gray-600 text-sm ml-8 mb-2">
                  Once complete, view results in multiple formats:
                </p>
                <ul className="text-gray-600 text-sm ml-8 space-y-1">
                  <li>• <strong>Analysis Results:</strong> Summary of unique key combinations with match percentages</li>
                  <li>• <strong>Comparison View:</strong> Side-by-side comparison of records from both files</li>
                  <li>• <strong>Data Quality:</strong> Comprehensive data quality metrics and validation results</li>
                  <li>• <strong>Export Files:</strong> Download CSV/Excel files with unique records, duplicates, and comparisons</li>
                </ul>
              </div>

              <div className="bg-white p-5 rounded-lg border border-green-100">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-green-600" />
                  Understanding Results
                </h4>
                <ul className="text-gray-600 text-sm ml-8 space-y-2">
                  <li>
                    <strong className="text-gray-800">Unique Key:</strong> A combination of columns that uniquely identifies records
                    <br/>
                      <span className="text-xs text-gray-500">Example: &quot;desk + book + trade_date&quot; might be a unique key for trading data</span>
                  </li>
                  <li>
                    <strong className="text-gray-800">Match Percentage:</strong> How many records match between the two files
                    <br/>
                    <span className="text-xs text-gray-500">100% = Perfect match, &lt;100% = Some records are unique to one file</span>
                  </li>
                  <li>
                    <strong className="text-gray-800">Unique Records:</strong> Records that exist in one file but not the other
                  </li>
                  <li>
                    <strong className="text-gray-800">Duplicate Records:</strong> Records that appear multiple times in a single file
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Smart Keys Feature Section - NEW */}
          <section className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg border border-indigo-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CpuChipIcon className="w-6 h-6 text-indigo-600" />
              Smart Keys - AI-Powered Key Discovery
            </h3>

            <div className="space-y-4">
              <div className="bg-white p-5 rounded-lg border border-indigo-100">
                <h4 className="font-bold text-indigo-900 mb-3">🚀 Auto Discovery Mode</h4>
                <p className="text-gray-700 text-sm mb-2">
                  <strong>When to use:</strong> Don't know which columns form unique key
                </p>
                <p className="text-gray-600 text-sm mb-2">
                  <strong>How to use:</strong> Leave "Expected Combinations" empty + Enable Smart Keys
                </p>
                <div className="bg-indigo-50 p-3 rounded-md">
                  <p className="text-sm text-gray-700 mb-1"><strong>Result:</strong></p>
                  <ul className="text-xs text-gray-600 space-y-1 ml-4">
                    <li>• Searches 2, 3, 4, 5, 6, 7, 8, 9, 10 column combinations</li>
                    <li>• Gets 100-150 combinations (150 for 200+ columns)</li>
                    <li>• Balanced: ~12-16 combinations per size</li>
                    <li>• Example: 2-col(16) 3-col(16) 4-col(15) ... 10-col(13)</li>
                  </ul>
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg border border-indigo-100">
                <h4 className="font-bold text-indigo-900 mb-3">🎯 Guided Discovery Mode</h4>
                <p className="text-gray-700 text-sm mb-2">
                  <strong>When to use:</strong> Know partial business key, want system to enhance it
                </p>
                <p className="text-gray-600 text-sm mb-2">
                  <strong>How to use:</strong> Enter base combination (e.g., "customer_id, fiscal_year") + Enable Smart Keys
                </p>
                <div className="bg-indigo-50 p-3 rounded-md">
                  <p className="text-sm text-gray-700 mb-1"><strong>Result:</strong></p>
                  <ul className="text-xs text-gray-600 space-y-1 ml-4">
                    <li>• First combination becomes base (your business domain knowledge)</li>
                    <li>• System tries adding 2, 3, 4... up to 10 additional columns</li>
                    <li>• Gets 100-150 enhanced combinations all including your base</li>
                    <li>• Example: base + product_id, base + product_id + warehouse...</li>
                  </ul>
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg border border-indigo-100">
                <h4 className="font-bold text-indigo-900 mb-3">📋 Multiple Combinations - Enhanced Power Mode</h4>
                <p className="text-gray-700 text-sm mb-2">
                  <strong>When to use:</strong> Have multiple business-relevant keys to explore
                </p>
                <p className="text-gray-600 text-sm mb-2">
                  <strong>How to use:</strong> Enter multiple combinations (one per line) + Enable Smart Keys
                </p>
                <div className="bg-indigo-50 p-3 rounded-md">
                  <p className="text-sm text-gray-700 mb-1"><strong>Behavior (ENHANCED):</strong></p>
                  <ul className="text-xs text-gray-600 space-y-1 ml-4">
                    <li>• <strong>ALL combinations get intelligent enhancement!</strong></li>
                    <li>• Each combination becomes a base (~100-150 variations per base)</li>
                    <li>• System adds 2-10 additional columns to each base</li>
                    <li>• Example: 3 bases × 100 variations = ~300 total combinations</li>
                    <li>• Better results: Explores all your business knowledge thoroughly</li>
                  </ul>
                </div>
                <div className="bg-green-50 border border-green-200 p-2 rounded-md mt-2">
                  <p className="text-xs font-semibold text-green-800">
                    💡 Each of your combinations represents business logic - all will be enhanced!
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-lg border-2 border-yellow-300">
                <p className="text-sm font-semibold text-yellow-900 mb-2">💡 Pro Tip:</p>
                <p className="text-xs text-yellow-800">
                  For 300+ column datasets, always use Smart Keys to avoid combinatorial explosion. 
                  The "Number of Columns" field is ignored when Smart Keys is enabled - the system automatically 
                  searches 2-10 column combinations for comprehensive coverage.
                </p>
              </div>
            </div>
          </section>

          {/* Architecture Section */}
          <section className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-lg border border-orange-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ArrowPathIcon className="w-6 h-6 text-orange-600" />
              How It Works
            </h3>

            <div className="bg-white p-5 rounded-lg border border-orange-100">
              <ol className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                  <div>
                    <strong className="text-gray-900">File Upload & Validation:</strong> Files are uploaded to the backend and validated for format and structure
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                  <div>
                    <strong className="text-gray-900">Column Analysis:</strong> System analyzes all possible column combinations (1-5 columns) to find unique keys
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                  <div>
                    <strong className="text-gray-900">Chunked Comparison:</strong> Large files are processed in chunks (10k records per chunk) for memory efficiency
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">4</span>
                  <div>
                    <strong className="text-gray-900">Record Matching:</strong> Records are compared using identified unique keys to find matches, unique records, and duplicates
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">5</span>
                  <div>
                    <strong className="text-gray-900">Export Generation:</strong> Results are exported to CSV/Excel files with comprehensive comparison data
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">6</span>
                  <div>
                    <strong className="text-gray-900">Progressive Loading:</strong> Frontend displays results with pagination and virtual scrolling for smooth performance
                  </div>
                </li>
              </ol>
            </div>
          </section>

          {/* Version Info */}
          <div className="text-center py-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Unique Key Identifier v2.0 - Enterprise Edition
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Built with FastAPI, Next.js, React, and Wijmo FlexGrid
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AboutDialog;

