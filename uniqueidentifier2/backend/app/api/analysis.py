from fastapi import APIRouter, HTTPException, Form, BackgroundTasks
from typing import Optional
from app.models.responses import AnalysisResponse
from app.services.analysis_engine import AnalysisEngine
import asyncio

router = APIRouter()

@router.post("/compare", response_model=AnalysisResponse)
async def submit_analysis(
    background_tasks: BackgroundTasks,
    file_a: str = Form(...),
    file_b: str = Form(...),
    num_columns: int = Form(3),
    max_rows: int = Form(0),
    expected_combinations: str = Form(""),
    excluded_combinations: str = Form(""),
    working_directory: str = Form(""),
    data_quality_check: bool = Form(False)
):
    """Submit analysis request"""
    try:
        # Parse combinations
        included_combinations = None
        if expected_combinations.strip():
            included_combinations = [
                combo.strip() for combo in expected_combinations.split('\n')
                if combo.strip()
            ]
        
        excluded_combinations_list = None
        if excluded_combinations.strip():
            excluded_combinations_list = [
                combo.strip() for combo in excluded_combinations.split('\n')
                if combo.strip()
            ]
        
        # Start analysis in background
        run_id = await AnalysisEngine.run_analysis(
            file_a=file_a,
            file_b=file_b,
            num_columns=num_columns,
            max_rows=max_rows,
            working_directory=working_directory,
            included_combinations=included_combinations,
            excluded_combinations=excluded_combinations_list,
            data_quality_check=data_quality_check
        )
        
        return AnalysisResponse(
            run_id=run_id,
            message="Analysis completed successfully"
        )
        
    except Exception as e:
        return AnalysisResponse(
            error=str(e)
        )

@router.get("/analysis/{run_id}")
async def get_analysis_result(run_id: str):
    """Get analysis result by run ID"""
    try:
        result = AnalysisEngine.get_analysis_result(run_id)
        if not result:
            raise HTTPException(status_code=404, detail="Analysis result not found")
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))