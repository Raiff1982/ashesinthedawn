# 🔍 Supabase Edge Functions Monitoring & Verification

**Purpose**: Ensure all 11 Edge Functions are being used correctly and catch failures early  
**Created**: December 1, 2025  
**Status**: Implementation guide + monitoring setup

---

## 📊 Real-Time Monitoring Dashboard

### 1. **Supabase Dashboard Logs** (Native)

Go to: `https://app.supabase.com/project/ngvcyxvtorwqocnqcbyz`

**Path**: Functions → Edge Functions → Select Function → Logs

**What to look for**:
- ✅ Request count increasing
- ✅ Response time < 500ms
- ❌ Error rate = 0%
- ❌ No timeout errors

**For each function**:

| Function | Path | Ideal Log Signature |
|----------|------|-------------------|
| `codette-fallback` | Functions → Logs | "Fallback triggered" |
| `hybrid-search-music` | Functions → Logs | "Query: {search_term}" |
| `upsert-embeddings` | Functions → Logs | "Stored X embeddings" |

---

## 🧪 Local Verification Tests

### Test 1: Verify Endpoint Connectivity

**File to create**: `verify_edge_functions.py`

```python
#!/usr/bin/env python
"""Verify all Edge Functions are accessible and returning data"""

import os
import requests
import json
from typing import Dict, List, Tuple
from datetime import datetime

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ngvcyxvtorwqocnqcbyz.supabase.co")
SUPABASE_ANON_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", "")

FUNCTIONS = {
    "codette-fallback": {
        "url": f"{SUPABASE_URL}/functions/v1/codette-fallback",
        "method": "POST",
        "body": {"message": "test"},
        "expected_status": [200, 400, 500]  # Any response = accessible
    },
    "hybrid-search-music": {
        "url": f"{SUPABASE_URL}/functions/v1/hybrid-search-music",
        "method": "POST",
        "body": {"query": "mixing", "limit": 5},
        "expected_status": [200, 404, 400]
    },
    "upsert-embeddings": {
        "url": f"{SUPABASE_URL}/functions/v1/upsert-embeddings",
        "method": "POST",
        "body": {
            "messages": [
                {
                    "id": "test-123",
                    "embedding": [0.1] * 1536,
                    "content": "test"
                }
            ]
        },
        "expected_status": [200, 400, 401]
    },
    "database-access": {
        "url": f"{SUPABASE_URL}/functions/v1/database-access",
        "method": "POST",
        "body": {"table": "music_knowledge", "limit": 10},
        "expected_status": [200, 400, 401]
    }
}

HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
}

def test_function(name: str, config: Dict) -> Tuple[bool, str]:
    """Test single Edge Function"""
    try:
        response = requests.post(
            config["url"],
            json=config["body"],
            headers=HEADERS,
            timeout=10
        )
        
        if response.status_code in config["expected_status"]:
            return True, f"✅ Status {response.status_code}"
        else:
            return False, f"❌ Unexpected status {response.status_code}"
    
    except requests.exceptions.Timeout:
        return False, "❌ Timeout (>10s)"
    except requests.exceptions.ConnectionError:
        return False, "❌ Connection refused (function may be offline)"
    except Exception as e:
        return False, f"❌ Error: {str(e)[:50]}"

def main():
    """Run all tests"""
    print("\n" + "="*70)
    print("🔍 SUPABASE EDGE FUNCTIONS VERIFICATION")
    print("="*70 + "\n")
    
    results = {}
    for name, config in FUNCTIONS.items():
        print(f"Testing {name}...", end=" ", flush=True)
        success, message = test_function(name, config)
        results[name] = (success, message)
        print(message)
    
    # Summary
    print("\n" + "="*70)
    passed = sum(1 for success, _ in results.values() if success)
    total = len(results)
    print(f"✅ PASSED: {passed}/{total}")
    print("="*70 + "\n")
    
    # Return error code if any failed
    return 0 if passed == total else 1

if __name__ == "__main__":
    exit(main())
```

**Run it**:
```bash
python verify_edge_functions.py
```

---

### Test 2: Track Function Calls in Backend

**File**: `codette_server_unified.py` - Add call tracking

```python
# Add at top of file
from datetime import datetime
from collections import defaultdict

# Tracking dict
FUNCTION_CALL_LOG = defaultdict(list)

def log_function_call(function_name: str, params: dict, response: dict):
    """Log Edge Function calls for monitoring"""
    FUNCTION_CALL_LOG[function_name].append({
        "timestamp": datetime.utcnow().isoformat(),
        "params": params,
        "response_status": "success" if response.get("error") is None else "error",
        "error": response.get("error")
    })

# Then in chat endpoint (around line 890):
@app.post("/codette/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Chat with Codette using training data, real engine, and Supabase context"""
    try:
        # ... existing code ...
        
        # Track Supabase call
        if not context_cached:
            logger.info(f"Calling Edge Function: hybrid-search-music")
            context_result = supabase_client.rpc(
                'get_codette_context',
                {
                    'input_prompt': request.message,
                    'optionally_filename': None
                }
            ).execute()
            
            # Log the call
            log_function_call(
                "hybrid-search-music",
                {"query": request.message},
                {"error": context_result.get("error")}
            )
            
            supabase_context = context_result.data
```

