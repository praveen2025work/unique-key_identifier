"""
Async Job Queue System
Isolates heavy backend operations from UI to prevent blocking
"""
import asyncio
import threading
import queue
import json
import os
from datetime import datetime
from typing import Dict, Any, Callable, Optional
from enum import Enum
import traceback


class JobStatus(Enum):
    """Job status enumeration"""
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Job:
    """Represents a processing job"""
    
    def __init__(
        self, 
        job_id: str, 
        job_type: str, 
        params: Dict[str, Any],
        callback: Callable
    ):
        self.job_id = job_id
        self.job_type = job_type
        self.params = params
        self.callback = callback
        self.status = JobStatus.QUEUED
        self.progress = 0
        self.message = "Queued"
        self.result = None
        self.error = None
        self.created_at = datetime.now()
        self.started_at = None
        self.completed_at = None
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert job to dictionary"""
        return {
            'job_id': self.job_id,
            'job_type': self.job_type,
            'status': self.status.value,
            'progress': self.progress,
            'message': self.message,
            'created_at': self.created_at.isoformat(),
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'error': self.error
        }


class AsyncJobQueue:
    """
    Asynchronous job queue that processes jobs in background threads
    Isolates UI from heavy operations
    """
    
    def __init__(self, max_concurrent_jobs: int = 2):
        """
        Initialize job queue
        
        Args:
            max_concurrent_jobs: Maximum number of jobs to run concurrently
        """
        self.max_concurrent_jobs = max_concurrent_jobs
        self.jobs: Dict[str, Job] = {}
        self.job_queue = queue.Queue()
        self.active_jobs: Dict[str, threading.Thread] = {}
        self.lock = threading.Lock()
        self.is_running = False
        self.worker_threads = []
        
    def start(self):
        """Start the job queue workers"""
        if self.is_running:
            return
            
        self.is_running = True
        
        # Start worker threads
        for i in range(self.max_concurrent_jobs):
            worker = threading.Thread(
                target=self._worker,
                name=f"JobWorker-{i}",
                daemon=True
            )
            worker.start()
            self.worker_threads.append(worker)
        
        print(f"✅ Job queue started with {self.max_concurrent_jobs} workers")
    
    def stop(self):
        """Stop the job queue"""
        self.is_running = False
        
        # Wait for workers to finish
        for worker in self.worker_threads:
            if worker.is_alive():
                worker.join(timeout=5)
        
        print("🛑 Job queue stopped")
    
    def submit_job(
        self, 
        job_type: str, 
        params: Dict[str, Any], 
        callback: Callable,
        job_id: Optional[str] = None
    ) -> str:
        """
        Submit a new job to the queue
        
        Args:
            job_type: Type of job (e.g., 'parallel_comparison', 'analysis')
            params: Job parameters
            callback: Function to execute (must accept job_id and params)
            job_id: Optional custom job ID
            
        Returns:
            Job ID
        """
        if job_id is None:
            job_id = f"{job_type}_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}"
        
        job = Job(job_id, job_type, params, callback)
        
        with self.lock:
            self.jobs[job_id] = job
            self.job_queue.put(job)
        
        print(f"📝 Job submitted: {job_id} ({job_type})")
        
        return job_id
    
    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a specific job"""
        with self.lock:
            job = self.jobs.get(job_id)
            if job:
                return job.to_dict()
        return None
    
    def get_all_jobs(self) -> Dict[str, Dict[str, Any]]:
        """Get status of all jobs"""
        with self.lock:
            return {
                job_id: job.to_dict() 
                for job_id, job in self.jobs.items()
            }
    
    def get_active_jobs(self) -> Dict[str, Dict[str, Any]]:
        """Get currently running jobs"""
        with self.lock:
            return {
                job_id: job.to_dict() 
                for job_id, job in self.jobs.items()
                if job.status == JobStatus.RUNNING
            }
    
    def cancel_job(self, job_id: str) -> bool:
        """
        Cancel a job (only works for queued jobs)
        
        Returns:
            True if cancelled, False otherwise
        """
        with self.lock:
            job = self.jobs.get(job_id)
            if job and job.status == JobStatus.QUEUED:
                job.status = JobStatus.CANCELLED
                job.message = "Cancelled by user"
                job.completed_at = datetime.now()
                return True
        return False
    
    def update_job_progress(
        self, 
        job_id: str, 
        progress: int, 
        message: str = None
    ):
        """
        Update job progress (called by job callback)
        
        Args:
            job_id: Job ID
            progress: Progress percentage (0-100)
            message: Optional status message
        """
        with self.lock:
            job = self.jobs.get(job_id)
            if job and job.status == JobStatus.RUNNING:
                job.progress = min(100, max(0, progress))
                if message:
                    job.message = message
    
    def _worker(self):
        """Worker thread that processes jobs from the queue"""
        while self.is_running:
            try:
                # Get job from queue (with timeout to allow checking is_running)
                try:
                    job = self.job_queue.get(timeout=1)
                except queue.Empty:
                    continue
                
                # Check if job was cancelled
                if job.status == JobStatus.CANCELLED:
                    self.job_queue.task_done()
                    continue
                
                # Mark job as running
                with self.lock:
                    job.status = JobStatus.RUNNING
                    job.started_at = datetime.now()
                    job.message = "Processing..."
                    self.active_jobs[job.job_id] = threading.current_thread()
                
                print(f"▶️  Processing job: {job.job_id}")
                
                try:
                    # Execute job callback
                    result = job.callback(job.job_id, job.params)
                    
                    # Mark as completed
                    with self.lock:
                        job.status = JobStatus.COMPLETED
                        job.progress = 100
                        job.message = "Completed successfully"
                        job.result = result
                        job.completed_at = datetime.now()
                        if job.job_id in self.active_jobs:
                            del self.active_jobs[job.job_id]
                    
                    print(f"✅ Job completed: {job.job_id}")
                    
                except Exception as e:
                    # Mark as failed
                    error_msg = f"{str(e)}\n{traceback.format_exc()}"
                    
                    with self.lock:
                        job.status = JobStatus.FAILED
                        job.message = f"Error: {str(e)}"
                        job.error = error_msg
                        job.completed_at = datetime.now()
                        if job.job_id in self.active_jobs:
                            del self.active_jobs[job.job_id]
                    
                    print(f"❌ Job failed: {job.job_id} - {str(e)}")
                
                self.job_queue.task_done()
                
            except Exception as e:
                print(f"❌ Worker error: {str(e)}")
                traceback.print_exc()
    
    def clear_completed_jobs(self, older_than_hours: int = 24):
        """
        Clear completed/failed jobs older than specified hours
        
        Args:
            older_than_hours: Remove jobs completed more than this many hours ago
        """
        cutoff_time = datetime.now().timestamp() - (older_than_hours * 3600)
        
        with self.lock:
            jobs_to_remove = []
            
            for job_id, job in self.jobs.items():
                if job.status in [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED]:
                    if job.completed_at and job.completed_at.timestamp() < cutoff_time:
                        jobs_to_remove.append(job_id)
            
            for job_id in jobs_to_remove:
                del self.jobs[job_id]
            
            if jobs_to_remove:
                print(f"🗑️  Cleared {len(jobs_to_remove)} old jobs")


