"""
Fix Stuck Job Stages
This script fixes job stages that are stuck in 'in_progress' status
for completed or errored runs
"""
import sqlite3
from datetime import datetime
from config import DB_PATH

def fix_stuck_stages(run_id=None):
    """Fix stages stuck in in_progress for completed/errored runs"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    if run_id:
        # Fix specific run
        print(f"Fixing stuck stages for run {run_id}...")
        
        # Get run status
        cursor.execute('SELECT status FROM runs WHERE run_id = ?', (run_id,))
        run_status = cursor.fetchone()
        
        if not run_status:
            print(f"Run {run_id} not found!")
            return
        
        status = run_status[0]
        print(f"Run {run_id} status: {status}")
        
        if status in ('completed', 'error'):
            # Get stuck stages
            cursor.execute('''
                SELECT stage_name, status, details FROM job_stages 
                WHERE run_id = ? AND status = 'in_progress'
            ''', (run_id,))
            stuck_stages = cursor.fetchall()
            
            if stuck_stages:
                print(f"Found {len(stuck_stages)} stuck stage(s):")
                for stage in stuck_stages:
                    print(f"  - {stage[0]}: {stage[1]} ({stage[2]})")
                
                # Fix them
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                new_status = 'error' if status == 'error' else 'completed'
                details = 'Fixed automatically - was stuck in progress' if status == 'completed' else 'Job failed'
                
                cursor.execute('''
                    UPDATE job_stages 
                    SET status = ?, completed_at = ?, details = ?
                    WHERE run_id = ? AND status = 'in_progress'
                ''', (new_status, timestamp, details, run_id))
                
                conn.commit()
                print(f"✅ Fixed {len(stuck_stages)} stage(s) for run {run_id}")
            else:
                print(f"No stuck stages found for run {run_id}")
    else:
        # Fix all runs
        print("Fixing stuck stages for ALL completed/errored runs...")
        
        cursor.execute('''
            SELECT DISTINCT r.run_id, r.status
            FROM runs r
            INNER JOIN job_stages js ON r.run_id = js.run_id
            WHERE r.status IN ('completed', 'error')
            AND js.status = 'in_progress'
        ''')
        affected_runs = cursor.fetchall()
        
        if affected_runs:
            print(f"Found {len(affected_runs)} run(s) with stuck stages:")
            for run in affected_runs:
                print(f"  Run {run[0]}: {run[1]}")
            
            # Fix all at once
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            # For completed runs
            cursor.execute('''
                UPDATE job_stages 
                SET status = 'completed', completed_at = ?, details = 'Fixed automatically - was stuck in progress'
                WHERE run_id IN (
                    SELECT run_id FROM runs WHERE status = 'completed'
                ) AND status = 'in_progress'
            ''', (timestamp,))
            
            # For errored runs
            cursor.execute('''
                UPDATE job_stages 
                SET status = 'error', completed_at = ?, details = 'Job failed'
                WHERE run_id IN (
                    SELECT run_id FROM runs WHERE status = 'error'
                ) AND status = 'in_progress'
            ''', (timestamp,))
            
            conn.commit()
            print(f"✅ Fixed stuck stages for {len(affected_runs)} run(s)")
        else:
            print("No stuck stages found")
    
    conn.close()

def show_run_stages(run_id):
    """Show all stages for a specific run"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT stage_name, stage_order, status, details, started_at, completed_at
        FROM job_stages
        WHERE run_id = ?
        ORDER BY stage_order
    ''', (run_id,))
    
    stages = cursor.fetchall()
    
    if stages:
        print(f"\nStages for Run #{run_id}:")
        print("-" * 80)
        for stage in stages:
            print(f"Stage {stage[1]}: {stage[0]}")
            print(f"  Status: {stage[2]}")
            print(f"  Details: {stage[3]}")
            print(f"  Started: {stage[4]}")
            print(f"  Completed: {stage[5]}")
            print()
    else:
        print(f"No stages found for run {run_id}")
    
    conn.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "show":
            if len(sys.argv) > 2:
                run_id = int(sys.argv[2])
                show_run_stages(run_id)
            else:
                print("Usage: python fix_stuck_stages.py show <run_id>")
        else:
            run_id = int(sys.argv[1])
            fix_stuck_stages(run_id)
    else:
        # Fix all
        fix_stuck_stages()
    
    print("\n✅ Done!")

