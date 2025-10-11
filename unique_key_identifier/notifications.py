"""
Enterprise Notification System
Sends alerts via email and webhooks for job completion and system events
"""
import os
import json
import smtplib
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from database import conn
from config import SCRIPT_DIR

class NotificationManager:
    """
    Enterprise notification manager
    - Email notifications
    - Webhook notifications
    - Configurable templates
    - Delivery tracking
    """
    
    def __init__(self):
        self.ensure_notification_tables()
        self.load_config()
    
    def ensure_notification_tables(self):
        """Create notification tracking tables"""
        cursor = conn.cursor()
        
        # Notification configuration
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS notification_config (
                config_id INTEGER PRIMARY KEY AUTOINCREMENT,
                config_type TEXT NOT NULL,
                config_name TEXT NOT NULL UNIQUE,
                config_value TEXT NOT NULL,
                is_sensitive INTEGER DEFAULT 0,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Notification history
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS notification_history (
                notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
                notification_type TEXT NOT NULL,
                recipient TEXT NOT NULL,
                subject TEXT,
                message TEXT,
                run_id INTEGER,
                status TEXT NOT NULL,
                error_message TEXT,
                sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (run_id) REFERENCES runs(run_id)
            )
        ''')
        
        conn.commit()
    
    def load_config(self):
        """Load notification configuration from database or environment"""
        cursor = conn.cursor()
        
        # Email configuration
        self.smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_user = os.getenv('SMTP_USER', '')
        self.smtp_password = os.getenv('SMTP_PASSWORD', '')
        self.smtp_from = os.getenv('SMTP_FROM', self.smtp_user)
        
        # Check database config
        cursor.execute('''
            SELECT config_name, config_value FROM notification_config
            WHERE config_type = 'email'
        ''')
        
        for row in cursor.fetchall():
            config_name, config_value = row
            if config_name == 'smtp_host' and not self.smtp_host:
                self.smtp_host = config_value
            elif config_name == 'smtp_port' and not self.smtp_port:
                self.smtp_port = int(config_value)
            elif config_name == 'smtp_user' and not self.smtp_user:
                self.smtp_user = config_value
    
    def send_email(self, to_addresses, subject, body, html_body=None, run_id=None):
        """
        Send email notification
        
        Args:
            to_addresses: String (single email) or list of emails
            subject: Email subject
            body: Plain text body
            html_body: HTML body (optional)
            run_id: Associated run ID
        
        Returns: (success, error_message)
        """
        if not self.smtp_user or not self.smtp_password:
            return False, "SMTP credentials not configured"
        
        if isinstance(to_addresses, str):
            to_addresses = [to_addresses]
        
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = self.smtp_from
            msg['To'] = ', '.join(to_addresses)
            msg['Subject'] = subject
            
            # Add bodies
            msg.attach(MIMEText(body, 'plain'))
            if html_body:
                msg.attach(MIMEText(html_body, 'html'))
            
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
            
            # Log success
            for recipient in to_addresses:
                self._log_notification('email', recipient, subject, body, run_id, 'sent')
            
            return True, None
            
        except Exception as e:
            error_msg = str(e)
            for recipient in to_addresses:
                self._log_notification('email', recipient, subject, body, run_id, 'failed', error_msg)
            return False, error_msg
    
    def send_webhook(self, webhook_url, payload, run_id=None):
        """
        Send webhook notification
        
        Args:
            webhook_url: Webhook endpoint URL
            payload: Dict payload to send
            run_id: Associated run ID
        
        Returns: (success, error_message)
        """
        try:
            # Add metadata
            payload['timestamp'] = datetime.now().isoformat()
            payload['source'] = 'unique_key_identifier'
            
            # Send webhook
            response = requests.post(
                webhook_url,
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            response.raise_for_status()
            
            # Log success
            self._log_notification(
                'webhook', 
                webhook_url, 
                None, 
                json.dumps(payload), 
                run_id, 
                'sent'
            )
            
            return True, None
            
        except Exception as e:
            error_msg = str(e)
            self._log_notification(
                'webhook',
                webhook_url,
                None,
                json.dumps(payload),
                run_id,
                'failed',
                error_msg
            )
            return False, error_msg
    
    def notify_analysis_complete(self, run_id):
        """
        Send notification when analysis completes
        
        Automatically determines recipients from run parameters
        """
        cursor = conn.cursor()
        
        # Get run details
        cursor.execute('''
            SELECT r.*, rp.expected_combinations, rp.excluded_combinations
            FROM runs r
            LEFT JOIN run_parameters rp ON r.run_id = rp.run_id
            WHERE r.run_id = ?
        ''', (run_id,))
        
        row = cursor.fetchone()
        if not row:
            return
        
        columns = [desc[0] for desc in cursor.description]
        run_info = dict(zip(columns, row))
        
        # Get analysis results summary
        cursor.execute('''
            SELECT 
                side,
                COUNT(*) as total_combinations,
                SUM(CASE WHEN is_unique_key = 1 THEN 1 ELSE 0 END) as unique_keys,
                AVG(uniqueness_score) as avg_uniqueness
            FROM analysis_results
            WHERE run_id = ?
            GROUP BY side
        ''', (run_id,))
        
        results_summary = {}
        for row in cursor.fetchall():
            results_summary[row[0]] = {
                'total_combinations': row[1],
                'unique_keys': row[2],
                'avg_uniqueness': round(row[3], 2) if row[3] else 0
            }
        
        # Build notification
        subject = f"✅ Analysis Complete - Run #{run_id}"
        
        body = f"""
Analysis Complete
================

Run ID: {run_id}
Timestamp: {run_info['timestamp']}
Status: {run_info['status'].upper()}

Files Analyzed:
- File A: {run_info['file_a']} ({run_info['file_a_rows']} rows)
- File B: {run_info['file_b']} ({run_info['file_b_rows']} rows)

Results Summary:
Side A: {results_summary.get('A', {}).get('total_combinations', 0)} combinations analyzed, {results_summary.get('A', {}).get('unique_keys', 0)} unique keys found
Side B: {results_summary.get('B', {}).get('total_combinations', 0)} combinations analyzed, {results_summary.get('B', {}).get('unique_keys', 0)} unique keys found

View Results: http://localhost:8000/run/{run_id}

---
Unique Key Identifier - Enterprise Edition
"""
        
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f8f9fa; padding: 20px; }}
        .summary-box {{ background: white; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; border-radius: 4px; }}
        .metric {{ display: inline-block; margin: 10px 20px 10px 0; }}
        .metric-label {{ font-size: 12px; color: #666; text-transform: uppercase; }}
        .metric-value {{ font-size: 24px; font-weight: bold; color: #667eea; }}
        .btn {{ display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }}
        .footer {{ text-align: center; padding: 20px; color: #999; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="margin: 0;">✅ Analysis Complete</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Run #{run_id} - {run_info['timestamp']}</p>
        </div>
        <div class="content">
            <div class="summary-box">
                <h3>Files Analyzed:</h3>
                <p><strong>File A:</strong> {run_info['file_a']} ({run_info['file_a_rows']:,} rows)</p>
                <p><strong>File B:</strong> {run_info['file_b']} ({run_info['file_b_rows']:,} rows)</p>
            </div>
            
            <div class="summary-box">
                <h3>Results Summary:</h3>
                <div style="margin-bottom: 15px;">
                    <strong>Side A:</strong><br>
                    <div class="metric">
                        <div class="metric-label">Combinations</div>
                        <div class="metric-value">{results_summary.get('A', {}).get('total_combinations', 0)}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Unique Keys</div>
                        <div class="metric-value">{results_summary.get('A', {}).get('unique_keys', 0)}</div>
                    </div>
                </div>
                <div>
                    <strong>Side B:</strong><br>
                    <div class="metric">
                        <div class="metric-label">Combinations</div>
                        <div class="metric-value">{results_summary.get('B', {}).get('total_combinations', 0)}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Unique Keys</div>
                        <div class="metric-value">{results_summary.get('B', {}).get('unique_keys', 0)}</div>
                    </div>
                </div>
            </div>
            
            <a href="http://localhost:8000/run/{run_id}" class="btn">View Full Results</a>
        </div>
        <div class="footer">
            Unique Key Identifier - Enterprise Edition<br>
            Automated notification - Do not reply
        </div>
    </div>
</body>
</html>
"""
        
        # Check for scheduled job notifications
        cursor.execute('''
            SELECT notification_emails, notification_webhooks
            FROM scheduled_jobs
            WHERE last_run_id = ?
        ''', (run_id,))
        
        job_row = cursor.fetchone()
        
        if job_row:
            # Send emails if configured
            if job_row[0]:
                emails = [e.strip() for e in job_row[0].split(',')]
                self.send_email(emails, subject, body, html_body, run_id)
            
            # Send webhooks if configured
            if job_row[1]:
                try:
                    webhooks = json.loads(job_row[1])
                    payload = {
                        'event': 'analysis_complete',
                        'run_id': run_id,
                        'status': run_info['status'],
                        'summary': results_summary
                    }
                    for webhook_url in webhooks:
                        self.send_webhook(webhook_url, payload, run_id)
                except:
                    pass
    
    def notify_analysis_failed(self, run_id, error_message):
        """Send notification when analysis fails"""
        cursor = conn.cursor()
        
        # Get run details
        cursor.execute('SELECT * FROM runs WHERE run_id = ?', (run_id,))
        row = cursor.fetchone()
        if not row:
            return
        
        columns = [desc[0] for desc in cursor.description]
        run_info = dict(zip(columns, row))
        
        subject = f"❌ Analysis Failed - Run #{run_id}"
        
        body = f"""
Analysis Failed
===============

Run ID: {run_id}
Timestamp: {run_info['timestamp']}
Status: FAILED

Files: {run_info['file_a']}, {run_info['file_b']}

Error: {error_message}

View Details: http://localhost:8000/workflow/{run_id}

---
Unique Key Identifier - Enterprise Edition
"""
        
        # Check for scheduled job notifications
        cursor.execute('''
            SELECT notification_emails
            FROM scheduled_jobs
            WHERE last_run_id = ?
        ''', (run_id,))
        
        job_row = cursor.fetchone()
        if job_row and job_row[0]:
            emails = [e.strip() for e in job_row[0].split(',')]
            self.send_email(emails, subject, body, None, run_id)
    
    def _log_notification(self, notification_type, recipient, subject, message, run_id, status, error_message=None):
        """Log notification to database"""
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO notification_history 
            (notification_type, recipient, subject, message, run_id, status, error_message)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (notification_type, recipient, subject, message, run_id, status, error_message))
        conn.commit()
    
    def get_notification_history(self, run_id=None, limit=100):
        """Get notification history"""
        cursor = conn.cursor()
        
        if run_id:
            cursor.execute('''
                SELECT * FROM notification_history
                WHERE run_id = ?
                ORDER BY sent_at DESC
                LIMIT ?
            ''', (run_id, limit))
        else:
            cursor.execute('''
                SELECT * FROM notification_history
                ORDER BY sent_at DESC
                LIMIT ?
            ''', (limit,))
        
        columns = [desc[0] for desc in cursor.description]
        history = []
        for row in cursor.fetchall():
            history.append(dict(zip(columns, row)))
        
        return history

# Global notification manager
notification_manager = NotificationManager()

