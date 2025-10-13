import pandas as pd
import os
import asyncio
from pathlib import Path
from typing import Tuple, List, Optional, Dict, Any
from app.core.config import settings

class FileProcessor:
    """Handles file operations and CSV processing"""
    
    @staticmethod
    def get_file_path(filename: str, working_directory: str = "") -> Path:
        """Get absolute file path"""
        if working_directory:
            base_path = Path(working_directory)
        else:
            base_path = Path(settings.DEFAULT_WORKING_DIRECTORY)
        
        return base_path / filename
    
    @staticmethod
    def validate_file_exists(file_path: Path) -> None:
        """Validate that file exists and is readable"""
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        if not file_path.is_file():
            raise ValueError(f"Path is not a file: {file_path}")
        
        if not os.access(file_path, os.R_OK):
            raise PermissionError(f"File is not readable: {file_path}")
    
    @staticmethod
    def get_file_size_mb(file_path: Path) -> float:
        """Get file size in MB"""
        size_bytes = file_path.stat().st_size
        return round(size_bytes / (1024 * 1024), 2)
    
    @staticmethod
    def read_csv_headers(file_path: Path) -> List[str]:
        """Read CSV headers without loading full file"""
        try:
            # Try different encodings
            encodings = ['utf-8', 'latin-1', 'cp1252']
            
            for encoding in encodings:
                try:
                    df = pd.read_csv(file_path, nrows=0, encoding=encoding)
                    return df.columns.tolist()
                except UnicodeDecodeError:
                    continue
            
            raise ValueError(f"Could not decode file with any of the supported encodings: {encodings}")
            
        except Exception as e:
            raise ValueError(f"Error reading CSV headers from {file_path}: {str(e)}")
    
    @staticmethod
    def count_csv_rows(file_path: Path) -> int:
        """Count rows in CSV file efficiently"""
        try:
            # For large files, use a more efficient method
            row_count = 0
            
            # Try different encodings
            encodings = ['utf-8', 'latin-1', 'cp1252']
            
            for encoding in encodings:
                try:
                    with open(file_path, 'r', encoding=encoding) as f:
                        # Skip header
                        next(f)
                        # Count remaining lines
                        row_count = sum(1 for _ in f)
                    break
                except UnicodeDecodeError:
                    continue
            else:
                raise ValueError(f"Could not decode file with any of the supported encodings: {encodings}")
            
            return row_count
            
        except Exception as e:
            raise ValueError(f"Error counting rows in {file_path}: {str(e)}")
    
    @staticmethod
    async def preview_files(file_a: str, file_b: str, working_directory: str = "") -> Dict[str, Any]:
        """Preview files and get metadata"""
        try:
            # Get file paths
            path_a = FileProcessor.get_file_path(file_a, working_directory)
            path_b = FileProcessor.get_file_path(file_b, working_directory)
            
            # Validate files exist
            FileProcessor.validate_file_exists(path_a)
            FileProcessor.validate_file_exists(path_b)
            
            # Get file sizes
            size_a = FileProcessor.get_file_size_mb(path_a)
            size_b = FileProcessor.get_file_size_mb(path_b)
            
            # Check file sizes
            if size_a > settings.MAX_FILE_SIZE_MB or size_b > settings.MAX_FILE_SIZE_MB:
                raise ValueError(f"File too large. Maximum size: {settings.MAX_FILE_SIZE_MB}MB")
            
            # Read headers
            headers_a = FileProcessor.read_csv_headers(path_a)
            headers_b = FileProcessor.read_csv_headers(path_b)
            
            # Find common columns
            common_columns = list(set(headers_a) & set(headers_b))
            common_columns.sort()  # Sort for consistency
            
            if not common_columns:
                raise ValueError("No common columns found between files")
            
            # Count rows (run in parallel)
            rows_a, rows_b = await asyncio.gather(
                asyncio.to_thread(FileProcessor.count_csv_rows, path_a),
                asyncio.to_thread(FileProcessor.count_csv_rows, path_b)
            )
            
            # Generate warnings and estimates
            warnings = []
            estimated_time = None
            
            total_rows = rows_a + rows_b
            if total_rows > 1000000:
                warnings.append("Large dataset detected. Consider using row limits for faster processing.")
                estimated_time = f"{int(total_rows / 100000)} minutes"
            
            if len(common_columns) > 20:
                warnings.append("Many columns detected. Consider specifying explicit combinations.")
            
            return {
                "columns": common_columns,
                "column_count": len(common_columns),
                "file_a_rows": rows_a,
                "file_b_rows": rows_b,
                "file_a_size_mb": size_a,
                "file_b_size_mb": size_b,
                "warnings": warnings,
                "estimated_time": estimated_time
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    @staticmethod
    def load_csv_data(file_path: Path, max_rows: int = 0) -> pd.DataFrame:
        """Load CSV data with optional row limit"""
        try:
            nrows = max_rows if max_rows > 0 else None
            
            # Try different encodings
            encodings = ['utf-8', 'latin-1', 'cp1252']
            
            for encoding in encodings:
                try:
                    df = pd.read_csv(file_path, nrows=nrows, encoding=encoding)
                    return df
                except UnicodeDecodeError:
                    continue
            
            raise ValueError(f"Could not decode file with any of the supported encodings: {encodings}")
            
        except Exception as e:
            raise ValueError(f"Error loading CSV data from {file_path}: {str(e)}")
    
    @staticmethod
    def validate_columns_exist(df: pd.DataFrame, columns: List[str]) -> None:
        """Validate that specified columns exist in DataFrame"""
        missing_columns = [col for col in columns if col not in df.columns]
        if missing_columns:
            raise ValueError(f"Columns not found in file: {missing_columns}")
    
    @staticmethod
    def get_common_columns(df_a: pd.DataFrame, df_b: pd.DataFrame) -> List[str]:
        """Get common columns between two DataFrames"""
        common_cols = list(set(df_a.columns) & set(df_b.columns))
        common_cols.sort()
        return common_cols