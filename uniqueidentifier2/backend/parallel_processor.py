"""
Parallel Processing Module for Large File Comparison
Implements chunked processing with multiprocessing for efficient large-scale data comparison
"""
import pandas as pd
import numpy as np
import os
import json
import multiprocessing as mp
from functools import partial
from datetime import datetime
import traceback
from typing import List, Dict, Tuple, Any
import hashlib

# Import configurations
from config import SCRIPT_DIR, SUPPORTED_EXTENSIONS


class ChunkedFileProcessor:
    """
    Handles large files by breaking them into manageable chunks
    for parallel processing
    """
    
    def __init__(self, chunk_size_mb=50, max_workers=None):
        """
        Initialize chunked processor
        
        Args:
            chunk_size_mb: Size of each chunk in MB (default 50MB)
            max_workers: Number of parallel workers (default: CPU count - 1)
        """
        self.chunk_size_mb = chunk_size_mb
        self.max_workers = max_workers or max(1, mp.cpu_count() - 1)
        
    def estimate_chunks(self, file_path: str, delimiter: str = ',') -> Tuple[int, int]:
        """
        Estimate number of chunks needed for a file
        
        Returns:
            (total_rows, num_chunks)
        """
        file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
        
        # Count rows efficiently
        with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
            total_rows = sum(1 for _ in f) - 1  # Subtract header
        
        # Calculate chunk size in rows
        avg_bytes_per_row = (file_size_mb * 1024 * 1024) / max(total_rows, 1)
        chunk_size_bytes = self.chunk_size_mb * 1024 * 1024
        rows_per_chunk = int(chunk_size_bytes / max(avg_bytes_per_row, 1))
        
        num_chunks = max(1, (total_rows + rows_per_chunk - 1) // rows_per_chunk)
        
        return total_rows, num_chunks, rows_per_chunk
    
    def read_file_in_chunks(self, file_path: str, delimiter: str = ',') -> List[pd.DataFrame]:
        """
        Read file in chunks and return list of DataFrames
        
        Returns:
            List of DataFrame chunks
        """
        total_rows, num_chunks, rows_per_chunk = self.estimate_chunks(file_path, delimiter)
        
        print(f"📊 File Analysis: {total_rows:,} rows → {num_chunks} chunks of ~{rows_per_chunk:,} rows")
        
        chunks = []
        
        # Read file in chunks
        try:
            for i, chunk in enumerate(pd.read_csv(
                file_path, 
                sep=delimiter, 
                chunksize=rows_per_chunk,
                encoding='utf-8',
                on_bad_lines='skip',
                low_memory=False
            )):
                chunks.append(chunk)
                print(f"  ✓ Loaded chunk {i+1}/{num_chunks} ({len(chunk):,} rows)")
                
        except UnicodeDecodeError:
            # Try with different encoding
            for i, chunk in enumerate(pd.read_csv(
                file_path, 
                sep=delimiter, 
                chunksize=rows_per_chunk,
                encoding='latin-1',
                on_bad_lines='skip',
                low_memory=False
            )):
                chunks.append(chunk)
                print(f"  ✓ Loaded chunk {i+1}/{num_chunks} ({len(chunk):,} rows)")
        
        return chunks


class ParallelComparator:
    """
    Performs parallel comparison of large datasets
    """
    
    def __init__(self, working_dir: str, max_workers: int = None):
        """
        Initialize parallel comparator
        
        Args:
            working_dir: Directory to store intermediate results
            max_workers: Number of parallel workers
        """
        self.working_dir = working_dir
        self.max_workers = max_workers or max(1, mp.cpu_count() - 1)
        self.results_dir = os.path.join(working_dir, 'intermediate_results')
        os.makedirs(self.results_dir, exist_ok=True)
        
    def compare_chunks_parallel(
        self, 
        chunks_a: List[pd.DataFrame], 
        chunks_b: List[pd.DataFrame],
        key_columns: List[str],
        run_id: str,
        progress_callback=None
    ) -> Dict[str, Any]:
        """
        Compare two sets of chunks in parallel
        
        Args:
            chunks_a: List of DataFrame chunks from File A
            chunks_b: List of DataFrame chunks from File B
            key_columns: Columns to use for comparison
            run_id: Unique identifier for this run
            progress_callback: Optional callback(current, total, message)
            
        Returns:
            Comparison results dictionary
        """
        print(f"\n🚀 Starting parallel comparison with {self.max_workers} workers")
        print(f"   Side A: {len(chunks_a)} chunks")
        print(f"   Side B: {len(chunks_b)} chunks")
        print(f"   Key columns: {', '.join(key_columns)}")
        
        # Phase 1: Create hash indexes for all chunks in parallel
        print("\n📍 Phase 1: Creating hash indexes...")
        
        with mp.Pool(processes=self.max_workers) as pool:
            # Process Side A chunks
            if progress_callback:
                progress_callback(0, len(chunks_a) + len(chunks_b), "Creating hash indexes for Side A")
            
            hash_func = partial(self._create_chunk_hash_index, key_columns=key_columns)
            hash_indexes_a = pool.map(hash_func, enumerate(chunks_a))
            
            # Process Side B chunks
            if progress_callback:
                progress_callback(len(chunks_a), len(chunks_a) + len(chunks_b), "Creating hash indexes for Side B")
            
            hash_indexes_b = pool.map(hash_func, enumerate(chunks_b))
        
        print(f"  ✓ Created {len(hash_indexes_a)} hash indexes for Side A")
        print(f"  ✓ Created {len(hash_indexes_b)} hash indexes for Side B")
        
        # Phase 2: Merge hash indexes
        print("\n📍 Phase 2: Merging hash indexes...")
        merged_index_a = self._merge_hash_indexes(hash_indexes_a)
        merged_index_b = self._merge_hash_indexes(hash_indexes_b)
        
        print(f"  ✓ Side A: {len(merged_index_a):,} unique key combinations")
        print(f"  ✓ Side B: {len(merged_index_b):,} unique key combinations")
        
        # Phase 3: Perform comparison
        print("\n📍 Phase 3: Comparing datasets...")
        
        if progress_callback:
            progress_callback(len(chunks_a) + len(chunks_b), 
                            len(chunks_a) + len(chunks_b) + 1, 
                            "Comparing datasets")
        
        comparison_results = self._compare_hash_indexes(
            merged_index_a, 
            merged_index_b, 
            key_columns
        )
        
        # Phase 4: Identify duplicates within each side
        print("\n📍 Phase 4: Analyzing duplicates...")
        
        duplicates_a = self._find_duplicates_in_index(merged_index_a, key_columns)
        duplicates_b = self._find_duplicates_in_index(merged_index_b, key_columns)
        
        # Phase 5: Save intermediate results
        print("\n📍 Phase 5: Saving results...")
        
        results = {
            'run_id': run_id,
            'timestamp': datetime.now().isoformat(),
            'key_columns': key_columns,
            'side_a': {
                'total_rows': sum(len(chunk) for chunk in chunks_a),
                'unique_keys': len(merged_index_a),
                'duplicate_keys': len(duplicates_a),
                'chunks_processed': len(chunks_a)
            },
            'side_b': {
                'total_rows': sum(len(chunk) for chunk in chunks_b),
                'unique_keys': len(merged_index_b),
                'duplicate_keys': len(duplicates_b),
                'chunks_processed': len(chunks_b)
            },
            'comparison': comparison_results,
            'duplicates': {
                'side_a': duplicates_a[:100],  # Store top 100
                'side_b': duplicates_b[:100]
            }
        }
        
        # Save to working directory
        results_file = os.path.join(self.working_dir, 'comparison_results.json')
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        print(f"  ✓ Results saved to: {results_file}")
        
        # Save detailed outputs
        self._save_detailed_results(
            comparison_results, 
            duplicates_a, 
            duplicates_b,
            chunks_a,
            chunks_b,
            key_columns,
            merged_index_a,
            merged_index_b
        )
        
        return results
    
    def _create_chunk_hash_index(
        self, 
        chunk_with_index: Tuple[int, pd.DataFrame], 
        key_columns: List[str]
    ) -> Dict[str, List[int]]:
        """
        Create hash index for a chunk
        Returns dict mapping key_hash -> [row_indices]
        """
        chunk_idx, chunk = chunk_with_index
        
        # Create composite key
        if len(key_columns) == 1:
            keys = chunk[key_columns[0]].astype(str)
        else:
            keys = chunk[key_columns].astype(str).agg('|'.join, axis=1)
        
        # Create hash index
        hash_index = {}
        for idx, key in enumerate(keys):
            key_hash = hashlib.md5(key.encode()).hexdigest()
            if key_hash not in hash_index:
                hash_index[key_hash] = []
            hash_index[key_hash].append((chunk_idx, idx, key))
        
        return hash_index
    
    def _merge_hash_indexes(
        self, 
        hash_indexes: List[Dict[str, List]]
    ) -> Dict[str, List]:
        """
        Merge multiple hash indexes into one
        """
        merged = {}
        
        for hash_index in hash_indexes:
            for key_hash, entries in hash_index.items():
                if key_hash not in merged:
                    merged[key_hash] = []
                merged[key_hash].extend(entries)
        
        return merged
    
    def _compare_hash_indexes(
        self, 
        index_a: Dict[str, List], 
        index_b: Dict[str, List],
        key_columns: List[str]
    ) -> Dict[str, Any]:
        """
        Compare two hash indexes
        """
        keys_a = set(index_a.keys())
        keys_b = set(index_b.keys())
        
        matched_keys = keys_a & keys_b
        only_a_keys = keys_a - keys_b
        only_b_keys = keys_b - keys_a
        
        # Calculate match statistics
        matched_rows_a = sum(len(index_a[k]) for k in matched_keys)
        matched_rows_b = sum(len(index_b[k]) for k in matched_keys)
        only_a_rows = sum(len(index_a[k]) for k in only_a_keys)
        only_b_rows = sum(len(index_b[k]) for k in only_b_keys)
        
        total_keys_a = len(keys_a)
        total_keys_b = len(keys_b)
        
        match_rate_keys = (len(matched_keys) / max(total_keys_a, 1)) * 100
        match_rate_rows_a = (matched_rows_a / max(sum(len(v) for v in index_a.values()), 1)) * 100
        match_rate_rows_b = (matched_rows_b / max(sum(len(v) for v in index_b.values()), 1)) * 100
        
        return {
            'summary': {
                'total_unique_keys_a': total_keys_a,
                'total_unique_keys_b': total_keys_b,
                'matched_keys': len(matched_keys),
                'only_in_a_keys': len(only_a_keys),
                'only_in_b_keys': len(only_b_keys),
                'match_rate_by_keys': round(match_rate_keys, 2),
                'match_rate_by_rows_a': round(match_rate_rows_a, 2),
                'match_rate_by_rows_b': round(match_rate_rows_b, 2)
            },
            'matched': {
                'count_keys': len(matched_keys),
                'count_rows_a': matched_rows_a,
                'count_rows_b': matched_rows_b,
                'sample_keys': list(matched_keys)[:20]
            },
            'only_in_a': {
                'count_keys': len(only_a_keys),
                'count_rows': only_a_rows,
                'sample_keys': list(only_a_keys)[:20]
            },
            'only_in_b': {
                'count_keys': len(only_b_keys),
                'count_rows': only_b_rows,
                'sample_keys': list(only_b_keys)[:20]
            }
        }
    
    def _find_duplicates_in_index(
        self, 
        hash_index: Dict[str, List],
        key_columns: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Find duplicate keys within an index
        """
        duplicates = []
        
        for key_hash, entries in hash_index.items():
            if len(entries) > 1:
                # This key appears multiple times
                key_value = entries[0][2]  # Original key value
                duplicates.append({
                    'key': key_value,
                    'key_columns': key_columns,
                    'occurrence_count': len(entries),
                    'locations': [(chunk_idx, row_idx) for chunk_idx, row_idx, _ in entries[:10]]
                })
        
        # Sort by occurrence count (descending)
        duplicates.sort(key=lambda x: -x['occurrence_count'])
        
        return duplicates
    
    def _extract_actual_records(
        self,
        merged_index_a: Dict,
        merged_index_b: Dict,
        chunks_a: List[pd.DataFrame],
        chunks_b: List[pd.DataFrame],
        key_columns: List[str],
        max_records_per_category: int = 10000
    ):
        """
        Extract actual data records for matched, only_a, only_b
        Returns dictionary with sample records for UI display
        """
        print("\n📋 Extracting actual records for comparison view...")
        
        keys_a = set(merged_index_a.keys())
        keys_b = set(merged_index_b.keys())
        
        matched_keys = keys_a & keys_b
        only_a_keys = keys_a - keys_b
        only_b_keys = keys_b - keys_a
        
        # Combine all chunks
        full_df_a = pd.concat(chunks_a, ignore_index=True)
        full_df_b = pd.concat(chunks_b, ignore_index=True)
        
        # Create composite keys for matching
        if len(key_columns) == 1:
            full_df_a['__composite_key__'] = full_df_a[key_columns[0]].astype(str)
            full_df_b['__composite_key__'] = full_df_b[key_columns[0]].astype(str)
        else:
            full_df_a['__composite_key__'] = full_df_a[key_columns].astype(str).agg('|'.join, axis=1)
            full_df_b['__composite_key__'] = full_df_b[key_columns].astype(str).agg('|'.join, axis=1)
        
        # Map hash to actual key value
        hash_to_key = {}
        for key_hash, entries in merged_index_a.items():
            if entries:
                hash_to_key[key_hash] = entries[0][2]  # Original key value
        for key_hash, entries in merged_index_b.items():
            if entries and key_hash not in hash_to_key:
                hash_to_key[key_hash] = entries[0][2]
        
        # Extract matched records (sample)
        matched_key_values = [hash_to_key[k] for k in list(matched_keys)[:max_records_per_category]]
        matched_a = full_df_a[full_df_a['__composite_key__'].isin(matched_key_values)].drop('__composite_key__', axis=1)
        matched_b = full_df_b[full_df_b['__composite_key__'].isin(matched_key_values)].drop('__composite_key__', axis=1)
        
        # Extract only_a records (sample)
        only_a_key_values = [hash_to_key[k] for k in list(only_a_keys)[:max_records_per_category]]
        only_a_records = full_df_a[full_df_a['__composite_key__'].isin(only_a_key_values)].drop('__composite_key__', axis=1)
        
        # Extract only_b records (sample)
        only_b_key_values = [hash_to_key[k] for k in list(only_b_keys)[:max_records_per_category]]
        only_b_records = full_df_b[full_df_b['__composite_key__'].isin(only_b_key_values)].drop('__composite_key__', axis=1)
        
        print(f"  ✓ Matched records: {len(matched_a):,} (from Side A)")
        print(f"  ✓ Matched records: {len(matched_b):,} (from Side B)")
        print(f"  ✓ Only in A: {len(only_a_records):,}")
        print(f"  ✓ Only in B: {len(only_b_records):,}")
        
        return {
            'matched_a': matched_a,
            'matched_b': matched_b,
            'only_a': only_a_records,
            'only_b': only_b_records
        }
    
    def _save_detailed_results(
        self,
        comparison_results: Dict,
        duplicates_a: List[Dict],
        duplicates_b: List[Dict],
        chunks_a: List[pd.DataFrame],
        chunks_b: List[pd.DataFrame],
        key_columns: List[str],
        merged_index_a: Dict = None,
        merged_index_b: Dict = None
    ):
        """
        Save detailed CSV results for matched, only_a, only_b, duplicates
        """
        print("\n💾 Saving detailed result files...")
        
        # Save comparison summary
        summary_file = os.path.join(self.working_dir, 'comparison_summary.csv')
        summary_df = pd.DataFrame([comparison_results['summary']])
        summary_df.to_csv(summary_file, index=False)
        print(f"  ✓ Summary: {summary_file}")
        
        # Extract and save actual records
        if merged_index_a and merged_index_b:
            records = self._extract_actual_records(
                merged_index_a, merged_index_b,
                chunks_a, chunks_b,
                key_columns,
                max_records_per_category=10000  # Limit to 10k records per category for UI
            )
            
            # Save matched records
            if len(records['matched_a']) > 0:
                matched_a_file = os.path.join(self.working_dir, 'matched_records_side_a.csv')
                records['matched_a'].to_csv(matched_a_file, index=False)
                print(f"  ✓ Matched (Side A): {matched_a_file} ({len(records['matched_a']):,} records)")
            
            if len(records['matched_b']) > 0:
                matched_b_file = os.path.join(self.working_dir, 'matched_records_side_b.csv')
                records['matched_b'].to_csv(matched_b_file, index=False)
                print(f"  ✓ Matched (Side B): {matched_b_file} ({len(records['matched_b']):,} records)")
            
            # Save only_a records
            if len(records['only_a']) > 0:
                only_a_file = os.path.join(self.working_dir, 'only_in_a_records.csv')
                records['only_a'].to_csv(only_a_file, index=False)
                print(f"  ✓ Only in A: {only_a_file} ({len(records['only_a']):,} records)")
            
            # Save only_b records
            if len(records['only_b']) > 0:
                only_b_file = os.path.join(self.working_dir, 'only_in_b_records.csv')
                records['only_b'].to_csv(only_b_file, index=False)
                print(f"  ✓ Only in B: {only_b_file} ({len(records['only_b']):,} records)")
        
        # Save duplicate records for Side A
        if duplicates_a:
            dup_a_file = os.path.join(self.working_dir, 'duplicates_side_a.csv')
            dup_a_df = pd.DataFrame(duplicates_a)
            dup_a_df.to_csv(dup_a_file, index=False)
            print(f"  ✓ Side A Duplicates: {dup_a_file} ({len(duplicates_a):,} entries)")
        
        # Save duplicate records for Side B
        if duplicates_b:
            dup_b_file = os.path.join(self.working_dir, 'duplicates_side_b.csv')
            dup_b_df = pd.DataFrame(duplicates_b)
            dup_b_df.to_csv(dup_b_file, index=False)
            print(f"  ✓ Side B Duplicates: {dup_b_file} ({len(duplicates_b):,} entries)")


def process_large_files_parallel(
    file_a_path: str,
    file_b_path: str,
    key_columns: List[str],
    working_dir: str,
    delimiter_a: str = ',',
    delimiter_b: str = ',',
    chunk_size_mb: int = 50,
    max_workers: int = None,
    progress_callback=None
) -> Dict[str, Any]:
    """
    Main entry point for parallel large file processing
    
    Args:
        file_a_path: Path to file A
        file_b_path: Path to file B
        key_columns: Columns to use for comparison
        working_dir: Directory to store results
        delimiter_a: Delimiter for file A
        delimiter_b: Delimiter for file B
        chunk_size_mb: Size of chunks in MB
        max_workers: Number of parallel workers
        progress_callback: Optional callback function
        
    Returns:
        Dictionary with comparison results
    """
    print("\n" + "="*80)
    print("🚀 PARALLEL LARGE FILE COMPARISON")
    print("="*80)
    
    # Create working directory
    os.makedirs(working_dir, exist_ok=True)
    
    # Initialize processors
    chunker = ChunkedFileProcessor(chunk_size_mb=chunk_size_mb, max_workers=max_workers)
    comparator = ParallelComparator(working_dir=working_dir, max_workers=max_workers)
    
    try:
        # Step 1: Load files in chunks
        print("\n📂 Step 1: Loading File A in chunks...")
        chunks_a = chunker.read_file_in_chunks(file_a_path, delimiter_a)
        
        print("\n📂 Step 2: Loading File B in chunks...")
        chunks_b = chunker.read_file_in_chunks(file_b_path, delimiter_b)
        
        # Step 2: Perform parallel comparison
        print("\n⚡ Step 3: Performing parallel comparison...")
        
        run_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        results = comparator.compare_chunks_parallel(
            chunks_a=chunks_a,
            chunks_b=chunks_b,
            key_columns=key_columns,
            run_id=run_id,
            progress_callback=progress_callback
        )
        
        print("\n" + "="*80)
        print("✅ COMPARISON COMPLETE")
        print("="*80)
        print(f"\n📊 Results Summary:")
        print(f"   Side A: {results['side_a']['total_rows']:,} rows, "
              f"{results['side_a']['unique_keys']:,} unique keys, "
              f"{results['side_a']['duplicate_keys']:,} duplicates")
        print(f"   Side B: {results['side_b']['total_rows']:,} rows, "
              f"{results['side_b']['unique_keys']:,} unique keys, "
              f"{results['side_b']['duplicate_keys']:,} duplicates")
        print(f"\n🔍 Comparison:")
        print(f"   Matched: {results['comparison']['matched']['count_keys']:,} keys")
        print(f"   Only in A: {results['comparison']['only_in_a']['count_keys']:,} keys")
        print(f"   Only in B: {results['comparison']['only_in_b']['count_keys']:,} keys")
        print(f"   Match Rate: {results['comparison']['summary']['match_rate_by_keys']:.2f}%")
        print(f"\n📁 Results saved to: {working_dir}")
        print("="*80 + "\n")
        
        return results
        
    except Exception as e:
        error_msg = f"Error during parallel processing: {str(e)}\n{traceback.format_exc()}"
        print(f"\n❌ ERROR: {error_msg}")
        
        # Save error log
        error_file = os.path.join(working_dir, 'error.log')
        with open(error_file, 'w') as f:
            f.write(error_msg)
        
        raise

