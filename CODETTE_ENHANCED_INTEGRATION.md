# Codette Enhanced - React Integration Guide

**Status**: Ready for Integration  
**Date**: December 4, 2025  
**Backend Port**: 8000  
**Frontend Port**: 5173/5174/5175

---

## ?? Quick Start

### 1. Copy React Component
```bash
# Already created at:
# src/components/CodetteFeedbackSystem.tsx
```

### 2. Import in Your Component
```typescript
import { 
  CodetteFeedbackComponent, 
  UserLearningProfile, 
  CodetteAnalyticsDashboard 
} from '@/components/CodetteFeedbackSystem';
```

### 3. Use in Your JSX
```typescript
import React, { useState } from 'react';
import { CodetteFeedbackComponent } from '@/components/CodetteFeedbackSystem';

export function CodettePanel() {
  const [response, setResponse] = useState<CodetteResponse | null>(null);
  const [userId] = useState('jonathan');
  
  // Example response object (from API)
  const exampleResponse: CodetteResponse = {
    query: "How do I properly gain stage?",
    category: "gain_staging",
    perspectives: [
      {
        perspective: "mix_engineering",
        emoji: "???",
        name: "Mix Engineering",
        response: "Set your master fader to -6dB headroom...",
        confidence: 0.88,
        color: "blue",
        user_preference_score: 0.85,
      },
      // ... more perspectives
    ],
    combined_confidence: 0.87,
    source: "codette-enhanced-ai",
    is_real_ai: false,
    deterministic: true,
    learning_enabled: true,
    user_id: userId,
    timestamp: new Date().toISOString(),
  };
  
  return (
    <div style={{ padding: '20px' }}>
      {/* Display Codette response */}
      {response && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Codette's Response</h3>
          {response.perspectives.map((p) => (
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
            // Update your state or refetch data
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

---

## ?? API Endpoints (Backend)

All endpoints are hosted at: `http://localhost:8000`

### Chat & Response Generation

#### `POST /api/codette/chat-enhanced`
Generate response with learning and preference tracking

```bash
curl -X POST http://localhost:8000/api/codette/chat-enhanced \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I improve vocal clarity?",
    "user_id": "jonathan"
  }'
```

**Response**:
```json
{
  "query": "How do I improve vocal clarity?",
  "category": "mixing_clarity",
  "perspectives": [
    {
      "perspective": "mix_engineering",
      "emoji": "???",
      "name": "Mix Engineering",
      "response": "Clear space with high-pass filters...",
      "confidence": 0.88,
      "color": "blue",
      "user_preference_score": 0.85
    },
    // ... more perspectives
  ],
  "combined_confidence": 0.87,
  "source": "codette-enhanced-ai",
  "learning_enabled": true,
  "user_id": "jonathan"
}
```

### Feedback Collection

#### `POST /api/codette/feedback`
Record user rating on a response

```bash
curl -X POST http://localhost:8000/api/codette/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "jonathan",
    "response_id": "2025-12-04T10:30:00Z-mixing_clarity",
    "category": "mixing_clarity",
    "perspective": "mix_engineering",
    "rating": 4,
    "rating_name": "EXACTLY_WHAT_NEEDED",
    "helpful_score": 100,
    "helpful_comment": "This helped me understand frequency masking better!"
  }'
```

**Rating Scale**:
- 0: ?? Not helpful
- 1: ?? Slightly helpful
- 2: ?? Helpful
- 3: ?? Very helpful
- 4: ?? Exactly what I needed!

### User Profiles & Learning

#### `GET /api/codette/user-profile/{user_id}`
Get user's learning profile and preferences

```bash
curl http://localhost:8000/api/codette/user-profile/jonathan
```