---

### Test 3: Create Health Check Endpoint

**Add to backend** (`codette_server_unified.py`):

```python
@app.get("/health/edge-functions")
async def edge_functions_health():
    """Health check for Edge Functions usage"""
    
    health_status = {
        "timestamp": datetime.utcnow().isoformat(),
        "supabase_connected": SUPABASE_AVAILABLE,
        "functions_called": dict(FUNCTION_CALL_LOG),
        "recent_calls": {
            name: calls[-5:] for name, calls in FUNCTION_CALL_LOG.items()
        },
        "error_rate": calculate_error_rate()
    }
    
    return health_status

def calculate_error_rate() -> float:
    """Calculate error rate across all function calls"""
    total_calls = sum(len(calls) for calls in FUNCTION_CALL_LOG.values())
    if total_calls == 0:
        return 0.0
    
    error_calls = sum(
        1 for calls in FUNCTION_CALL_LOG.values()
        for call in calls
        if call["response_status"] == "error"
    )
    
    return (error_calls / total_calls) * 100
```

**Query it**:
```bash
curl http://localhost:8000/health/edge-functions
```

---

## 📈 Monitoring Strategy by Function Type

### Active Functions (Monitor 24/7)

**1. `hybrid-search-music` & `upsert-embeddings`** (New - Dec 1, 2025)

```yaml
Monitoring:
  - ✅ Call frequency: Should increase as users search
  - ✅ Response time: Target < 200ms
  - ✅ Error rate: Target 0%
  - ✅ Embedding quality: Verify search results are relevant
  
Alert triggers:
  - ⚠️ Response time > 500ms
  - ⚠️ Error rate > 5%
  - ⚠️ No calls in 1 hour (possible bug)
```

**2. `codette-fallback*` Functions** (Fallback handlers)

```yaml
Monitoring:
  - ✅ Should only trigger when primary fails
  - ✅ Call frequency: < 10% of total requests
  - ✅ Response time: Fast (cached data)
  
Alert triggers:
  - ⚠️ Fallback called > 20% of time (primary broken)
  - ⚠️ No calls in 24 hours (possible removal candidate)
```

**3. `database-access`** (Core database operations)

```yaml
Monitoring:
  - ✅ Steady call volume
  - ✅ Response time: 50-200ms
  - ✅ Error rate: < 2% (network failures normal)
  
Alert triggers:
  - ⚠️ Connection errors increasing
  - ⚠️ Timeout errors > 10%
```

### Inactive Functions (Periodic Check)

**`kaggle-proxy`, `openai-chat`, `openai-completion`, `swift-task`, `my-function`**

```yaml
Monitoring (Weekly):
  - ✅ Verify still deployed
  - ✅ Check last invocation date
  - ✅ Decision: Keep or archive?
  
Action if unused 3+ months:
  - 📋 Document why unused
  - 🗑️ Archive or remove
  - 📝 Update team documentation
```

---

## 🛠️ Implementation Checklist

### Phase 1: Immediate (Today)
- [ ] Create `verify_edge_functions.py` script
- [ ] Run it manually once: `python verify_edge_functions.py`
- [ ] Check Supabase dashboard for recent invocations
- [ ] Verify `hybrid-search-music` and `upsert-embeddings` (new functions)

### Phase 2: Short-term (This Week)
- [ ] Add function call logging to `codette_server_unified.py`
- [ ] Create `/health/edge-functions` endpoint
- [ ] Test: POST to `/codette/chat` and check health endpoint
- [ ] Document baseline metrics (response times, error rates)

### Phase 3: Medium-term (This Month)
- [ ] Setup automated monitoring:
  - [ ] Cron job to run `verify_edge_functions.py` daily
  - [ ] Parse results and store in database
  - [ ] Alert on anomalies
- [ ] Create dashboard showing function usage over time
- [ ] Document runbook for function failures

### Phase 4: Long-term (Ongoing)
- [ ] Review weekly metrics
- [ ] Archive unused functions
- [ ] Optimize slow functions
- [ ] Scale high-usage functions

---

## 🚨 Failure Recovery Procedures

### If `hybrid-search-music` Fails

```
1. Check Supabase dashboard
2. Verify message embeddings table is accessible
3. Fallback: codette-fallback handler activates
4. Return generic suggestions from genre templates
5. Log error for debugging
```

**Recovery script**:
```bash
# Restart the function
curl -X POST https://app.supabase.com/api/v1/projects/ngvcyxvtorwqocnqcbyz/functions/hybrid-search-music/redeploy \
  -H "Authorization: Bearer $SUPABASE_ADMIN_TOKEN"
```

### If `upsert-embeddings` Falls Behind

```
1. Check Supabase function logs for errors
2. Verify message_embeddings table capacity
3. Check batch size (default: 50)
4. Retry failed batches manually
```

