from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api import analysis, files, runs
from app.core.config import settings
import uvicorn

# Create FastAPI app
app = FastAPI(
    title="Unique Key Identifier API",
    description="API for file comparison and unique key identification",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(analysis.router, prefix="/api", tags=["analysis"])
app.include_router(files.router, prefix="/api", tags=["files"])
app.include_router(runs.router, prefix="/api", tags=["runs"])

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "Unique Key Identifier API v2.0", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )