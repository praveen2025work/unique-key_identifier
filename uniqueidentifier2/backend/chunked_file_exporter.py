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
import hashlib
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
    
    def __init__(self, run_id: int, file_a_path: str, file_b_path: str, 
                 file_a_delimiter: str = ',', file_b_delimiter: str = ',',
                 max_rows_limit: int = 0):
        self.run_id = run_id
        self.file_a_path = file_a_path
        self.file_b_path = file_b_path
        self.file_a_delimiter = file_a_delimiter
        self.file_b_delimiter = file_b_delimiter
        self.chunk_size = COMPARISON_CHUNK_SIZE
        self.max_rows_limit = max_rows_limit  # User-specified row limit (0 = no limit)
        
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
        self._current_columns = column_str  # Store for chunk registration
        comparison_dir = self._get_comparison_dir(column_str)
        os.makedirs(comparison_dir, exist_ok=True)
        
        # Create README file with column mapping for easy reference
        readme_path = os.path.join(comparison_dir, '_COLUMNS.txt')
        with open(readme_path, 'w') as f:
            f.write(f"Run ID: {self.run_id}\n")
            f.write(f"Columns: {column_str}\n")
            f.write(f"Column Count: {len(columns)}\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"\nColumn List:\n")
            for i, col in enumerate(columns, 1):
                f.write(f"  {i}. {col}\n")
        
        # PHASE 1: Extract unique keys from both files
        print(f"📊 Phase 1/3: Extracting unique keys...")
        keys_a, total_rows_a = self._extract_unique_keys_chunked(
            self.file_a_path, columns, 'File A', self.file_a_delimiter
        )
        keys_b, total_rows_b = self._extract_unique_keys_chunked(
            self.file_b_path, columns, 'File B', self.file_b_delimiter
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
        
        # PHASE 3: Export full row data for each category (200k records per file for better performance)
        print(f"📊 Phase 3/3: Exporting full row data to chunked CSV files (200k per file)...")
        export_paths = {}
        all_chunk_files = []
        
        # Determine max rows per file - Default to 200k for optimal performance with pagination
        rows_per_file = max_export_rows if max_export_rows else 200000
        
        # Export matched records
        if matched_keys:
            matched_count, matched_files = self._export_records_chunked(
                self.file_a_path, columns, matched_keys, comparison_dir,
                category="matched", max_rows_per_file=rows_per_file,
                label="Matched", delimiter=self.file_a_delimiter
            )
            export_paths['matched_count'] = matched_count
            export_paths['matched_files'] = matched_files
            all_chunk_files.extend(matched_files)
        else:
            export_paths['matched_count'] = 0
            export_paths['matched_files'] = []
        
        # Export only_a records
        if only_a_keys:
            only_a_count, only_a_files = self._export_records_chunked(
                self.file_a_path, columns, only_a_keys, comparison_dir,
                category="only_a", max_rows_per_file=rows_per_file,
                label="A-Only", delimiter=self.file_a_delimiter
            )
            export_paths['only_a_count'] = only_a_count
            export_paths['only_a_files'] = only_a_files
            all_chunk_files.extend(only_a_files)
        else:
            export_paths['only_a_count'] = 0
            export_paths['only_a_files'] = []
        
        # Export only_b records
        if only_b_keys:
            only_b_count, only_b_files = self._export_records_chunked(
                self.file_b_path, columns, only_b_keys, comparison_dir,
                category="only_b", max_rows_per_file=rows_per_file,
                label="B-Only", delimiter=self.file_b_delimiter
            )
            export_paths['only_b_count'] = only_b_count
            export_paths['only_b_files'] = only_b_files
            all_chunk_files.extend(only_b_files)
        else:
            export_paths['only_b_count'] = 0
            export_paths['only_b_files'] = []
        
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
        label: str,
        delimiter: str = ','
    ) -> Tuple[set, int]:
        """
        Extract unique composite keys from a file using chunked reading.
        Returns set of unique keys and total row count.
        """
        unique_keys = set()
        total_rows = 0
        chunk_num = 0
        
        try:
            for chunk in pd.read_csv(file_path, sep=delimiter, chunksize=self.chunk_size, 
                                    encoding='utf-8', on_bad_lines='skip', low_memory=False):
                chunk_num += 1
                
                # Validate columns exist (only on first chunk)
                if chunk_num == 1:
                    # Create mapping for case-insensitive and whitespace-tolerant matching
                    chunk_cols_lower = {col.strip().lower(): col for col in chunk.columns}
                    
                    # Map requested columns to actual column names
                    mapped_columns = []
                    missing_cols = []
                    
                    for col in columns:
                        col_normalized = col.strip().lower()
                        if col in chunk.columns:
                            # Exact match - use as is
                            mapped_columns.append(col)
                        elif col_normalized in chunk_cols_lower:
                            # Case-insensitive/whitespace match - use actual column name
                            actual_col = chunk_cols_lower[col_normalized]
                            mapped_columns.append(actual_col)
                            print(f"   📝 Mapped column '{col}' to '{actual_col}'")
                        else:
                            missing_cols.append(col)
                    
                    if missing_cols:
                        available = ', '.join(chunk.columns.tolist())
                        raise ValueError(
                            f"Column(s) {', '.join(missing_cols)} not found in {label}. "
                            f"Available columns: {available}"
                        )
                    
                    # Update columns list with mapped values
                    columns = mapped_columns
                
                # Apply user's max rows limit if specified
                if self.max_rows_limit > 0 and total_rows >= self.max_rows_limit:
                    print(f"   {label}: Reached user-specified limit of {self.max_rows_limit:,} rows")
                    break
                
                # If this chunk would exceed limit, truncate it
                if self.max_rows_limit > 0 and (total_rows + len(chunk)) > self.max_rows_limit:
                    rows_to_take = self.max_rows_limit - total_rows
                    chunk = chunk.head(rows_to_take)
                    print(f"   {label}: Taking only {rows_to_take:,} rows from this chunk to reach limit")
                
                total_rows += len(chunk)
                
                # Create composite keys
                if len(columns) == 1:
                    keys = chunk[columns[0]].astype(str)
                else:
                    keys = chunk[columns].astype(str).agg('||'.join, axis=1)
                
                unique_keys.update(keys.unique())
                
                if chunk_num % 10 == 0:
                    print(f"   {label}: Processed {total_rows:,} rows, {len(unique_keys):,} unique keys...")
        except Exception as e:
            if "Column(s)" in str(e) and "not found" in str(e):
                raise  # Re-raise our formatted error
            # Generic error with helpful context
            raise ValueError(f"Error reading {label} from {os.path.basename(file_path)}: {str(e)}")
        
        if self.max_rows_limit > 0:
            print(f"   {label}: Limited to {total_rows:,} rows (user limit: {self.max_rows_limit:,})")
        
        return unique_keys, total_rows
    
    def _export_records_chunked(
        self,
        file_path: str,
        key_columns: List[str],
        target_keys: set,
        output_dir: str,
        category: str,
        max_rows_per_file: int = 10000,
        label: str = "Records",
        delimiter: str = ','
    ) -> Tuple[int, List[str]]:
        """
        Export full row data for target keys by reading file in chunks.
        Creates multiple chunk files with max_rows_per_file records each.
        
        Args:
            file_path: Path to source CSV file
            key_columns: Columns used to create composite key
            target_keys: Set of keys to export
            output_dir: Directory to save chunk files
            category: Category name (matched, only_a, only_b)
            max_rows_per_file: Maximum rows per chunk file (default 10k)
            label: Label for progress messages
            delimiter: CSV delimiter
            
        Returns:
            Tuple of (total_records_exported, list_of_chunk_file_paths)
        """
        print(f"   Exporting {label} records to multiple chunk files (max {max_rows_per_file:,} per file)...")
        
        exported_count = 0
        chunk_num = 0
        file_chunk_num = 1
        chunk_file_paths = []
        current_chunk_records = []
        target_keys_set = target_keys
        total_rows_processed = 0
        
        for chunk in pd.read_csv(file_path, sep=delimiter, chunksize=self.chunk_size, 
                                encoding='utf-8', on_bad_lines='skip', low_memory=False):
            chunk_num += 1
            
            # Map columns on first chunk (same logic as _extract_unique_keys_chunked)
            if chunk_num == 1:
                chunk_cols_lower = {col.strip().lower(): col for col in chunk.columns}
                mapped_columns = []
                
                for col in key_columns:
                    col_normalized = col.strip().lower()
                    if col in chunk.columns:
                        mapped_columns.append(col)
                    elif col_normalized in chunk_cols_lower:
                        actual_col = chunk_cols_lower[col_normalized]
                        mapped_columns.append(actual_col)
                        print(f"   📝 Mapped export column '{col}' to '{actual_col}'")
                    else:
                        raise ValueError(f"Column '{col}' not found in {label}")
                
                key_columns = mapped_columns
            
            # Apply user's max rows limit if specified
            if self.max_rows_limit > 0 and total_rows_processed >= self.max_rows_limit:
                print(f"   {label}: Reached user-specified limit of {self.max_rows_limit:,} rows during export")
                break
            
            # If this chunk would exceed limit, truncate it
            if self.max_rows_limit > 0 and (total_rows_processed + len(chunk)) > self.max_rows_limit:
                rows_to_take = self.max_rows_limit - total_rows_processed
                chunk = chunk.head(rows_to_take)
                print(f"   {label}: Taking only {rows_to_take:,} rows from this chunk to reach export limit")
            
            total_rows_processed += len(chunk)
            
            # Create composite key for this chunk
            if len(key_columns) == 1:
                chunk_keys = chunk[key_columns[0]].astype(str)
            else:
                chunk_keys = chunk[key_columns].astype(str).agg('||'.join, axis=1)
            
            # Filter rows where key matches target keys
            mask = chunk_keys.isin(target_keys_set)
            matched_rows = chunk[mask]
            
            if len(matched_rows) > 0:
                # Add to current chunk
                current_chunk_records.append(matched_rows)
                exported_count += len(matched_rows)
                
                # Check if we need to write current chunk
                total_in_current_chunk = sum(len(df) for df in current_chunk_records)
                if total_in_current_chunk >= max_rows_per_file:
                    # Write chunk file
                    chunk_file_path = os.path.join(output_dir, f"{category}_chunk_{file_chunk_num:04d}.csv")
                    combined_df = pd.concat(current_chunk_records, ignore_index=True)
                    combined_df.to_csv(chunk_file_path, index=False)
                    chunk_file_paths.append(chunk_file_path)
                    print(f"   ✅ Created chunk file {file_chunk_num}: {len(combined_df):,} records")
                    
                    # Register chunk in database immediately for progressive loading
                    self._register_chunk(chunk_file_path, category, file_chunk_num, len(combined_df))
                    
                    # Reset for next chunk
                    current_chunk_records = []
                    file_chunk_num += 1
            
            if chunk_num % 10 == 0:
                print(f"   {label}: Processed {total_rows_processed:,} rows, exported {exported_count:,} so far...")
        
        # Write remaining records
        if current_chunk_records:
            chunk_file_path = os.path.join(output_dir, f"{category}_chunk_{file_chunk_num:04d}.csv")
            combined_df = pd.concat(current_chunk_records, ignore_index=True)
            combined_df.to_csv(chunk_file_path, index=False)
            chunk_file_paths.append(chunk_file_path)
            print(f"   ✅ Created chunk file {file_chunk_num}: {len(combined_df):,} records")
            
            # Register final chunk in database immediately for progressive loading
            self._register_chunk(chunk_file_path, category, file_chunk_num, len(combined_df))
        
        print(f"   ✅ Exported {exported_count:,} {label} records to {len(chunk_file_paths)} chunk files")
        return exported_count, chunk_file_paths
    
    def _get_comparison_dir(self, column_str: str) -> str:
        """
        Get directory path for specific column combination.
        Uses MD5 hash to avoid long folder names (Windows 260 char limit).
        """
        # Create short hash from column string (first 12 chars of MD5)
        column_hash = hashlib.md5(column_str.encode()).hexdigest()[:12]
        
        # Create readable prefix from first few columns (max 30 chars)
        first_cols = column_str.split(',')[:3]  # Take first 3 columns
        prefix = '_'.join(first_cols).replace(' ', '')[:30]
        
        # Folder name: prefix + hash (max ~45 chars total)
        safe_name = f"{prefix}_{column_hash}"
        
        return os.path.join(self.run_export_dir, f"comparison_{safe_name}")
    
    def _register_chunk(self, chunk_file_path: str, category: str, chunk_index: int, row_count: int):
        """
        Register a chunk file in database immediately after creation.
        This enables progressive loading - UI can fetch chunks as they're created.
        """
        from database import conn
        cursor = conn.cursor()
        
        # Get file size
        file_size = os.path.getsize(chunk_file_path) if os.path.exists(chunk_file_path) else 0
        
        # Get column combination from the current comparison directory
        # Extract from file path (it's stored in the compare_and_export method)
        column_combination = getattr(self, '_current_columns', 'unknown')
        
        cursor.execute('''
            INSERT INTO comparison_export_files 
            (run_id, column_combination, category, file_path, file_size, row_count, chunk_index, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            self.run_id,
            column_combination,
            category,
            chunk_file_path,
            file_size,
            row_count,
            chunk_index,
            'completed',
            datetime.now().isoformat()
        ))
        conn.commit()
        print(f"   📝 Registered chunk {chunk_index} in database for progressive loading")
    
    def _store_comparison_metadata(self, summary: Dict):
        """Store comparison metadata in database including all chunk files"""
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
        
        # Store chunk file paths
        export_paths = summary.get('export_paths', {})
        timestamp = datetime.now().isoformat()
        export_dir = summary.get('export_dir', '')
        
        # Delete old chunk files for this combination first
        cursor.execute('''
            DELETE FROM comparison_export_files 
            WHERE run_id = ? AND column_combination = ?
        ''', (self.run_id, summary['columns']))
        
        # Store directory mapping for reference (helps identify folders)
        print(f"✅ Export directory: {export_dir}")
        print(f"   Full columns: {summary['columns']}")
        
        for category in ['matched', 'only_a', 'only_b']:
            chunk_files = export_paths.get(f'{category}_files', [])
            category_count = export_paths.get(f'{category}_count', 0)
            
            if chunk_files:
                for idx, file_path in enumerate(chunk_files, 1):
                    file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
                    
                    # Count rows in chunk file (from file, more accurate)
                    try:
                        with open(file_path, 'r') as f:
                            row_count = sum(1 for _ in f) - 1  # Subtract header
                    except:
                        row_count = 0
                    
                    cursor.execute('''
                        INSERT INTO comparison_export_files 
                        (run_id, column_combination, category, file_path, file_size, row_count, created_at, chunk_index)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        self.run_id,
                        summary['columns'],
                        category,
                        file_path,
                        file_size,
                        row_count,
                        timestamp,
                        idx
                    ))
        
        conn.commit()
        print(f"✅ Metadata stored in database (chunk files tracked)")


