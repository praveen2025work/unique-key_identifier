"""
Chunked Comparison Engine for Large Files
Processes file comparisons in chunks to prevent memory issues with files >100K records
"""
import pandas as pd
import numpy as np
from typing import List, Dict, Tuple, Optional, Generator
from datetime import datetime
import time
from database import conn
from config import (
    COMPARISON_CHUNK_SIZE, 
    COMPARISON_DB_BATCH_SIZE,
    MAX_COMPARISON_MEMORY_ROWS,
    COMPARISON_CHUNK_THRESHOLD
)


class ChunkedComparisonEngine:
    """
    Efficient comparison engine for large files using chunked processing.
    Processes files in chunks and stores results directly to database.
    """
    
    def __init__(self, run_id: int, file_a_path: str, file_b_path: str):
        self.run_id = run_id
        self.file_a_path = file_a_path
        self.file_b_path = file_b_path
        self.chunk_size = COMPARISON_CHUNK_SIZE
        self.db_batch_size = COMPARISON_DB_BATCH_SIZE
        
    def compare_files_chunked(
        self, 
        columns: List[str],
        progress_callback: Optional[callable] = None
    ) -> Dict:
        """
        Compare two large files using chunked processing.
        Returns summary statistics without loading all data into memory.
        
        Args:
            columns: List of column names to use as comparison keys
            progress_callback: Optional callback function to report progress
            
        Returns:
            Dictionary with comparison summary
        """
        print(f"🔄 Starting chunked comparison for run {self.run_id}")
        start_time = time.time()
        
        # Step 1: Build unique key sets from both files using chunks
        print("📊 Step 1/3: Extracting unique keys from File A...")
        keys_a, total_rows_a = self._extract_unique_keys_chunked(
            self.file_a_path, columns, 'A'
        )
        
        print("📊 Step 2/3: Extracting unique keys from File B...")
        keys_b, total_rows_b = self._extract_unique_keys_chunked(
            self.file_b_path, columns, 'B'
        )
        
        print(f"✅ Extracted {len(keys_a):,} unique keys from A, {len(keys_b):,} from B")
        
        # Step 2: Calculate matches and differences
        print("📊 Step 3/3: Computing matches and differences...")
        matched_keys = keys_a & keys_b
        only_a_keys = keys_a - keys_b
        only_b_keys = keys_b - keys_a
        
        # Calculate statistics
        total_unique = len(keys_a | keys_b)
        match_rate = (len(matched_keys) / total_unique * 100) if total_unique > 0 else 0
        
        summary = {
            'matched_count': len(matched_keys),
            'only_a_count': len(only_a_keys),
            'only_b_count': len(only_b_keys),
            'total_a': len(keys_a),
            'total_b': len(keys_b),
            'total_rows_a': total_rows_a,
            'total_rows_b': total_rows_b,
            'match_rate': round(match_rate, 2),
            'processing_time': round(time.time() - start_time, 2)
        }
        
        # Step 3: Store results in database
        column_str = ','.join(columns)
        self._store_comparison_summary(column_str, summary)
        
        # Store keys in database for pagination (in batches to manage memory)
        self._store_comparison_keys(column_str, matched_keys, only_a_keys, only_b_keys, columns)
        
        print(f"✅ Chunked comparison completed in {summary['processing_time']}s")
        print(f"   Matched: {summary['matched_count']:,} | A-only: {summary['only_a_count']:,} | B-only: {summary['only_b_count']:,}")
        
        return summary
    
    def _extract_unique_keys_chunked(
        self, 
        file_path: str, 
        columns: List[str],
        side: str
    ) -> Tuple[set, int]:
        """
        Extract unique composite keys from a file using chunked reading.
        Returns set of unique keys and total row count.
        """
        unique_keys = set()
        total_rows = 0
        chunk_num = 0
        
        # Read file in chunks
        for chunk in pd.read_csv(file_path, chunksize=self.chunk_size, low_memory=False):
            chunk_num += 1
            total_rows += len(chunk)
            
            # Validate columns exist
            for col in columns:
                if col not in chunk.columns:
                    raise ValueError(f"Column '{col}' not found in {side}")
            
            # Create composite keys
            if len(columns) == 1:
                keys = chunk[columns[0]].astype(str)
            else:
                keys = chunk[columns].astype(str).agg('||'.join, axis=1)
            
            # Add to set (automatically handles uniqueness)
            unique_keys.update(keys.unique())
            
            # Progress logging
            if chunk_num % 10 == 0:
                print(f"   Processed {total_rows:,} rows from {side}, found {len(unique_keys):,} unique keys...")
        
        return unique_keys, total_rows
    
    def _store_comparison_summary(self, column_str: str, summary: Dict):
        """Store comparison summary in database"""
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO comparison_summary 
            (run_id, column_combination, matched_count, only_a_count, only_b_count, 
             total_a, total_b, generated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            self.run_id,
            column_str,
            summary['matched_count'],
            summary['only_a_count'],
            summary['only_b_count'],
            summary['total_a'],
            summary['total_b'],
            datetime.now().isoformat()
        ))
        conn.commit()
    
    def _store_comparison_keys(
        self, 
        column_str: str, 
        matched_keys: set, 
        only_a_keys: set, 
        only_b_keys: set,
        columns: List[str]
    ):
        """
        Store comparison keys in database in batches to manage memory.
        This enables efficient pagination without re-reading CSV files.
        """
        cursor = conn.cursor()
        
        # Clear any existing data for this comparison
        cursor.execute('''
            DELETE FROM comparison_results 
            WHERE run_id = ? AND column_combination = ?
        ''', (self.run_id, column_str))
        
        # Helper function to batch insert keys
        def batch_insert_keys(keys: set, category: str):
            keys_list = sorted(list(keys))  # Sort for consistent ordering
            total_keys = len(keys_list)
            
            print(f"   Storing {total_keys:,} {category} keys in database...")
            
            batch = []
            for idx, key in enumerate(keys_list):
                batch.append((
                    self.run_id,
                    column_str,
                    category,
                    key,
                    idx  # Store position for consistent pagination
                ))
                
                # Insert in batches
                if len(batch) >= self.db_batch_size:
                    cursor.executemany('''
                        INSERT INTO comparison_results 
                        (run_id, column_combination, category, key_value, position)
                        VALUES (?, ?, ?, ?, ?)
                    ''', batch)
                    conn.commit()
                    batch = []
                    
                    # Progress
                    if (idx + 1) % 50000 == 0:
                        print(f"      Stored {idx + 1:,} / {total_keys:,} {category} keys...")
            
            # Insert remaining
            if batch:
                cursor.executemany('''
                    INSERT INTO comparison_results 
                    (run_id, column_combination, category, key_value, position)
                    VALUES (?, ?, ?, ?, ?)
                ''', batch)
                conn.commit()
        
        # Store all categories
        if matched_keys:
            batch_insert_keys(matched_keys, 'matched')
        if only_a_keys:
            batch_insert_keys(only_a_keys, 'only_a')
        if only_b_keys:
            batch_insert_keys(only_b_keys, 'only_b')
        
        print("✅ All comparison keys stored in database")
    
    def get_comparison_data_paginated(
        self,
        columns: str,
        category: str,
        offset: int = 0,
        limit: int = 100
    ) -> Dict:
        """
        Get paginated comparison data from database.
        This is FAST because it doesn't read the CSV files!
        
        Args:
            columns: Comma-separated column names
            category: 'matched', 'only_a', or 'only_b'
            offset: Starting position
            limit: Number of records to return
            
        Returns:
            Dictionary with records and pagination info
        """
        cursor = conn.cursor()
        
        # Get total count
        cursor.execute('''
            SELECT COUNT(*) FROM comparison_results
            WHERE run_id = ? AND column_combination = ? AND category = ?
        ''', (self.run_id, columns, category))
        total = cursor.fetchone()[0]
        
        # Get paginated keys
        cursor.execute('''
            SELECT key_value FROM comparison_results
            WHERE run_id = ? AND column_combination = ? AND category = ?
            ORDER BY position
            LIMIT ? OFFSET ?
        ''', (self.run_id, columns, category, limit, offset))
        
        keys = cursor.fetchall()
        
        # Convert keys to records
        column_list = [c.strip() for c in columns.split(',')]
        records = []
        
        for (key_value,) in keys:
            if '||' in key_value:
                values = key_value.split('||')
            else:
                values = [key_value]
            
            record = {col: val for col, val in zip(column_list, values)}
            records.append(record)
        
        return {
            'records': records,
            'total': total,
            'offset': offset,
            'limit': limit,
            'has_more': offset + limit < total,
            'showing': len(records)
        }


