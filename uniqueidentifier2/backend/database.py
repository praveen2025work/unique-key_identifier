"""
Database operations for storing and retrieving analysis results
"""
import sqlite3
from datetime import datetime
from config import DB_PATH

# SQLite connection with proper text handling
conn = sqlite3.connect(DB_PATH, check_same_thread=False)
# Ensure TEXT columns return strings, not bytes
conn.text_factory = str

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
            working_directory TEXT,
            environment TEXT DEFAULT 'default'
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
            data_quality_check INTEGER DEFAULT 0,
            environment TEXT DEFAULT 'default',
            validated_columns TEXT,
            file_a_delimiter TEXT,
            file_b_delimiter TEXT,
            generate_comparisons INTEGER DEFAULT 1,
            FOREIGN KEY (run_id) REFERENCES runs(run_id)
        )
    ''')
    
    # Add validated_columns column if it doesn't exist (migration)
    try:
        cursor.execute("ALTER TABLE run_parameters ADD COLUMN validated_columns TEXT")
        conn.commit()
    except:
        pass  # Column already exists
    
    # Add delimiter columns if they don't exist (migration)
    try:
        cursor.execute("ALTER TABLE run_parameters ADD COLUMN file_a_delimiter TEXT")
        conn.commit()
    except:
        pass  # Column already exists
    
    try:
        cursor.execute("ALTER TABLE run_parameters ADD COLUMN file_b_delimiter TEXT")
        conn.commit()
    except:
        pass  # Column already exists
    
    # Add generate_comparisons column if it doesn't exist (migration)
    try:
        cursor.execute("ALTER TABLE run_parameters ADD COLUMN generate_comparisons INTEGER DEFAULT 1")
        conn.commit()
    except:
        pass  # Column already exists
    
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
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS data_quality_results (
            run_id INTEGER PRIMARY KEY,
            quality_summary TEXT,
            quality_data TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (run_id) REFERENCES runs(run_id)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS environments (
            env_id INTEGER PRIMARY KEY AUTOINCREMENT,
            env_name TEXT UNIQUE,
            env_type TEXT,
            host TEXT,
            port INTEGER,
            base_path TEXT,
            description TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # NEW: Comparison summary table for performant UI display
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS comparison_summary (
            run_id INTEGER,
            column_combination TEXT,
            matched_count INTEGER DEFAULT 0,
            only_a_count INTEGER DEFAULT 0,
            only_b_count INTEGER DEFAULT 0,
            total_a INTEGER DEFAULT 0,
            total_b INTEGER DEFAULT 0,
            generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (run_id, column_combination),
            FOREIGN KEY (run_id) REFERENCES runs(run_id)
        )
    ''')
    
    # Create index for fast lookups
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_comparison_run 
        ON comparison_summary(run_id)
    ''')
    
    # NEW: Comparison results table for chunked data storage
    # Stores individual comparison keys for paginated retrieval
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS comparison_results (
            result_id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER,
            column_combination TEXT,
            category TEXT,
            key_value TEXT,
            position INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (run_id) REFERENCES runs(run_id)
        )
    ''')
    
    # Create indexes for fast paginated queries
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_comparison_results_lookup 
        ON comparison_results(run_id, column_combination, category, position)
    ''')
    
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_comparison_results_category 
        ON comparison_results(run_id, column_combination, category)
    ''')
    
    # NEW: Comparison export files table for tracking exported CSV files
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS comparison_export_files (
            file_id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER,
            column_combination TEXT,
            category TEXT,
            file_path TEXT,
            file_size INTEGER DEFAULT 0,
            row_count INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            chunk_index INTEGER DEFAULT 1,
            FOREIGN KEY (run_id) REFERENCES runs(run_id)
        )
    ''')
    
    # Add chunk_index column if it doesn't exist (migration)
    try:
        cursor.execute("ALTER TABLE comparison_export_files ADD COLUMN chunk_index INTEGER DEFAULT 1")
        conn.commit()
    except:
        pass  # Column already exists
    
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_export_files_run 
        ON comparison_export_files(run_id, column_combination)
    ''')
    
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_export_files_chunk 
        ON comparison_export_files(run_id, column_combination, category, chunk_index)
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
    
    # Fix any stuck stages when job completes or errors
    if status in ('completed', 'error'):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        new_stage_status = 'error' if status == 'error' else 'completed'
        details = 'Job failed' if status == 'error' else 'Completed with job'
        
        cursor.execute('''
            UPDATE job_stages 
            SET status = ?, completed_at = ?, details = ?
            WHERE run_id = ? AND status = 'in_progress'
        ''', (new_stage_status, timestamp, details, run_id))
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

