# Quick Start - Enterprise Features
## Get up and running with Enterprise Edition in 5 minutes

---

## ⚡ Quick Setup

### 1. Install New Dependencies
```bash
cd unique_key_identifier
pip install -r requirements.txt
```

**New packages added:**
- `psutil` - System monitoring
- `requests` - Webhook notifications

### 2. Optional: Configure Email Notifications
```bash
# For Gmail
export SMTP_HOST="smtp.gmail.com"
export SMTP_PORT="587"
export SMTP_USER="your-email@gmail.com"
export SMTP_PASSWORD="your-app-specific-password"

# For Outlook
export SMTP_HOST="smtp.office365.com"
export SMTP_PORT="587"
export SMTP_USER="your-email@outlook.com"
export SMTP_PASSWORD="your-password"
```

### 3. Start Application
```bash
python file_comparator.py
```

**You should see:**
```
============================================================
🚀 Unique Key Identifier - Enterprise Edition v2.0
============================================================
✅ Enterprise features initialized
📊 Audit logging: ENABLED
⏰ Job scheduler: RUNNING
📧 Notifications: CONFIGURED
📈 Analytics: ENABLED
============================================================
```

---

## 🎯 Try These Features Now

### 1. View API Documentation
Open your browser:
```
http://localhost:8000/docs
```

Interactive Swagger UI shows all API endpoints with examples!

### 2. Check System Health
```bash
curl http://localhost:8000/api/system/health
```

### 3. Run an Analysis and View Audit Log
```bash
# Run analysis via web UI
# Then check audit log:
curl http://localhost:8000/api/audit-log?limit=10
```

### 4. Create a Scheduled Job
```bash
curl -X POST http://localhost:8000/api/scheduled-jobs \
  -F "job_name=Daily Production Check" \
  -F "file_a=trading_system_a.csv" \
  -F "file_b=trading_system_b.csv" \
  -F "num_columns=3" \
  -F "schedule_type=daily" \
  -F 'schedule_config={"time":"02:00","days":[0,1,2,3,4]}' \
  -F "notification_emails=team@company.com"
```

### 5. Compare Two Runs
```bash
# After you have at least 2 runs completed:
curl http://localhost:8000/api/compare-runs/1/2
```

### 6. Get Historical Trends
```bash
curl "http://localhost:8000/api/trends/trading_system_a.csv/trading_system_b.csv?days=30"
```

---

## 📊 Enterprise Dashboard (Coming Soon)

While we build the dashboard UI, use these API endpoints:

### Check Recent Activity
```python
import requests

# Get recent audit events
response = requests.get('http://localhost:8000/api/audit-log?limit=20')
print(response.json())

# Get scheduled jobs
response = requests.get('http://localhost:8000/api/scheduled-jobs')
print(response.json())

# Get notification history
response = requests.get('http://localhost:8000/api/notification-history?limit=20')
print(response.json())
```

---

## 🔧 Common Use Cases

### Use Case 1: Set Up Daily Automated Checks
```bash
# Create job
curl -X POST http://localhost:8000/api/scheduled-jobs \
  -F "job_name=Daily Reconciliation" \
  -F "file_a=production.csv" \
  -F "file_b=backup.csv" \
  -F "num_columns=3" \
  -F "schedule_type=daily" \
  -F 'schedule_config={"time":"02:00","days":[0,1,2,3,4]}' \
  -F "notification_emails=ops@company.com"

# Verify it's created
curl http://localhost:8000/api/scheduled-jobs
```

### Use Case 2: Monitor Data Quality Trends
```bash
# Get 90-day trend report
curl "http://localhost:8000/api/trend-report/file_a.csv/file_b.csv?days=90" > trend_report.json

# Detect anomalies
curl "http://localhost:8000/api/anomalies/file_a.csv/file_b.csv" > anomalies.json
```

### Use Case 3: Set Up Slack Notifications
```python
import requests

# Create job with Slack webhook
data = {
    "job_name": "Production Data Check",
    "file_a": "prod_data.csv",
    "file_b": "backup_data.csv",
    "num_columns": 3,
    "schedule_type": "daily",
    "schedule_config": '{"time":"02:00","days":[0,1,2,3,4]}',
    "notification_webhooks": '["https://hooks.slack.com/services/YOUR/WEBHOOK/URL"]'
}

response = requests.post('http://localhost:8000/api/scheduled-jobs', data=data)
print(response.json())
```

---

## 📈 Monitoring Your System

### Check System Health
```bash
# Current health
curl http://localhost:8000/api/system/health

# 24-hour metrics
curl "http://localhost:8000/api/system/metrics?hours=24"
```

