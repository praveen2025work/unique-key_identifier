"""
File processing operations - reading, parsing, and validating data files
"""
import os
import csv
import pandas as pd
import numpy as np
from config import SUPPORTED_EXTENSIONS, MEMORY_EFFICIENT_THRESHOLD, LARGE_FILE_THRESHOLD, SAMPLE_SIZE_FOR_LARGE_FILES

def detect_delimiter(file_path, sample_size=5):
    """
    Auto-detect delimiter in file by analyzing first few lines
    Supports: comma, tab, pipe, semicolon, space
    """
    common_delimiters = [',', '\t', '|', ';', ' ']
    
    with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
        # Read sample lines
        sample_lines = [f.readline() for _ in range(sample_size)]
        sample = ''.join(sample_lines)
    
    # Use CSV Sniffer to detect delimiter
    try:
        sniffer = csv.Sniffer()
        delimiter = sniffer.sniff(sample, delimiters=''.join(common_delimiters)).delimiter
        return delimiter
    except:
        # Fallback: count occurrences of each delimiter
        delimiter_counts = {delim: sum(line.count(delim) for line in sample_lines) 
                           for delim in common_delimiters}
        
        # Return delimiter with highest consistent count
        max_delim = max(delimiter_counts, key=delimiter_counts.get)
        if delimiter_counts[max_delim] > 0:
            return max_delim
        
        # Default to comma if nothing found
        return ','

def get_file_stats(file_path):
    """
    Get basic file statistics without loading entire file
    Returns: (row_count, file_size_mb)
    """
    try:
        file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
        
        # Count rows efficiently
        with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
            row_count = sum(1 for _ in f) - 1  # Subtract header row
        
        return row_count, file_size_mb
    except Exception as e:
        return None, None

def estimate_processing_time(rows, columns):
    """Estimate processing time based on data size"""
    if rows < 10000:
        return "Less than 30 seconds"
    elif rows < 50000:
        return "30-60 seconds"
    elif rows < 100000:
        return "1-2 minutes"
    elif rows < 250000:
        return "2-5 minutes (using sampling)"
    elif rows < 1000000:
        return "5-10 minutes (using sampling)"
    elif rows < 5000000:
        return "10-15 minutes (using smart sampling)"
    else:
        return "15-20 minutes (using smart sampling for large dataset)"

def read_large_file_with_sampling(file_path, sample_size=SAMPLE_SIZE_FOR_LARGE_FILES):
    """
    Read very large files (millions of rows) using intelligent sampling
    Returns a representative sample of the data
    """
    file_ext = os.path.splitext(file_path)[1].lower()
    
    if file_ext not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {file_ext}. Supported formats: {', '.join(SUPPORTED_EXTENSIONS)}")
    
    # Detect delimiter
    delimiter = detect_delimiter(file_path)
    
    # Get total row count
    row_count, _ = get_file_stats(file_path)
    
    if row_count is None or row_count <= sample_size:
        # File is small enough to read entirely
        try:
            df = pd.read_csv(file_path, sep=delimiter, encoding='utf-8', on_bad_lines='skip', low_memory=False)
            return df, delimiter
        except UnicodeDecodeError:
            df = pd.read_csv(file_path, sep=delimiter, encoding='latin-1', on_bad_lines='skip', low_memory=False)
            return df, delimiter
    
    # For very large files, use stratified sampling
    # Read every Nth row to get a representative sample
    skip_interval = max(1, row_count // sample_size)
    
    try:
        # Use skiprows to read only every Nth row
        df = pd.read_csv(
            file_path, 
            sep=delimiter, 
            encoding='utf-8', 
            on_bad_lines='skip',
            skiprows=lambda i: i > 0 and i % skip_interval != 0,
            low_memory=False
        )
        
        # Ensure we don't exceed sample size
        if len(df) > sample_size:
            df = df.head(sample_size)
        
        return df, delimiter
    except UnicodeDecodeError:
        df = pd.read_csv(
            file_path, 
            sep=delimiter, 
            encoding='latin-1', 
            on_bad_lines='skip',
            skiprows=lambda i: i > 0 and i % skip_interval != 0,
            low_memory=False
        )
        if len(df) > sample_size:
            df = df.head(sample_size)
        return df, delimiter
    except Exception as e:
        raise ValueError(f"Error reading large file: {str(e)}")

def read_data_file(file_path, nrows=None, sample_for_large=False):
    """
    Read data file with automatic delimiter detection
    Supports: .csv, .dat, .txt files
    For large files, can use sampling for efficiency
    """
    file_ext = os.path.splitext(file_path)[1].lower()
    
    if file_ext not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {file_ext}. Supported formats: {', '.join(SUPPORTED_EXTENSIONS)}")
    
    # Detect delimiter
    delimiter = detect_delimiter(file_path)
    
    # Check if we should use sampling for very large files
    if sample_for_large and nrows is None:
        row_count, _ = get_file_stats(file_path)
        if row_count and row_count > LARGE_FILE_THRESHOLD:
            # Use intelligent sampling for very large files
            return read_large_file_with_sampling(file_path)
        elif row_count and row_count > MEMORY_EFFICIENT_THRESHOLD:
            # Use stratified sampling for medium-large files
            skip_rows = max(1, row_count // MEMORY_EFFICIENT_THRESHOLD)
            try:
                df = pd.read_csv(file_path, sep=delimiter, encoding='utf-8', 
                               on_bad_lines='skip', skiprows=lambda i: i % skip_rows != 0 and i > 0,
                               low_memory=False)
                return df, delimiter
            except:
                pass  # Fall back to normal reading
    
    # Read file with detected delimiter
    try:
        df = pd.read_csv(file_path, sep=delimiter, nrows=nrows, encoding='utf-8', on_bad_lines='skip', low_memory=False)
        return df, delimiter
    except UnicodeDecodeError:
        # Try with different encoding
        df = pd.read_csv(file_path, sep=delimiter, nrows=nrows, encoding='latin-1', on_bad_lines='skip', low_memory=False)
        return df, delimiter
    except Exception as e:
        raise ValueError(f"Error reading file: {str(e)}")

