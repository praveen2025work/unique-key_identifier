"""
Comparison Cache Manager
Generates and caches file comparison data for efficient retrieval
"""
import os
import json
import pandas as pd
from pathlib import Path
from datetime import datetime
from database import conn

# Cache directory
CACHE_DIR = os.path.join(os.path.dirname(__file__), 'comparison_cache')
os.makedirs(CACHE_DIR, exist_ok=True)

def get_comparison_cache_path(run_id, column_combination):
    """Get cache file path for a specific comparison"""
    # Clean column combination for filename
    safe_name = column_combination.replace(',', '_').replace(' ', '')[:50]
    filename = f"run_{run_id}_{safe_name}.json"
    return os.path.join(CACHE_DIR, filename)

def generate_comparison_cache(run_id, df_a, df_b, column_combinations):
    """
    Generate comparison cache for all column combinations during analysis
    This runs ONCE during analysis when files are already loaded
    """
    print(f"📊 Generating comparison cache for run {run_id}...")
    
    cursor = conn.cursor()
    generated_count = 0
    
    for combo in column_combinations:
        try:
            # Parse column combination
            if isinstance(combo, tuple):
                cols = list(combo)
            elif isinstance(combo, str):
                cols = [c.strip() for c in combo.split(',')]
            else:
                cols = combo
            
            # Skip if columns don't exist
            if not all(col in df_a.columns and col in df_b.columns for col in cols):
                continue
            
            column_str = ','.join(cols)
            
            # Get unique values from each file
            key_a = df_a[cols].drop_duplicates()
            key_b = df_b[cols].drop_duplicates()
            
            # Create comparison key strings for matching
            if len(cols) == 1:
                key_a['_key'] = key_a[cols[0]].astype(str)
                key_b['_key'] = key_b[cols[0]].astype(str)
            else:
                key_a['_key'] = key_a[cols].apply(lambda x: '||'.join(x.astype(str)), axis=1)
                key_b['_key'] = key_b[cols].apply(lambda x: '||'.join(x.astype(str)), axis=1)
            
            # Find matches
            keys_a = set(key_a['_key'])
            keys_b = set(key_b['_key'])
            
            matched_keys = keys_a & keys_b
            only_a_keys = keys_a - keys_b
            only_b_keys = keys_b - keys_a
            
            # Prepare cache data
            cache_data = {
                'run_id': run_id,
                'columns': column_str,
                'generated_at': datetime.now().isoformat(),
                'summary': {
                    'matched_count': len(matched_keys),
                    'only_a_count': len(only_a_keys),
                    'only_b_count': len(only_b_keys),
                    'total_a': len(keys_a),
                    'total_b': len(keys_b)
                },
                'matched_sample': list(matched_keys)[:100],  # First 100 for preview
                'only_a_sample': list(only_a_keys)[:100],
                'only_b_sample': list(only_b_keys)[:100]
            }
            
            # Save to file
            cache_path = get_comparison_cache_path(run_id, column_str)
            with open(cache_path, 'w') as f:
                json.dump(cache_data, f, indent=2)
            
            # Store summary in database
            cursor.execute('''
                INSERT OR REPLACE INTO comparison_summary 
                (run_id, column_combination, matched_count, only_a_count, only_b_count, total_a, total_b)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                run_id, 
                column_str,
                len(matched_keys),
                len(only_a_keys),
                len(only_b_keys),
                len(keys_a),
                len(keys_b)
            ))
            
            generated_count += 1
            
        except Exception as e:
            print(f"⚠️  Error generating cache for {combo}: {e}")
            continue
    
    conn.commit()
    print(f"✅ Generated {generated_count} comparison caches for run {run_id}")
    return generated_count

def get_comparison_from_cache(run_id, column_combination):
    """
    Get comparison data from cache (instant, no file reading!)
    """
    cache_path = get_comparison_cache_path(run_id, column_combination)
    
    if not os.path.exists(cache_path):
        return None
    
    try:
        with open(cache_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading cache: {e}")
        return None

def get_comparison_summary_from_db(run_id):
    """
    Get all comparison summaries for a run from database (instant!)
    """
    cursor = conn.cursor()
    cursor.execute('''
        SELECT column_combination, matched_count, only_a_count, only_b_count, 
               total_a, total_b, generated_at
        FROM comparison_summary
        WHERE run_id = ?
        ORDER BY matched_count DESC
    ''', (run_id,))
    
    results = cursor.fetchall()
    
    summaries = []
    for row in results:
        summaries.append({
            'columns': row[0],
            'matched_count': row[1],
            'only_a_count': row[2],
            'only_b_count': row[3],
            'total_a': row[4],
            'total_b': row[5],
            'generated_at': row[6]
        })
    
    return summaries

def clear_comparison_cache(run_id=None):
    """
    Clear comparison cache files
    If run_id specified, clear only that run's cache
    """
    if run_id:
        # Clear specific run
        pattern = f"run_{run_id}_*.json"
        for file in Path(CACHE_DIR).glob(pattern):
            try:
                file.unlink()
            except:
                pass
        
        # Clear from database
        cursor = conn.cursor()
        cursor.execute('DELETE FROM comparison_summary WHERE run_id = ?', (run_id,))
        conn.commit()
    else:
        # Clear all cache
        for file in Path(CACHE_DIR).glob("run_*.json"):
            try:
                file.unlink()
            except:
                pass
        
        cursor = conn.cursor()
        cursor.execute('DELETE FROM comparison_summary')
        conn.commit()

def get_cache_size(run_id=None):
    """Get size of cache files"""
    total_size = 0
    pattern = f"run_{run_id}_*.json" if run_id else "run_*.json"
    
    for file in Path(CACHE_DIR).glob(pattern):
        total_size += file.stat().st_size
    
    return total_size

# Clean up old cache files on startup (optional)
def cleanup_old_cache(days=30):
    """Remove cache files older than specified days"""
    import time
    cutoff = time.time() - (days * 86400)
    
    for file in Path(CACHE_DIR).glob("run_*.json"):
        if file.stat().st_mtime < cutoff:
            try:
                file.unlink()
                print(f"Cleaned up old cache: {file.name}")
            except:
                pass