**Manual retry**:
```javascript
// backfill_embeddings.js - Run with retry logic
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // ms

for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
  try {
    const response = await fetch(EDGE_FN_URL, {
      method: 'POST',
      body: JSON.stringify({ messages: batch })
    });
    if (response.ok) break;
  } catch (err) {
    if (attempt < MAX_RETRIES - 1) {
      console.log(`Retry ${attempt + 1}/${MAX_RETRIES}...`);
      await new Promise(r => setTimeout(r, RETRY_DELAY));
    }
  }
}
```

---

## 📊 Metrics to Track

### Per-Function Metrics

```
metric_name: "function_call_count"
  labels:
    function: "hybrid-search-music"
    status: "success" | "error"
  interval: 5 minutes

metric_name: "function_response_time_ms"
  labels:
    function: "hybrid-search-music"
    percentile: "p50" | "p95" | "p99"
  interval: 5 minutes

metric_name: "edge_function_error_rate"
  labels:
    function: "upsert-embeddings"
  threshold_alert: > 5%
```

### System-Wide Metrics

```
metric_name: "supabase_connectivity"
  possible_values: "connected" | "degraded" | "offline"
  interval: 30 seconds

metric_name: "embedding_pipeline_latency_ms"
  definition: Time from message sent to embedding stored
  target: < 500ms
  percentile: p95

metric_name: "fallback_activation_rate"
  definition: % of requests using fallback handlers
  target: < 5%
  alert_threshold: > 10%
```

---

## 🔔 Alert Setup (Supabase + Email)

### Option 1: Supabase Native Alerts

1. Go to: `https://app.supabase.com/project/ngvcyxvtorwqocnqcbyz/settings/notifications`
2. Add alert rule:
   ```
   When: Function Error Rate > 5%
   Duration: 5 minutes
   Action: Send email notification
   ```

### Option 2: Custom Script (Check via Cron)

**File**: `check_functions_health.py`

```python
#!/usr/bin/env python
"""Check Edge Functions health and send alerts"""

import subprocess
import smtplib
from email.mime.text import MIMEText
from datetime import datetime

def send_alert(subject: str, message: str):
    """Send email alert"""
    # Configure email credentials
    SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT = 587
    EMAIL = os.getenv("ALERT_EMAIL")
    PASSWORD = os.getenv("ALERT_EMAIL_PASSWORD")
    
    msg = MIMEText(message)
    msg["Subject"] = subject
    msg["From"] = EMAIL
    msg["To"] = EMAIL
    
    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(EMAIL, PASSWORD)
        server.send_message(msg)

def main():
    """Health check with alerts"""
    
    # Run verification
    result = subprocess.run(
        ["python", "verify_edge_functions.py"],
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        send_alert(
            "🚨 Edge Function Failure",
            f"One or more functions are not responding:\n{result.stdout}"
        )
        print("❌ Alert sent")
    else:
        print(f"✅ All functions healthy at {datetime.now()}")

if __name__ == "__main__":
    main()
```

**Add to crontab** (Linux/Mac):
```bash
# Check every hour
0 * * * * /usr/bin/python3 /path/to/check_functions_health.py
```

**Or as background job** (Windows Task Scheduler):
```powershell
# Create scheduled task
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Days 999)
$action = New-ScheduledTaskAction -Execute "python" -Argument "check_functions_health.py"
Register-ScheduledTask -TaskName "CheckEdgeFunctions" -Trigger $trigger -Action $action
```

---

## 📋 Verification Checklist

**Daily** (Morning):
- [ ] Check Supabase dashboard: any errors overnight?
- [ ] Verify response times normal
- [ ] Check error rate < 2%

**Weekly** (Monday):
- [ ] Review function call counts
- [ ] Identify any unused functions
- [ ] Check for performance degradation

**Monthly** (First day):
- [ ] Archive unused functions
- [ ] Update monitoring thresholds
- [ ] Document lessons learned
- [ ] Plan optimizations

---

## 🎯 Quick Verification Commands

### Check if Supabase is responding
```bash
curl -I https://ngvcyxvtorwqocnqcbyz.supabase.co/functions/v1/hybrid-search-music
```

### Check backend health
```bash
curl http://localhost:8000/health/edge-functions | jq
```

### Count total function calls today
```bash
curl http://localhost:8000/health/edge-functions | jq '.functions_called | map(length) | add'
```

### Test message embedding pipeline
```bash
curl -X POST http://localhost:8000/codette/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test","perspective":"mix_engineering"}' | jq '.confidence'
```

---

## 📚 Related Documentation

- `SUPABASE_EDGE_FUNCTIONS_REFERENCE.md` - Complete function inventory
- `SUPABASE_CODETTE_FUNCTION_DOCS.md` - PostgreSQL function details
- `BACKFILL_SETUP_GUIDE.md` - Embedding pipeline setup
- Supabase Dashboard: https://app.supabase.com/project/ngvcyxvtorwqocnqcbyz

---

**Status**: Ready to implement  
**Next Step**: Run `verify_edge_functions.py` to get baseline metrics
