"""
Test Script for Enterprise Chunked Comparison Export
Demonstrates the complete workflow with sample data
"""
import os
import pandas as pd
import time
from pathlib import Path
from chunked_file_exporter import (
    ChunkedFileExporter,
    get_comparison_export_files,
    read_export_file_paginated,
    get_export_summary,
    cleanup_export_files
)

# Test configuration
TEST_RUN_ID = 9999
TEST_DIR = os.path.join(os.path.dirname(__file__), 'test_data')
os.makedirs(TEST_DIR, exist_ok=True)


def generate_test_files(rows_a=10000, rows_b=8000, overlap=6000):
    """
    Generate test CSV files with controlled overlap.
    
    Args:
        rows_a: Number of rows in file A
        rows_b: Number of rows in file B
        overlap: Number of rows that should match between files
    """
    print(f"\n{'='*60}")
    print(f"Generating Test Files")
    print(f"{'='*60}")
    print(f"File A: {rows_a:,} rows")
    print(f"File B: {rows_b:,} rows")
    print(f"Expected overlap: {overlap:,} rows")
    
    # Generate File A
    data_a = {
        'customer_id': [f'C{i:06d}' for i in range(rows_a)],
        'order_id': [f'O{i:08d}' for i in range(rows_a)],
        'order_date': [f'2025-01-{(i % 28) + 1:02d}' for i in range(rows_a)],
        'amount': [round(100 + (i * 0.5) % 900, 2) for i in range(rows_a)],
        'status': ['completed' if i % 3 == 0 else 'pending' for i in range(rows_a)],
        'product': [f'Product_{i % 50}' for i in range(rows_a)]
    }
    df_a = pd.DataFrame(data_a)
    file_a_path = os.path.join(TEST_DIR, 'test_file_a.csv')
    df_a.to_csv(file_a_path, index=False)
    print(f"✅ Generated File A: {file_a_path}")
    
    # Generate File B (with controlled overlap)
    # First 'overlap' rows match (0 to overlap-1), rest are unique to B
    customer_ids_b = []
    for i in range(rows_b):
        if i < overlap:
            # These match file A
            customer_ids_b.append(f'C{i:06d}')
        else:
            # These are unique to B (use high numbers not in A)
            customer_ids_b.append(f'C{(rows_a + i):06d}')
    
    data_b = {
        'customer_id': customer_ids_b,
        'order_id': [f'O{i:08d}' for i in range(rows_b)],
        'order_date': [f'2025-02-{(i % 28) + 1:02d}' for i in range(rows_b)],
        'amount': [round(150 + (i * 0.7) % 850, 2) for i in range(rows_b)],
        'status': ['shipped' if i % 2 == 0 else 'delivered' for i in range(rows_b)],
        'product': [f'Product_{i % 40}' for i in range(rows_b)]
    }
    df_b = pd.DataFrame(data_b)
    file_b_path = os.path.join(TEST_DIR, 'test_file_b.csv')
    df_b.to_csv(file_b_path, index=False)
    print(f"✅ Generated File B: {file_b_path}")
    
    expected_matched = overlap
    expected_only_a = rows_a - overlap
    expected_only_b = rows_b - overlap
    
    print(f"\nExpected Results:")
    print(f"  Matched:    {expected_matched:,} rows")
    print(f"  Only in A:  {expected_only_a:,} rows")
    print(f"  Only in B:  {expected_only_b:,} rows")
    
    return file_a_path, file_b_path, {
        'matched': expected_matched,
        'only_a': expected_only_a,
        'only_b': expected_only_b
    }


def test_comparison_export(file_a_path, file_b_path, expected_results):
    """Test the complete comparison export workflow"""
    print(f"\n{'='*60}")
    print(f"Testing Chunked Comparison Export")
    print(f"{'='*60}")
    
    # Clean up any previous test exports
    cleanup_export_files(run_id=TEST_RUN_ID)
    
    # Create exporter
    exporter = ChunkedFileExporter(TEST_RUN_ID, file_a_path, file_b_path)
    
    # Test 1: Single column comparison
    print(f"\n📊 Test 1: Single Column Comparison (customer_id)")
    start_time = time.time()
    result = exporter.compare_and_export(columns=['customer_id'])
    elapsed = time.time() - start_time
    
    print(f"\n✅ Comparison completed in {elapsed:.2f}s")
    print(f"   Matched:    {result['matched_count']:,} (expected: {expected_results['matched']:,})")
    print(f"   Only in A:  {result['only_a_count']:,} (expected: {expected_results['only_a']:,})")
    print(f"   Only in B:  {result['only_b_count']:,} (expected: {expected_results['only_b']:,})")
    print(f"   Match Rate: {result['match_rate']:.2f}%")
    
    # Verify counts
    assert result['matched_count'] == expected_results['matched'], "Matched count mismatch!"
    assert result['only_a_count'] == expected_results['only_a'], "Only A count mismatch!"
    assert result['only_b_count'] == expected_results['only_b'], "Only B count mismatch!"
    print(f"✅ All counts match expected values!")
    
    # Test 2: Multi-column comparison
    print(f"\n📊 Test 2: Multi-Column Comparison (customer_id, order_id)")
    start_time = time.time()
    result2 = exporter.compare_and_export(columns=['customer_id', 'order_id'])
    elapsed = time.time() - start_time
    
    print(f"\n✅ Comparison completed in {elapsed:.2f}s")
    print(f"   Matched:    {result2['matched_count']:,}")
    print(f"   Only in A:  {result2['only_a_count']:,}")
    print(f"   Only in B:  {result2['only_b_count']:,}")
    print(f"   Match Rate: {result2['match_rate']:.2f}%")
    
    return result


