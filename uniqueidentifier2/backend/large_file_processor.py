"""
Large File Processor for 7-10 Million Records
Optimized chunked processing with intelligent sampling and memory management
"""
import pandas as pd
import numpy as np
from typing import List, Dict, Tuple, Optional, Iterator
import os
from file_processing import detect_delimiter, read_data_file
from config import (
    VERY_LARGE_FILE_THRESHOLD,
    INTELLIGENT_SAMPLING_SIZE,
    ULTRA_LARGE_CHUNK_SIZE,
    CHUNK_SIZE
)


class LargeFileProcessor:
    """
    Handles processing of very large files (5M+ rows) with:
    - Intelligent sampling
    - Chunked processing
    - Memory optimization
    - Progress tracking
    """
    
    def __init__(self, file_path: str, max_rows: Optional[int] = None):
        self.file_path = file_path
        self.max_rows = max_rows
        self.delimiter = detect_delimiter(file_path)
        self.row_count = self._count_rows()
        self.is_very_large = self.row_count > VERY_LARGE_FILE_THRESHOLD
        self.sample_size = self._determine_sample_size()
        
    def _count_rows(self) -> int:
        """Fast row count without loading file into memory"""
        try:
            # Quick count using shell command for very large files
            if os.name != 'nt':  # Unix-like systems
                import subprocess
                result = subprocess.run(
                    ['wc', '-l', self.file_path],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                if result.returncode == 0:
                    count = int(result.stdout.split()[0])
                    return count - 1  # Subtract header
            
            # Fallback: count using pandas chunking
            count = 0
            for _ in pd.read_csv(self.file_path, sep=self.delimiter, chunksize=100000):
                count += 1
            return count * 100000
        except:
            # Last resort: estimate from file size
            file_size = os.path.getsize(self.file_path)
            estimated_rows = int(file_size / 100)  # Assume ~100 bytes per row
            return estimated_rows
    
    def _determine_sample_size(self) -> int:
        """Determine optimal sample size based on file size"""
        if self.max_rows and self.max_rows > 0:
            return min(self.max_rows, self.row_count)
        
        if self.row_count <= VERY_LARGE_FILE_THRESHOLD:
            return self.row_count  # Load all
        
        # For 5M-10M rows, use 1M sample (10-20%)
        if self.row_count <= 10000000:
            return INTELLIGENT_SAMPLING_SIZE
        
        # For >10M rows, use adaptive sampling (minimum 1M, max 15%)
        return max(INTELLIGENT_SAMPLING_SIZE, int(self.row_count * 0.15))
    
    def load_data(self, use_sampling: bool = True) -> pd.DataFrame:
        """
        Load data with intelligent sampling for very large files
        
        Args:
            use_sampling: Whether to use sampling (auto-determined if None)
        
        Returns:
            DataFrame with loaded data
        """
        if not use_sampling or not self.is_very_large:
            # Load entire file or user-specified rows
            if self.max_rows and self.max_rows > 0:
                df, _ = read_data_file(self.file_path, nrows=self.max_rows)
            else:
                df, _ = read_data_file(self.file_path)
            return df
        
        # Use intelligent sampling
        print(f"📊 Large file detected: {self.row_count:,} rows")
        print(f"🎯 Using intelligent sampling: {self.sample_size:,} rows ({(self.sample_size/self.row_count*100):.1f}%)")
        
        return self._stratified_sample()
    
    def _stratified_sample(self) -> pd.DataFrame:
        """
        Create a stratified sample that's representative of the entire dataset
        Uses systematic sampling for speed and representativeness
        """
        # Calculate sampling interval
        skip_interval = self.row_count // self.sample_size
        
        if skip_interval <= 1:
            # If sample size >= file size, load all
            df, _ = read_data_file(self.file_path)
            return df
        
        # Read every Nth row for systematic sampling
        rows_to_read = list(range(0, self.row_count, skip_interval))[:self.sample_size]
        
        df = pd.read_csv(
            self.file_path,
            sep=self.delimiter,
            skiprows=lambda x: x not in rows_to_read and x != 0
        )
        
        return df
    
    def process_in_chunks(self, process_func, chunk_size: Optional[int] = None) -> Iterator[Dict]:
        """
        Process file in chunks for memory efficiency
        
        Args:
            process_func: Function to apply to each chunk
            chunk_size: Size of each chunk (default: ULTRA_LARGE_CHUNK_SIZE)
        
        Yields:
            Processed results for each chunk
        """
        chunk_size = chunk_size or ULTRA_LARGE_CHUNK_SIZE
        
        chunk_reader = pd.read_csv(
            self.file_path,
            sep=self.delimiter,
            chunksize=chunk_size
        )
        
        for i, chunk in enumerate(chunk_reader):
            print(f"Processing chunk {i + 1} ({len(chunk):,} rows)...")
            result = process_func(chunk)
            yield result
    
    def get_metadata(self) -> Dict:
        """Get file metadata without loading entire file"""
        # Read just first few rows to get column info
        df_sample = pd.read_csv(self.file_path, sep=self.delimiter, nrows=5)
        
        return {
            'file_path': self.file_path,
            'total_rows': self.row_count,
            'columns': df_sample.columns.tolist(),
            'column_count': len(df_sample.columns),
            'delimiter': self.delimiter,
            'is_very_large': self.is_very_large,
            'sample_size': self.sample_size,
            'sampling_ratio': f"{(self.sample_size / self.row_count * 100):.1f}%",
            'file_size_mb': os.path.getsize(self.file_path) / (1024 * 1024),
            'estimated_memory_mb': self._estimate_memory_usage()
        }
    
    def _estimate_memory_usage(self) -> float:
        """Estimate memory usage for loading the data"""
        # Read small sample to estimate
        df_sample = pd.read_csv(self.file_path, sep=self.delimiter, nrows=1000)
        memory_per_row = df_sample.memory_usage(deep=True).sum() / 1000
        total_memory = (self.sample_size * memory_per_row) / (1024 * 1024)
        return round(total_memory, 2)


def process_ultra_large_comparison(
    file_a_path: str,
    file_b_path: str,
    columns: List[str],
    progress_callback=None
) -> Dict:
    """
    Compare two very large files efficiently
    
    Args:
        file_a_path: Path to first file
        file_b_path: Path to second file
        columns: Columns to use for comparison
        progress_callback: Function to call with progress updates
    
    Returns:
        Comparison results with summary statistics
    """
    processor_a = LargeFileProcessor(file_a_path)
    processor_b = LargeFileProcessor(file_b_path)
    
    # Determine if we need sampling
    use_sampling_a = processor_a.is_very_large
    use_sampling_b = processor_b.is_very_large
    
    if progress_callback:
        progress_callback(0, f"Loading File A ({processor_a.row_count:,} rows)...")
    
    df_a = processor_a.load_data(use_sampling=use_sampling_a)
    
    if progress_callback:
        progress_callback(25, f"Loading File B ({processor_b.row_count:,} rows)...")
    
    df_b = processor_b.load_data(use_sampling=use_sampling_b)
    
    if progress_callback:
        progress_callback(50, "Comparing files...")
    
    # Create composite keys
    df_a['_key'] = df_a[columns].astype(str).agg('||'.join, axis=1)
    df_b['_key'] = df_b[columns].astype(str).agg('||'.join, axis=1)
    
    # Get unique keys from each side
    keys_a = set(df_a['_key'].unique())
    keys_b = set(df_b['_key'].unique())
    
    if progress_callback:
        progress_callback(75, "Calculating matches...")
    
    # Calculate matches
    matched = keys_a & keys_b
    only_a = keys_a - keys_b
    only_b = keys_b - keys_a
    
    if progress_callback:
        progress_callback(100, "Complete!")
    
    return {
        'matched_count': len(matched),
        'only_a_count': len(only_a),
        'only_b_count': len(only_b),
        'total_a': len(keys_a),
        'total_b': len(keys_b),
        'match_rate': round(len(matched) / len(keys_a) * 100, 2) if keys_a else 0,
        'matched_keys': list(matched)[:10000],  # Limit for API response
        'only_a_keys': list(only_a)[:10000],
        'only_b_keys': list(only_b)[:10000],
        'sampled_a': use_sampling_a,
        'sampled_b': use_sampling_b,
        'sample_size_a': processor_a.sample_size,
        'sample_size_b': processor_b.sample_size,
        'metadata_a': processor_a.get_metadata(),
        'metadata_b': processor_b.get_metadata()
    }


def optimize_dataframe_memory(df: pd.DataFrame) -> pd.DataFrame:
    """
    Optimize DataFrame memory usage by downcasting numeric types
    Can reduce memory by 50-75%
    """
    for col in df.columns:
        col_type = df[col].dtype
        
        if col_type == 'object':
            # Try to convert to category if low cardinality
            num_unique = df[col].nunique()
            num_total = len(df[col])
            if num_unique / num_total < 0.5:
                df[col] = df[col].astype('category')
        
        elif col_type == 'float64':
            # Downcast floats
            df[col] = pd.to_numeric(df[col], downcast='float')
        
        elif col_type == 'int64':
            # Downcast integers
            df[col] = pd.to_numeric(df[col], downcast='integer')
    
    return df


def get_processing_strategy(row_count: int, user_limit: Optional[int] = None) -> Dict:
    """
    Determine optimal processing strategy based on file size
    
    Returns:
        Strategy dictionary with recommended approach
    """
    if user_limit and user_limit > 0:
        return {
            'strategy': 'user_limited',
            'rows_to_process': user_limit,
            'use_sampling': False,
            'chunk_processing': user_limit > CHUNK_SIZE,
            'chunk_size': CHUNK_SIZE,
            'description': f'User-limited to {user_limit:,} rows'
        }
    
    if row_count <= CHUNK_SIZE:
        return {
            'strategy': 'full_load',
            'rows_to_process': row_count,
            'use_sampling': False,
            'chunk_processing': False,
            'description': f'Full load ({row_count:,} rows)'
        }
    
    elif row_count <= VERY_LARGE_FILE_THRESHOLD:
        return {
            'strategy': 'chunked',
            'rows_to_process': row_count,
            'use_sampling': False,
            'chunk_processing': True,
            'chunk_size': CHUNK_SIZE,
            'description': f'Chunked processing ({row_count:,} rows)'
        }
    
    else:
        # Very large files: use sampling
        sample_size = min(INTELLIGENT_SAMPLING_SIZE, int(row_count * 0.2))
        return {
            'strategy': 'intelligent_sampling',
            'rows_to_process': sample_size,
            'use_sampling': True,
            'chunk_processing': True,
            'chunk_size': ULTRA_LARGE_CHUNK_SIZE,
            'sample_ratio': f"{(sample_size / row_count * 100):.1f}%",
            'description': f'Intelligent sampling: {sample_size:,} / {row_count:,} rows ({(sample_size/row_count*100):.1f}%)'
        }


# Example usage
if __name__ == "__main__":
    # Test with a large file
    import sys
    
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        
        print("Analyzing file...")
        processor = LargeFileProcessor(file_path)
        metadata = processor.get_metadata()
        
        print("\n" + "=" * 60)
        print("FILE METADATA")
        print("=" * 60)
        for key, value in metadata.items():
            print(f"{key:.<30} {value}")
        
        print("\n" + "=" * 60)
        print("PROCESSING STRATEGY")
        print("=" * 60)
        strategy = get_processing_strategy(processor.row_count)
        for key, value in strategy.items():
            print(f"{key:.<30} {value}")
        
        print("\n✅ Analysis complete!")
    else:
        print("Usage: python large_file_processor.py <file_path>")

