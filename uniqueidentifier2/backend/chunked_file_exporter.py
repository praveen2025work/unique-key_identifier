"""
Enterprise-Level Chunked File Comparison with Full Row Export
Handles massive files without memory issues by processing in chunks
Exports matched, only_a, only_b data to organized CSV files by run_id
"""
import os
import pandas as pd
import numpy as np
from typing import List, Dict, Tuple, Optional
from datetime import datetime
from pathlib import Path
import time
from database import conn
from config import COMPARISON_CHUNK_SIZE

# Base directory for comparison exports (organized by run_id)
EXPORT_BASE_DIR = os.path.join(os.path.dirname(__file__), 'comparison_exports')
os.makedirs(EXPORT_BASE_DIR, exist_ok=True)


class ChunkedFileExporter:
    """
    Enterprise-level comparison engine that:
    1. Processes files in chunks to avoid memory issues
    2. Exports full row data (not just keys) to CSV files
    3. Organizes exports by run_id for easy tracking
    4. Supports pagination through large result sets
    5. Creates separate files for matched, only_a, only_b
    """
    
    def __init__(self, run_id: int, file_a_path: str, file_b_path: str):
        self.run_id = run_id
        self.file_a_path = file_a_path
        self.file_b_path = file_b_path
        self.chunk_size = COMPARISON_CHUNK_SIZE
        
        # Create run-specific directory
        self.run_export_dir = os.path.join(EXPORT_BASE_DIR, f"run_{run_id}")
        os.makedirs(self.run_export_dir, exist_ok=True)
    
    def compare_and_export(
        self, 
        columns: List[str],
        max_export_rows: int = None,
        progress_callback: Optional[callable] = None
    ) -> Dict:
        """
        Complete comparison workflow:
        1. Extract unique keys from both files (chunked)
        2. Determine matched, only_a, only_b keys
        3. Export full row data for each category (chunked)
        4. Store metadata in database
        
        Args:
            columns: List of column names to use as comparison keys
            max_export_rows: Optional limit on rows to export per category
            progress_callback: Optional callback for progress updates
            
        Returns:
            Dictionary with comparison summary and export paths
        """
        print(f"🚀 Starting enterprise chunked comparison for run {self.run_id}")
        start_time = time.time()
        
        # Create column combination identifier
        column_str = ','.join(columns)
        comparison_dir = self._get_comparison_dir(column_str)
        os.makedirs(comparison_dir, exist_ok=True)
        
        # PHASE 1: Extract unique keys from both files
        print(f"📊 Phase 1/3: Extracting unique keys...")
        keys_a, total_rows_a = self._extract_unique_keys_chunked(
            self.file_a_path, columns, 'File A'
        )
        keys_b, total_rows_b = self._extract_unique_keys_chunked(
            self.file_b_path, columns, 'File B'
        )
        
        print(f"✅ Found {len(keys_a):,} unique keys in A, {len(keys_b):,} in B")
        
        # PHASE 2: Calculate matches and differences
        print(f"📊 Phase 2/3: Computing matches and differences...")
        matched_keys = keys_a & keys_b
        only_a_keys = keys_a - keys_b
        only_b_keys = keys_b - keys_a
        
        total_unique = len(keys_a | keys_b)
        match_rate = (len(matched_keys) / total_unique * 100) if total_unique > 0 else 0
        
        print(f"✅ Matched: {len(matched_keys):,} | A-only: {len(only_a_keys):,} | B-only: {len(only_b_keys):,}")
        
        # PHASE 3: Export full row data for each category
        print(f"📊 Phase 3/3: Exporting full row data to CSV files...")
        export_paths = {}
        
        # Export matched records
        if matched_keys:
            matched_path = os.path.join(comparison_dir, "matched.csv")
            matched_count = self._export_records_chunked(
                self.file_a_path, columns, matched_keys, matched_path,
                max_rows=max_export_rows, label="Matched"
            )
            export_paths['matched'] = matched_path
            export_paths['matched_count'] = matched_count
        else:
            export_paths['matched_count'] = 0
        
        # Export only_a records
        if only_a_keys:
            only_a_path = os.path.join(comparison_dir, "only_a.csv")
            only_a_count = self._export_records_chunked(
                self.file_a_path, columns, only_a_keys, only_a_path,
                max_rows=max_export_rows, label="A-Only"
            )
            export_paths['only_a'] = only_a_path
            export_paths['only_a_count'] = only_a_count
        else:
            export_paths['only_a_count'] = 0
        
        # Export only_b records
        if only_b_keys:
            only_b_path = os.path.join(comparison_dir, "only_b.csv")
            only_b_count = self._export_records_chunked(
                self.file_b_path, columns, only_b_keys, only_b_path,
                max_rows=max_export_rows, label="B-Only"
            )
            export_paths['only_b'] = only_b_path
            export_paths['only_b_count'] = only_b_count
        else:
            export_paths['only_b_count'] = 0
        
        processing_time = round(time.time() - start_time, 2)
        
        # Create summary
        summary = {
            'run_id': self.run_id,
            'columns': column_str,
            'matched_count': len(matched_keys),
            'only_a_count': len(only_a_keys),
            'only_b_count': len(only_b_keys),
            'total_a': len(keys_a),
            'total_b': len(keys_b),
            'total_rows_a': total_rows_a,
            'total_rows_b': total_rows_b,
            'match_rate': round(match_rate, 2),
            'processing_time': processing_time,
            'export_dir': comparison_dir,
            'export_paths': export_paths
        }
        
        # Store summary in database
        self._store_comparison_metadata(summary)
        
        print(f"✅ Comparison completed in {processing_time}s")
        print(f"📁 Exports stored in: {comparison_dir}")
        
        return summary
    
    def _extract_unique_keys_chunked(
        self, 
        file_path: str, 
        columns: List[str],
        label: str
    ) -> Tuple[set, int]:
        """
        Extract unique composite keys from a file using chunked reading.
        Returns set of unique keys and total row count.
        """
        unique_keys = set()
        total_rows = 0
        chunk_num = 0
        
        for chunk in pd.read_csv(file_path, chunksize=self.chunk_size, low_memory=False):
            chunk_num += 1
            total_rows += len(chunk)
            
            # Validate columns exist
            for col in columns:
                if col not in chunk.columns:
                    raise ValueError(f"Column '{col}' not found in {label}")
            
            # Create composite keys
            if len(columns) == 1:
                keys = chunk[columns[0]].astype(str)
            else:
                keys = chunk[columns].astype(str).agg('||'.join, axis=1)
            
            unique_keys.update(keys.unique())
            
            if chunk_num % 10 == 0:
                print(f"   {label}: Processed {total_rows:,} rows, {len(unique_keys):,} unique keys...")
        
        return unique_keys, total_rows
    
    def _export_records_chunked(
        self,
        file_path: str,
        key_columns: List[str],
        target_keys: set,
        output_path: str,
        max_rows: int = None,
        label: str = "Records"
    ) -> int:
        """
        Export full row data for target keys by reading file in chunks.
        This avoids loading entire file into memory.
        
        Args:
            file_path: Path to source CSV file
            key_columns: Columns used to create composite key
            target_keys: Set of keys to export
            output_path: Path to output CSV file
            max_rows: Maximum rows to export (None = no limit)
            label: Label for progress messages
            
        Returns:
            Number of records exported
        """
        print(f"   Exporting {label} records to {os.path.basename(output_path)}...")
        
        exported_count = 0
        chunk_num = 0
        first_chunk = True
        
        # Convert target_keys to list for faster membership testing (if very large)
        # For moderate sets, the set itself is fine
        target_keys_set = target_keys
        
        for chunk in pd.read_csv(file_path, chunksize=self.chunk_size, low_memory=False):
            chunk_num += 1
            
            # Create composite key for this chunk
            if len(key_columns) == 1:
                chunk_keys = chunk[key_columns[0]].astype(str)
            else:
                chunk_keys = chunk[key_columns].astype(str).agg('||'.join, axis=1)
            
            # Filter rows where key matches target keys
            mask = chunk_keys.isin(target_keys_set)
            matched_rows = chunk[mask]
            
            if len(matched_rows) > 0:
                # Check if we've hit the max_rows limit
                if max_rows and exported_count + len(matched_rows) > max_rows:
                    remaining = max_rows - exported_count
                    matched_rows = matched_rows.head(remaining)
                
                # Write to CSV (append mode after first write)
                matched_rows.to_csv(
                    output_path,
                    mode='w' if first_chunk else 'a',
                    header=first_chunk,
                    index=False
                )
                
                exported_count += len(matched_rows)
                first_chunk = False
                
                # Break if we've hit the limit
                if max_rows and exported_count >= max_rows:
                    print(f"   ⚠️  Hit export limit of {max_rows:,} rows for {label}")
                    break
            
            if chunk_num % 10 == 0:
                print(f"   {label}: Processed {chunk_num * self.chunk_size:,} rows, exported {exported_count:,} so far...")
        
        print(f"   ✅ Exported {exported_count:,} {label} records")
        return exported_count
    
    def _get_comparison_dir(self, column_str: str) -> str:
        """Get directory path for specific column combination"""
        # Create safe directory name from columns
        safe_name = column_str.replace(',', '_').replace(' ', '').replace('/', '_')[:100]
        return os.path.join(self.run_export_dir, f"comparison_{safe_name}")
    
    def _store_comparison_metadata(self, summary: Dict):
        """Store comparison metadata in database"""
        cursor = conn.cursor()
        
        # Store summary
        cursor.execute('''
            INSERT OR REPLACE INTO comparison_summary 
            (run_id, column_combination, matched_count, only_a_count, only_b_count, 
             total_a, total_b, generated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            self.run_id,
            summary['columns'],
            summary['matched_count'],
            summary['only_a_count'],
            summary['only_b_count'],
            summary['total_a'],
            summary['total_b'],
            datetime.now().isoformat()
        ))
        
        # Store export file paths
        export_paths = summary.get('export_paths', {})
        timestamp = datetime.now().isoformat()
        
        for category in ['matched', 'only_a', 'only_b']:
            if category in export_paths:
                file_path = export_paths[category]
                file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
                row_count = export_paths.get(f'{category}_count', 0)
                
                cursor.execute('''
                    INSERT INTO comparison_export_files 
                    (run_id, column_combination, category, file_path, file_size, row_count, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    self.run_id,
                    summary['columns'],
                    category,
                    file_path,
                    file_size,
                    row_count,
                    timestamp
                ))
        
        conn.commit()
        print(f"✅ Metadata stored in database")