**Response**:
```json
{
  "user_id": "jonathan",
  "profile_age": "2025-12-04T10:30:00Z",
  "most_preferred_perspective": {
    "name": "mix_engineering",
    "score": 0.85
  },
  "least_preferred_perspective": {
    "name": "creative_production",
    "score": 0.45
  },
  "all_perspective_preferences": {
    "mix_engineering": 0.85,
    "audio_theory": 0.65,
    "creative_production": 0.45,
    "technical_troubleshooting": 0.72,
    "workflow_optimization": 0.88
  },
  "all_category_preferences": { /* 25 categories */ },
  "responses_rated": 47,
  "learning_recommendation": "Try exploring more creative production perspectives..."
}
```

### Analytics & Dashboard

#### `GET /api/codette/analytics`
Get system-wide analytics

```bash
curl http://localhost:8000/api/codette/analytics
```

**Response**:
```json
{
  "total_responses_generated": 1243,
  "total_ratings_received": 847,
  "average_rating": 3.12,
  "rating_distribution": {
    "unhelpful": 52,
    "slightly_helpful": 89,
    "helpful": 256,
    "very_helpful": 303,
    "exactly_what_needed": 147
  },
  "categories_used": ["vocal_processing", "mixing_clarity", ...],
  "total_categories_available": 25,
  "active_users": 127,
  "most_helpful_perspective": "mix_engineering",
  "least_helpful_perspective": "creative_production",
  "response_quality_trend": "improving"
}
```

#### `GET /api/codette/analytics/category/{category}`
Get category-specific analytics

```bash
curl http://localhost:8000/api/codette/analytics/category/vocal_processing
```

### Recommendations & Export

#### `GET /api/codette/recommendations/{user_id}`
Get personalized recommendations based on learning profile

```bash
curl http://localhost:8000/api/codette/recommendations/jonathan
```

#### `GET /api/codette/export/feedback`
Export feedback data for analysis

```bash
curl http://localhost:8000/api/codette/export/feedback > feedback.json
# Or specific user:
curl http://localhost:8000/api/codette/export/feedback?user_id=jonathan > jonathan_feedback.json
```

---

## ?? Integration Checklist

- [ ] Backend running: `python codette_server_unified.py`
- [ ] Verify import: `python -c "from codette_enhanced_responder import get_enhanced_responder; print('?')"`
- [ ] Check endpoints: `curl http://localhost:8000/docs` (Swagger UI)
- [ ] Copy React component to `src/components/CodetteFeedbackSystem.tsx`
- [ ] Import in your panel component
- [ ] Add to your JSX
- [ ] Test feedback submission
- [ ] Verify user profile loads
- [ ] Check analytics dashboard
- [ ] Deploy to production

---

## ?? Testing

### Test 1: Generate Response
```bash
curl -X POST http://localhost:8000/api/codette/chat-enhanced \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I mix drums?", "user_id": "test"}'
```

Expected: Response with 5 perspectives (mix_engineering, audio_theory, etc.)

### Test 2: Submit Feedback
```bash
curl -X POST http://localhost:8000/api/codette/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test",
    "response_id": "test-response",
    "category": "audio_clipping",
    "perspective": "mix_engineering",
    "rating": 4,
    "rating_name": "EXACTLY_WHAT_NEEDED",
    "helpful_score": 100
  }'
```

Expected: Feedback recorded successfully

### Test 3: Get User Profile
```bash
curl http://localhost:8000/api/codette/user-profile/test
```

Expected: User's learning profile with preferences

### Test 4: Check Analytics
```bash
curl http://localhost:8000/api/codette/analytics
```

Expected: System metrics and quality indicators

---

## ?? Data Model

### CodetteResponse (from API)
```typescript
interface CodetteResponse {
  query: string;
  category: string;
  perspectives: Array<{
    perspective: string;        // Key: "mix_engineering", "audio_theory", etc.
    emoji: string;              // "???", "??", "??", "??", "?"
    name: string;               // "Mix Engineering", "Audio Theory", etc.
    response: string;           // Full response text
    confidence: number;         // 0-1 score
    color: string;              // "blue", "purple", "green", etc.
    user_preference_score: number; // How much user prefers this perspective
  }>;
  combined_confidence: number;  // Average confidence across all perspectives
  source: string;               // "codette-enhanced-ai"
  is_real_ai: boolean;         // false (deterministic system)
  deterministic: boolean;       // true (no randomness)
  learning_enabled: boolean;    // true
  user_id: string;              // "jonathan"
  timestamp: string;            // ISO format
  ab_test_variant?: string;     // Optional A/B test variant
}
```