def test_export_files(expected_results):
    """Test retrieving export file information"""
    print(f"\n{'='*60}")
    print(f"Testing Export File Retrieval")
    print(f"{'='*60}")
    
    # Get all export files for the run
    files = get_comparison_export_files(TEST_RUN_ID)
    
    print(f"\n✅ Found {len(files)} export files")
    for file in files:
        print(f"\n   Category: {file['category']}")
        print(f"   Columns: {file['columns']}")
        print(f"   Rows: {file['row_count']:,}")
        print(f"   Size: {file['file_size_mb']:.2f} MB")
        print(f"   Path: {file['file_path']}")
        print(f"   Exists: {file['exists']}")
        
        # Verify file exists
        assert file['exists'], f"File does not exist: {file['file_path']}"
    
    return files


def test_pagination(files):
    """Test paginated reading from export files"""
    print(f"\n{'='*60}")
    print(f"Testing Pagination")
    print(f"{'='*60}")
    
    # Test reading from matched file
    matched_file = next((f for f in files if f['category'] == 'matched'), None)
    if not matched_file:
        print("⚠️  No matched file found, skipping pagination test")
        return
    
    print(f"\n📄 Testing pagination on matched file ({matched_file['row_count']:,} rows)")
    
    # Test 1: First page
    print(f"\n   Test 1: First page (rows 0-99)")
    result = read_export_file_paginated(matched_file['file_path'], offset=0, limit=100)
    
    print(f"   ✅ Retrieved {result['showing']} records")
    print(f"   Total records: {result['total']:,}")
    print(f"   Has more: {result['has_more']}")
    
    assert len(result['records']) > 0, "No records returned!"
    assert result['total'] == matched_file['row_count'], "Total count mismatch!"
    
    # Display first record
    if result['records']:
        print(f"\n   Sample record (first row):")
        for key, value in result['records'][0].items():
            print(f"     {key}: {value}")
    
    # Test 2: Middle page
    if result['total'] > 500:
        print(f"\n   Test 2: Middle page (rows 500-599)")
        result2 = read_export_file_paginated(matched_file['file_path'], offset=500, limit=100)
        print(f"   ✅ Retrieved {result2['showing']} records")
        assert len(result2['records']) > 0, "No records returned from middle page!"
    
    # Test 3: Last page
    if result['total'] > 100:
        last_offset = (result['total'] // 100) * 100
        print(f"\n   Test 3: Last page (rows {last_offset}-end)")
        result3 = read_export_file_paginated(matched_file['file_path'], offset=last_offset, limit=100)
        print(f"   ✅ Retrieved {result3['showing']} records")
        print(f"   Has more: {result3['has_more']}")
        assert not result3['has_more'], "Should not have more records on last page!"


def test_export_summary():
    """Test export summary retrieval"""
    print(f"\n{'='*60}")
    print(f"Testing Export Summary")
    print(f"{'='*60}")
    
    summary = get_export_summary(TEST_RUN_ID)
    
    print(f"\n✅ Export Summary for Run {TEST_RUN_ID}:")
    print(f"   Total Comparisons: {summary['total_comparisons']}")
    print(f"   Total Files: {summary['total_files']}")
    print(f"   Total Size: {summary['total_size_mb']:.2f} MB")
    
    for comp in summary['comparisons']:
        print(f"\n   Comparison: {comp['columns']}")
        print(f"     Files: {len(comp['files'])}")
        print(f"     Total Rows: {comp['total_rows']:,}")
        print(f"     Total Size: {comp['total_size_mb']:.2f} MB")


def test_cleanup():
    """Test cleanup functionality"""
    print(f"\n{'='*60}")
    print(f"Testing Cleanup")
    print(f"{'='*60}")
    
    print(f"\n🗑️  Cleaning up test exports for run {TEST_RUN_ID}...")
    cleanup_export_files(run_id=TEST_RUN_ID)
    
    # Verify cleanup
    files = get_comparison_export_files(TEST_RUN_ID)
    assert len(files) == 0, "Files not cleaned up properly!"
    
    print(f"✅ Cleanup successful - all test exports removed")


def main():
    """Run all tests"""
    print(f"\n{'='*60}")
    print(f"🧪 Enterprise Chunked Comparison Export - Test Suite")
    print(f"{'='*60}")
    
    try:
        # Generate test files
        file_a_path, file_b_path, expected_results = generate_test_files(
            rows_a=10000,
            rows_b=8000,
            overlap=6000
        )
        
        # Test comparison export
        result = test_comparison_export(file_a_path, file_b_path, expected_results)
        
        # Test file retrieval
        files = test_export_files(expected_results)
        
        # Test pagination
        test_pagination(files)
        
        # Test summary
        test_export_summary()
        
        # Test cleanup
        test_cleanup()
        
        print(f"\n{'='*60}")
        print(f"✅ ALL TESTS PASSED!")
        print(f"{'='*60}")
        print(f"\nThe enterprise chunked comparison export system is working correctly!")
        print(f"Ready for production use with files of any size.")
        
    except Exception as e:
        print(f"\n{'='*60}")
        print(f"❌ TEST FAILED!")
        print(f"{'='*60}")
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    finally:
        # Clean up test files
        print(f"\n🗑️  Cleaning up test files...")
        for file in ['test_file_a.csv', 'test_file_b.csv']:
            file_path = os.path.join(TEST_DIR, file)
            if os.path.exists(file_path):
                os.remove(file_path)
        print(f"✅ Test files removed")
    
    return 0


if __name__ == "__main__":
    exit(main())

