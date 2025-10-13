from fastapi import APIRouter, HTTPException
from typing import List
from app.models.responses import RunInfo
from app.services.analysis_engine import AnalysisEngine

router = APIRouter()

@router.get("/runs", response_model=List[RunInfo])
async def get_runs():
    """Get list of all analysis runs"""
    try:
        runs = AnalysisEngine.list_analysis_runs()
        return [RunInfo(**run) for run in runs]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/clone/{run_id}")
async def clone_run(run_id: str):
    """Clone a run configuration"""
    try:
        result = AnalysisEngine.get_analysis_result(run_id)
        if not result:
            raise HTTPException(status_code=404, detail="Run not found")
        
        # Return configuration data for cloning
        return {
            "run_id": run_id,
            "file_a": result["file_a"],
            "file_b": result["file_b"],
            "num_columns": result["num_columns"],
            "max_rows": result["max_rows"],
            "working_directory": result.get("working_directory", ""),
            "data_quality_check": result.get("data_quality_check", False),
            "expected_combinations": '\n'.join(result.get("included_combinations", [])) if result.get("included_combinations") else "",
            "excluded_combinations": '\n'.join(result.get("excluded_combinations", [])) if result.get("excluded_combinations") else ""
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/run/{run_id}")
async def get_run_details(run_id: str):
    """Get detailed run results"""
    try:
        result = AnalysisEngine.get_analysis_result(run_id)
        if not result:
            raise HTTPException(status_code=404, detail="Run not found")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))