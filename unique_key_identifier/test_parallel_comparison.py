#!/usr/bin/env python3
"""
Test Script for Parallel Comparison System
Demonstrates usage and validates functionality
"""
import os
import sys
import time
import pandas as pd
import numpy as np
from datetime import datetime

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from parallel_processor import ChunkedFileProcessor, ParallelComparator, process_large_files_parallel
from job_queue import working_dir_manager
from export_manager import ExportManager


def generate_test_data(filename, rows=10000, columns=10, duplicate_rate=0.1):
    """Generate test CSV file with some duplicates"""
    print(f"\n📝 Generating test file: {filename}")
    print(f"   Rows: {rows:,}, Columns: {columns}, Duplicate Rate: {duplicate_rate:.0%}")
    
    # Create data
    data = {
        'id': range(rows),
        'timestamp': pd.date_range('2024-01-01', periods=rows, freq='1min'),
    }
    
    # Add random columns
    for i in range(columns - 2):
        data[f'col_{i}'] = np.random.choice(['A', 'B', 'C', 'D', 'E'], size=rows)
    
    df = pd.DataFrame(data)
    
    # Introduce duplicates
    num_duplicates = int(rows * duplicate_rate)
    if num_duplicates > 0:
        duplicate_indices = np.random.choice(rows, num_duplicates, replace=False)
        for idx in duplicate_indices:
            # Duplicate a random earlier row
            source_idx = np.random.randint(0, idx) if idx > 0 else 0
            df.loc[idx, 'id'] = df.loc[source_idx, 'id']
    
    # Save to CSV
    df.to_csv(filename, index=False)
    file_size = os.path.getsize(filename) / (1024 * 1024)
    print(f"   ✅ Created: {filename} ({file_size:.2f} MB)")
    
    return filename


