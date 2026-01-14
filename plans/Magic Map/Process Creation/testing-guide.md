# Magic Map Testing Guide

**Status**: Ready for Testing  
**Last Updated**: Phase 7 Implementation  
**Time Required**: ~30 minutes for full test suite

---

## ⚡ Quick Pre-Test Setup

### 1. Environment Variables
Ensure `.env.local` contains:
```
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 2. Development Server
```bash
npm run dev
```

### 3. Open Browser DevTools
- Console tab (watch for errors)
- Network tab (monitor API calls)
- Performance tab (optional - check FPS)

---

## ✅ Phase 7 Testing Checklist

### Test 1: Happy Path (CRITICAL)
**Expected Time**: <20 seconds total

**Steps**:
1. ✅ Navigate to modeler page
2. ✅ Select a playbook (or create new)
3. ✅ Click "AI Magic Map" tab (right sidebar)
4. ✅ Verify welcome message appears with:
   - Glowing sparkles icon
   - 3 example prompt buttons
   - "Try these examples" text
5. ✅ Type in input: "Simple patient registration process"
6. ✅ Click "Send" button
7. ✅ Verify thinking animation appears:
   - 3 bouncing gold dots
   - "Creating your diagram..." text
8. ✅ Wait ~3-8 seconds for generation
9. ✅ Verify assistant message appears with:
   - AI avatar (gold sparkles)
   - Success message text
   - Diagram preview (280x180px)
10. ✅ Hover over diagram → verify "Expand" tooltip appears
11. ✅ Click diagram preview
12. ✅ Verify modal opens with:
    - Larger diagram (~60vh height)
    - "Create as New Process" button
13. ✅ Click "Create as New Process"
14. ✅ Verify form animates in (smooth height expand)
15. ✅ Type process name: "Test Magic Map Process"
16. ✅ Press Enter (or click Confirm)
17. ✅ Verify:
    - Success indicator appears (green checkmark)
    - Modal closes after ~1 second
    - Left sidebar refreshes and shows new process
    - Diagram loads in center modeler
    - Can click and edit nodes

**Pass Criteria**: All steps work smoothly, <12s from creation to editable

---

### Test 2: Follow-up Modifications
**Purpose**: Test conversation memory and follow-up requests

**Steps**:
1. ✅ Generate initial diagram (Test 1, steps 1-9)
2. ✅ Type: "Add a notification step at the end"
3. ✅ Send message
4. ✅ Verify:
   - Previous diagram still visible in chat
   - New diagram appears below
   - New diagram has additional node
5. ✅ Can create either diagram as process

**Pass Criteria**: AI uses context, both diagrams visible, new diagram is different

---

### Test 3: Example Prompts
**Purpose**: Verify pre-baked examples work

**Steps**:
1. ✅ Click "Start Fresh" button (top right)
2. ✅ Verify chat clears to welcome message
3. ✅ Click Example 1: "Patient registration..."
4. ✅ Verify:
   - Message sends automatically (no typing needed)
   - Diagram generates successfully
   - Has ~3-4 nodes minimum
5. ✅ Click "Start Fresh" again
6. ✅ Repeat for Example 2 (cancer screening)
7. ✅ Repeat for Example 3 (site assessment)

**Pass Criteria**: All 3 examples generate valid diagrams

---

### Test 4: Magic Prompt Enhancement
**Purpose**: Test prompt enhancement feature

**Steps**:
1. ✅ Type vague prompt: "patient visit"
2. ✅ Click "✨ Enhance" button
3. ✅ Verify:
   - Button shows "Enhancing..." with spinner
   - After ~2-3s, enhanced text appears IN input field
   - Text is more detailed than original
4. ✅ Verify can edit enhanced text before sending
5. ✅ Click Send
6. ✅ Verify diagram generates successfully

**Pass Criteria**: Enhancement works, text is editable, generates valid diagram

---

### Test 5: Message Limit
**Purpose**: Verify 5-message limit and Start Fresh

**Steps**:
1. ✅ Send 5 messages (can be quick, e.g., "test 1", "test 2", etc.)
2. ✅ After 5th user message, verify:
   - Input field is greyed out
   - Send button is disabled
   - Message shows: "For accurate diagram creation, please start a new chat"
   - "(5 message limit reached)" text visible
3. ✅ Click "Start Fresh"
4. ✅ Verify:
   - Chat clears to welcome
   - Input enabled again
   - Can send messages

**Pass Criteria**: Limit enforced, clear message, Start Fresh resets

---

### Test 6: Error Handling
**Purpose**: Test graceful degradation

**Steps**:
1. ✅ **Invalid Prompt Test**:
   - Type: "asdfasdf" or gibberish
   - Send
   - Verify: Friendly error message appears
   - Verify: Can retry with valid prompt
2. ✅ **Network Error Test** (optional):
   - Open DevTools → Network tab
   - Set throttling to "Offline"
   - Try to generate
   - Verify: Error message mentions connection
   - Re-enable network
   - Verify: Retry works

**Pass Criteria**: No raw errors shown, helpful messages, retry works

---

### Test 7: Animation Quality
**Purpose**: Verify smooth 60fps animations

**Animations to Check**:
1. ✅ Message appear: Fade-in + slide (user from right, AI from left)
2. ✅ Thinking dots: Smooth bounce (staggered timing)
3. ✅ Diagram preview: No jank when appearing
4. ✅ Modal open/close: Smooth zoom animation
5. ✅ Form reveal in modal: Smooth height expand
6. ✅ Success indicator: Clean fade-in + scale

**Pass Criteria**: All smooth, no stuttering or layout shifts

---

### Test 8: Console Error Check
**Purpose**: Ensure no runtime errors

**Steps**:
1. ✅ Open DevTools Console
2. ✅ Clear console
3. ✅ Run through Test 1 (Happy Path)
4. ✅ Check console:
   - ❌ No red errors
   - ⚠️ Warnings acceptable (React DevTools, etc.)
   - ✅ Debug logs OK (e.g., "[Magic Map] ...")

**Pass Criteria**: Zero red errors during happy path

---

### Test 9: Tab Persistence
**Purpose**: Verify chat survives tab switching

**Steps**:
1. ✅ Generate a diagram in AI Magic Map tab
2. ✅ Click "Node Editor" tab
3. ✅ Wait 2 seconds
4. ✅ Click back to "AI Magic Map" tab
5. ✅ Verify:
   - Chat history still visible
   - Diagram still there
   - Can continue conversation

**Pass Criteria**: Chat state persists, no data loss

---

### Test 10: Edge Cases

**A. Long Process Name**:
1. ✅ Generate diagram
2. ✅ Try to create with 100+ character name
3. ✅ Verify: Handles gracefully (no overflow/breaks)

**B. Special Characters in Name**:
1. ✅ Try name: "Test's Process & Diagram #1"
2. ✅ Verify: Creates successfully, no XML errors

**C. Rapid Switching**:
1. ✅ Generate diagram
2. ✅ Immediately switch to Node Editor before generation completes
3. ✅ Switch back to AI Magic Map
4. ✅ Verify: Completes without crash

**Pass Criteria**: No crashes, graceful handling

---

## 🚀 Performance Benchmarks

| Action | Target | Acceptable | Failure |
|--------|--------|-----------|---------|
| Diagram Generation | <5s | <8s | >10s |
| Process Creation | <3s | <5s | >8s |
| Total (Gen + Create) | <8s | <12s | >15s |
| Chat Input Lag | 0ms | <50ms | >100ms |
| Animation FPS | 60fps | 55fps | <50fps |

**How to Measure**:
- Browser Network tab: Check API response times
- Performance tab: Record while testing
- Subjective: Does it feel fast/smooth?

---

## 🐛 Known Issues (Acceptable for Demo)

1. **Auto-layout limitations**:
   - Very complex diagrams (>20 nodes) may have overlapping
   - Mitigation: Demo uses simple examples (<10 nodes)

2. **OpenAI rate limits**:
   - Free tier may be slow during peak times
   - Mitigation: Demo during off-peak hours

3. **First load slow**:
   - Cold start on Vercel free tier ~2-3s
   - Mitigation: Pre-warm by visiting before demo

---

## 📋 Pre-Demo Checklist

### 1 Day Before Demo:
- [ ] Run full test suite (Tests 1-10)
- [ ] Deploy to Vercel, test on production
- [ ] Create 2 sample playbooks with processes
- [ ] Verify OPENAI_API_KEY has credits
- [ ] Test on clean browser (incognito)

### 1 Hour Before Demo:
- [ ] Clear browser cache
- [ ] Pre-warm production site (visit once)
- [ ] Prepare 3 demo prompts in notepad
- [ ] Have backup screenshots ready

### During Demo:
- [ ] Use Example Prompts (most reliable)
- [ ] If generation fails, say "Let me try another" and use fallback
- [ ] Focus on the flow, not specific diagram accuracy

---

## 🎯 Success Metrics

**MVP Success** (Must Have):
- ✅ Can generate simple diagram (<10 nodes)
- ✅ Can create process and load in modeler
- ✅ No crashes or error modals
- ✅ Animations work smoothly
- ✅ Total flow <15 seconds

**Demo Success** (Nice to Have):
- ✅ All 3 example prompts work
- ✅ Follow-up modification works
- ✅ Enhance prompt works
- ✅ <12 seconds total time

**Wow Factor** (Exceeds Expectations):
- ✅ Complex diagram with gateways
- ✅ <8 seconds total time
- ✅ Zero console errors
- ✅ Smooth animations throughout

---

## 🔧 Troubleshooting

### Issue: Generation takes >10s
**Causes**: OpenAI API slow, complex prompt  
**Fix**: Use simpler prompt, try again  
**Prevention**: Use example prompts in demo

### Issue: "Invalid XML" error
**Causes**: AI generated malformed BPMN, auto-layout failed  
**Fix**: Retry automatically happens (1 retry)  
**Prevention**: Should be rare with good prompts

### Issue: Diagram doesn't appear in modeler
**Causes**: Database save failed, sidebar didn't refresh  
**Fix**: Refresh page, check console for errors  
**Prevention**: Test database connection before demo

### Issue: Modal doesn't close after creation
**Causes**: API returned success but JS error  
**Fix**: Check console, manually close modal  
**Prevention**: Test happy path multiple times

---

## 📝 Testing Notes Template

**Date**: ____________  
**Tester**: ____________  
**Environment**: □ Local  □ Vercel  
**Browser**: ____________

| Test # | Status | Time | Notes |
|--------|--------|------|-------|
| 1. Happy Path | ⬜ | ___s | |
| 2. Follow-up | ⬜ | ___s | |
| 3. Examples | ⬜ | ___s | |
| 4. Enhance | ⬜ | ___s | |
| 5. Limit | ⬜ | ___s | |
| 6. Errors | ⬜ | ___s | |
| 7. Animations | ⬜ | ___s | |
| 8. Console | ⬜ | ___s | |
| 9. Persistence | ⬜ | ___s | |
| 10. Edge Cases | ⬜ | ___s | |

**Overall Pass**: ⬜ YES  ⬜ NO  
**Ready for Demo**: ⬜ YES  ⬜ NO  
**Blocker Issues**: _________________________
