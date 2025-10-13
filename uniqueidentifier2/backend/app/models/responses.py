from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class PreviewResponse(BaseModel):
    columns: List[str] = Field(..., description="List of column names")
    column_count: int = Field(..., description="Number of columns")
    file_a_rows: int = Field(..., description="Number of rows in file A")
    file_b_rows: int = Field(..., description="Number of rows in file B")
    file_a_size_mb: Optional[float] = Field(None, description="File A size in MB")
    file_b_size_mb: Optional[float] = Field(None, description="File B size in MB")
    warnings: Optional[List[str]] = Field(None, description="Performance warnings")
    estimated_time: Optional[str] = Field(None, description="Estimated processing time")
    error: Optional[str] = Field(None, description="Error message if any")

class AnalysisResponse(BaseModel):
    run_id: Optional[str] = Field(None, description="Run ID if successful")
    error: Optional[str] = Field(None, description="Error message if any")
    message: Optional[str] = Field(None, description="Additional message")

class RunInfo(BaseModel):
    id: str = Field(..., description="Run ID")
    label: str = Field(..., description="Run label")
    file_a: str = Field(..., description="Path to file A")
    file_b: str = Field(..., description="Path to file B")
    num_columns: int = Field(..., description="Number of columns")
    max_rows: int = Field(..., description="Maximum rows processed")
    working_directory: Optional[str] = Field(None, description="Working directory")
    data_quality_check: bool = Field(..., description="Data quality check enabled")
    expected_combinations: Optional[str] = Field(None, description="Expected combinations")
    excluded_combinations: Optional[str] = Field(None, description="Excluded combinations")
    created_at: datetime = Field(..., description="Creation timestamp")
    status: str = Field(..., description="Run status")

class ErrorResponse(BaseModel):
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Error details")
    code: Optional[str] = Field(None, description="Error code")