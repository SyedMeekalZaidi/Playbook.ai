# Implementation Plan: Micro Sidebar (Node Details Panel)

## Overview

Build a right sidebar for viewing/editing node documentation and process parameters. Uses **Tiptap** for rich text (modern, React-native, Shadcn-compatible). Two main tabs at top: **Node Editor** and **AI Magic Map**. Node Editor has Edit/Preview toggle for documentation and parameter management.

---

## Critical Analysis (Pre-Implementation Review)

### ✅ What's Already In Place
| Component | Status | Notes |
|-----------|--------|-------|
| `Node.documentContent` (Json) | ✅ Exists | Can store Tiptap HTML + parameters |
| `NodeAPI.update()` | ✅ Works | Accepts `documentContent` field |
| `selectedElement.databaseInfo` | ✅ Works | Returns full Node object |
| `/api/processes/[processId]/nodes` | ✅ Works | Includes ProcessParameter |
| Shadcn Tabs component | ✅ Ready | In `src/components/ui/tabs.tsx` |

### 🔄 Key Architectural Decision: Simplified Storage

**Problem:** ProcessParameter model schema doesn't support SCALE/NUMBER config (min/max/unit).

**Solution:** Store documentation AND parameters in Node's `documentContent` Json field:
```json
{
  "documentation": "<p>Tiptap HTML content</p>",
  "parameters": [
    { "id": "...", "type": "CHECKLIST", "question": "...", "options": [...] },
    { "id": "...", "type": "SCALE", "question": "...", "min": 1, "max": 10, "unit": "Hours" },
    { "id": "...", "type": "NUMBER", "question": "...", "min": 0, "current": 10 }
  ]
}
```

**Benefits:**
- ✅ No schema changes needed
- ✅ Single API call to save
- ✅ Full flexibility for parameter config
- ✅ Easy to migrate to proper schema later

**Trade-off:** Parameters won't be queryable at DB level (acceptable for demo).

---

## Data Flow Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    NODE SELECTION                          │
├────────────────────────────────────────────────────────────┤
│  User clicks node on canvas                                │
│         ↓                                                  │
│  DatabaseIntegration fires 'database.element.selected'     │
│         ↓                                                  │
│  BpmnModeler calls onElementSelect(element, databaseInfo)  │
│         ↓                                                  │
│  useModeler updates selectedElement state                  │
│         ↓                                                  │
│  NodeDetailsPanel receives selectedElement                 │
│         ↓                                                  │
│  useNodeDetails extracts documentContent from databaseInfo │
│         ↓                                                  │
│  Local state populated with documentation + parameters     │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                    AUTO-SAVE FLOW                          │
├────────────────────────────────────────────────────────────┤
│  User edits documentation or parameters                    │
│         ↓                                                  │
│  Local state updates, isDirty = true                       │
│         ↓                                                  │
│  Debounce timer starts (3 seconds)                         │
│         ↓                                                  │
│  [3 seconds pass with no edits]                            │
│         ↓                                                  │
│  saveNodeDetails() called:                                 │
│    - Build documentContent: { documentation, parameters }  │
│    - Call NodeAPI.update({ id, documentContent })          │
│    - Show "✓ Saved" indicator                              │
│    - isDirty = false                                       │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                 NODE SWITCH FLOW                           │
├────────────────────────────────────────────────────────────┤
│  User clicks different node                                │
│         ↓                                                  │
│  [Check if isDirty === true]                               │
│         ↓ YES                                              │
│  saveNodeDetails() for PREVIOUS node                       │
│         ↓                                                  │
│  [Wait for save to complete]                               │
│         ↓                                                  │
│  Load new node's documentContent                           │
│         ↓                                                  │
│  Reset local state with new data                           │
└────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Layout & Tab Structure
**Goal:** Add right sidebar column with tab navigation  
**Time:** 30 min

**Files:**
- `src/app/modeler/page.module.css`
- `src/app/modeler/page.tsx`
- `src/components/modeler/NodeDetailsPanel.tsx` (new)

**Tasks:**
1. [ ] Add `.rightSidebarColumn` CSS:
   - Width: 360px (slightly wider for comfortable editing)
   - Height: 100% of modeler area
   - Background: bg-surface-muted
   - Border-left: 1px solid border
   - Overflow-y: auto
