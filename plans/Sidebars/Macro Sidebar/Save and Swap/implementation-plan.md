# Save & Swap Architecture - Implementation Plan

**Feature:** Fast, reliable process switching with background sync  
**Priority:** 🔴 Critical (Demo blocker)  
**Estimated Time:** 55 minutes  
**Created:** Jan 13, 2026

---

## 📋 Feature Requirements

| # | Requirement | Success Criteria |
|---|-------------|------------------|
| 1 | Save before switch | XML persisted before loading new process |
| 2 | Seamless & smooth | Switch feels instant (<500ms perceived) |
| 3 | No data loss | Documentation, parameters, diagram intact |
| 4 | Visual feedback | Shimmer effects, save indicator |

---

## 🏗️ Architecture: XML-First + Background Sync

### Core Principle
**XML is the source of truth.** Node records are derived data for convenience.

### Flow Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                 USER CLICKS PROCESS B                        │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  IMMEDIATE (0ms)                                             │
│  • Sidebar: B starts shining                                │
│  • Modeler: Light frost overlay + shimmer                   │
│  • Save button: "Saving..."                                 │
│  • Set mutex: isSwitching = true                            │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: Quick Save A (~100ms)                             │
│  • Cancel any pending background sync for A                 │
│  • saveXmlOnly(processA) → 1 API call                       │
│  • ProcessAPI.patch(processA.id, { bpmnXml: xml })          │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: Load Process B (~200ms)                           │
│  • ProcessAPI.getById(B) → fetch XML                        │
│  • NodeAPI.getByProcess(B) → fetch nodes                    │
│  • Import XML into BPMN.js modeler                          │
│  • Update state: processId, processName, nodes              │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 3: Cleanup                                           │
│  • Remove overlay, stop shimmer                             │
│  • Save button: back to normal                              │
│  • Set mutex: isSwitching = false                           │
│  • Queue background sync for A (2s delay)                   │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 4: Background Sync A (NON-BLOCKING)                  │
│  • Wait 2 seconds (cancellable)                             │
│  • If not cancelled: syncNodesForProcess(A)                 │
│  • Silent success/failure (no UI)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🐛 Bugs to Fix

### Bug 1: Stale Callback Reference
**Location:** `src/components/BpmnModeler.tsx:264-268`  
**Problem:** `useImperativeHandle` missing `onSave` in dependencies  
**Solution:** Use ref pattern for callbacks

```
Current (broken):
useImperativeHandle(ref, () => ({
  saveDiagram,
}), [modeler, selectedElement, selectedElementDbInfo]); // Missing onSave!

Fixed:
- Add onSaveRef = useRef(onSave)
- Update ref in useEffect when onSave changes
- saveDiagram calls onSaveRef.current() instead of onSave()
```

### Bug 2: Heavy Save Blocking UI
**Location:** `src/app/modeler/useModeler.tsx:530-680`  
**Problem:** `handleSaveSuccess` makes N API calls synchronously  
**Solution:** Split into quick save + background sync

---

## 📁 Files to Modify

| File | Changes |
|------|---------|
| `src/components/BpmnModeler.tsx` | Add ref pattern for callbacks, add `saveXmlOnly()` method |
| `src/app/modeler/useModeler.tsx` | Split save functions, add background sync queue |
| `src/app/modeler/page.tsx` | Update overlay styling |
| `src/app/modeler/page.module.css` | Add frost overlay + shimmer styles |

---

## 🔧 Implementation Phases

### Phase 1: Fix Stale Callback (10 min) ✅ COMPLETE
**File:** `src/components/BpmnModeler.tsx`

**Tasks:**
- [x] Add `onSaveRef = useRef(onSave)` and `onErrorRef = useRef(onError)`
- [x] Add `useEffect` to update refs when props change
- [x] Update `saveDiagram()` to call `onSaveRef.current()` instead of `onSave()`
- [x] Add `getXml()` method for quick saves (returns XML without callbacks)
- [x] Add `getDiagramElements()` method for background sync
- [x] Update `useImperativeHandle` with new methods and correct dependencies

**Why:** Ensures callback is always fresh, not stale from initial render.

---

### Phase 2: Create saveXmlOnly() Function (10 min) ✅ COMPLETE
**File:** `src/app/modeler/useModeler.tsx`

**Tasks:**
- [x] Create `saveXmlOnly(processId: string, xml: string)` function
- [x] Single API call: `ProcessAPI.patch(processId, { bpmnXml: xml })`
- [x] Update local state: `setProcesses(prev => ...)`
- [x] Return promise for await
- [x] No node syncing, no sidebar refresh
- [x] Added console logging for timing/debugging
- [x] Exported from hook

**API:**
```typescript
const saveXmlOnly = async (targetProcessId: string, xml: string): Promise<void>
```

---

### Phase 3: Create Background Sync with Cancellation (15 min) ✅ COMPLETE
**File:** `src/app/modeler/useModeler.tsx`

**Tasks:**
- [x] Create `PendingSync` interface with processId, timeoutId, cancel function
- [x] Create `pendingSyncRef = useRef<PendingSync | null>(null)`
- [x] Create `cancelPendingSync(reason: string)` helper function
- [x] Create `syncNodesInBackground(processId: string, diagramElements: any[])` function
- [x] Implement 2-second delay before sync starts
- [x] Use closure-based cancellation pattern with `isCancelled` flag
- [x] On cancel: clear timeout, skip sync operations
- [x] On success: silent (console log only)
- [x] On error: silent (console log only)
- [x] Added cleanup effect to cancel pending sync on unmount
- [x] Exported both functions

