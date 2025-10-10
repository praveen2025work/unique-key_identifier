"""
Database operations for storing and retrieving analysis results
"""
import sqlite3
from datetime import datetime
from config import DB_PATH

# SQLite connection
conn = sqlite3.connect(DB_PATH, check_same_thread=False)

def create_tables():
    """Initialize database tables"""
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS runs (
            run_id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            file_a TEXT,
            file_b TEXT,
            num_columns INTEGER,
            file_a_rows INTEGER,
            file_b_rows INTEGER,
            status TEXT DEFAULT 'pending',
            current_stage TEXT DEFAULT 'initializing',
            progress_percent INTEGER DEFAULT 0,
            started_at TEXT,
            completed_at TEXT,
            error_message TEXT,
            working_directory TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS job_stages (
            stage_id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER,
            stage_name TEXT,
            stage_order INTEGER,
            status TEXT DEFAULT 'pending',
            started_at TEXT,
            completed_at TEXT,
            details TEXT,
            FOREIGN KEY (run_id) REFERENCES runs(run_id)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS analysis_results (
            run_id INTEGER,
            side TEXT,
            columns TEXT,
            total_rows INTEGER,
            unique_rows INTEGER,
            duplicate_rows INTEGER,
            duplicate_count INTEGER,
            uniqueness_score REAL,
            is_unique_key INTEGER,
            UNIQUE(run_id, side, columns),
            FOREIGN KEY (run_id) REFERENCES runs(run_id)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS duplicate_samples (
            run_id INTEGER,
            side TEXT,
            columns TEXT,
            duplicate_value TEXT,
            occurrence_count INTEGER,
            FOREIGN KEY (run_id) REFERENCES runs(run_id)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS run_parameters (
            run_id INTEGER PRIMARY KEY,
            max_rows INTEGER,
            expected_combinations TEXT,
            excluded_combinations TEXT,
            working_directory TEXT,
            FOREIGN KEY (run_id) REFERENCES runs(run_id)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS result_files (
            file_id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER,
            file_type TEXT,
            side TEXT,
            columns TEXT,
            file_path TEXT,
            file_size INTEGER,
            created_at TEXT,
            FOREIGN KEY (run_id) REFERENCES runs(run_id)
        )
    ''')
    conn.commit()

def update_job_status(run_id, status=None, stage=None, progress=None, error=None):
    """Update job status in database"""
    cursor = conn.cursor()
    updates = []
    values = []
    
    if status:
        updates.append("status = ?")
        values.append(status)
    if stage:
        updates.append("current_stage = ?")
        values.append(stage)
    if progress is not None:
        updates.append("progress_percent = ?")
        values.append(progress)
    if error:
        updates.append("error_message = ?")
        values.append(error)
    if status == 'completed':
        updates.append("completed_at = ?")
        values.append(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    
    if updates:
        values.append(run_id)
        cursor.execute(f"UPDATE runs SET {', '.join(updates)} WHERE run_id = ?", values)
        conn.commit()

def update_stage_status(run_id, stage_name, status, details=None):
    """Update individual stage status"""
    cursor = conn.cursor()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    if status == 'in_progress':
        cursor.execute('''
            UPDATE job_stages SET status = ?, started_at = ?, details = ?
            WHERE run_id = ? AND stage_name = ?
        ''', (status, timestamp, details, run_id, stage_name))
    elif status == 'completed':
        cursor.execute('''
            UPDATE job_stages SET status = ?, completed_at = ?, details = ?
            WHERE run_id = ? AND stage_name = ?
        ''', (status, timestamp, details, run_id, stage_name))
    elif status == 'error':
        cursor.execute('''
            UPDATE job_stages SET status = ?, details = ?
            WHERE run_id = ? AND stage_name = ?
        ''', (status, details, run_id, stage_name))
    
    conn.commit()

# Initialize database
create_tables()