def should_use_chunked_comparison(file_a_rows: int, file_b_rows: int) -> bool:
    """
    Determine if chunked comparison should be used based on file sizes.
    
    Args:
        file_a_rows: Number of rows in file A
        file_b_rows: Number of rows in file B
        
    Returns:
        True if chunked comparison should be used
    """
    max_rows = max(file_a_rows or 0, file_b_rows or 0)
    return max_rows > COMPARISON_CHUNK_THRESHOLD


def estimate_comparison_time(file_a_rows: int, file_b_rows: int) -> str:
    """
    Estimate processing time for comparison based on file sizes.
    
    Args:
        file_a_rows: Number of rows in file A
        file_b_rows: Number of rows in file B
        
    Returns:
        Human-readable time estimate
    """
    total_rows = file_a_rows + file_b_rows
    
    if total_rows < 100000:
        return "< 10 seconds"
    elif total_rows < 500000:
        return "10-30 seconds"
    elif total_rows < 1000000:
        return "30-60 seconds"
    elif total_rows < 5000000:
        return "1-3 minutes"
    else:
        return "3-10 minutes"


def get_comparison_status(run_id: int, columns: str) -> Optional[Dict]:
    """
    Check if comparison exists for given run and columns.
    
    Args:
        run_id: Run ID
        columns: Comma-separated column names
        
    Returns:
        Summary dict if exists, None otherwise
    """
    cursor = conn.cursor()
    cursor.execute('''
        SELECT matched_count, only_a_count, only_b_count, total_a, total_b, generated_at
        FROM comparison_summary
        WHERE run_id = ? AND column_combination = ?
    ''', (run_id, columns))
    
    row = cursor.fetchone()
    
    if not row:
        return None
    
    return {
        'matched_count': row[0],
        'only_a_count': row[1],
        'only_b_count': row[2],
        'total_a': row[3],
        'total_b': row[4],
        'generated_at': row[5],
        'exists': True
    }