def test_chunked_processing():
    """Test 1: Chunked file processing"""
    print("\n" + "="*80)
    print("TEST 1: Chunked File Processing")
    print("="*80)
    
    # Generate test file
    test_file = generate_test_data('test_chunk_file.csv', rows=50000, columns=20)
    
    try:
        # Initialize processor
        processor = ChunkedFileProcessor(chunk_size_mb=5)
        
        # Read in chunks
        print("\n📊 Reading file in chunks...")
        chunks = processor.read_file_in_chunks(test_file, delimiter=',')
        
        print(f"\n✅ SUCCESS: Created {len(chunks)} chunks")
        print(f"   Total rows: {sum(len(chunk) for chunk in chunks):,}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        # Cleanup
        if os.path.exists(test_file):
            os.remove(test_file)


def test_parallel_comparison():
    """Test 2: Parallel comparison"""
    print("\n" + "="*80)
    print("TEST 2: Parallel Comparison")
    print("="*80)
    
    # Generate test files
    file_a = generate_test_data('test_file_a.csv', rows=100000, columns=15, duplicate_rate=0.05)
    file_b = generate_test_data('test_file_b.csv', rows=100000, columns=15, duplicate_rate=0.05)
    
    try:
        # Create working directory
        run_id = f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        working_dir = working_dir_manager.create_run_directory(run_id, metadata={
            'test': True,
            'file_a': file_a,
            'file_b': file_b
        })
        
        print(f"\n📁 Working directory: {working_dir}")
        
        # Run parallel comparison
        print("\n⚡ Running parallel comparison...")
        key_columns = ['id']
        
        start_time = time.time()
        
        results = process_large_files_parallel(
            file_a_path=file_a,
            file_b_path=file_b,
            key_columns=key_columns,
            working_dir=working_dir,
            delimiter_a=',',
            delimiter_b=',',
            chunk_size_mb=10,
            max_workers=2
        )
        
        elapsed_time = time.time() - start_time
        
        # Validate results
        print(f"\n✅ SUCCESS: Comparison completed in {elapsed_time:.2f} seconds")
        print(f"\n📊 Results Summary:")
        print(f"   Side A: {results['side_a']['total_rows']:,} rows, "
              f"{results['side_a']['unique_keys']:,} unique keys")
        print(f"   Side B: {results['side_b']['total_rows']:,} rows, "
              f"{results['side_b']['unique_keys']:,} unique keys")
        print(f"   Matched: {results['comparison']['matched']['count_keys']:,} keys")
        print(f"   Only in A: {results['comparison']['only_in_a']['count_keys']:,} keys")
        print(f"   Only in B: {results['comparison']['only_in_b']['count_keys']:,} keys")
        print(f"   Match Rate: {results['comparison']['summary']['match_rate_by_keys']:.2f}%")
        
        return True
        
    except Exception as e:
        print(f"\n❌ FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        # Cleanup
        for f in [file_a, file_b]:
            if os.path.exists(f):
                os.remove(f)


def test_export_manager():
    """Test 3: Export functionality"""
    print("\n" + "="*80)
    print("TEST 3: Export Manager")
    print("="*80)
    
    try:
        # Create working directory
        run_id = f"test_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        working_dir = working_dir_manager.create_run_directory(run_id, metadata={'test': True})
        
        # Create mock results
        mock_results = {
            'run_id': run_id,
            'timestamp': datetime.now().isoformat(),
            'key_columns': ['id', 'timestamp'],
            'side_a': {
                'total_rows': 100000,
                'unique_keys': 95000,
                'duplicate_keys': 5000,
                'chunks_processed': 10
            },
            'side_b': {
                'total_rows': 100000,
                'unique_keys': 96000,
                'duplicate_keys': 4000,
                'chunks_processed': 10
            },
            'comparison': {
                'summary': {
                    'total_unique_keys_a': 95000,
                    'total_unique_keys_b': 96000,
                    'matched_keys': 90000,
                    'only_in_a_keys': 5000,
                    'only_in_b_keys': 6000,
                    'match_rate_by_keys': 94.74,
                    'match_rate_by_rows_a': 90.0,
                    'match_rate_by_rows_b': 93.75
                },
                'matched': {'sample_keys': []},
                'only_in_a': {'sample_keys': []},
                'only_in_b': {'sample_keys': []}
            },
            'duplicates': {
                'side_a': [],
                'side_b': []
            }
        }
        
        # Test exports
        export_mgr = ExportManager(working_dir)
        
        print("\n📥 Testing CSV export...")
        csv_files = export_mgr.export_comparison_to_csv(mock_results)
        print(f"   ✅ Exported {len(csv_files)} CSV files")
        
        print("\n📊 Testing Excel export...")
        excel_file = export_mgr.export_comparison_to_excel(mock_results)
        print(f"   ✅ Exported Excel file: {os.path.basename(excel_file)}")
        
        print("\n📄 Testing HTML export...")
        html_file = export_mgr.create_comparison_report_html(mock_results)
        print(f"   ✅ Exported HTML file: {os.path.basename(html_file)}")
        
        print(f"\n✅ SUCCESS: All exports created in {working_dir}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_existing_files():
    """Test 4: Using existing sample files"""
    print("\n" + "="*80)
    print("TEST 4: Existing Sample Files (if available)")
    print("="*80)
    
    # Check for existing files
    file_a = 'trading_system_a.csv'
    file_b = 'trading_system_b.csv'
    
    if not os.path.exists(file_a) or not os.path.exists(file_b):
        print(f"\n⚠️  SKIPPED: Sample files not found ({file_a}, {file_b})")
        return True
    
    try:
        # Get file info
        size_a = os.path.getsize(file_a) / (1024 * 1024)
        size_b = os.path.getsize(file_b) / (1024 * 1024)
        
        print(f"\n📂 Found sample files:")
        print(f"   {file_a}: {size_a:.2f} MB")
        print(f"   {file_b}: {size_b:.2f} MB")
        
        # Create working directory
        run_id = f"test_sample_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        working_dir = working_dir_manager.create_run_directory(run_id, metadata={
            'test': True,
            'file_a': file_a,
            'file_b': file_b
        })
        
        # Run comparison
        print("\n⚡ Running comparison...")
        
        start_time = time.time()
        
        results = process_large_files_parallel(
            file_a_path=file_a,
            file_b_path=file_b,
            key_columns=['trade_id'],
            working_dir=working_dir,
            delimiter_a=',',
            delimiter_b=',',
            chunk_size_mb=50,
            max_workers=None  # Auto-detect
        )
        
        elapsed_time = time.time() - start_time
        
        print(f"\n✅ SUCCESS: Completed in {elapsed_time:.2f} seconds")
        print(f"\n📊 Results:")
        print(f"   Matched: {results['comparison']['matched']['count_keys']:,} keys")
        print(f"   Match Rate: {results['comparison']['summary']['match_rate_by_keys']:.2f}%")
        print(f"   Working Dir: {working_dir}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("🧪 PARALLEL COMPARISON SYSTEM - TEST SUITE")
    print("="*80)
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = []
    
    # Run tests
    tests = [
        ("Chunked Processing", test_chunked_processing),
        ("Parallel Comparison", test_parallel_comparison),
        ("Export Manager", test_export_manager),
        ("Existing Sample Files", test_existing_files),
    ]
    
    for test_name, test_func in tests:
        try:
            success = test_func()
            results.append((test_name, success))
        except Exception as e:
            print(f"\n❌ Test '{test_name}' crashed: {str(e)}")
            results.append((test_name, False))
    
    # Print summary
    print("\n" + "="*80)
    print("📊 TEST SUMMARY")
    print("="*80)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    print(f"\nTotal: {passed}/{total} tests passed ({passed/total*100:.0f}%)")
    print(f"Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80 + "\n")
    
    return passed == total


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