class WorkingDirectoryManager:
    """
    Manages working directories for each run
    Creates structured directories for storing intermediate and final results
    """
    
    def __init__(self, base_dir: str = None):
        """
        Initialize working directory manager
        
        Args:
            base_dir: Base directory for all runs (default: results/)
        """
        if base_dir is None:
            from config import SCRIPT_DIR
            base_dir = os.path.join(SCRIPT_DIR, 'results')
        
        self.base_dir = base_dir
        os.makedirs(base_dir, exist_ok=True)
    
    def create_run_directory(self, run_id: str, metadata: Dict[str, Any] = None) -> str:
        """
        Create a working directory for a specific run
        
        Args:
            run_id: Unique run identifier
            metadata: Optional metadata to save
            
        Returns:
            Path to created directory
        """
        # Create timestamped directory
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        run_dir = os.path.join(self.base_dir, f"run_{run_id}_{timestamp}")
        
        # Create directory structure
        os.makedirs(run_dir, exist_ok=True)
        os.makedirs(os.path.join(run_dir, 'intermediate'), exist_ok=True)
        os.makedirs(os.path.join(run_dir, 'final'), exist_ok=True)
        os.makedirs(os.path.join(run_dir, 'exports'), exist_ok=True)
        
        # Save metadata
        if metadata:
            metadata_file = os.path.join(run_dir, 'metadata.json')
            with open(metadata_file, 'w') as f:
                json.dump({
                    **metadata,
                    'run_id': run_id,
                    'created_at': datetime.now().isoformat(),
                    'directory': run_dir
                }, f, indent=2, default=str)
        
        print(f"📁 Created run directory: {run_dir}")
        
        return run_dir
    
    def get_run_directory(self, run_id: str) -> Optional[str]:
        """
        Get the directory path for a specific run
        
        Returns:
            Directory path or None if not found
        """
        # Search for directory matching run_id
        for dirname in os.listdir(self.base_dir):
            if dirname.startswith(f"run_{run_id}_"):
                return os.path.join(self.base_dir, dirname)
        
        return None
    
    def list_runs(self, limit: int = 100) -> list:
        """
        List all runs with their metadata
        
        Args:
            limit: Maximum number of runs to return
            
        Returns:
            List of run metadata dictionaries
        """
        runs = []
        
        for dirname in sorted(os.listdir(self.base_dir), reverse=True)[:limit]:
            run_dir = os.path.join(self.base_dir, dirname)
            metadata_file = os.path.join(run_dir, 'metadata.json')
            
            if os.path.isdir(run_dir) and os.path.exists(metadata_file):
                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)
                    runs.append(metadata)
        
        return runs
    
    def cleanup_old_runs(self, days_to_keep: int = 30):
        """
        Clean up old run directories
        
        Args:
            days_to_keep: Keep runs from last N days
        """
        cutoff_time = datetime.now().timestamp() - (days_to_keep * 24 * 3600)
        
        removed_count = 0
        
        for dirname in os.listdir(self.base_dir):
            run_dir = os.path.join(self.base_dir, dirname)
            
            if os.path.isdir(run_dir):
                # Check directory creation time
                dir_ctime = os.path.getctime(run_dir)
                
                if dir_ctime < cutoff_time:
                    import shutil
                    shutil.rmtree(run_dir)
                    removed_count += 1
        
        if removed_count > 0:
            print(f"🗑️  Cleaned up {removed_count} old run directories")


# Global instances
job_queue = AsyncJobQueue(max_concurrent_jobs=2)
working_dir_manager = WorkingDirectoryManager()

# Auto-start job queue
job_queue.start()