2. [ ] Update `.modelerLayoutRow` to accommodate 3 columns
3. [ ] Create `NodeDetailsPanel.tsx` shell:
   - Accept `selectedElement` prop
   - Render tabs at TOP using Shadcn Tabs
   - Tab 1: "Node Editor" (with FileText icon)
   - Tab 2: "AI Magic Map" (with Sparkles icon)
4. [ ] Show empty state when no node selected:
   - Centered message: "Select a node to view details"
   - Subtle icon above text
5. [ ] Wire up in page.tsx - render when `selectedElement` exists

**Test:** Select node → right sidebar appears with tabs. Click away → empty state.

---

## Phase 2: useNodeDetails Hook & State Management
**Goal:** Create hook for local state management and auto-save logic  
**Time:** 45 min

**Files:**
- `src/hooks/useNodeDetails.ts` (new)
- `src/types/nodeDetails.ts` (new)

**Tasks:**
1. [ ] Create `src/types/nodeDetails.ts` with interfaces:
```typescript
interface NodeDocumentContent {
  documentation: string; // HTML from Tiptap
  parameters: ProcessParameter[];
}

type ParameterType = 'CHECKLIST' | 'SCALE' | 'NUMBER';

interface BaseParameter {
  id: string;
  type: ParameterType;
  question: string;
}

interface ChecklistParameter extends BaseParameter {
  type: 'CHECKLIST';
  options: { id: string; label: string; checked: boolean }[];
}

interface ScaleParameter extends BaseParameter {
  type: 'SCALE';
  min: number;
  max: number;
  unit?: string;
  current: number;
}

interface NumberParameter extends BaseParameter {
  type: 'NUMBER';
  min?: number;
  max?: number;
  unit?: string;
  current: number;
}

type ProcessParameter = ChecklistParameter | ScaleParameter | NumberParameter;
```

2. [ ] Create `useNodeDetails` hook:
   - Accept: `selectedElement` (or null)
   - State: `documentation`, `parameters`, `isDirty`, `isSaving`, `saveStatus`
   - Refs: `previousNodeIdRef`, `saveTimeoutRef`
   - Load data from `selectedElement.databaseInfo.documentContent`
   - Parse JSON or use defaults if empty

3. [ ] Implement `setDocumentation(html)` - updates state, marks dirty
4. [ ] Implement `setParameters(params)` - updates state, marks dirty
5. [ ] Implement `saveNodeDetails()` - calls NodeAPI.update()
6. [ ] Return: `{ documentation, parameters, setDocumentation, setParameters, isDirty, isSaving, saveStatus }`

**Test:** Hook compiles, can load/save data correctly.

---

## Phase 3: Auto-Save Implementation
**Goal:** Debounced auto-save and save-on-switch  
**Time:** 45 min

**Files:**
- `src/hooks/useNodeDetails.ts`

**Tasks:**
1. [ ] Add debounce effect:
   - When `isDirty` becomes true, start 3-second timer
   - Clear timer if new edits come in
   - When timer completes, call `saveNodeDetails()`
2. [ ] Add node-switch detection:
   - Track `previousNodeIdRef`
   - When `selectedElement` changes:
     - If previous node exists AND `isDirty`, save previous first
     - Then load new node data
3. [ ] Add cleanup effect:
   - On unmount, if `isDirty`, save synchronously
4. [ ] Add save status states:
   - `'idle'` - no pending changes
   - `'saving'` - save in progress
   - `'saved'` - just saved (show for 2 seconds)
   - `'error'` - save failed

**Test:** Edit → wait 3s → see "Saved". Click another node → previous saves first.

---

## Phase 4: Node Editor Tab Structure
**Goal:** Create the Node Editor tab with header and Edit/Preview toggle  
**Time:** 30 min

**Files:**
- `src/components/modeler/NodeEditorTab.tsx` (new)

**Tasks:**
1. [ ] Create component accepting:
   - `nodeName: string`
   - `documentation`, `setDocumentation`
   - `parameters`, `setParameters`
   - `isSaving`, `saveStatus`
