# Magic Map Browser Console Debugging Guide

**Quick Start**: Open DevTools Console → Type "Magic Map" in filter box → Try generation

---

## 📊 What You'll See

### 1. Generation Flow (sendMessage)

```
[Magic Map] 🚀 Generation started
[Magic Map] Prompt: "your prompt here"
[Magic Map] 📤 Sending to API: { messageCount: 1, conversationHistory: [...] }
[Magic Map] 📥 API response received { status: 200, timeMs: 5234 }
[Magic Map] 📋 Response data: { valid: true, hasXml: true, xmlLength: 2847 }
[Magic Map] ✅ Success! XML preview (first 500 chars): <?xml...
[Magic Map] 🎉 Total generation time: 5248 ms
```

### 2. Enhancement Flow (enhancePrompt)

```
[Magic Map] ✨ Enhancement started
[Magic Map] Original prompt: "short prompt"
[Magic Map] Enhancement response: { status: 200, hasEnhanced: true }
[Magic Map] ✅ Enhanced prompt: "detailed enhanced prompt..."
```

### 3. Process Creation Flow (createProcess)

```
[Magic Map] 💾 Process creation started
[Magic Map] Process name: "My Process"
[Magic Map] XML length: 2847 chars
[Magic Map] Playbook ID: "abc-123-def"
[Magic Map] Create process response: { status: 200, success: true, processId: "xyz-789" }
[Magic Map] ✅ Process created successfully: xyz-789
```

---

## 🔍 Debugging Scenarios

### Scenario 1: Generation Fails Immediately
**Look for**:
```
[Magic Map] ❌ Generation failed: "error message"
```
**Common Causes**:
- OpenAI API key missing/invalid
- Auto-layout failed (invalid BPMN structure)
- Network timeout

### Scenario 2: No Response from API
**Look for**:
```
[Magic Map] 📤 Sending to API: ...
(nothing after this)
```
**Cause**: API route not responding
**Check**: Network tab for 500 error details

### Scenario 3: XML Generated but Invalid
**Look for**:
```
[Magic Map] 📋 Response data: { valid: false, hasXml: true }
```
**Cause**: Auto-layout rejected the XML
**Check**: XML preview in logs to see structure

### Scenario 4: Process Creation Fails
**Look for**:
```
[Magic Map] ❌ Process creation failed: "error message"
```
**Common Causes**:
- Database connection issue
- Playbook doesn't exist
- Missing processId

---

## 🎯 Performance Benchmarks

**Good**:
- Generation: < 8000ms
- Enhancement: < 3000ms
- Process creation: < 2000ms

**Acceptable**:
- Generation: < 12000ms
- Enhancement: < 5000ms
- Process creation: < 3000ms

**Bad (investigate)**:
- Generation: > 15000ms
- Enhancement: > 8000ms
- Process creation: > 5000ms

---

## 🛠️ How to Use

1. **Open DevTools**: F12 or Right-click → Inspect
2. **Go to Console tab**
3. **Filter logs**: Type "Magic Map" in filter box (top of console)
4. **Clear console**: Click trash icon to start fresh
5. **Try generation**: Use example prompt or type your own
6. **Watch logs appear**: See each step of the process
7. **Expand objects**: Click triangles to see full details

---

## 💡 Pro Tips

**Tip 1: Group Logs**
- Each feature (generate/enhance/create) has its own emoji
- 🚀 = Generation, ✨ = Enhancement, 💾 = Creation

**Tip 2: Check Network Tab Too**
- Console shows client-side flow
- Network tab shows full request/response bodies
- Click on failed requests to see server errors

**Tip 3: Performance Monitoring**
- Total time logged at end of generation
- Use to identify slow API responses
- Target: < 8 seconds end-to-end

**Tip 4: Error Details**
- ❌ = Expected error (show user)
- 💥 = Unexpected error (bug)
- Stack traces shown for unexpected errors

---

## 🚨 Quick Troubleshooting

**Problem**: No logs at all
- Check filter (should be "Magic Map" not case-sensitive)
- Check console isn't cleared on navigation
- Try clearing and regenerating

**Problem**: Logs stop mid-flow
- Check Network tab for failed request
- Look for red errors in console (non-Magic Map)
- Check terminal for server crash

**Problem**: Success logs but no diagram
- Check `hasXml: true` in response data
- Look at XML preview - should start with `<?xml`
- Check if DiagramPreview component rendering

---

## 📋 Expected Happy Path

```
1. [Magic Map] 🚀 Generation started
2. [Magic Map] Prompt: ...
3. [Magic Map] 📤 Sending to API: ...
4. [Magic Map] 📥 API response received (status: 200, ~5s)
5. [Magic Map] 📋 Response data: (valid: true, hasXml: true)
6. [Magic Map] ✅ Success! XML preview
7. [Magic Map] 🎉 Total generation time: ~5000ms

(User clicks diagram)

8. (User clicks "Create as New Process")
9. [Magic Map] 💾 Process creation started
10. [Magic Map] Create process response: (success: true)
11. [Magic Map] ✅ Process created successfully
```

**If any step missing**: That's where the bug is!

---

**Filter Command**: Type this in console filter box
```
Magic Map
```

**Clear All Logs**: Ctrl+L or click trash icon

**Save Logs**: Right-click → Save as...
