"""
Configuration and constants for the file comparison tool
"""
import os

# Get script directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Database path
DB_PATH = os.path.join(SCRIPT_DIR, "file_comparison.db")

# Supported file formats
SUPPORTED_EXTENSIONS = ['.csv', '.dat', '.txt']

# Performance limits
MAX_ROWS_WARNING = 100000  # Warn above 100k rows
MAX_ROWS_HARD_LIMIT = 100000000  # Hard limit at 100 million rows (increased for large datasets)
MAX_COMBINATIONS = 50  # Maximum combinations to analyze
MEMORY_EFFICIENT_THRESHOLD = 50000  # Use sampling above 50k rows

# Chunk processing settings for very large files
CHUNK_SIZE = 100000  # Process 100k rows at a time
LARGE_FILE_THRESHOLD = 1000000  # Use chunk processing above 1M rows
SAMPLE_SIZE_FOR_LARGE_FILES = 500000  # Sample size for files above 1M rows

# Ultra-large file handling (7-10M records)
VERY_LARGE_FILE_THRESHOLD = 5000000  # 5M+ rows - use aggressive optimization
EXTREME_LARGE_FILE_THRESHOLD = 50000000  # 50M+ rows - use extreme optimization
ULTRA_LARGE_CHUNK_SIZE = 250000  # Process 250k rows at a time for very large files
INTELLIGENT_SAMPLING_SIZE = 1000000  # Use 1M sample for 7-10M files
EXTREME_SAMPLING_SIZE = 2000000  # Use 2M sample for 50M+ files (still <5%)
PROGRESSIVE_LOADING_BATCH_SIZE = 50  # Load results in batches of 50

# File generation limits (enterprise grade)
MAX_FILE_GENERATION_ROWS = 100000  # Max rows to include in generated files
SKIP_FILE_GENERATION_THRESHOLD = 200000  # Skip file generation if source > 200k rows
MAX_FILE_SIZE_MB = 50  # Maximum file size in MB for generated files
FILE_GENERATION_TIMEOUT = 300  # Timeout in seconds (5 minutes) per file generation
MAX_COMBINATIONS_TO_GENERATE = 5  # Limit number of combination files to generate

# API Pagination settings
DEFAULT_PAGE_SIZE = 100  # Default number of results per page
MAX_PAGE_SIZE = 500  # Maximum results per page
COMPARISON_BATCH_SIZE = 1000  # Batch size for comparison data loading

