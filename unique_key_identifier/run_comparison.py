"""
Run Comparison and Historical Analysis
Compare results across different runs to identify trends and changes
"""
import json
from datetime import datetime, timedelta
from database import conn

class RunComparator:
    """
    Enterprise run comparison
    - Compare results between runs
    - Identify trends and changes
    - Historical analysis
    - Regression detection
    """
    
    def compare_runs(self, run_id_1, run_id_2):
        """
        Compare two runs in detail
        
        Returns: Comprehensive comparison dict
        """
        cursor = conn.cursor()
        
        # Get run metadata
        run1 = self._get_run_metadata(run_id_1)
        run2 = self._get_run_metadata(run_id_2)
        
        if not run1 or not run2:
            return None
        
        # Compare basic metrics
        basic_comparison = {
            'run1': run1,
            'run2': run2,
            'file_size_change': {
                'a': run2['file_a_rows'] - run1['file_a_rows'],
                'b': run2['file_b_rows'] - run1['file_b_rows']
            },
            'time_difference_hours': self._calculate_time_diff(run1['timestamp'], run2['timestamp'])
        }
        
        # Compare results
        results1_a = self._get_run_results(run_id_1, 'A')
        results1_b = self._get_run_results(run_id_1, 'B')
        results2_a = self._get_run_results(run_id_2, 'A')
        results2_b = self._get_run_results(run_id_2, 'B')
        
        # Compare unique keys
        unique_keys1_a = set(r['columns'] for r in results1_a if r['is_unique_key'])
        unique_keys1_b = set(r['columns'] for r in results1_b if r['is_unique_key'])
        unique_keys2_a = set(r['columns'] for r in results2_a if r['is_unique_key'])
        unique_keys2_b = set(r['columns'] for r in results2_b if r['is_unique_key'])
        
        key_changes = {
            'side_a': {
                'new_unique_keys': list(unique_keys2_a - unique_keys1_a),
                'lost_unique_keys': list(unique_keys1_a - unique_keys2_a),
                'stable_unique_keys': list(unique_keys1_a & unique_keys2_a)
            },
            'side_b': {
                'new_unique_keys': list(unique_keys2_b - unique_keys1_b),
                'lost_unique_keys': list(unique_keys1_b - unique_keys2_b),
                'stable_unique_keys': list(unique_keys1_b & unique_keys2_b)
            }
        }
        
        # Compare quality scores
        quality_comparison = self._compare_quality_scores(results1_a, results1_b, results2_a, results2_b)
        
        # Identify regressions
        regressions = self._identify_regressions(results1_a, results1_b, results2_a, results2_b)
        
        return {
            'basic_comparison': basic_comparison,
            'key_changes': key_changes,
            'quality_comparison': quality_comparison,
            'regressions': regressions
        }
    
    def get_historical_trend(self, file_a, file_b, days=30):
        """
        Get historical trend for specific files
        
        Returns: Time series of quality metrics
        """
        cursor = conn.cursor()
        
        cutoff_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
        
        cursor.execute('''
            SELECT run_id, timestamp, file_a_rows, file_b_rows
            FROM runs
            WHERE file_a = ? AND file_b = ?
            AND timestamp >= ?
            AND status = 'completed'
            ORDER BY timestamp ASC
        ''', (file_a, file_b, cutoff_date))
        
        runs = []
        for row in cursor.fetchall():
            run_id, timestamp, rows_a, rows_b = row
            
            # Get quality metrics for this run
            cursor.execute('''
                SELECT 
                    side,
                    COUNT(*) as combinations,
                    SUM(CASE WHEN is_unique_key = 1 THEN 1 ELSE 0 END) as unique_keys,
                    AVG(uniqueness_score) as avg_uniqueness
                FROM analysis_results
                WHERE run_id = ?
                GROUP BY side
            ''', (run_id,))
            
            metrics = {}
            for metric_row in cursor.fetchall():
                side, combinations, unique_keys, avg_uniqueness = metric_row
                metrics[side] = {
                    'combinations': combinations,
                    'unique_keys': unique_keys,
                    'avg_uniqueness': round(avg_uniqueness, 2) if avg_uniqueness else 0
                }
            
            runs.append({
                'run_id': run_id,
                'timestamp': timestamp,
                'file_a_rows': rows_a,
                'file_b_rows': rows_b,
                'metrics': metrics
            })
        
        return runs
    
    def detect_anomalies(self, file_a, file_b, threshold_std_dev=2.0):
        """
        Detect anomalies in run history
        
        Returns: List of anomalous runs
        """
        trend = self.get_historical_trend(file_a, file_b, days=90)
        
        if len(trend) < 5:
            return []  # Not enough data
        
        # Calculate statistics
        import statistics
        
        unique_keys_a = [r['metrics'].get('A', {}).get('unique_keys', 0) for r in trend]
        unique_keys_b = [r['metrics'].get('B', {}).get('unique_keys', 0) for r in trend]
        
        mean_a = statistics.mean(unique_keys_a)
        stdev_a = statistics.stdev(unique_keys_a) if len(unique_keys_a) > 1 else 0
        
        mean_b = statistics.mean(unique_keys_b)
        stdev_b = statistics.stdev(unique_keys_b) if len(unique_keys_b) > 1 else 0
        
        anomalies = []
        
        for i, run in enumerate(trend):
            keys_a = run['metrics'].get('A', {}).get('unique_keys', 0)
            keys_b = run['metrics'].get('B', {}).get('unique_keys', 0)
            
            is_anomaly = False
            reasons = []
            
            # Check Side A
            if stdev_a > 0:
                z_score_a = abs((keys_a - mean_a) / stdev_a)
                if z_score_a > threshold_std_dev:
                    is_anomaly = True
                    reasons.append(f"Side A: {keys_a} unique keys (expected ~{int(mean_a)}, Z-score: {z_score_a:.2f})")
            
            # Check Side B
            if stdev_b > 0:
                z_score_b = abs((keys_b - mean_b) / stdev_b)
                if z_score_b > threshold_std_dev:
                    is_anomaly = True
                    reasons.append(f"Side B: {keys_b} unique keys (expected ~{int(mean_b)}, Z-score: {z_score_b:.2f})")
            
            if is_anomaly:
                anomalies.append({
                    'run': run,
                    'reasons': reasons
                })
        
        return anomalies
    
    def generate_trend_report(self, file_a, file_b, days=30):
        """
        Generate comprehensive trend report
        
        Returns: Report dict with visualizations data
        """
        trend = self.get_historical_trend(file_a, file_b, days)
        anomalies = self.detect_anomalies(file_a, file_b)
        
        if not trend:
            return None
        
        # Calculate summary statistics
        total_runs = len(trend)
        first_run = trend[0]
        last_run = trend[-1]
        
        # Unique keys trend
        unique_keys_a = [r['metrics'].get('A', {}).get('unique_keys', 0) for r in trend]
        unique_keys_b = [r['metrics'].get('B', {}).get('unique_keys', 0) for r in trend]
        
        import statistics
        
        report = {
            'period': {
                'days': days,
                'start_date': first_run['timestamp'],
                'end_date': last_run['timestamp'],
                'total_runs': total_runs
            },
            'summary': {
                'side_a': {
                    'current_unique_keys': unique_keys_a[-1],
                    'avg_unique_keys': round(statistics.mean(unique_keys_a), 2),
                    'min_unique_keys': min(unique_keys_a),
                    'max_unique_keys': max(unique_keys_a),
                    'trend': 'improving' if unique_keys_a[-1] > unique_keys_a[0] else 'declining'
                },
                'side_b': {
                    'current_unique_keys': unique_keys_b[-1],
                    'avg_unique_keys': round(statistics.mean(unique_keys_b), 2),
                    'min_unique_keys': min(unique_keys_b),
                    'max_unique_keys': max(unique_keys_b),
                    'trend': 'improving' if unique_keys_b[-1] > unique_keys_b[0] else 'declining'
                }
            },
            'time_series': trend,
            'anomalies': anomalies,
            'generated_at': datetime.now().isoformat()
        }
        
        return report
    
    def _get_run_metadata(self, run_id):
        """Get run metadata"""
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM runs WHERE run_id = ?', (run_id,))
        row = cursor.fetchone()
        if not row:
            return None
        
        columns = [desc[0] for desc in cursor.description]
        return dict(zip(columns, row))
    
    def _get_run_results(self, run_id, side):
        """Get analysis results for a run"""
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM analysis_results
            WHERE run_id = ? AND side = ?
            ORDER BY uniqueness_score DESC
        ''', (run_id, side))
        
        columns = [desc[0] for desc in cursor.description]
        results = []
        for row in cursor.fetchall():
            results.append(dict(zip(columns, row)))
        
        return results
    
    def _calculate_time_diff(self, timestamp1, timestamp2):
        """Calculate time difference in hours"""
        try:
            dt1 = datetime.fromisoformat(timestamp1.replace(' ', 'T'))
            dt2 = datetime.fromisoformat(timestamp2.replace(' ', 'T'))
            return round((dt2 - dt1).total_seconds() / 3600, 2)
        except:
            return None
    
    def _compare_quality_scores(self, results1_a, results1_b, results2_a, results2_b):
        """Compare quality scores between runs"""
        def avg_score(results):
            scores = [r['uniqueness_score'] for r in results]
            return sum(scores) / len(scores) if scores else 0
        
        return {
            'side_a': {
                'run1_avg': round(avg_score(results1_a), 2),
                'run2_avg': round(avg_score(results2_a), 2),
                'change': round(avg_score(results2_a) - avg_score(results1_a), 2)
            },
            'side_b': {
                'run1_avg': round(avg_score(results1_b), 2),
                'run2_avg': round(avg_score(results2_b), 2),
                'change': round(avg_score(results2_b) - avg_score(results1_b), 2)
            }
        }
    
    def _identify_regressions(self, results1_a, results1_b, results2_a, results2_b):
        """Identify quality regressions"""
        regressions = []
        
        # Build lookup for run2
        run2_lookup_a = {r['columns']: r for r in results2_a}
        run2_lookup_b = {r['columns']: r for r in results2_b}
        
        # Check Side A
        for r1 in results1_a:
            r2 = run2_lookup_a.get(r1['columns'])
            if r2:
                # Check for regressions
                if r1['is_unique_key'] and not r2['is_unique_key']:
                    regressions.append({
                        'side': 'A',
                        'columns': r1['columns'],
                        'type': 'lost_uniqueness',
                        'details': f"Was unique key, now has {r2['duplicate_count']} duplicates"
                    })
                elif r1['uniqueness_score'] - r2['uniqueness_score'] > 10:
                    regressions.append({
                        'side': 'A',
                        'columns': r1['columns'],
                        'type': 'score_degradation',
                        'details': f"Score dropped from {r1['uniqueness_score']}% to {r2['uniqueness_score']}%"
                    })
        
        # Check Side B
        for r1 in results1_b:
            r2 = run2_lookup_b.get(r1['columns'])
            if r2:
                if r1['is_unique_key'] and not r2['is_unique_key']:
                    regressions.append({
                        'side': 'B',
                        'columns': r1['columns'],
                        'type': 'lost_uniqueness',
                        'details': f"Was unique key, now has {r2['duplicate_count']} duplicates"
                    })
                elif r1['uniqueness_score'] - r2['uniqueness_score'] > 10:
                    regressions.append({
                        'side': 'B',
                        'columns': r1['columns'],
                        'type': 'score_degradation',
                        'details': f"Score dropped from {r1['uniqueness_score']}% to {r2['uniqueness_score']}%"
                    })
        
        return regressions

# Global comparator instance
run_comparator = RunComparator()

