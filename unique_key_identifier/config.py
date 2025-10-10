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
MAX_ROWS_HARD_LIMIT = 500000  # Hard limit at 500k rows
MAX_COMBINATIONS = 50  # Maximum combinations to analyze
MEMORY_EFFICIENT_THRESHOLD = 50000  # Use sampling above 50k rows