def get_comparison_export_files(run_id: int, columns: str = None) -> List[Dict]:
    """
    Get list of exported comparison chunk files for a run.
    
    Args:
        run_id: Run ID
        columns: Optional column combination filter
        
    Returns:
        List of file information dictionaries with chunk details
    """
    cursor = conn.cursor()
    
    if columns:
        cursor.execute('''
            SELECT file_id, column_combination, category, file_path, file_size, row_count, created_at, chunk_index
            FROM comparison_export_files
            WHERE run_id = ? AND column_combination = ?
            ORDER BY category, chunk_index
        ''', (run_id, columns))
    else:
        cursor.execute('''
            SELECT file_id, column_combination, category, file_path, file_size, row_count, created_at, chunk_index
            FROM comparison_export_files
            WHERE run_id = ?
            ORDER BY column_combination, category, chunk_index
        ''', (run_id,))
    
    rows = cursor.fetchall()
    
    files = []
    for row in rows:
        chunk_index = row[7] if len(row) > 7 else 1
        files.append({
            'file_id': row[0],
            'columns': row[1],
            'category': row[2],
            'file_path': row[3],
            'file_size': row[4],
            'file_size_mb': round(row[4] / (1024 * 1024), 2),
            'row_count': row[5],
            'created_at': row[6],
            'chunk_index': chunk_index,
            'chunk_name': f"{row[2]}_chunk_{chunk_index:04d}.csv",
            'exists': os.path.exists(row[3])
        })
    
    return files