2. [ ] Header section:
   - Node name (truncated with tooltip if long)
   - Edit/Preview toggle (pill-style buttons)
   - Save status indicator (subtle, right-aligned)
3. [ ] Content section:
   - Top ~50%: Documentation area
   - Bottom ~50%: Parameters area
   - Divider line between sections
4. [ ] Pass mode to child components (Edit vs Preview)

**Test:** See header with node name, toggle switches modes.

---

## Phase 5: Documentation Editor (Tiptap)
**Goal:** Rich text editor for node documentation  
**Time:** 1 hr

**Files:**
- `src/components/modeler/DocumentationEditor.tsx` (new)
- `src/components/modeler/DocumentationViewer.tsx` (new)
- `package.json` (add dependencies)
- `src/app/globals.css` (editor styles)

**Tasks:**
1. [ ] Install Tiptap:
   ```bash
   npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder
   ```
2. [ ] Create `DocumentationEditor.tsx`:
   - Tiptap editor with useEditor hook
   - Toolbar: Bold | Italic | H1 | H2 | H3 | Bullet | Numbered
   - Placeholder: "Add documentation for this step..."
   - Call `onChange` when content changes
   - Style toolbar to match design system
3. [ ] Create `DocumentationViewer.tsx`:
   - Renders HTML safely (dangerouslySetInnerHTML)
   - Styled prose typography
   - Empty state: "No documentation added yet"
4. [ ] Add Tiptap styling to globals.css:
   - `.tiptap-editor` class
   - Toolbar button styles
   - Editor content area styles

**Test:** Type formatted text, see it render in Preview mode.

---

## Phase 6: Parameter Editor (Edit Mode)
**Goal:** UI to add and configure parameters  
**Time:** 1.5 hr

**Files:**
- `src/components/modeler/ParameterEditor.tsx` (new)
- `src/components/modeler/parameters/ChecklistEditor.tsx` (new)
- `src/components/modeler/parameters/ScaleEditor.tsx` (new)
- `src/components/modeler/parameters/NumberEditor.tsx` (new)

**Tasks:**
1. [ ] Create `ParameterEditor.tsx`:
   - "Add Parameter" dropdown with 3 options
   - List existing parameters
   - Each parameter card: type icon, question, config, delete button
2. [ ] Create `ChecklistEditor.tsx`:
   - Editable question text
   - List of options with inline editing
   - "Add option" button
   - Delete option (X) on each
3. [ ] Create `ScaleEditor.tsx`:
   - Editable question text
   - Min/Max number inputs
   - Optional unit label input
4. [ ] Create `NumberEditor.tsx`:
   - Editable question text
   - Optional min/max inputs
   - Optional unit label
5. [ ] All editors call `onChange` when modified
6. [ ] Delete parameter functionality

**Test:** Add each type, configure, delete. Changes reflected.

---

## Phase 7: Parameter Viewer (Preview Mode)
**Goal:** Interactive parameter display matching design mockup  
**Time:** 1.5 hr

**Files:**
- `src/components/modeler/ParameterViewer.tsx` (new)
- `src/components/modeler/parameters/ChecklistViewer.tsx` (new)
- `src/components/modeler/parameters/ScaleViewer.tsx` (new)
- `src/components/modeler/parameters/NumberViewer.tsx` (new)
- `src/app/globals.css` (gradient slider styles)

**Tasks:**
1. [ ] Create `ParameterViewer.tsx`:
   - Map parameters to viewer components
   - Empty state: "No parameters configured"
2. [ ] Create `ChecklistViewer.tsx`:
   - Question as label
   - Styled checkboxes (oxford-blue when checked)
   - Click toggles checked state
3. [ ] Create `ScaleViewer.tsx`:
   - Question as label
   - **Gradient slider track** (red → yellow → green)
   - Draggable thumb
   - Value pill showing current + unit
4. [ ] Create `NumberViewer.tsx`:
   - Question as label
   - Number slider with gradient
   - Value pill display
5. [ ] Add CSS for gradient sliders:
```css
.gradient-slider-track {
  background: linear-gradient(to right, #ef4444, #eab308, #22c55e);
  height: 8px;
  border-radius: 4px;
}
```
6. [ ] All viewers update local state only (no auto-save trigger)