### Generate Compliance Report
```bash
curl "http://localhost:8000/api/compliance-report?start_date=2025-10-01&end_date=2025-10-31" > compliance_report.json
```

---

## 🎨 Integration Examples

### Python Integration
```python
import requests

class UniqueKeyIdentifierClient:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
    
    def create_scheduled_job(self, job_config):
        return requests.post(
            f"{self.base_url}/api/scheduled-jobs",
            data=job_config
        ).json()
    
    def get_trends(self, file_a, file_b, days=30):
        return requests.get(
            f"{self.base_url}/api/trends/{file_a}/{file_b}",
            params={"days": days}
        ).json()
    
    def compare_runs(self, run_id_1, run_id_2):
        return requests.get(
            f"{self.base_url}/api/compare-runs/{run_id_1}/{run_id_2}"
        ).json()

# Usage
client = UniqueKeyIdentifierClient()

# Get trends
trends = client.get_trends("file_a.csv", "file_b.csv", days=90)
print(f"Found {trends['count']} data points")

# Compare runs
comparison = client.compare_runs(1, 2)
print(f"Quality change: {comparison['quality_comparison']}")
```

### cURL Integration (for CI/CD)
```bash
#!/bin/bash
# ci_analysis_check.sh

# Trigger analysis
run_response=$(curl -s -X POST http://localhost:8000/compare \
  -F "file_a=latest_data.csv" \
  -F "file_b=reference_data.csv" \
  -F "num_columns=3")

run_id=$(echo $run_response | jq -r '.run_id')
echo "Started analysis run: $run_id"

# Wait for completion
while true; do
  status=$(curl -s http://localhost:8000/api/status/$run_id | jq -r '.status')
  if [ "$status" == "completed" ]; then
    break
  fi
  sleep 5
done

# Check for regressions
comparison=$(curl -s http://localhost:8000/api/compare-runs/$((run_id-1))/$run_id)
regressions=$(echo $comparison | jq '.regressions | length')

if [ $regressions -gt 0 ]; then
  echo "❌ Quality regressions detected!"
  exit 1
else
  echo "✅ No regressions found"
  exit 0
fi
```

---

## 🐛 Troubleshooting

### Scheduler Not Starting
**Issue**: Job scheduler doesn't start  
**Solution**: Check logs for errors, ensure database is writable

### Email Notifications Not Working
**Issue**: Emails not sending  
**Solutions**:
1. Verify SMTP credentials: `POST /api/notify/test`
2. Check firewall rules (port 587)
3. For Gmail, use App-Specific Password
4. Check audit log for error messages

### API Returns 500 Error
**Issue**: API endpoint returns internal server error  
**Solutions**:
1. Check console logs for stack trace
2. Verify database permissions
3. Check audit log: `GET /api/audit-log?event_type=error`

### High Memory Usage
**Issue**: Application using too much memory  
**Solutions**:
1. Reduce `MAX_FILE_GENERATION_ROWS` in `config.py`
2. Increase `SKIP_FILE_GENERATION_THRESHOLD`
3. Check system health: `GET /api/system/health`

---

## 📚 Next Steps

1. **Read Full Documentation**: `ENTERPRISE_FEATURES.md`
2. **Set Up Monitoring**: Configure health checks
3. **Create Scheduled Jobs**: Automate your workflows
4. **Integrate with Tools**: Connect to Slack, monitoring systems
5. **Generate Reports**: Use compliance and trend reports

---

## 🆘 Support

### Documentation
- **Enterprise Features**: `ENTERPRISE_FEATURES.md`
- **Fixes Applied**: `FIXES_APPLIED_LARGE_FILES.md`
- **Enterprise Improvements**: `ENTERPRISE_IMPROVEMENTS.md`

### API Reference
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Community
- Report issues on GitHub
- Contact enterprise support

---

## ✅ Verification Checklist

After setup, verify these work:

- [ ] Application starts without errors
- [ ] Web UI accessible at http://localhost:8000
- [ ] API docs at http://localhost:8000/docs
- [ ] System health returns data: `GET /api/system/health`
- [ ] Audit logging working: Run analysis → Check `GET /api/audit-log`
- [ ] Scheduler running: Check console output for "Job scheduler: RUNNING"
- [ ] (Optional) Email test passes: `POST /api/notify/test`
- [ ] (Optional) Scheduled job created successfully

---

**🎉 Congratulations! You're now running Enterprise Edition with:**
- ✅ Complete audit trails
- ✅ Automated scheduling
- ✅ Proactive notifications
- ✅ Historical analytics
- ✅ System monitoring
- ✅ RESTful API

**Happy analyzing! 🚀**

