"""
Database Repair Utility
Fixes corrupted data in the analysis results database
"""
import sqlite3
from config import DB_PATH
from datetime import datetime

def check_database_integrity():
    """Check database for corrupted data"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("=" * 60)
    print("DATABASE INTEGRITY CHECK")
    print("=" * 60)
    
    # Check runs table
    cursor.execute("SELECT COUNT(*) FROM runs")
    total_runs = cursor.fetchone()[0]
    print(f"\n✓ Total runs: {total_runs}")
    
    # Check for corrupted data
    cursor.execute("""
        SELECT run_id, side, columns, total_rows, unique_rows, duplicate_rows, 
               duplicate_count, uniqueness_score, is_unique_key
        FROM analysis_results
    """)
    
    corrupted_count = 0
    corrupted_runs = set()
    
    for row in cursor.fetchall():
        run_id = row[0]
        for i, value in enumerate(row):
            if isinstance(value, bytes):
                corrupted_count += 1
                corrupted_runs.add(run_id)
                print(f"✗ Run {run_id}: Column {i} has bytes data: {value[:20]}")
    
    if corrupted_count == 0:
        print("\n✅ No corrupted data found!")
    else:
        print(f"\n⚠️  Found {corrupted_count} corrupted field(s) in {len(corrupted_runs)} run(s)")
        print(f"Affected runs: {sorted(corrupted_runs)}")
    
    conn.close()
    return list(corrupted_runs)

def repair_run(run_id):
    """Repair corrupted data for a specific run"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print(f"\n🔧 Repairing run {run_id}...")
    
    # Check if run exists
    cursor.execute("SELECT status FROM runs WHERE run_id = ?", (run_id,))
    result = cursor.fetchone()
    
    if not result:
        print(f"✗ Run {run_id} not found!")
        conn.close()
        return False
    
    # Option 1: Delete corrupted results (safest)
    cursor.execute("DELETE FROM analysis_results WHERE run_id = ?", (run_id,))
    cursor.execute("DELETE FROM duplicate_samples WHERE run_id = ?", (run_id,))
    
    # Mark run as error so user knows to re-run
    cursor.execute("""
        UPDATE runs 
        SET status = 'error', 
            error_message = 'Database corruption detected - please re-run analysis',
            current_stage = 'error'
        WHERE run_id = ?
    """, (run_id,))
    
    conn.commit()
    print(f"✓ Deleted corrupted data for run {run_id}")
    print(f"✓ Run marked as error - user should re-run analysis")
    
    conn.close()
    return True

def repair_all():
    """Find and repair all corrupted runs"""
    print("\n🔍 Scanning for corrupted data...")
    corrupted_runs = check_database_integrity()
    
    if not corrupted_runs:
        print("\n✅ Database is healthy!")
        return
    
    print(f"\n⚠️  Found {len(corrupted_runs)} run(s) with corrupted data")
    print("These runs will be marked as error and should be re-run.")
    
    response = input("\nDo you want to repair these runs? (yes/no): ")
    if response.lower() != 'yes':
        print("Aborted.")
        return
    
    repaired = 0
    for run_id in corrupted_runs:
        if repair_run(run_id):
            repaired += 1
    
    print(f"\n✅ Repaired {repaired} run(s)")
    print("\n⚠️  Note: Users will need to re-run these analyses")

def vacuum_database():
    """Optimize database and reclaim space"""
    print("\n🔧 Optimizing database...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get size before
    cursor.execute("PRAGMA page_count")
    page_count_before = cursor.fetchone()[0]
    cursor.execute("PRAGMA page_size")
    page_size = cursor.fetchone()[0]
    size_before = (page_count_before * page_size) / (1024 * 1024)
    
    # Vacuum and analyze
    cursor.execute("VACUUM")
    cursor.execute("ANALYZE")
    
    # Get size after
    cursor.execute("PRAGMA page_count")
    page_count_after = cursor.fetchone()[0]
    size_after = (page_count_after * page_size) / (1024 * 1024)
    
    saved = size_before - size_after
    
    print(f"✓ Database optimized")
    print(f"  Before: {size_before:.2f} MB")
    print(f"  After: {size_after:.2f} MB")
    print(f"  Saved: {saved:.2f} MB")
    
    conn.close()

def recreate_database():
    """Last resort: recreate database schema (DESTRUCTIVE!)"""
    print("\n⚠️  WARNING: This will delete ALL data!")
    response = input("Are you absolutely sure? Type 'DELETE ALL DATA' to confirm: ")
    
    if response != "DELETE ALL DATA":
        print("Aborted.")
        return
    
    import os
    backup_path = DB_PATH + f".backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    print(f"\n📦 Creating backup: {backup_path}")
    import shutil
    shutil.copy2(DB_PATH, backup_path)
    print("✓ Backup created")
    
    print("\n🗑️  Deleting database...")
    os.remove(DB_PATH)
    
    print("📝 Recreating schema...")
    from database import create_tables
    create_tables()
    
    print("✅ Database recreated")
    print(f"   Backup saved at: {backup_path}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "check":
            check_database_integrity()
        
        elif command == "repair":
            if len(sys.argv) > 2:
                run_id = int(sys.argv[2])
                repair_run(run_id)
            else:
                repair_all()
        
        elif command == "vacuum":
            vacuum_database()
        
        elif command == "recreate":
            recreate_database()
        
        else:
            print("Unknown command!")
            print("\nUsage:")
            print("  python repair_database.py check           # Check for corrupted data")
            print("  python repair_database.py repair          # Repair all corrupted runs")
            print("  python repair_database.py repair 1        # Repair specific run")
            print("  python repair_database.py vacuum          # Optimize database")
            print("  python repair_database.py recreate        # Recreate database (DESTRUCTIVE)")
    else:
        # Interactive mode
        while True:
            print("\n" + "=" * 60)
            print("DATABASE REPAIR UTILITY")
            print("=" * 60)
            print("1. Check database integrity")
            print("2. Repair corrupted runs")
            print("3. Vacuum/optimize database")
            print("4. Recreate database (DESTRUCTIVE)")
            print("0. Exit")
            print()
            
            choice = input("Select option (0-4): ")
            
            if choice == "1":
                check_database_integrity()
            elif choice == "2":
                repair_all()
            elif choice == "3":
                vacuum_database()
            elif choice == "4":
                recreate_database()
            elif choice == "0":
                print("\nGoodbye!")
                break
            else:
                print("Invalid option!")

