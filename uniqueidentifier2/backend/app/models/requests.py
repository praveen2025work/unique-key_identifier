from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class AnalysisRequest(BaseModel):
    file_a: str = Field(..., description="Path to file A")
    file_b: str = Field(..., description="Path to file B")
    num_columns: int = Field(3, ge=1, le=10, description="Number of columns for combination")
    max_rows: int = Field(0, ge=0, description="Maximum rows to process (0 = auto)")
    expected_combinations: str = Field("", description="Expected combinations (newline separated)")
    excluded_combinations: str = Field("", description="Excluded combinations (newline separated)")
    working_directory: str = Field("", description="Working directory path")
    data_quality_check: bool = Field(False, description="Enable data quality checks")

class PreviewRequest(BaseModel):
    file_a: str = Field(..., description="Path to file A")
    file_b: str = Field(..., description="Path to file B")
    working_directory: Optional[str] = Field("", description="Working directory path")