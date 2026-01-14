# Save & Swap Issues Log

## Test 1: Switch A→B

### Issue 1.1: Slow Quick Save (2223ms)
- **Target:** <500ms for XML-only save
- **Actual:** 2223ms
- **Location:** `useModeler.tsx:saveXmlOnly()`
- **Cause:** Network latency to Supabase (cold start or slow connection)
- **Impact:** ⚠️ Medium - User waits ~2s with frost overlay
- **Demo Critical:** No (functional, just slower than ideal)

### Issue 1.2: Double Effect Triggers (Race Condition)
- **Symptom:** BpmnModeler effect fires multiple times during switch with stale state
- **Location:** `BpmnModeler.tsx` useEffect with `[processId, bpmnXml, processes, nodes]` deps
- **Logs:** "Setting up database integration" spam (8+ times), wrong node counts initially
- **Cause:** `setProcessId` and `setNodes` called separately → multiple re-renders → effect fires before state settles
- **Impact:** ⚠️ Medium - Extra work, console noise, potential stale data
- **Demo Critical:** No (doesn't break functionality, just inefficient)

### Issue 1.3: Nodes Array Mismatch During Transition
- **Symptom:** Effect sees 5 nodes (from Process A) when loading Process B (has 4 nodes)
- **Location:** `BpmnModeler.tsx` effect and `useModeler.tsx` state updates
- **Cause:** State not batched - `nodes` still contains old process data when effect runs
- **Impact:** ⚠️ Low - Eventually corrects itself when new nodes load
- **Demo Critical:** No (self-correcting)

---

## Test 2: Switch A→B→C Quickly

### Issue 2.1: Cancellation Logic Partially Broken
- **Symptom:** Background sync says "cancelled" but old sync completes anyway, then "cancelled" sync also completes
- **Location:** `useModeler.tsx:syncNodesInBackground()` - AbortController pattern
- **Logs:** 
  - `🚀 Starting sync for: B`
  - `⏭️ Cancelled during sync` (for B)
  - `💾 SAVE COMPLETE for: A` (old sync finishes!)
  - `✅ Sync complete for: B (18663ms)` (cancelled sync finishes!)
- **Cause:** `AbortController` signal not properly propagating to all async operations in sync chain
- **Impact:** ⚠️ Medium - Confusing logs, potential race conditions, wasted API calls
- **Demo Critical:** No (doesn't break functionality, happens silently)

### Issue 2.2: Background Sync Extremely Slow (18.6 seconds)
- **Target:** <5s background operation
- **Actual:** 18663ms (18.6 seconds)
- **Location:** `useModeler.tsx:handleSaveSuccess()` - node sync logic
- **Cause:** **N+1 Query Anti-Pattern**
  - Loops through each canvas element (5 nodes)
  - For EACH element, calls `NodeAPI.getByProcess()` to fetch all DB nodes
  - Fetches same data 5+ times, then creates/updates nodes individually
  - Should fetch once, build Map for lookups
- **Impact:** 🔴 High - 18s wasted on background operation, potential timeout
- **Demo Critical:** ⚠️ Maybe (happens in background but very inefficient, shows poor code quality)

### Issue 2.3: Quick Saves Still Slow (1.6-2.3s)
- **Target:** <500ms for XML-only save
- **Actual:** A→B: 1647ms, B→C: 2275ms
- **Location:** `useModeler.tsx:saveXmlOnly()`
- **Cause:** Network latency to Supabase (consistent with Test 1)
- **Impact:** ⚠️ Medium - User waits 1.6-2.3s with frost overlay each switch
- **Demo Critical:** ⚠️ Maybe (feels sluggish, but functional)

### Issue 2.4: Extra Manual Save Triggered
- **Symptom:** After switch sequence, manual save fires → re-imports XML → more database setup spam
- **Location:** Likely 15-second auto-save or user clicked save
- **Cause:** Auto-save timer or user action
- **Impact:** ⚠️ Low - Extra work but self-correcting
- **Demo Critical:** No (normal operation)

---

## Test 3: Switch A→B→A Quickly (Cancellation Test)
_Pending test..._

---

## Test 4: Node Persistence (Add node, switch, switch back)
_Pending test..._

---

## Test 5: Documentation Persistence
_Pending test..._

---

## Test 6: Parameters Persistence
_Pending test..._

---

## Summary

| Issue | Severity | Demo Critical | Status |
|-------|----------|---------------|--------|
| 1.1: Slow save (2223ms) | Medium | ❌ No | Documented |
| 1.2: Double effects | Medium | ❌ No | Documented |
| 1.3: Stale nodes array | Low | ❌ No | Documented |
| 2.1: Cancellation broken | Medium | ❌ No | Documented |
| 2.2: 18.6s background sync (N+1) | High | ⚠️ Maybe | Documented |
| 2.3: Slow saves (1.6-2.3s) | Medium | ⚠️ Maybe | Documented |
| 2.4: Extra manual save | Low | ❌ No | Documented |

### Recommended Fixes for Demo

**HIGH PRIORITY (Easy Win):**
- **Issue 2.2:** Fix N+1 query - fetch nodes once, use Map for lookups (~15 min fix, massive performance gain)

**MEDIUM PRIORITY (If Time):**
- **Issue 2.1:** Fix AbortController propagation to properly cancel in-flight syncs (~20 min)
- **Issues 1.1/2.3:** Add optimistic updates or local caching to reduce perceived latency (~30+ min)

**LOW PRIORITY (Skip for Demo):**
- Issues 1.2, 1.3, 2.4: Console noise only, no functional impact

