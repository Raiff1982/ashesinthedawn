# 🚀 CODETTE AI - QUICK START GUIDE

**Last Updated:** December 1, 2025  
**Status:** ✅ **Ready to Use**

---

## ⚡ QUICK START (30 seconds)

### 1. **Backend is Running** ✅
- Port: `8000`
- URL: `http://localhost:8000`
- Status: Check `http://localhost:8000/health`

### 2. **Frontend is Running** ✅
- Port: `5173`
- URL: `http://localhost:5173`
- Status: Browser shows CoreLogic Studio DAW

### 3. **Open Frontend**
```
Go to: http://localhost:5173
```

### 4. **Find Codette Button**
- Look in the **TopBar** (top of screen)
- Purple button with sparkles icon 💜✨
- Says "Codette"

### 5. **Click the Button**
- Panel opens in bottom-right corner
- You're ready to chat!

---

## 💬 CODETTE MASTER PANEL TABS

### 🗨️ Chat Tab
```
1. Type a question about music production
2. Hit "Send"
3. Codette responds
4. Ask follow-ups

Example questions:
- "How do I EQ vocals?"
- "What compressor settings for drums?"
- "How to avoid phase issues?"
```

### 💡 Suggestions Tab
```
1. Select a track from the DAW
2. Click "Get Suggestions"
3. See personalized recommendations
4. Click "Refresh" for more
```

### 📊 Analysis Tab
```
1. Select a track
2. Click "Analyze Track"
3. Get detailed metrics
4. See findings and recommendations
```

### ⚙️ Controls Tab
```
- Quick action buttons (Smart Mix, Diagnose, etc.)
- Settings toggles
- Clear chat history
```

---

## 🎯 QUICK ACTIONS

| Action | Button | What It Does |
|--------|--------|-------------|
| Smart Mix | 🎯 | Auto-optimizes mixing |
| Diagnose | 🔍 | Finds mixing issues |
| Enhance | ✨ | Improves audio quality |
| Genre Match | 🎵 | Matches genre style |

---

## ❌ ISSUES & FIXES

### "Codette button not showing?"
1. Refresh the page (F5)
2. Check TopBar is visible
3. Look for purple button

### "Chat not responding?"
1. Check backend: `http://localhost:8000/health`
2. Restart backend if needed
3. Refresh frontend

### "Backend not working?"
```powershell
# Restart backend
cd I:\ashesinthedawn
python codette_server_unified.py
```

### "Frontend not loading?"
```powershell
# Restart frontend
cd I:\ashesinthedawn
npm run dev
```

---

## 📍 PANEL LOCATION

**Bottom-Right Corner**
```
┌─────────────────────────────────┐
│                                 │
│  DAW Main Area                  │
│                                 │
│                      ┌──────┐   │
│                      │Codette│   │
│                      │Panel  │   │
│                      └──────┘   │
└─────────────────────────────────┘
```

**Click "✕" to close**

---

## 🔗 IMPORTANT URLS

| Service | URL | Status |
|---------|-----|--------|
| Frontend | http://localhost:5173 | ✅ Open now |
| Backend | http://localhost:8000 | ✅ Running |
| Backend Health | http://localhost:8000/health | ✅ Check |
| API Docs | http://localhost:8000/docs | 📚 Swagger UI |

---

## 🎓 EXAMPLE WORKFLOWS

### Workflow 1: Get Mixing Tips
```
1. Open Codette
2. Go to Chat tab
3. Ask: "How do I mix a crowded instrumental?"
4. Get detailed response
5. Follow recommendations
```

### Workflow 2: Analyze Your Mix
```
1. Select a track
2. Go to Analysis tab
3. Click "Analyze Track"
4. Review findings
5. Implement recommendations
```

### Workflow 3: Get Quick Suggestions
```
1. Select a track
2. Go to Suggestions tab
3. Click "Get Suggestions"
4. See recommendations
5. Click "Refresh" for different ideas
```

---

## ✨ FEATURES AT A GLANCE

- ✅ Real-time AI chat
- ✅ Music production knowledge
- ✅ Audio analysis
- ✅ Smart suggestions
- ✅ Quick actions
- ✅ Track-aware recommendations
- ✅ Error handling
- ✅ Loading indicators

---

## 🎚️ SETTINGS

**In Controls Tab:**

- [ ] Auto-analyze on track change (auto-runs analysis when you switch tracks)
- [ ] Real-time suggestions (shows suggestions as you work)
- [ ] Experimental features (enables beta features)

---

## 📱 BROWSER TIPS

### Best Experience
- **Desktop:** Recommended
- **Resolution:** 1920x1080 or higher
- **Browser:** Chrome, Firefox, Safari, Edge

### Keyboard Shortcuts
- `Ctrl+Shift+P` - Command Palette (separate feature)
- `Ctrl+/` - Command Palette (separate feature)
- Click "✕" on Codette panel to close

---

## 🔔 STATUS INDICATOR

**Bottom of Codette Panel:**
- 🟢 **Green dot** = Connected to backend
- 🔴 **Red dot** = Backend offline

If red:
1. Check backend is running
2. Restart backend
3. Refresh frontend

---

## 🎯 WHAT TO TRY FIRST

1. **Open Codette Panel**
   - Click Codette button in TopBar

2. **Test Chat**
   - Ask: "What's a good starting point for mixing vocals?"
   - See Codette respond

3. **Get Suggestions**
   - Select any track
   - Click "Get Suggestions" button
   - See recommendations

4. **Analyze**
   - Select a track
   - Click "Analyze Track"
   - Review results

5. **Try Quick Actions**
   - Click "Smart Mix" button
   - Click "Diagnose" button

---

## 📞 NEED HELP?

1. **Check the docs:**
   - `CODETTE_UI_INTEGRATION_COMPLETE.md`
   - `CODETTE_AI_INTEGRATION_FINAL_DEPLOYMENT_REPORT.md`

2. **Check backend health:**
   - Visit `http://localhost:8000/health`

3. **Check logs:**
   - Look at terminal where backend/frontend run

4. **Restart:**
   - Ctrl+C to stop backend
   - Kill npm process for frontend
   - Restart both services

---

## 🎉 YOU'RE READY!

The Codette AI Master Panel is fully integrated and operational.

**Start chatting with Codette now!**

---

**Questions?** Check the comprehensive docs for detailed information.  
**Issues?** Restart both services and refresh the page.  
**Ready to go!** ✅
