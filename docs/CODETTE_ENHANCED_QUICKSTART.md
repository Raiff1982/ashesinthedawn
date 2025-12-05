# ? QUICK START - CODETTE ENHANCED INTEGRATION

**5-Minute Setup Guide**

---

## ?? Step 1: Backend Setup (2 min)

### Copy Files
```bash
cp codette_enhanced_responder.py /path/to/project/
cp codette_enhanced_routes.py /path/to/project/routes/
```

### Update `codette_server_unified.py`
```python
# Add this import
from codette_enhanced_routes import router as enhanced_router

# Add this after your existing routers
app.include_router(enhanced_router)
```

### Test
```bash
curl -X POST http://localhost:8000/api/codette/chat-enhanced \
  -H "Content-Type: application/json" \
  -d '{"message":"How do I gain stage?","user_id":"test"}'
```

Expected response:
```json
{
  "query": "How do I gain stage?",
  "category": "gain_staging",
  "perspectives": [...],
  "source": "codette-enhanced-ai",
  "learning_enabled": true
}
```

---

## ?? Step 2: Frontend Setup (2 min)

### Copy Component
```bash
cp src/components/CodetteFeedbackSystem.tsx /path/to/project/src/components/
```

### Update Your Codette Panel
```tsx
// In src/components/CodettePanel.tsx
import { 
  CodetteFeedbackComponent, 
  UserLearningProfile, 
  CodetteAnalyticsDashboard 
} from '@/components/CodetteFeedbackSystem';

export function CodettePanel() {
  const [response, setResponse] = useState<CodetteResponse | null>(null);
  const [userId] = useState('jonathan');

  return (
    <div style={{ padding: '20px' }}>
      {/* Display Codette response */}
      {response && (
        <div>
          <h3>Codette Response</h3>
          {response.perspectives.map(p => (
            <div key={p.perspective}>
              <h4>{p.emoji} {p.name}</h4>
              <p>{p.response}</p>
            </div>
          ))}
        </div>
      )}

      {/* Feedback component */}
      {response && (
        <CodetteFeedbackComponent 
          response={response}
          onFeedbackSubmitted={(feedback) => {
            console.log('Feedback submitted:', feedback);
          }}
        />
      )}

      {/* User profile */}
      <UserLearningProfile userId={userId} />

      {/* Analytics */}
      <CodetteAnalyticsDashboard />
    </div>
  );
}
```

### Test
- Open your Codette panel
- Ask a question
- Rate the response
- See user profile update

---

## ?? Step 3: Verify & Deploy (1 min)

### Health Check
```bash
curl http://localhost:8000/api/codette/status
```

Expected:
```json
{
  "status": "operational",
  "system": "codette-enhanced",
  "metrics": {...}
}
```

### Check Analytics
```bash
curl http://localhost:8000/api/codette/analytics
```

### Deploy
```bash
git add .
git commit -m "feat: add Codette enhanced learning system"
git push
```

---

## ?? Optional: Customize Styling

The component includes dark theme by default. To customize:

```tsx
// Change colors in CodetteFeedbackSystem.tsx
const styles: any = {
  container: {
    backgroundColor: '#1e293b',  // Change this
    // ...
  }
}
```

---

## ?? Monitor & Iterate

### Daily
```bash
# Check analytics
curl http://localhost:8000/api/codette/analytics | jq '.average_rating'

# Export feedback
curl http://localhost:8000/api/codette/export/feedback > feedback.json
```

### Weekly
- Review most/least helpful perspectives
- Check A/B test results
- Look for improvement trends

### Monthly
- Export all data
- Analyze user profiles
- Plan next enhancements

---

## ?? Troubleshooting

**Q: Feedback not saving?**
```bash
# Check backend logs
tail -f server.log | grep "feedback"

# Verify endpoint
curl -X POST http://localhost:8000/api/codette/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "user_id":"test",
    "response_id":"123",
    "category":"vocal_processing",
    "perspective":"mix_engineering",
    "rating":4,
    "rating_name":"EXACTLY_WHAT_NEEDED",
    "helpful_score":100
  }'
```

**Q: Analytics showing zero?**
```bash
# No feedback submitted yet - this is normal
# Submit feedback first, then check analytics
```

**Q: User profile empty?**
```bash
# User must have at least one rating
# Rate a response, then check profile
curl http://localhost:8000/api/codette/user-profile/jonathan
```

---

## ? Checklist

- [ ] Backend files copied
- [ ] Routes integrated in `codette_server_unified.py`
- [ ] Frontend component copied
- [ ] Component imported in CodettePanel
- [ ] Health check passing
- [ ] Analytics endpoint working
- [ ] Test feedback submission
- [ ] User profile displaying
- [ ] Styles look good
- [ ] Ready to deploy

---

## ?? You're Done!

Your Codette system now has:
- ? 25+ response categories
- ? User feedback collection
- ? Preference learning
- ? A/B testing ready
- ? Analytics dashboard
- ? User profiles

**Next steps:**
1. Deploy to production
2. Collect feedback from users
3. Monitor metrics
4. Iterate on responses
5. Celebrate! ??

---

**Questions?** See `CODETTE_ENHANCED_COMPLETE_GUIDE.md` for full documentation.
