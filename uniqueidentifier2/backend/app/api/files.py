from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.models.responses import PreviewResponse
from app.utils.file_processor import FileProcessor

router = APIRouter()

@router.get("/preview-columns", response_model=PreviewResponse)
async def preview_columns(
    file_a: str = Query(..., description="Path to file A"),
    file_b: str = Query(..., description="Path to file B"),
    working_directory: Optional[str] = Query("", description="Working directory path")
):
    """Preview columns and file information"""
    try:
        result = await FileProcessor.preview_files(file_a, file_b, working_directory)
        
        if "error" in result:
            return PreviewResponse(
                columns=[],
                column_count=0,
                file_a_rows=0,
                file_b_rows=0,
                error=result["error"]
            )
        
        return PreviewResponse(
            columns=result["columns"],
            column_count=result["column_count"],
            file_a_rows=result["file_a_rows"],
            file_b_rows=result["file_b_rows"],
            file_a_size_mb=result.get("file_a_size_mb"),
            file_b_size_mb=result.get("file_b_size_mb"),
            warnings=result.get("warnings"),
            estimated_time=result.get("estimated_time")
        )
        
    except Exception as e:
        return PreviewResponse(
            columns=[],
            column_count=0,
            file_a_rows=0,
            file_b_rows=0,
            error=str(e)
        )