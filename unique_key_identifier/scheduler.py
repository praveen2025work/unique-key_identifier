"""
Enterprise Job Scheduling System
Allows automated, recurring analysis runs
"""
import os
import json
import threading
import time
from datetime import datetime, timedelta
from database import conn
from audit_logger import audit_logger

class JobScheduler:
    """
    Enterprise job scheduler
    - Cron-like scheduling
    - Recurring jobs
    - Job history
    - Failure retry logic
    """
    
    def __init__(self):
        self.ensure_scheduler_tables()
        self.running = False
        self.scheduler_thread = None
    
    def ensure_scheduler_tables(self):
        """Create scheduler tables"""
        cursor = conn.cursor()
        
        # Scheduled jobs table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS scheduled_jobs (
                job_id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_name TEXT NOT NULL UNIQUE,
                description TEXT,
                file_a TEXT NOT NULL,
                file_b TEXT NOT NULL,
                num_columns INTEGER NOT NULL,
                expected_combinations TEXT,
                excluded_combinations TEXT,
                working_directory TEXT,
                schedule_type TEXT NOT NULL,
                schedule_config TEXT NOT NULL,
                enabled INTEGER DEFAULT 1,
                last_run_time TEXT,
                last_run_id INTEGER,
                last_run_status TEXT,
                next_run_time TEXT,
                created_by TEXT DEFAULT 'system',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                retry_count INTEGER DEFAULT 3,
                retry_delay_minutes INTEGER DEFAULT 15,
                notification_emails TEXT,
                notification_webhooks TEXT
            )
        ''')
        
        # Job execution history
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS job_execution_history (
                execution_id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id INTEGER NOT NULL,
                run_id INTEGER,
                start_time TEXT NOT NULL,
                end_time TEXT,
                status TEXT NOT NULL,
                error_message TEXT,
                duration_seconds INTEGER,
                triggered_by TEXT DEFAULT 'scheduler',
                FOREIGN KEY (job_id) REFERENCES scheduled_jobs(job_id),
                FOREIGN KEY (run_id) REFERENCES runs(run_id)
            )
        ''')
        
        conn.commit()
    
    def create_scheduled_job(self, job_name, file_a, file_b, num_columns,
                            schedule_type, schedule_config,
                            description=None, expected_combinations=None,
                            excluded_combinations=None, working_directory=None,
                            created_by='system', notification_emails=None,
                            notification_webhooks=None, retry_count=3):
        """
        Create a new scheduled job
        
        Args:
            job_name: Unique name for the job
            file_a, file_b: Files to compare
            num_columns: Number of columns to analyze
            schedule_type: 'once', 'daily', 'weekly', 'monthly', 'cron'
            schedule_config: JSON config for schedule
                - once: {"run_at": "2025-10-15 14:00:00"}
                - daily: {"time": "02:00", "days": [1,2,3,4,5]}
                - weekly: {"day": "monday", "time": "02:00"}
                - monthly: {"day": 1, "time": "02:00"}
                - cron: {"expression": "0 2 * * *"}
            notification_emails: Comma-separated emails
            notification_webhooks: JSON array of webhook URLs
        
        Returns: job_id
        """
        cursor = conn.cursor()
        
        # Calculate next run time
        next_run = self._calculate_next_run(schedule_type, schedule_config)
        
        cursor.execute('''
            INSERT INTO scheduled_jobs 
            (job_name, description, file_a, file_b, num_columns, 
             expected_combinations, excluded_combinations, working_directory,
             schedule_type, schedule_config, next_run_time, created_by,
             retry_count, notification_emails, notification_webhooks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            job_name, description, file_a, file_b, num_columns,
            expected_combinations, excluded_combinations, working_directory,
            schedule_type, json.dumps(schedule_config), next_run, created_by,
            retry_count, notification_emails, notification_webhooks
        ))
        
        job_id = cursor.lastrowid
        conn.commit()
        
        audit_logger.log_event(
            'scheduled_job_create',
            f'Created scheduled job: {job_name}',
            details={
                'job_id': job_id,
                'schedule_type': schedule_type,
                'next_run': next_run
            },
            user_id=created_by,
            status='success'
        )
        
        return job_id
    
    def _calculate_next_run(self, schedule_type, schedule_config):
        """Calculate next run time based on schedule"""
        now = datetime.now()
        config = schedule_config if isinstance(schedule_config, dict) else json.loads(schedule_config)
        
        if schedule_type == 'once':
            return config.get('run_at')
        
        elif schedule_type == 'daily':
            time_str = config.get('time', '02:00')
            hour, minute = map(int, time_str.split(':'))
            next_run = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            
            if next_run <= now:
                next_run += timedelta(days=1)
            
            # Check if today is in allowed days (0=Monday, 6=Sunday)
            allowed_days = config.get('days', [0,1,2,3,4,5,6])
            while next_run.weekday() not in allowed_days:
                next_run += timedelta(days=1)
            
            return next_run.strftime('%Y-%m-%d %H:%M:%S')
        
        elif schedule_type == 'weekly':
            day_map = {
                'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
                'friday': 4, 'saturday': 5, 'sunday': 6
            }
            target_day = day_map.get(config.get('day', 'monday').lower())
            time_str = config.get('time', '02:00')
            hour, minute = map(int, time_str.split(':'))
            
            days_ahead = target_day - now.weekday()
            if days_ahead <= 0:
                days_ahead += 7
            
            next_run = now + timedelta(days=days_ahead)
            next_run = next_run.replace(hour=hour, minute=minute, second=0, microsecond=0)
            
            if next_run <= now:
                next_run += timedelta(weeks=1)
            
            return next_run.strftime('%Y-%m-%d %H:%M:%S')
        
        elif schedule_type == 'monthly':
            day_of_month = config.get('day', 1)
            time_str = config.get('time', '02:00')
            hour, minute = map(int, time_str.split(':'))
            
            next_run = now.replace(day=day_of_month, hour=hour, minute=minute, second=0, microsecond=0)
            
            if next_run <= now:
                # Move to next month
                if now.month == 12:
                    next_run = next_run.replace(year=now.year + 1, month=1)
                else:
                    next_run = next_run.replace(month=now.month + 1)
            
            return next_run.strftime('%Y-%m-%d %H:%M:%S')
        
        return None
    
    def get_pending_jobs(self):
        """Get jobs that need to run"""
        cursor = conn.cursor()
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.execute('''
            SELECT * FROM scheduled_jobs
            WHERE enabled = 1
            AND next_run_time IS NOT NULL
            AND next_run_time <= ?
        ''', (now,))
        
        columns = [desc[0] for desc in cursor.description]
        jobs = []
        for row in cursor.fetchall():
            jobs.append(dict(zip(columns, row)))
        
        return jobs
    
    def execute_job(self, job_id):
        """
        Execute a scheduled job
        
        Returns: (success, run_id, error_message)
        """
        cursor = conn.cursor()
        
        # Get job details
        cursor.execute('SELECT * FROM scheduled_jobs WHERE job_id = ?', (job_id,))
        row = cursor.fetchone()
        if not row:
            return False, None, "Job not found"
        
        columns = [desc[0] for desc in cursor.description]
        job = dict(zip(columns, row))
        
        # Record execution start
        start_time = datetime.now()
        cursor.execute('''
            INSERT INTO job_execution_history (job_id, start_time, status, triggered_by)
            VALUES (?, ?, 'running', 'scheduler')
        ''', (job_id, start_time.isoformat()))
        execution_id = cursor.lastrowid
        conn.commit()
        
        try:
            # Import here to avoid circular dependency
            from file_comparator import process_analysis_job
            import threading
            
            # Create run record
            timestamp = start_time.strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute('''
                INSERT INTO runs (timestamp, file_a, file_b, num_columns, status, current_stage, progress_percent, started_at, working_directory)
                VALUES (?, ?, ?, ?, 'queued', 'initializing', 0, ?, ?)
            ''', (timestamp, job['file_a'], job['file_b'], job['num_columns'], timestamp, job['working_directory']))
            run_id = cursor.lastrowid
            conn.commit()
            
            # Execute analysis in background
            thread = threading.Thread(
                target=process_analysis_job,
                args=(
                    run_id,
                    os.path.join(job['working_directory'] or '', job['file_a']),
                    os.path.join(job['working_directory'] or '', job['file_b']),
                    job['num_columns'],
                    0,  # max_rows
                    json.loads(job['expected_combinations']) if job['expected_combinations'] else None,
                    json.loads(job['excluded_combinations']) if job['excluded_combinations'] else None,
                    job['working_directory']
                )
            )
            thread.daemon = True
            thread.start()
            
            # Update job
            next_run = self._calculate_next_run(job['schedule_type'], job['schedule_config'])
            cursor.execute('''
                UPDATE scheduled_jobs
                SET last_run_time = ?, last_run_id = ?, next_run_time = ?
                WHERE job_id = ?
            ''', (start_time.isoformat(), run_id, next_run, job_id))
            conn.commit()
            
            return True, run_id, None
            
        except Exception as e:
            import traceback
            error_msg = str(e)
            traceback.print_exc()
            
            # Update execution history
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            cursor.execute('''
                UPDATE job_execution_history
                SET end_time = ?, status = 'error', error_message = ?, duration_seconds = ?
                WHERE execution_id = ?
            ''', (end_time.isoformat(), error_msg, int(duration), execution_id))
            conn.commit()
            
            return False, None, error_msg
    
    def start_scheduler(self):
        """Start the background scheduler"""
        if self.running:
            return
        
        self.running = True
        self.scheduler_thread = threading.Thread(target=self._scheduler_loop, daemon=True)
        self.scheduler_thread.start()
        
        audit_logger.log_event('system_startup', 'Scheduler started', status='success')
        print("✅ Job scheduler started")
    
    def stop_scheduler(self):
        """Stop the scheduler"""
        self.running = False
        if self.scheduler_thread:
            self.scheduler_thread.join(timeout=5)
        
        audit_logger.log_event('system_shutdown', 'Scheduler stopped', status='success')
        print("🛑 Job scheduler stopped")
    
    def _scheduler_loop(self):
        """Main scheduler loop"""
        while self.running:
            try:
                # Check for pending jobs every minute
                pending_jobs = self.get_pending_jobs()
                
                for job in pending_jobs:
                    print(f"⏰ Executing scheduled job: {job['job_name']}")
                    success, run_id, error = self.execute_job(job['job_id'])
                    
                    if success:
                        print(f"✅ Job {job['job_name']} started (Run #{run_id})")
                    else:
                        print(f"❌ Job {job['job_name']} failed: {error}")
                
                # Sleep for 1 minute
                time.sleep(60)
                
            except Exception as e:
                import traceback
                print(f"❌ Scheduler error: {str(e)}")
                traceback.print_exc()
                time.sleep(60)  # Continue after error
    
    def get_all_jobs(self):
        """Get all scheduled jobs"""
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM scheduled_jobs ORDER BY created_at DESC')
        
        columns = [desc[0] for desc in cursor.description]
        jobs = []
        for row in cursor.fetchall():
            jobs.append(dict(zip(columns, row)))
        
        return jobs
    
    def get_job_history(self, job_id, limit=50):
        """Get execution history for a job"""
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM job_execution_history
            WHERE job_id = ?
            ORDER BY start_time DESC
            LIMIT ?
        ''', (job_id, limit))
        
        columns = [desc[0] for desc in cursor.description]
        history = []
        for row in cursor.fetchall():
            history.append(dict(zip(columns, row)))
        
        return history
    
    def enable_job(self, job_id):
        """Enable a scheduled job"""
        cursor = conn.cursor()
        cursor.execute('UPDATE scheduled_jobs SET enabled = 1 WHERE job_id = ?', (job_id,))
        conn.commit()
        audit_logger.log_event('config_change', f'Enabled scheduled job #{job_id}')
    
    def disable_job(self, job_id):
        """Disable a scheduled job"""
        cursor = conn.cursor()
        cursor.execute('UPDATE scheduled_jobs SET enabled = 0 WHERE job_id = ?', (job_id,))
        conn.commit()
        audit_logger.log_event('config_change', f'Disabled scheduled job #{job_id}')
    
    def delete_job(self, job_id):
        """Delete a scheduled job"""
        cursor = conn.cursor()
        cursor.execute('DELETE FROM scheduled_jobs WHERE job_id = ?', (job_id,))
        conn.commit()
        audit_logger.log_event('config_change', f'Deleted scheduled job #{job_id}')

# Global scheduler instance
job_scheduler = JobScheduler()