**Test:** Interact with all parameter types in Preview mode.

---

## Phase 8: AI Magic Map Tab (Shell)
**Goal:** Placeholder for future AI features  
**Time:** 15 min

**Files:**
- `src/components/modeler/MagicMapTab.tsx` (new)

**Tasks:**
1. [ ] Create component with:
   - Sparkles icon (✨) centered
   - "AI Magic Map" heading
   - "Coming soon" description
   - Disabled text input (visual preview of future chat)
2. [ ] Match design system styling

**Test:** Switch to AI tab, see placeholder.

---

## Phase 9: Polish & Edge Cases
**Goal:** Handle edge cases, animations, final styling  
**Time:** 45 min

**Files:**
- Various components
- `src/app/globals.css`

**Tasks:**
1. [ ] Add fade transition when switching nodes
2. [ ] Handle long node names (truncate + tooltip)
3. [ ] Handle node deleted while editing:
   - Show error toast
   - Return to empty state
4. [ ] Handle network errors:
   - Show "Failed to save" status
   - Retry button
5. [ ] Keyboard shortcuts:
   - Cmd/Ctrl+S to force save
6. [ ] Match scrollbar to app styling
7. [ ] Test all node types (task, gateway, event, start, end)

**Test:** Full workflow feels polished and handles errors gracefully.

---

## Files Summary

| New Files | Purpose |
|-----------|---------|
| `components/modeler/NodeDetailsPanel.tsx` | Main sidebar wrapper |
| `components/modeler/NodeEditorTab.tsx` | Documentation + Parameters |
| `components/modeler/MagicMapTab.tsx` | AI placeholder |
| `components/modeler/DocumentationEditor.tsx` | Tiptap editor |
| `components/modeler/DocumentationViewer.tsx` | HTML renderer |
| `components/modeler/ParameterEditor.tsx` | Parameter config |
| `components/modeler/ParameterViewer.tsx` | Interactive display |
| `components/modeler/parameters/*.tsx` | 6 parameter components |
| `hooks/useNodeDetails.ts` | State + auto-save logic |
| `types/nodeDetails.ts` | TypeScript interfaces |

| Modified Files | Changes |
|----------------|---------|
| `page.module.css` | Right sidebar column |
| `page.tsx` | Render NodeDetailsPanel |
| `globals.css` | Tiptap + slider styles |
| `package.json` | Tiptap dependencies |

---

## Time Estimate

| Phase | Time | Cumulative |
|-------|------|------------|
| Phase 1: Layout | 30 min | 30 min |
| Phase 2: Hook & State | 45 min | 1h 15m |
| Phase 3: Auto-Save | 45 min | 2h |
| Phase 4: Editor Tab | 30 min | 2h 30m |
| Phase 5: Tiptap | 1 hr | 3h 30m |
| Phase 6: Param Editor | 1.5 hr | 5h |
| Phase 7: Param Viewer | 1.5 hr | 6h 30m |
| Phase 8: AI Tab | 15 min | 6h 45m |
| Phase 9: Polish | 45 min | **7h 30m** |

---

## Demo Considerations
- [ ] Right sidebar loads instantly (<100ms)
- [ ] Auto-save works reliably (no data loss)
- [ ] Save indicator visible but not distracting
- [ ] No console errors when switching nodes rapidly
- [ ] Tiptap editor doesn't lag on typing
- [ ] Gradient sliders are smooth
- [ ] Parameters update visually without delay
- [ ] Graceful empty states
- [ ] Works with all node types

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Tiptap bundle too large | Low | Medium | Use starter-kit only |
| Rapid node switching race | Medium | High | Block switch until save completes |
| Network save fails | Low | High | Show error, retry button |
| documentContent format issues | Low | Medium | Validate JSON, use defaults |
| Long node names break layout | Medium | Low | Truncate + tooltip |

---

## Post-Demo Improvements (Future)
1. Migrate parameters to proper ProcessParameter table with `config` field
2. Add parameter reordering (drag & drop)
3. Add parameter relationships (AND, OR, XOR)
4. Add image upload in documentation
5. Add collaborative editing indicators
