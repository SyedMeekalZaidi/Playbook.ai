# Implementation Plan: Macro Sidebar Simplification

## Overview

Simplify the left sidebar from a complex process+node tree to a clean process-only list. Clicking a process loads it into the modeler. This improves navigation UX and removes unnecessary complexity while setting up the architecture for future sub-process nesting.

**Key Decisions:**
- Remove node display entirely (diagram IS the visualization)
- Use Lucide icons for professional appearance (FileText for processes)
- Add "New Process" button for quick creation workflow
- Leverage existing auto-save (15-sec interval) when switching processes

---

## Phase 1: Simplify Context & Data Flow
**Goal:** Remove node fetching and expand/collapse logic from context

**Files:** 
- `src/components/ProcessTreeContext.tsx`

**Tasks:**
1. [ ] Remove `nodes` state variable
2. [ ] Remove `expandedProcesses` state and `toggleProcessExpand` function
3. [ ] Remove node API fetch (`/api/playbooks/${playbookId}/nodes`)
4. [ ] Keep only: `processes`, `activeItemId`, `fetchTreeData`, `setActiveItem`
5. [ ] Update TypeScript interfaces to remove node references

**Test:** Context compiles without errors, no node-related exports

---

## Phase 2: Rebuild ProcessTree Component
**Goal:** Clean, flat process list with icons and active state

**Files:**
- `src/components/ProcessTree.tsx`

**Tasks:**
1. [ ] Remove all node rendering code (`renderProcessTree`, `getNodeIcon`, etc.)
2. [ ] Remove expand/collapse UI elements
3. [ ] Import `FileText` icon from `lucide-react`
4. [ ] Create simple process list render:
   - FileText icon (16x16, text-oxford-blue)
   - Process name with truncation
   - Active state: gold left border + light gold background
5. [ ] Single click on process calls `onSelectProcess(processId)`
6. [ ] Update props interface: add `currentProcessId` for active highlighting
7. [ ] Add empty state: "No processes yet. Create one to get started."

**Test:** Sidebar shows flat list, clicking logs process ID, active state visible

---

## Phase 3: Add New Process Button
**Goal:** Quick action to create new process without modal hunting

**Files:**
- `src/components/EnhancedSidebar.tsx`

**Tasks:**
1. [ ] Import `Plus` icon from `lucide-react`
2. [ ] Add `onNewProcess` callback prop
3. [ ] Add "New Process" button below playbook selector
   - Style: Outline button, full width, oxford-blue text
   - Icon: Plus icon left-aligned
4. [ ] Add `currentProcessId` prop to pass to ProcessTree

**Test:** Button renders, clicking triggers callback

---

## Phase 4: Wire Up Modeler Page
**Goal:** Connect sidebar interactions to modeler state

**Files:**
- `src/app/modeler/page.tsx`
- `src/app/modeler/useModeler.tsx`

**Tasks:**
1. [ ] Create `handleSidebarProcessSelect(processId)` in useModeler:
   - Set `selectedExistingProcess` to processId
   - Call existing `handleLoadExistingProcess()` logic
2. [ ] Create `handleNewProcessFromSidebar()` in useModeler:
   - Set `showNameDialog(true)`
   - Set `activeTab('new')`
3. [ ] Pass handlers to EnhancedSidebar:
   - `onSelectProcess={handleSidebarProcessSelect}`
   - `onNewProcess={handleNewProcessFromSidebar}`
4. [ ] Pass `currentProcessId={processId}` to EnhancedSidebar

**Test:** Click process in sidebar → loads into modeler, click New → opens modal

---

## Phase 5: Clean Up CSS
**Goal:** Remove unused node styles, enhance process item styling

**Files:**
- `src/components/SideBar.css`

**Tasks:**
1. [ ] Remove `.node-item` styles
2. [ ] Remove `.nested-list` styles  
3. [ ] Remove `.node-icon`, `.node-name` styles
4. [ ] Remove tree structure line styles (::before, ::after)
5. [ ] Keep/enhance `.sidebar-item` for process list
6. [ ] Ensure `.sidebar-item.active` has gold accent styling

**Test:** No visual regressions, active state clearly visible

---

## Demo Considerations
- [ ] Process switch works in <2 seconds
- [ ] No console errors on sidebar interactions
- [ ] Auto-save triggers before loading new process (via 15-sec interval)
- [ ] Empty state shows gracefully for new playbooks
- [ ] Active process always visually highlighted

---

## Time Estimate
| Phase | Time |
|-------|------|
| Phase 1: Context | 10 min |
| Phase 2: ProcessTree | 20 min |
| Phase 3: New Button | 10 min |
| Phase 4: Wire Up | 15 min |
| Phase 5: CSS | 5 min |
| **Total** | **~1 hour** |
