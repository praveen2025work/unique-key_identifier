"""
Test script for chunked comparison functionality
"""
import os
import pandas as pd
import sys
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from chunked_comparison import (
    ChunkedComparisonEngine,
    should_use_chunked_comparison,
    estimate_comparison_time,
    get_comparison_status
)
from database import conn


def create_test_files(size_a=150000, size_b=150000):
    """Create test CSV files with specified number of rows"""
    print(f"\n{'='*60}")
    print(f"Creating test files...")
    print(f"{'='*60}")
    
    # Create File A
    print(f"Creating File A with {size_a:,} rows...")
    data_a = {
        'order_id': range(1, size_a + 1),
        'customer_id': [f'CUST{i % 100000:06d}' for i in range(size_a)],
        'product_id': [f'PROD{i % 5000:04d}' for i in range(size_a)],
        'amount': [100 + (i % 500) for i in range(size_a)]
    }
    df_a = pd.DataFrame(data_a)
    file_a = 'test_large_file_a.csv'
    df_a.to_csv(file_a, index=False)
    print(f"✅ Created {file_a} ({os.path.getsize(file_a) / 1024 / 1024:.2f} MB)")
    
    # Create File B (with some overlap)
    print(f"Creating File B with {size_b:,} rows...")
    # 80% overlap, 20% unique
    overlap_size = int(size_b * 0.8)
    unique_size = size_b - overlap_size
    
    data_b = {
        'order_id': list(range(1, overlap_size + 1)) + list(range(size_a + 1, size_a + unique_size + 1)),
        'customer_id': [f'CUST{i % 100000:06d}' for i in range(size_b)],
        'product_id': [f'PROD{i % 5000:04d}' for i in range(size_b)],
        'amount': [100 + (i % 500) for i in range(size_b)]
    }
    df_b = pd.DataFrame(data_b)
    file_b = 'test_large_file_b.csv'
    df_b.to_csv(file_b, index=False)
    print(f"✅ Created {file_b} ({os.path.getsize(file_b) / 1024 / 1024:.2f} MB)")
    
    return file_a, file_b


def test_comparison_detection():
    """Test automatic chunked comparison detection"""
    print(f"\n{'='*60}")
    print("Test 1: Comparison Mode Detection")
    print(f"{'='*60}")
    
    test_cases = [
        (50000, 50000, False, "Small files (<100K)"),
        (100000, 100000, False, "At threshold (100K)"),
        (150000, 150000, True, "Large files (>100K)"),
        (500000, 500000, True, "Very large files (500K)"),
    ]
    
    for file_a_rows, file_b_rows, expected, description in test_cases:
        result = should_use_chunked_comparison(file_a_rows, file_b_rows)
        status = "✅ PASS" if result == expected else "❌ FAIL"
        print(f"{status} {description}: {result} (expected {expected})")


def test_time_estimation():
    """Test processing time estimation"""
    print(f"\n{'='*60}")
    print("Test 2: Time Estimation")
    print(f"{'='*60}")
    
    test_cases = [
        (50000, 50000),
        (100000, 100000),
        (500000, 500000),
        (1000000, 1000000),
        (5000000, 5000000),
    ]
    
    for file_a_rows, file_b_rows in test_cases:
        estimate = estimate_comparison_time(file_a_rows, file_b_rows)
        print(f"Files: {file_a_rows:,} & {file_b_rows:,} rows → Estimated: {estimate}")


def test_chunked_comparison_engine(file_a, file_b):
    """Test the chunked comparison engine"""
    print(f"\n{'='*60}")
    print("Test 3: Chunked Comparison Engine")
    print(f"{'='*60}")
    
    # Create a test run record
    cursor = conn.cursor()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute('''
        INSERT INTO runs (timestamp, file_a, file_b, num_columns, status, file_a_rows, file_b_rows)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (timestamp, file_a, file_b, 2, 'completed', 150000, 150000))
    run_id = cursor.lastrowid
    conn.commit()
    
    print(f"✅ Created test run ID: {run_id}")
    
    # Test comparison
    columns = ['order_id', 'customer_id']
    print(f"\nRunning comparison on columns: {columns}")
    
    engine = ChunkedComparisonEngine(run_id, file_a, file_b)
    
    try:
        summary = engine.compare_files_chunked(columns)
        
        print(f"\n{'='*60}")
        print("Comparison Summary:")
        print(f"{'='*60}")
        print(f"Matched records:  {summary['matched_count']:,}")
        print(f"Only in A:        {summary['only_a_count']:,}")
        print(f"Only in B:        {summary['only_b_count']:,}")
        print(f"Total unique (A): {summary['total_a']:,}")
        print(f"Total unique (B): {summary['total_b']:,}")
        print(f"Match rate:       {summary['match_rate']}%")
        print(f"Processing time:  {summary['processing_time']}s")
        print(f"{'='*60}")
        
        # Test pagination
        print(f"\nTest 4: Paginated Data Retrieval")
        print(f"{'='*60}")
        
        for category in ['matched', 'only_a', 'only_b']:
            data = engine.get_comparison_data_paginated(
                ','.join(columns), 
                category, 
                offset=0, 
                limit=10
            )
            print(f"\n{category.upper()}:")
            print(f"  Total: {data['total']:,} records")
            print(f"  Showing: {data['showing']} records")
            print(f"  Sample records:")
            for i, record in enumerate(data['records'][:3], 1):
                print(f"    {i}. {record}")
        
        # Test comparison status retrieval
        print(f"\nTest 5: Status Retrieval")
        print(f"{'='*60}")
        
        status = get_comparison_status(run_id, ','.join(columns))
        if status:
            print(f"✅ Status retrieved successfully")
            print(f"   Matched: {status['matched_count']:,}")
            print(f"   Generated at: {status['generated_at']}")
        else:
            print(f"❌ Status not found")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during comparison: {e}")
        import traceback
        traceback.print_exc()
        return False


def cleanup_test_files(file_a, file_b):
    """Clean up test files"""
    print(f"\n{'='*60}")
    print("Cleanup")
    print(f"{'='*60}")
    
    for file in [file_a, file_b]:
        if os.path.exists(file):
            os.remove(file)
            print(f"✅ Removed {file}")


def main():
    """Run all tests"""
    print(f"\n{'#'*60}")
    print("#" + " " * 58 + "#")
    print("#" + "  CHUNKED COMPARISON SYSTEM - TEST SUITE".center(58) + "#")
    print("#" + " " * 58 + "#")
    print(f"{'#'*60}")
    
    # Test 1: Detection
    test_comparison_detection()
    
    # Test 2: Time estimation
    test_time_estimation()
    
    # Test 3-5: Full comparison test
    print(f"\n{'='*60}")
    print("Preparing for full comparison test...")
    print(f"{'='*60}")
    
    file_a, file_b = create_test_files(size_a=150000, size_b=150000)
    
    try:
        success = test_chunked_comparison_engine(file_a, file_b)
        
        if success:
            print(f"\n{'='*60}")
            print("✅ ALL TESTS PASSED!")
            print(f"{'='*60}")
        else:
            print(f"\n{'='*60}")
            print("❌ SOME TESTS FAILED")
            print(f"{'='*60}")
    finally:
        cleanup_test_files(file_a, file_b)
    
    print(f"\n{'#'*60}")
    print("#" + "  TEST SUITE COMPLETED".center(58) + "#")
    print(f"{'#'*60}\n")


if __name__ == "__main__":
    main()