**Cancellation Logic:**
```
When switching to process X:
1. If pendingSyncRef.current exists AND pendingSyncRef.current.processId === X
   → Cancel it (we're loading X fresh anyway)
2. Queue new background sync for the process we're leaving
```

---

### Phase 4: Update Switch Flow (10 min) ✅ COMPLETE
**File:** `src/app/modeler/useModeler.tsx`

**Tasks:**
- [x] Refactor `handleSidebarProcessSelect()`:
  - [x] Cancel pending sync if returning to same process
  - [x] Get XML from modeler: `modelerRef.current.getXml()`
  - [x] Get diagram elements: `modelerRef.current.getDiagramElements()`
  - [x] Call `saveXmlOnly()` (fast, ~100ms)
  - [x] Load new process
  - [x] Queue background sync for old process
- [x] Removed the heavy `saveDiagram()` call from switch flow
- [x] Kept `handleSaveSuccess` for manual "Save" button (full sync)

**New Flow (Implemented):**
```typescript
handleSidebarProcessSelect = async (targetId) => {
  // Phase 1: Quick save current (XML only)
  const xml = await modelerRef.current.getXml();
  const elements = modelerRef.current.getDiagramElements();
  await saveXmlOnly(previousProcessId, xml);
  
  // Phase 2: Load new process
  const process = await ProcessAPI.getById(targetId);
  setProcessId(process.id);
  // ... load nodes, update state
  
  // Phase 3: Queue background sync (non-blocking, 2s delay)
  syncNodesInBackground(previousProcessId, elements);
}
```

---

### Phase 5: Update UI (10 min) ✅ COMPLETE
**Files:** `src/app/modeler/page.tsx`, `src/app/modeler/page.module.css`

**Tasks:**
- [x] Update overlay from dark (0.3 opacity) to light frost with gradient
- [x] Add shimmer animation with golden highlight sweep
- [x] Remove centered spinner/text from overlay
- [x] Keep save button "Saving..." indicator

**CSS Changes (Implemented):**
```css
.savingOverlay {
  background: linear-gradient(
    110deg,
    rgba(255, 255, 255, 0.6) 0%,
    rgba(255, 255, 255, 0.8) 40%,
    rgba(254, 200, 114, 0.15) 50%,  /* Gold highlight */
    rgba(255, 255, 255, 0.8) 60%,
    rgba(255, 255, 255, 0.6) 100%
  );
  background-size: 200% 100%;
  animation: overlayShimmer 1.5s ease-in-out infinite;
  backdrop-filter: blur(1px);
}
```

---

## 🧪 Test Scenarios

### Manual Test Checklist

| # | Test | Expected Result |
|---|------|-----------------|
| 1 | Switch A→B | A saves (<500ms), B loads, smooth |
| 2 | Switch A→B→C quickly | A saves, B saves, C loads |
| 3 | Switch A→B→A quickly | A saves, B saves (or cancelled), A loads fresh |
| 4 | Add node, switch, switch back | Node persists (in XML) |
| 5 | Add documentation, switch, switch back | Documentation persists |
| 6 | Add parameters, switch, switch back | Parameters persist |

### Console Logs to Verify

```
[QUICK-SAVE] 💾 Saving XML for: process-A (2984 bytes)
[QUICK-SAVE] ✅ XML saved in 87ms
[SWITCH] 📂 Loading process: process-B
[SWITCH] ✅ Process loaded in 156ms
[BACKGROUND-SYNC] 🔄 Queued sync for: process-A (2s delay)
[BACKGROUND-SYNC] ✅ Sync complete for: process-A
```

---

## 🛡️ Data Safety Guarantees

| Data Type | Storage | Safety |
|-----------|---------|--------|
| Diagram layout | `Process.bpmnXml` | ✅ Saved in quick save |
| Node positions | `Process.bpmnXml` | ✅ Saved in quick save |
| Node names | `Process.bpmnXml` + `Node.name` | ✅ XML has it, DB synced later |
| Documentation | `Node.documentContent` | ✅ Untouched by sync |
| Parameters | `Node.documentContent` | ✅ Untouched by sync |

**Key insight:** `documentContent` is linked by `bpmnId`, not database ID. As long as the bpmnId exists in XML, the data is recoverable.

---

## 🚨 Edge Cases Handled

| Edge Case | Handling |
|-----------|----------|
| User clicks during switch | Mutex blocks, click ignored |
| Background sync fails | Silent fail, XML is source of truth |
| User returns before sync completes | Cancel pending sync, load fresh XML |
| Network error during quick save | Show error, don't proceed with switch |
| Modeler not initialized | Early return, show error |

---

## 📊 Performance Targets

| Metric | Before | After |
|--------|--------|-------|
| Switch time (perceived) | 30-60s | <500ms |
| API calls (blocking) | 8-12 | 2 |
| API calls (total) | 8-12 | 2 + N (background) |
| User blocking | Full duration | ~300ms |

---

## ✅ Acceptance Criteria

- [ ] Switch between processes completes in <500ms perceived time
- [ ] No data loss for diagrams, documentation, or parameters
- [ ] Visual feedback (shimmer) during switch
- [ ] No console errors during switch
- [ ] Background sync completes silently
- [ ] Rapid switching (A→B→A) works without bugs
