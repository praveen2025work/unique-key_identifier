"""
Enterprise Audit Logging System
Tracks all operations, user actions, and system events for compliance and monitoring
"""
import os
import json
from datetime import datetime
from database import conn
from config import SCRIPT_DIR

class AuditLogger:
    """
    Enterprise-grade audit logger
    - Tracks all operations
    - User activity monitoring
    - Compliance and governance
    - Performance metrics
    """
    
    def __init__(self):
        self.ensure_audit_tables()
    
    def ensure_audit_tables(self):
        """Create audit tables if they don't exist"""
        cursor = conn.cursor()
        
        # Main audit log table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS audit_log (
                audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                event_type TEXT NOT NULL,
                event_category TEXT NOT NULL,
                user_id TEXT,
                run_id INTEGER,
                action TEXT NOT NULL,
                details TEXT,
                ip_address TEXT,
                user_agent TEXT,
                status TEXT DEFAULT 'success',
                error_message TEXT,
                duration_ms INTEGER,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Performance metrics table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS performance_metrics (
                metric_id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id INTEGER NOT NULL,
                metric_name TEXT NOT NULL,
                metric_value REAL NOT NULL,
                metric_unit TEXT,
                timestamp TEXT NOT NULL,
                FOREIGN KEY (run_id) REFERENCES runs(run_id)
            )
        ''')
        
        # User activity table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_activity (
                activity_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                session_id TEXT,
                activity_type TEXT NOT NULL,
                resource_accessed TEXT,
                timestamp TEXT NOT NULL,
                duration_seconds INTEGER,
                success INTEGER DEFAULT 1
            )
        ''')
        
        # System health table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS system_health (
                health_id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                cpu_percent REAL,
                memory_percent REAL,
                disk_usage_percent REAL,
                active_connections INTEGER,
                queue_size INTEGER,
                status TEXT DEFAULT 'healthy'
            )
        ''')
        
        conn.commit()
    
    def log_event(self, event_type, action, details=None, run_id=None, 
                   user_id='system', status='success', error_message=None, 
                   duration_ms=None, ip_address=None, user_agent=None):
        """
        Log an audit event
        
        Args:
            event_type: Type of event (analysis, download, configuration, etc.)
            action: Specific action taken
            details: JSON-serializable details dict
            run_id: Associated run ID if applicable
            user_id: User who performed the action
            status: success, error, warning
            error_message: Error details if status is error
            duration_ms: Operation duration in milliseconds
        """
        cursor = conn.cursor()
        
        # Determine event category
        category_map = {
            'analysis_start': 'analysis',
            'analysis_complete': 'analysis',
            'analysis_error': 'analysis',
            'file_upload': 'data',
            'file_download': 'data',
            'config_change': 'configuration',
            'user_login': 'authentication',
            'user_logout': 'authentication',
            'export': 'reporting',
            'api_call': 'integration',
            'system_startup': 'system',
            'system_shutdown': 'system'
        }
        
        category = category_map.get(event_type, 'general')
        
        # Serialize details to JSON
        details_json = json.dumps(details) if details else None
        
        cursor.execute('''
            INSERT INTO audit_log 
            (timestamp, event_type, event_category, user_id, run_id, action, 
             details, ip_address, user_agent, status, error_message, duration_ms)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            datetime.now().isoformat(),
            event_type,
            category,
            user_id,
            run_id,
            action,
            details_json,
            ip_address,
            user_agent,
            status,
            error_message,
            duration_ms
        ))
        
        conn.commit()
        
        return cursor.lastrowid
    
    def log_performance_metric(self, run_id, metric_name, metric_value, metric_unit=None):
        """Log a performance metric"""
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO performance_metrics (run_id, metric_name, metric_value, metric_unit, timestamp)
            VALUES (?, ?, ?, ?, ?)
        ''', (run_id, metric_name, metric_value, metric_unit, datetime.now().isoformat()))
        conn.commit()
    
    def log_user_activity(self, user_id, activity_type, resource_accessed=None, 
                          session_id=None, duration_seconds=None, success=True):
        """Log user activity"""
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO user_activity 
            (user_id, session_id, activity_type, resource_accessed, timestamp, duration_seconds, success)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id,
            session_id,
            activity_type,
            resource_accessed,
            datetime.now().isoformat(),
            duration_seconds,
            1 if success else 0
        ))
        conn.commit()
    
    def log_system_health(self, cpu_percent=None, memory_percent=None, 
                          disk_usage_percent=None, active_connections=None, 
                          queue_size=None, status='healthy'):
        """Log system health metrics"""
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO system_health 
            (timestamp, cpu_percent, memory_percent, disk_usage_percent, 
             active_connections, queue_size, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            datetime.now().isoformat(),
            cpu_percent,
            memory_percent,
            disk_usage_percent,
            active_connections,
            queue_size,
            status
        ))
        conn.commit()
    
    def get_audit_trail(self, run_id=None, user_id=None, event_type=None, 
                        start_date=None, end_date=None, limit=100):
        """
        Retrieve audit trail with filters
        
        Returns: List of audit log entries
        """
        cursor = conn.cursor()
        
        query = "SELECT * FROM audit_log WHERE 1=1"
        params = []
        
        if run_id:
            query += " AND run_id = ?"
            params.append(run_id)
        
        if user_id:
            query += " AND user_id = ?"
            params.append(user_id)
        
        if event_type:
            query += " AND event_type = ?"
            params.append(event_type)
        
        if start_date:
            query += " AND timestamp >= ?"
            params.append(start_date)
        
        if end_date:
            query += " AND timestamp <= ?"
            params.append(end_date)
        
        query += " ORDER BY timestamp DESC LIMIT ?"
        params.append(limit)
        
        cursor.execute(query, params)
        
        columns = [desc[0] for desc in cursor.description]
        results = []
        for row in cursor.fetchall():
            results.append(dict(zip(columns, row)))
        
        return results
    
    def get_user_activity_summary(self, user_id=None, days=30):
        """Get user activity summary"""
        cursor = conn.cursor()
        
        query = '''
            SELECT 
                user_id,
                activity_type,
                COUNT(*) as count,
                SUM(duration_seconds) as total_duration,
                AVG(duration_seconds) as avg_duration,
                SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
                SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed
            FROM user_activity
            WHERE timestamp >= datetime('now', '-' || ? || ' days')
        '''
        
        params = [days]
        
        if user_id:
            query += " AND user_id = ?"
            params.append(user_id)
        
        query += " GROUP BY user_id, activity_type ORDER BY count DESC"
        
        cursor.execute(query, params)
        
        columns = [desc[0] for desc in cursor.description]
        results = []
        for row in cursor.fetchall():
            results.append(dict(zip(columns, row)))
        
        return results
    
    def get_system_health_history(self, hours=24):
        """Get system health history"""
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM system_health
            WHERE timestamp >= datetime('now', '-' || ? || ' hours')
            ORDER BY timestamp DESC
        ''', (hours,))
        
        columns = [desc[0] for desc in cursor.description]
        results = []
        for row in cursor.fetchall():
            results.append(dict(zip(columns, row)))
        
        return results
    
    def generate_compliance_report(self, start_date, end_date):
        """
        Generate compliance report for audit purposes
        
        Returns: Dict with compliance metrics and audit trail
        """
        cursor = conn.cursor()
        
        # Get activity summary
        cursor.execute('''
            SELECT 
                event_category,
                COUNT(*) as total_events,
                SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
                SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors
            FROM audit_log
            WHERE timestamp BETWEEN ? AND ?
            GROUP BY event_category
        ''', (start_date, end_date))
        
        category_summary = []
        for row in cursor.fetchall():
            category_summary.append({
                'category': row[0],
                'total_events': row[1],
                'successful': row[2],
                'errors': row[3],
                'success_rate': round((row[2] / row[1] * 100) if row[1] > 0 else 0, 2)
            })
        
        # Get user activity
        cursor.execute('''
            SELECT 
                user_id,
                COUNT(DISTINCT session_id) as sessions,
                COUNT(*) as activities,
                SUM(duration_seconds) as total_time
            FROM user_activity
            WHERE timestamp BETWEEN ? AND ?
            GROUP BY user_id
        ''', (start_date, end_date))
        
        user_summary = []
        for row in cursor.fetchall():
            user_summary.append({
                'user_id': row[0],
                'sessions': row[1],
                'activities': row[2],
                'total_time_seconds': row[3]
            })
        
        # Get critical events
        cursor.execute('''
            SELECT * FROM audit_log
            WHERE timestamp BETWEEN ? AND ?
            AND (status = 'error' OR event_type LIKE '%_error%')
            ORDER BY timestamp DESC
            LIMIT 100
        ''', (start_date, end_date))
        
        columns = [desc[0] for desc in cursor.description]
        critical_events = []
        for row in cursor.fetchall():
            critical_events.append(dict(zip(columns, row)))
        
        return {
            'report_period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'category_summary': category_summary,
            'user_summary': user_summary,
            'critical_events': critical_events,
            'generated_at': datetime.now().isoformat()
        }

# Global audit logger instance
audit_logger = AuditLogger()