def get_comparison_export_files(run_id: int, columns: str = None) -> List[Dict]:
    """
    Get list of exported comparison files for a run.
    
    Args:
        run_id: Run ID
        columns: Optional column combination filter
        
    Returns:
        List of file information dictionaries
    """
    cursor = conn.cursor()
    
    if columns:
        cursor.execute('''
            SELECT file_id, column_combination, category, file_path, file_size, row_count, created_at
            FROM comparison_export_files
            WHERE run_id = ? AND column_combination = ?
            ORDER BY category
        ''', (run_id, columns))
    else:
        cursor.execute('''
            SELECT file_id, column_combination, category, file_path, file_size, row_count, created_at
            FROM comparison_export_files
            WHERE run_id = ?
            ORDER BY column_combination, category
        ''', (run_id,))
    
    rows = cursor.fetchall()
    
    files = []
    for row in rows:
        files.append({
            'file_id': row[0],
            'columns': row[1],
            'category': row[2],
            'file_path': row[3],
            'file_size': row[4],
            'file_size_mb': round(row[4] / (1024 * 1024), 2),
            'row_count': row[5],
            'created_at': row[6],
            'exists': os.path.exists(row[3])
        })
    
    return files


def read_export_file_paginated(
    file_path: str,
    offset: int = 0,
    limit: int = 100
) -> Dict:
    """
    Read exported CSV file with pagination support.
    Uses skiprows and nrows for memory-efficient reading.
    
    Args:
        file_path: Path to exported CSV file
        offset: Number of rows to skip
        limit: Number of rows to read
        
    Returns:
        Dictionary with records and pagination info
    """
    if not os.path.exists(file_path):
        return {
            'records': [],
            'total': 0,
            'offset': offset,
            'limit': limit,
            'has_more': False,
            'error': 'File not found'
        }
    
    try:
        # Get total row count (excluding header)
        # Read just to count rows (fast)
        with open(file_path, 'r') as f:
            total_rows = sum(1 for _ in f) - 1  # -1 for header
        
        # Read paginated chunk
        # skiprows: skip header (0) + offset rows (1 to offset+1)
        # We need to skip row 0 (header is read separately), then skip offset data rows
        if offset == 0:
            df = pd.read_csv(file_path, nrows=limit)
        else:
            # Skip offset rows (after header)
            skip_rows = list(range(1, offset + 1))
            df = pd.read_csv(file_path, skiprows=skip_rows, nrows=limit)
        
        # Convert to records
        records = df.to_dict('records')
        
        # Handle NaN values
        for record in records:
            for key, value in record.items():
                if pd.isna(value):
                    record[key] = None
        
        return {
            'records': records,
            'total': total_rows,
            'offset': offset,
            'limit': limit,
            'has_more': offset + limit < total_rows,
            'showing': len(records)
        }
    
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        return {
            'records': [],
            'total': 0,
            'offset': offset,
            'limit': limit,
            'has_more': False,
            'error': str(e)
        }