# Cache for file row counts to avoid re-counting large files
_file_row_count_cache = {}

def _get_cached_row_count(file_path: str) -> int:
    """
    Get row count from cache or count and cache it.
    Optimized for very large files (up to 70M+ records).
    """
    # Check cache first
    file_mtime = os.path.getmtime(file_path)
    cache_key = f"{file_path}:{file_mtime}"
    
    if cache_key in _file_row_count_cache:
        return _file_row_count_cache[cache_key]
    
    # Try to get from database first (fastest)
    try:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT row_count FROM comparison_export_files 
            WHERE file_path = ? 
            ORDER BY created_at DESC LIMIT 1
        ''', (file_path,))
        result = cursor.fetchone()
        if result and result[0]:
            _file_row_count_cache[cache_key] = result[0]
            return result[0]
    except:
        pass
    
    # Fallback: Count lines efficiently for large files
    # Use buffered reading for better performance
    print(f"⏱️ Counting rows in large file (this may take a moment)...")
    row_count = 0
    with open(file_path, 'rb') as f:
        # Read in 64KB chunks for speed
        buffer_size = 64 * 1024
        chunk = f.read(buffer_size)
        while chunk:
            row_count += chunk.count(b'\n')
            chunk = f.read(buffer_size)
    
    row_count -= 1  # Subtract header row
    _file_row_count_cache[cache_key] = row_count
    return row_count


def read_export_file_paginated(
    file_path: str,
    offset: int = 0,
    limit: int = 100
) -> Dict:
    """
    Read exported CSV file with pagination support.
    Optimized for very large files (70M+ records) using:
    - Cached row counts (no re-counting on every request)
    - Memory-efficient chunked reading with skiprows/nrows
    - Fast binary line counting when cache miss
    
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
        # Get total row count from cache (very fast for large files)
        total_rows = _get_cached_row_count(file_path)
        
        # Read paginated chunk (memory-efficient)
        # skiprows: skip header (0) + offset rows (1 to offset+1)
        if offset == 0:
            df = pd.read_csv(file_path, nrows=limit, low_memory=False)
        else:
            # Skip offset rows (after header) - use range for memory efficiency
            skip_rows = list(range(1, offset + 1))
            df = pd.read_csv(file_path, skiprows=skip_rows, nrows=limit, low_memory=False)
        
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
            'showing': len(records),
            'total_pages': (total_rows + limit - 1) // limit  # Ceiling division
        }
    
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        import traceback
        traceback.print_exc()
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