### Feedback Model
```typescript
interface Feedback {
  user_id: string;
  response_id: string;
  category: string;             // Which topic category
  perspective: string;          // Which perspective was rated
  rating: 0 | 1 | 2 | 3 | 4;   // User's rating
  rating_name: string;          // "UNHELPFUL", "HELPFUL", etc.
  helpful_score: number;        // 0-100 percentage
  helpful_comment: string;      // Optional written feedback
  timestamp: string;            // When submitted
}
```

---

## ?? Environment Setup

### Backend
```bash
# Start server (requires Python 3.10+)
cd I:\ashesinthedawn
python codette_server_unified.py

# Server will start on port 8000
# Access docs: http://localhost:8000/docs
```

### Frontend
```bash
# In React app (runs on 5173+)
npm run dev

# Import and use components
import { CodetteFeedbackComponent } from '@/components/CodetteFeedbackSystem';
```

---

## ?? Troubleshooting

### "Import failed: codette_enhanced_responder not found"
```bash
# Verify file exists:
ls codette_enhanced_responder.py

# Test import:
python -c "from codette_enhanced_responder import get_enhanced_responder"
```

### "Feedback endpoint not found (404)"
```bash
# Check enhanced responder is available:
curl http://localhost:8000/api/codette/status-enhanced

# Should show: "status": "operational"
```

### React component styling not loading
```typescript
// Styles are inline in component
// Check CodetteFeedbackSystem.tsx has `styles` object
// All colors use dark theme (bg-gray-950, etc.)
```

### User profile empty
```bash
# User must have at least one rating first
# Submit feedback, then check profile:
curl http://localhost:8000/api/codette/user-profile/jonathan
```

---

## ?? Monitoring

### System Health
```bash
curl http://localhost:8000/api/codette/status-enhanced
```

### Analytics Dashboard
```bash
curl http://localhost:8000/api/codette/analytics
```

### User Statistics
```bash
curl http://localhost:8000/api/codette/user-profiles?limit=10
```

### Export Data
```bash
curl http://localhost:8000/api/codette/export/feedback > feedback_backup.json
curl http://localhost:8000/api/codette/export/user-profiles > profiles_backup.json
```

---

## ?? Learning System

### How It Works
1. User asks question ? System generates 5-perspective response
2. User rates response (0-4 scale)
3. System learns: `new_score = (old_score × 0.7) + (rating_influence × 0.3)`
4. Next time same topic ? Perspectives reordered by user preference
5. Over time ? Highly personalized response order

### Example
```
User asks about gain staging
Week 1: All perspectives equal (0.5 each)

User rates mix_engineering highly (4/4)
new_score = (0.5 × 0.7) + (1.0 × 0.3) = 0.65

User rates audio_theory lowly (1/4)
new_score = (0.5 × 0.7) + (0.25 × 0.3) = 0.425

Week 2: Next gain staging question
mix_engineering appears FIRST (0.65)
audio_theory appears LAST (0.425)
? User gets their preferred perspective first!
```

---

## ? Success Criteria

- [x] Backend imports codette_enhanced_responder successfully
- [x] All 10+ endpoints registered in FastAPI
- [x] React component created with feedback system
- [x] User learning profiles working
- [x] Analytics dashboard functional
- [x] A/B testing framework ready
- [x] Documentation complete

**Status**: ?? **READY FOR PRODUCTION**

---

**Questions?** See:
- `CODETTE_ENHANCED_COMPLETE_GUIDE.md` - Full technical docs
- `CODETTE_ENHANCED_REFERENCE.md` - Quick reference
- `CODETTE_ENHANCED_DELIVERY.md` - Delivery summary