def get_export_summary(run_id: int) -> Dict:
    """
    Get summary of all exports for a run.
    
    Args:
        run_id: Run ID
        
    Returns:
        Summary dictionary with statistics
    """
    files = get_comparison_export_files(run_id)
    
    if not files:
        return {
            'run_id': run_id,
            'total_comparisons': 0,
            'total_files': 0,
            'total_size_mb': 0,
            'comparisons': []
        }
    
    # Group by column combination
    comparisons_dict = {}
    total_size = 0
    
    for file in files:
        cols = file['columns']
        if cols not in comparisons_dict:
            comparisons_dict[cols] = {
                'columns': cols,
                'files': [],
                'total_rows': 0,
                'total_size_mb': 0
            }
        
        comparisons_dict[cols]['files'].append(file)
        comparisons_dict[cols]['total_rows'] += file['row_count']
        comparisons_dict[cols]['total_size_mb'] += file['file_size_mb']
        total_size += file['file_size_mb']
    
    return {
        'run_id': run_id,
        'total_comparisons': len(comparisons_dict),
        'total_files': len(files),
        'total_size_mb': round(total_size, 2),
        'comparisons': list(comparisons_dict.values())
    }


def cleanup_export_files(run_id: int = None, older_than_days: int = None):
    """
    Clean up export files.
    
    Args:
        run_id: If specified, clean only this run's exports
        older_than_days: If specified, clean files older than this many days
    """
    import shutil
    
    if run_id:
        # Clean specific run
        run_dir = os.path.join(EXPORT_BASE_DIR, f"run_{run_id}")
        if os.path.exists(run_dir):
            shutil.rmtree(run_dir)
            print(f"✅ Cleaned up exports for run {run_id}")
        
        # Clean from database
        cursor = conn.cursor()
        cursor.execute('DELETE FROM comparison_export_files WHERE run_id = ?', (run_id,))
        conn.commit()
    
    elif older_than_days:
        # Clean old files
        import time
        cutoff = time.time() - (older_than_days * 86400)
        
        for run_dir in Path(EXPORT_BASE_DIR).glob("run_*"):
            if run_dir.stat().st_mtime < cutoff:
                shutil.rmtree(run_dir)
                print(f"✅ Cleaned up old export: {run_dir.name}")

