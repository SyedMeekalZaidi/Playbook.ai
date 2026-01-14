# Magic Map Implementation Plan

> **Reference**: [Feature Requirements](./feature-requirements.md)  
> **Estimated Time**: 7-8 hours  
> **Dependencies**: bpmn-auto-layout (✅ installed), openai (❌ need to install)

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           MAGIC MAP ARCHITECTURE                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FRONTEND (React Components)                                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │  NodeDetailsPanel.tsx (Modified - adds MagicMapProvider wrapper)       │ │
│  │  └── MagicMapProvider (Context - survives tab switches)               │ │
│  │       └── Tabs                                                         │ │
│  │            ├── Node Editor Tab                                         │ │
│  │            └── AI Magic Map Tab                                        │ │
│  │                 └── MagicMapTab.tsx (Complete Rewrite)                │ │
│  │                      ├── ChatHeader.tsx (Title + Start Fresh)         │ │
│  │                      ├── ChatMessageList.tsx (Scrollable)             │ │
│  │                      │   ├── WelcomeMessage.tsx (+ examples)          │ │
│  │                      │   ├── UserMessage.tsx                          │ │
│  │                      │   ├── AssistantMessage.tsx                     │ │
│  │                      │   │   └── DiagramPreview.tsx (Mini viewer)    │ │
│  │                      │   └── ThinkingMessage.tsx (Loading)            │ │
│  │                      ├── ChatInput.tsx (+ Enhance button)             │ │
│  │                      └── DiagramModal.tsx (Expanded view)             │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  STATE (React Context - MagicMapContext.tsx @ NodeDetailsPanel level)       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  messages: ChatMessage[]                                               │ │
│  │  isGenerating: boolean                                                 │ │
│  │  isEnhancing: boolean                                                  │ │
│  │  messageCount: number                                                  │ │
│  │  currentDiagramXml: string | null                                      │ │
│  │  expandedDiagramXml: string | null (for modal)                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  BACKEND (Next.js API Routes)                                                │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │  /api/magic-map/                                                       │ │
│  │  ├── enhance/route.ts  (Magic Prompt enhancement)                     │ │
│  │  │   └── Input: { prompt: string }                                    │ │
│  │  │   └── Output: { enhancedPrompt: string }                           │ │
│  │  │                                                                     │ │
│  │  ├── generate/route.ts (Generate/modify BPMN)                         │ │
│  │  │   └── Input: { messages: ChatMessage[] }                           │ │
│  │  │   └── Process:                                                      │ │
│  │  │       1. Call OpenAI with BPMN context                             │ │
│  │  │       2. Extract XML from response                                  │ │
│  │  │       3. Run bpmn-auto-layout                                       │ │
│  │  │       4. Validate XML (try import)                                  │ │
│  │  │       5. If invalid, retry with simpler prompt                      │ │
│  │  │   └── Output: { xml: string, message: string, valid: boolean }     │ │
│  │  │                                                                     │ │
│  │  └── create-process/route.ts (Save to database)                       │ │
│  │      └── Input: { xml: string, processName: string, playbookId }      │ │
│  │      └── Output: { processId: string, success: boolean }              │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  INTEGRATION (with existing modeler)                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │  Props flow: page.tsx → NodeDetailsPanel → MagicMapProvider (context)  │
│  │  - playbookId: string (from useModeler)                                │ │
│  │  - onProcessCreated: callback created in page.tsx                      │ │
│  │                                                                        │ │
│  │  handleMagicMapProcessCreated(processId) in page.tsx:                  │ │
│  │  1. setSidebarRefreshNonce(n => n + 1) - refresh sidebar list          │ │
│  │  2. handleSidebarProcessSelect(processId) - load in modeler            │ │
│  │                                                                        │ │
│  │  MagicMapTab accesses everything via useMagicMap() hook (no props)     │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Phase Breakdown

---

## Phase 1: Setup & API Routes (1.5h)

### Research Notes

**1.1 OpenAI NPM Package**

The `openai` npm package (v4.x) provides a clean TypeScript client:
- Installation: `npm install openai`
- Environment variable: `OPENAI_API_KEY` 
- The client is initialized once and reused across requests
- Uses `chat.completions.create()` method for conversation

**Key Decision**: Use `gpt-4o-mini` model for cost-effective BPMN generation. It follows complex instructions well and is much cheaper than GPT-4. Cost is ~$0.00015/1K input tokens.

**1.2 Next.js 15 App Router API Routes**

Existing pattern in codebase (`src/app/api/processes/[processId]/route.ts`):
- Export async functions named after HTTP methods: `POST`, `GET`, etc.
- Use `NextResponse.json()` for responses
- Parse request body with `await req.json()`
- Error handling with try/catch and `handleApiError` utility

**1.5 Authentication Pattern (CRITICAL)**

All existing API routes use `requireUser()` helper for authentication:
- Located in each route file (copied pattern, not shared)
- Uses `createApiClient()` from `@/utils/supabase/server`
- Throws error if user not authenticated
- Must be called at start of every API handler

All Magic Map routes MUST include this authentication check.

**1.3 bpmn-auto-layout Integration**

Already installed. Key observations:
- Import: `import { layoutProcess } from 'bpmn-auto-layout'`
- Async function: `const layoutedXml = await layoutProcess(processOnlyXml)`
- Must run server-side (not in browser) due to Node.js dependencies
- Throws error if XML is invalid (missing start event, unconnected elements)

**1.4 XML Extraction Strategy**

AI responses may contain markdown code blocks or extra text. Need to:
- Extract XML between `<?xml` and `</bpmn2:definitions>`
- Handle case where AI includes explanatory text
- Strip markdown code fences (```xml)

---

### Phase 1: Step-by-Step Implementation

**Step 1.1: Install OpenAI Package**
- Run terminal command: `npm install openai`
- Verify installation in `package.json`

**Step 1.2: Set Up Environment Variable**
- Add `OPENAI_API_KEY` to `.env.local` file
- Add to Vercel environment variables for production
- Never commit API key to git

**Step 1.3: Create Directory Structure**
- Create folder: `src/app/api/magic-map/`
- Create subfolders: `enhance/`, `generate/`, `create-process/`
- Each subfolder gets a `route.ts` file

**Step 1.4: Create `/api/magic-map/generate/route.ts`**

This is the main endpoint. Implementation steps:

1. **Authentication (FIRST STEP - CRITICAL)**
   - Copy `requireUser()` helper function pattern from existing routes
   - Import `createApiClient` from `@/utils/supabase/server`
   - Call `await requireUser()` at start of POST handler
   - This ensures only logged-in users can generate diagrams

2. **Request Parsing**
   - Extract `messages` array from request body
   - Validate messages exist and is an array
   - Return 400 error if invalid

3. **OpenAI Client Setup**
   - Import `OpenAI` from 'openai' package
   - Initialize with environment variable
   - Handle missing API key gracefully

4. **System Prompt Construction**
   - Create a comprehensive system prompt that includes:
     - Role: "You are a BPMN 2.0 XML generator"
     - Key rules from BPMN-Understanding.md (summarized)
     - Emphasize: NO DI section, ONE start event, all elements connected
     - Output format: Pure XML only, no explanations
   - Keep prompt concise to save tokens but complete enough for accuracy

5. **OpenAI API Call**
   - Use `chat.completions.create()` method
   - Pass: model (`gpt-4o-mini`), messages array (system + user messages)
   - Set reasonable `max_tokens` (2000 should cover most diagrams)
   - Set `temperature: 0.3` for more deterministic output

6. **XML Extraction**
   - Create helper function `extractXmlFromResponse(content: string)`
   - Use regex to find XML block: `/<?xml[\s\S]*?<\/bpmn2:definitions>/`
   - Handle markdown code fences (strip them if present)
   - Return extracted XML or throw error if not found

7. **Auto-Layout**
   - Import `layoutProcess` from 'bpmn-auto-layout'
   - Wrap in try/catch (may fail if XML structure is wrong)
   - Pass extracted XML through `await layoutProcess(xml)`
   - Get back complete XML with DI section added

8. **Validation**
   - Create helper function `validateBpmnXml(xml: string)`
   - Use basic XML parsing to check structure
   - Check for required elements: definitions, process, startEvent
   - Return boolean indicating validity

9. **Retry Logic (if invalid)**
   - If validation fails, try ONE more time with simplified prompt
   - Simplified prompt: "Create a simple linear process with 3-5 steps"
   - If second attempt fails, return error response

10. **Response**
    - Return JSON with: `{ xml, valid: true, message: "Diagram created" }`
    - On error: `{ xml: null, valid: false, error: "Friendly message" }`

**Step 1.5: Create `/api/magic-map/enhance/route.ts`**

Simpler endpoint for Magic Prompt:

1. **Authentication (FIRST STEP)**
   - Copy `requireUser()` helper pattern (same as generate route)
   - Call `await requireUser()` at start of handler

2. **Request Parsing**
   - Extract `prompt` string from body
   - Validate it's a non-empty string

3. **OpenAI Call for Enhancement**
   - Different system prompt: "You are a BPMN prompt optimizer..."
   - Instructions: Clarify vague steps, identify decision points, keep concise
   - Pass user's original prompt
   - Request enhanced version as output

4. **Response**
   - Return `{ enhancedPrompt: string }`
   - On error: `{ error: string }`

**Step 1.6: Create `/api/magic-map/create-process/route.ts`**

Saves generated diagram as a new process:

1. **Authentication (FIRST STEP)**
   - Copy `requireUser()` helper pattern
   - Call `await requireUser()` at start of handler
   - Get user ID for potential ownership tracking

2. **Request Parsing**
   - Extract `xml`, `processName`, `playbookId` from body
   - Validate all required fields exist

3. **Reuse Existing ProcessAPI Pattern**
   - Look at `src/app/api/processes/route.ts` POST handler
   - Similar flow: create process with prisma, return new process

4. **Database Operation**
   - Use `prisma.process.create()` with:
     - `name`: from request
     - `playbookId`: from request  
     - `bpmnXml`: from request (the generated XML)
   - Return created process with ID

5. **Response**
   - Return `{ processId, success: true }`
   - On error: `{ error: string, success: false }`

---

## Phase 2: Chat State & Context (1h)

### Research Notes

**2.1 Existing Context Pattern**

Reviewed `src/components/ProcessTreeContext.tsx`:
- Uses `createContext` + `useContext` pattern
- State managed with `useState` hooks
- Provides values and functions via Provider
- Components access via custom `useProcessTree()` hook

**2.2 Session-Only Persistence**

Per feature requirements:
- Chat persists during session (React state)
- Clears on page reload (no localStorage/DB)
- Persists when switching processes (state stays in parent)

**Key Insight**: The context should be placed at `NodeDetailsPanel` level, NOT inside MagicMapTab. 

**Why NodeDetailsPanel level?**
- If placed inside MagicMapTab, chat resets when user switches to "Node Editor" tab and back
- User generates diagram → clicks Node Editor to check something → switches back → chat is gone! Bad UX.
- At NodeDetailsPanel level, context survives tab switches within the right sidebar

**Architecture Decision**: Place `MagicMapProvider` in `NodeDetailsPanel.tsx`, wrapping the entire Tabs component. This ensures chat persists across tab switches but clears on page reload (acceptable).

**2.3 Message Count Tracking**

- Track message count for 5-message limit
- Only count user messages (not system/assistant for simplicity)
- Or count all messages and check if >= 10 (5 pairs)

**Decision**: Count user messages only. After 5 user messages, disable input.

**2.4 TypeScript Types**

Need clean interfaces for:
- `ChatMessage`: id, role, content, xml?, timestamp
- `MagicMapState`: full state shape
- `MagicMapContextType`: state + actions

---

### Phase 2: Step-by-Step Implementation

**Step 2.1: Create Types File**

Create `src/components/modeler/magic-map/types.ts`:

1. **ChatMessage Interface**
   - `id`: string (use `crypto.randomUUID()` or simple counter)
   - `role`: 'user' | 'assistant' | 'system'
   - `content`: string (the message text)
   - `xml?`: string | null (optional, only for assistant messages with diagrams)
   - `timestamp`: Date
   - `isLoading?`: boolean (for thinking state)

2. **MagicMapState Interface**
   - `messages`: ChatMessage[]
   - `isGenerating`: boolean (API call in progress for diagram)
   - `isEnhancing`: boolean (API call in progress for enhance)
   - `isLimitReached`: boolean (5 user messages hit)
   - `expandedXml`: string | null (for modal view)

3. **Export all types** for use across components

**Step 2.2: Create Context File**

Create `src/components/modeler/magic-map/MagicMapContext.tsx`:

1. **Initial State**
   - Empty messages array
   - All booleans false
   - expandedXml null

2. **Context Value Shape**
   - All state values
   - Action functions:
     - `addMessage(message: ChatMessage)`: Add to messages array
     - `clearMessages()`: Reset to initial state (Start Fresh)
     - `setIsGenerating(val: boolean)`: Update generating state
     - `setIsEnhancing(val: boolean)`: Update enhancing state
     - `setExpandedXml(xml: string | null)`: For modal
     - `sendMessage(content: string)`: Main action - orchestrates API call

3. **Provider Component**
   - Accept `playbookId` and `onProcessCreated` as props (needed for process creation)
   - Use `useState` for all state
   - Use `useCallback` for memoized actions
   - Compute `isLimitReached` from message count

4. **sendMessage Function Logic**
   - Add user message to state immediately (optimistic)
   - Set isGenerating true
   - Call `/api/magic-map/generate` with all messages
   - On success: Add assistant message with XML
   - On error: Add assistant error message
   - Set isGenerating false

5. **enhancePrompt Function Logic**
   - Set isEnhancing true
   - Call `/api/magic-map/enhance` with current prompt
   - Return enhanced prompt (caller updates input field)
   - Set isEnhancing false

6. **createProcess Function Logic**
   - Call `/api/magic-map/create-process` with XML and name
   - On success: Call `onProcessCreated(processId)` callback
   - Return success/error status

7. **Custom Hook**
   - Create `useMagicMap()` hook
   - Throw error if used outside provider

**Step 2.3: Wire Up Context**

The provider will be used to wrap MagicMapTab content in Phase 6.

---

## Phase 3: Chat UI Components (2h)

### Research Notes

**3.1 Existing Component Patterns**

Reviewed current `MagicMapTab.tsx`:
- Uses Shadcn UI components (Button)
- Uses Lucide React icons (Sparkles, Send, Wand2)
- Follows design system colors (gold, oxford-blue, muted-foreground)
- Uses Tailwind for styling

**3.2 Shadcn Components Available**

Already installed:
- `Button` - various variants
- `Input` - text input (may need Textarea for multi-line)
- `Dialog` - for modal (DiagramModal)
- `Tooltip` - for button hints

**May need to add**: `Textarea` from shadcn for multi-line input.

**3.3 Framer Motion Usage**

Already installed (`framer-motion: ^11.18.2`). Key APIs:
- `motion.div` - animated div
- `animate` prop - define animation states
- `transition` prop - timing/easing
- `AnimatePresence` - animate elements entering/exiting

**3.4 Scrollable Chat Design**

Layout structure:
```
┌────────────────────────┐
│ Header (fixed)         │ ← ChatHeader
├────────────────────────┤
│                        │
│ Messages (scrollable)  │ ← ChatMessageList with overflow-y-auto
│                        │
├────────────────────────┤
│ Input (fixed)          │ ← ChatInput
└────────────────────────┘
```

Use flexbox: `flex flex-col h-full`, with middle section `flex-1 overflow-y-auto`.

**3.5 Auto-Scroll Behavior**

When new message added, scroll to bottom:
- Use `useRef` for scroll container
- Use `useEffect` to scroll when messages change
- Smooth scroll behavior: `scrollIntoView({ behavior: 'smooth' })`

---

### Phase 3: Step-by-Step Implementation

**Step 3.1: Create ChatHeader Component**

File: `src/components/modeler/magic-map/ChatHeader.tsx`

Purpose: Title bar with "Start Fresh" button

Elements:
1. Container div with padding, border-bottom
2. Left side: "Magic Map" title with Sparkles icon
3. Right side: "Start Fresh" ghost button
4. Button calls `clearMessages()` from context
5. Style: `flex items-center justify-between`

**Step 3.2: Create ThinkingMessage Component**

File: `src/components/modeler/magic-map/ThinkingMessage.tsx`

Purpose: Animated loading indicator while AI generates

Elements:
1. Container styled like assistant message bubble
2. Three bouncing dots using Framer Motion
3. Dots animate with staggered delay (0, 0.1s, 0.2s)
4. Gold color (`bg-gold`)
5. Animation: y position oscillates 0 → -6 → 0
6. Add subtle text: "Creating your diagram..."

**Step 3.3: Create UserMessage Component**

File: `src/components/modeler/magic-map/UserMessage.tsx`

Purpose: Display user's chat messages

Props: `message: ChatMessage`

Elements:
1. Container aligned right (`flex justify-end`)
2. Message bubble with background (`bg-oxford-blue text-white`)
3. Rounded corners (`rounded-lg rounded-br-sm`)
4. Padding and max-width constraint
5. Timestamp below (optional, small muted text)
6. Framer Motion: fade in + slide from right

**Step 3.4: Create AssistantMessage Component**

File: `src/components/modeler/magic-map/AssistantMessage.tsx`

Purpose: Display AI responses, optionally with diagram

Props: `message: ChatMessage`

Elements:
1. Container aligned left
2. Message bubble with light background (`bg-muted`)
3. If `message.xml` exists, render DiagramPreview below text
4. If message is error, style differently (subtle red tint)
5. Framer Motion: fade in + slide from left

**Step 3.5: Create WelcomeMessage Component**

File: `src/components/modeler/magic-map/WelcomeMessage.tsx`

Purpose: Initial greeting with instructions and example prompts

Elements:
1. Bot icon or Magic Map branding
2. Welcome text explaining how to use
3. Three example prompt buttons (pre-defined healthcare scenarios):
   - "Patient registration with eligibility check"
   - "Cervical cancer screening with decision points"
   - "Site assessment with parallel preparation tasks"
4. Each button onClick: Set input field value AND submit
5. Styled as pill buttons with gold accent

**Step 3.6: Create ChatMessageList Component**

File: `src/components/modeler/magic-map/ChatMessageList.tsx`

Purpose: Scrollable container for all messages

Elements:
1. Outer container: `flex-1 overflow-y-auto`
2. Inner padding container
3. Render messages array in order
4. If no messages (or just welcome), show WelcomeMessage
5. For each message, render UserMessage or AssistantMessage based on role
6. If isGenerating, show ThinkingMessage at end
7. Auto-scroll to bottom on new messages
8. Add ref to bottom element for scroll targeting

**Step 3.7: Create ChatInput Component**

File: `src/components/modeler/magic-map/ChatInput.tsx`

Purpose: Input field with Enhance and Send buttons

Elements:
1. Container with padding, border-top, background
2. If limit reached: Show disabled state with message
   - "For accurate diagram creation, please start a new chat"
   - Grey out all inputs
3. Otherwise show:
   - "✨ Enhance" button (left of input or inside)
   - Text input/textarea for typing
   - Send button (right side)
4. Input behavior:
   - Controlled component (value + onChange)
   - Enter key submits (unless shift+enter for newline if textarea)
   - Disable while generating/enhancing
5. Enhance button:
   - Calls enhancePrompt with current input value
   - On success, replaces input value with enhanced version
   - Shows loading state while enhancing
6. Send button:
   - Calls sendMessage with input value
   - Clears input on send
   - Disabled if input empty or generating

---

**Phase 3 Component Relationships:**

```
ChatMessageList
├── WelcomeMessage (only when no user messages)
├── UserMessage (for each user message)
├── AssistantMessage (for each assistant message)
│   └── DiagramPreview (if xml present) [Phase 4]
└── ThinkingMessage (when isGenerating)
```

---

## Phase 4: Diagram Preview & Modal (1.5h)

### Research Notes

**4.1 Existing BpmnViewer Component**

Reviewed `src/components/BpmnViewer.tsx`:
- Uses `bpmn-js/lib/Viewer` (read-only, not the Modeler)
- Takes `xml` prop and renders diagram
- Has `zoom('fit-viewport')` built-in after import
- Includes custom `DatabaseIntegration` module (for highlighting)

**Key Insight**: For Magic Map preview, we need a SIMPLER version:
- No database integration needed (it's a draft, not saved yet)
- No click handlers for node selection
- Just render XML and fit to container

**Decision**: Create a new lightweight `DiagramPreview` component rather than reusing the full `BpmnViewer`. This avoids unnecessary complexity and dependencies.

**4.2 bpmn-js Viewer Initialization**

Key bpmn-js concepts:
- Viewer is instantiated with a `container` DOM element
- `importXML(xml)` is async, returns a Promise
- After import, call `canvas.zoom('fit-viewport')` to auto-fit
- Must `destroy()` on component unmount to prevent memory leaks
- Viewer instance needs fixed height container (won't work with `height: 0`)

**4.3 Shadcn Dialog for Modal**

Reviewed `src/components/ui/dialog.tsx`:
- Already has size variants: `sm (400px)`, `md (560px)`, `lg (720px)`
- For diagram modal, use `lg` size for maximum visibility
- Has built-in animations (zoom in/out)
- Portal-based, so won't break layout

**4.4 Container Sizing Strategy**

For preview in chat bubble:
- Fixed dimensions: 280x180px works well in sidebar width (360px)
- Use CSS `aspect-ratio` or fixed height
- Container needs overflow hidden (diagram may be larger)

For modal:
- Use responsive sizing within Dialog's lg container
- Height should be ~60-70vh for comfortable viewing
- Maintain aspect ratio

---

### Phase 4: Step-by-Step Implementation

**Step 4.1: Create DiagramPreview Component**

File: `src/components/modeler/magic-map/DiagramPreview.tsx`

Purpose: Render a mini BPMN diagram in chat bubbles

1. **Props Interface**
   - `xml`: string (the BPMN XML to render)
   - `onClick`: callback when clicked (to open modal)
   - `className?`: optional additional styles

2. **Container Setup**
   - Fixed dimensions: 280x180px
   - Border with rounded corners matching design system
   - Subtle shadow and background
   - Cursor pointer to indicate clickable

3. **Viewer Initialization**
   - Use `useRef` for container DOM element
   - Use `useRef` for viewer instance
   - Initialize viewer in `useEffect` with dependency on `xml`
   - Import bpmn-js Viewer (not Modeler)
   - Do NOT include DatabaseIntegration module (not needed)
   - **CRITICAL: Import CSS files for proper rendering:**
     - `import 'bpmn-js/dist/assets/diagram-js.css'`
     - `import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css'`
   - Without these imports, diagram will render with broken styling

4. **XML Import Logic**
   - When `xml` prop changes, call `viewer.importXML(xml)`
   - After import success, call `canvas.zoom('fit-viewport')`
   - Handle import errors gracefully (show placeholder instead)

5. **Cleanup**
   - In useEffect return, call `viewer.destroy()`
   - This prevents memory leaks when component unmounts

6. **Click Handler**
   - Entire container is clickable
   - Call `onClick` prop when clicked
   - Consider adding hover effect (subtle scale or border color)

7. **Loading/Error States**
   - While importing, show skeleton or shimmer
   - If import fails, show error placeholder with message

**Step 4.2: Create DiagramModal Component**

File: `src/components/modeler/magic-map/DiagramModal.tsx`

Purpose: Full-size view of diagram with "Create as New Process" action

1. **Props Interface**
   - `open`: boolean (controlled modal state)
   - `onOpenChange`: (open: boolean) => void
   - `xml`: string | null (diagram XML)
   - `onCreateProcess`: (xml: string, name: string) => Promise<void>

2. **Modal Structure**
   - Use Shadcn Dialog with size "lg"
   - DialogContent contains:
     - Header with title "Preview Diagram"
     - Body with large diagram viewer
     - Footer with actions

3. **Large Diagram Viewer**
   - Use same bpmn-js Viewer approach as DiagramPreview
   - Container: full width, ~60vh height
   - Fit to viewport on load

4. **Create Process Form**
   - Below diagram, show "Create as New Process" button
   - When clicked, reveal inline text input for process name
   - Use Framer Motion to animate the reveal (height expand)
   - Submit button next to input

5. **Form Submission Flow**
   - User enters name → clicks confirm
   - Show loading state on button
   - Call `onCreateProcess(xml, name)`
   - On success: close modal (parent handles the rest)
   - On error: show inline error message

6. **Close Button**
   - Standard Dialog close button (X in corner)
   - Also close on overlay click

**Step 4.3: Wire Up Click-to-Expand**

In `AssistantMessage.tsx` (Phase 3):
1. If message has XML, render DiagramPreview
2. Track expanded XML in context (`expandedXml` state)
3. When DiagramPreview clicked, set `expandedXml = message.xml`
4. DiagramModal reads from context and opens when `expandedXml !== null`
5. When modal closes, set `expandedXml = null`

**Step 4.4: Styling Details**

DiagramPreview styling:
- Border: `border border-border`
- Background: `bg-white`
- Rounded: `rounded-lg`
- Shadow: `shadow-sm`
- Hover: `hover:shadow-md transition-shadow`

Modal styling:
- Follow existing Dialog patterns
- Diagram area: clean white background
- Action buttons: oxford-blue primary, outline secondary

---

## Phase 5: Process Creation Flow (1h)

### Research Notes

**5.1 Existing Process Creation Pattern**

Reviewed `handleCreateProcessFromSidebar` in `useModeler.tsx`:
- Takes just a `name` parameter
- Creates process via `ProcessAPI.create({ processName, playbookId })`
- Updates state: `setProcessId`, `setProcessName`, `setProcesses`, `setNodes`
- Returns the new process object

**Key Difference for Magic Map**:
- We also have XML to attach (from AI generation)
- Need to save XML to the new process immediately

**5.2 API Endpoint Design**

Looking at existing `/api/processes/[processId]/route.ts` PATCH:
- Accepts `bpmnXml` in request body
- Updates process with XML

**Strategy**: 
1. Create process first (via existing `ProcessAPI.create`)
2. Immediately PATCH with bpmnXml
OR
3. Create new endpoint `/api/magic-map/create-process` that does both in one call

**Decision**: Create dedicated endpoint for atomic operation (cleaner, single network call).

**5.3 Props Threading**

Current hierarchy:
```
page.tsx (has playbookId, handleSidebarProcessSelect)
  └── NodeDetailsPanel (receives selectedElement)
        └── MagicMapTab (currently no props)
```

Need to pass:
- `playbookId`: from page.tsx → NodeDetailsPanel → MagicMapTab
- `onProcessCreated`: callback to load new process in modeler

**5.4 After Process Creation**

What needs to happen:
1. New process created in DB (with XML)
2. Sidebar list refreshes (via `sidebarRefreshNonce++`)
3. New process loads in modeler (via `handleSidebarProcessSelect(newProcessId)`)
4. User can now edit the diagram

---

### Phase 5: Step-by-Step Implementation

**Step 5.1: Create `/api/magic-map/create-process/route.ts`**

Purpose: Create a new process with BPMN XML in one atomic operation

1. **Request Validation**
   - Extract: `xml`, `processName`, `playbookId` from body
   - Validate all fields present and non-empty
   - Validate playbookId exists in database

2. **Database Transaction**
   - Use Prisma transaction for atomicity
   - Create process with name and playbookId
   - Immediately update with bpmnXml
   - Or use single create with all fields

3. **Response**
   - Return: `{ processId, processName, success: true }`
   - On error: `{ error: string, success: false }`

**Step 5.2: Add createProcess to MagicMapContext**

In `MagicMapContext.tsx`:

1. **Function Signature**
   - `createProcess(xml: string, name: string): Promise<{ success: boolean; processId?: string; error?: string }>`

2. **Implementation**
   - Set loading state
   - Call `/api/magic-map/create-process` with xml, name, playbookId
   - On success: call `onProcessCreated(processId)` callback
   - Return result for UI to handle

3. **Context Value**
   - Expose `createProcess` function
   - Expose `isCreatingProcess` loading state

**Step 5.3: Update Component Hierarchy for Props**

This is the critical integration step. Props must flow correctly:

```
page.tsx
  └── NodeDetailsPanel (receives playbookId, onProcessCreated)
        └── MagicMapProvider (wraps tabs, receives props)
              └── MagicMapTab (accesses via context)
```

1. **page.tsx Changes**
   
   Create new callback function (inside the component, after useModeler):
   - Name: `handleMagicMapProcessCreated`
   - Parameter: `processId: string`
   - Function body should:
     a. Increment sidebar refresh: `setSidebarRefreshNonce(n => n + 1)`
     b. Load new process in modeler: `handleSidebarProcessSelect(processId)`
   
   Update NodeDetailsPanel rendering:
   - **Current:** `<NodeDetailsPanel selectedElement={selectedElement} />`
   - **New:** `<NodeDetailsPanel selectedElement={selectedElement} playbookId={playbookId} onProcessCreated={handleMagicMapProcessCreated} />`
   
   Note: `playbookId` is already available in page.tsx from `useModeler()`.

2. **NodeDetailsPanel Changes**
   
   Update interface:
   - Add `playbookId: string` prop
   - Add `onProcessCreated: (processId: string) => void` prop
   
   Wrap content with MagicMapProvider:
   - Provider goes AROUND the entire `<Tabs>` component
   - Pass `playbookId` and `onProcessCreated` to provider
   
   MagicMapTab no longer needs direct props - it reads from context.

3. **MagicMapTab Changes**
   - Remove props interface (gets everything from context)
   - Access `playbookId` and `createProcess` via `useMagicMap()` hook
   - Much simpler component!

**Step 5.4: Create Process Form UX (in DiagramModal)**

1. **Initial State**
   - Show "Create as New Process" button
   - Button styled as primary (oxford-blue)

2. **After Button Click**
   - Button transitions to show inline input field
   - Use Framer Motion `AnimatePresence` for smooth height animation
   - Input auto-focuses

3. **Form State**
   - Track `processName` in local state
   - Track `isCreating` loading state
   - Track `error` message state

4. **Submission**
   - Disable button while creating
   - Show spinner in button
   - Call context's `createProcess(xml, name)`
   - On success: modal closes, parent handles loading
   - On error: show error message below input, don't close

5. **Validation**
   - Disable submit if name is empty or whitespace
   - Optional: show character limit hint

---

## Phase 6: Rewrite MagicMapTab & Update NodeDetailsPanel (0.5h)

### Research Notes

**6.1 Current MagicMapTab**

Reviewed `src/components/modeler/MagicMapTab.tsx`:
- Currently a placeholder with "Coming Soon" messaging
- Has disabled input preview
- Uses Sparkles, Send, Wand2 icons from Lucide
- Follows design system (gold, oxford-blue)

**6.2 Component Composition (Updated Architecture)**

Per Phase 2/5 decisions, `MagicMapProvider` is placed at `NodeDetailsPanel` level:

```
NodeDetailsPanel (receives playbookId, onProcessCreated)
  └── MagicMapProvider (wraps entire component, context persists across tabs)
        └── Tabs
              ├── Node Editor Tab
              └── AI Magic Map Tab
                    └── MagicMapTab (reads from context)
                          ├── ChatHeader
                          ├── ChatMessageList
                          ├── ChatInput
                          └── DiagramModal
```

**Key Benefit**: Chat survives when user switches between "Node Editor" and "AI Magic Map" tabs!

**6.3 Simplified Props Flow**

MagicMapTab no longer receives props directly - it accesses everything via context:
- `useMagicMap()` hook provides: messages, sendMessage, enhancePrompt, createProcess, etc.
- No prop drilling needed through MagicMapTab

---

### Phase 6: Step-by-Step Implementation

**Step 6.1: Update NodeDetailsPanel.tsx (IMPORTANT)**

1. **Update Props Interface**
   - Add `playbookId: string`
   - Add `onProcessCreated: (processId: string) => void`

2. **Import MagicMapProvider**
   - Import from `./magic-map/MagicMapContext`

3. **Wrap Content with Provider**
   - Provider goes at the TOP level, wrapping `<Tabs>`
   - Pass `playbookId` and `onProcessCreated` to provider

4. **Keep MagicMapTab Usage Simple**
   - `<MagicMapTab />` - no props needed anymore

**Step 6.2: Rewrite MagicMapTab.tsx**

1. **Remove Placeholder Content**
   - Delete all "Coming Soon" UI
   - Delete disabled input preview
   - Keep only necessary imports

2. **No Props Interface Needed**
   - MagicMapTab accesses everything via `useMagicMap()` hook
   - Cleaner, simpler component

**Step 6.3: Compose MagicMapTab Components**

1. **Layout Container**
   - `div` with `h-full flex flex-col`
   - This ensures proper layout within the tab

2. **Component Order**
   - ChatHeader (flex-shrink-0)
   - ChatMessageList (flex-1 overflow-y-auto)
   - ChatInput (flex-shrink-0)
   - DiagramModal (outside layout flow, uses portal)

**Step 6.4: Import All Child Components**

1. **Create Index File (Optional)**
   - `src/components/modeler/magic-map/index.ts`
   - Re-exports all components for cleaner imports

2. **Import Statements**
   - ChatHeader, ChatMessageList, ChatInput, DiagramModal
   - All from `./magic-map/` folder

**Step 6.5: Verify Styling**

1. **Check Container Height**
   - Parent (`TabsContent`) should have proper height
   - Use browser DevTools to verify flex layout working

2. **Check Scroll Behavior**
   - Messages should scroll independently
   - Input should stay fixed at bottom

---

## Phase 7: Testing & Polish (0.5h)

### Research Notes

**7.1 Test Scenarios**

Must test these flows before demo:
1. **Happy Path**: Type description → Generate diagram → Create process → Edit in modeler
2. **Follow-up Modification**: Generate → Ask for change → Get updated diagram → Create
3. **Example Prompts**: Click each of 3 examples → Each generates valid diagram
4. **Error Recovery**: Test with invalid prompt → Get friendly error → Retry works
5. **Message Limit**: Send 5 messages → Input disabled with correct message
6. **Start Fresh**: After limit reached → Click Start Fresh → Can send again

**7.2 Performance Targets**

- Diagram generation: <8 seconds
- Process creation + modeler load: <12 seconds
- No lag when typing in input
- Animations at 60fps

**7.3 Common Issues to Check**

- bpmn-js memory leaks (viewer not destroyed)
- Stale closures in callbacks
- React hydration mismatches
- Console errors during any flow
- Mobile/responsive issues (even if not primary target)

---

### Phase 7: Step-by-Step Testing Checklist

**Step 7.1: Test Happy Path**

1. Open modeler, select a playbook
2. Click "AI Magic Map" tab
3. See welcome message with examples
4. Type: "Simple patient registration process"
5. Click Send
6. Verify: Thinking animation appears (~3-8s)
7. Verify: Diagram preview appears in chat
8. Click diagram to expand
9. Verify: Modal opens with larger diagram
10. Click "Create as New Process"
11. Enter name: "Test Magic Map Process"
12. Click confirm
13. Verify: Modal closes, sidebar refreshes, diagram loads in modeler
14. Verify: Can edit diagram (add/move nodes)

**Step 7.2: Test Follow-up Modifications**

1. Generate a diagram (same as above)
2. Type: "Add a notification step at the end"
3. Click Send
4. Verify: New diagram appears (should have extra node)
5. Verify: Both diagrams visible in chat history

**Step 7.3: Test Example Prompts**

1. Click "Start Fresh" to clear chat
2. Click first example button
3. Verify: Diagram generates successfully
4. Repeat for examples 2 and 3

**Step 7.4: Test Error Handling**

1. Disconnect network (or mock API failure)
2. Try to generate
3. Verify: Friendly error message appears
4. Verify: Can retry after reconnecting

**Step 7.5: Test Message Limit**

1. Send 5 messages (generating diagrams each time)
2. Verify: After 5th, input is disabled
3. Verify: Message explains to start fresh
4. Click "Start Fresh"
5. Verify: Can send messages again

**Step 7.6: Test Magic Prompt Enhancement**

1. Type vague prompt: "patient visit"
2. Click "✨ Enhance"
3. Verify: Enhanced prompt appears in input field
4. Verify: Can edit before sending
5. Send and verify diagram generates

**Step 7.7: Verify Animations**

1. Watch message appear animation (fade + slide)
2. Watch thinking dots (bouncing)
3. Watch diagram appear (scale up)
4. Watch form reveal in modal (height expand)
5. All should be smooth (no jank)

**Step 7.8: Console Error Check**

1. Open browser DevTools Console
2. Run through entire happy path
3. Verify: No red errors
4. Verify: No excessive warning spam

**Step 7.9: Deploy & Test on Vercel**

1. Push changes
2. Wait for Vercel deployment
3. Open production URL
4. Run through happy path again
5. Verify: Works identically to localhost
6. Check: No CORS or env variable issues

**Step 7.10: Final Polish**

1. Check all copy/text for typos
2. Verify colors match design system
3. Check spacing is consistent
4. Test with both short and long process descriptions
5. Verify XML doesn't break with special characters in names

---

## File Changes Summary

### New Files (12 files)

| File | Purpose |
|------|---------|
| `src/app/api/magic-map/enhance/route.ts` | Magic Prompt API |
| `src/app/api/magic-map/generate/route.ts` | BPMN generation API |
| `src/app/api/magic-map/create-process/route.ts` | Process creation API |
| `src/components/modeler/magic-map/MagicMapContext.tsx` | Chat state management |
| `src/components/modeler/magic-map/types.ts` | TypeScript interfaces |
| `src/components/modeler/magic-map/ChatHeader.tsx` | Header with reset |
| `src/components/modeler/magic-map/ChatMessageList.tsx` | Message container |
| `src/components/modeler/magic-map/WelcomeMessage.tsx` | Initial message |
| `src/components/modeler/magic-map/ChatInput.tsx` | Input with enhance |
| `src/components/modeler/magic-map/DiagramPreview.tsx` | Mini viewer |
| `src/components/modeler/magic-map/DiagramModal.tsx` | Full viewer modal |
| `src/components/modeler/magic-map/ThinkingMessage.tsx` | Loading animation |

### Modified Files (3 files)

| File | Changes |
|------|---------|
| `src/components/modeler/MagicMapTab.tsx` | Complete rewrite - compose chat components |
| `src/components/modeler/NodeDetailsPanel.tsx` | Add props (playbookId, onProcessCreated), wrap with MagicMapProvider |
| `src/app/modeler/page.tsx` | Add handleMagicMapProcessCreated callback, pass new props to NodeDetailsPanel |

---

## Environment Variables

Add to `.env.local`:
```
OPENAI_API_KEY=sk-...
```

---

## Prompts Library

### BPMN Generation System Prompt

```
You are a BPMN 2.0 diagram generator. Your job is to create valid BPMN XML from natural language process descriptions.

RULES:
1. Generate ONLY the process definition (no BPMNDiagram section - auto-layout adds it)
2. Always include exactly ONE startEvent
3. Connect ALL elements with sequenceFlow
4. Use exclusiveGateway for decisions (if/else)
5. Use parallelGateway for parallel tasks (and)
6. Every element must have incoming/outgoing references
7. Use bpmn2: namespace prefix

When modifying a previous diagram:
- Keep the same structure but apply the requested changes
- Preserve element IDs where possible
- Output the complete updated XML

OUTPUT FORMAT:
Return ONLY the XML, no explanations. Start with <?xml and end with </bpmn2:definitions>
```

### Magic Prompt Enhancement Prompt

```
You are a BPMN prompt optimizer. Take the user's process description and enhance it for better diagram generation.

Guidelines:
1. Clarify vague steps into specific tasks
2. Identify decision points and make them explicit
3. Identify parallel activities
4. Add start and end conditions
5. Keep it concise (max 3 sentences)

Example:
Input: "patient registration"
Output: "Patient registration workflow: 1) Collect patient information, 2) Verify insurance eligibility (if eligible proceed, otherwise request self-pay), 3) Assign patient ID and room number, 4) Notify nursing staff."

Return ONLY the enhanced prompt, no explanations.
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| OpenAI rate limits | Use gpt-4o-mini (generous limits), add retry logic |
| Invalid XML from AI | Auto-retry with simpler prompt, graceful error |
| bpmn-auto-layout fails | Catch error, show friendly message |
| Slow generation | Show engaging loading animation |
| Token limits (5 messages) | Enforce limit, clear guidance message |
| Unauthenticated access | All API routes use `requireUser()` check |
| Context lost on tab switch | Provider at NodeDetailsPanel level (survives tab switches) |

---

## Demo Script Alignment

After implementation, demo will flow:

1. Open modeler, select a playbook
2. Click "AI Magic Map" tab in right sidebar
3. See welcome message with 3 example buttons
4. Click example: "Cervical cancer screening workflow"
5. Watch thinking animation (3-5s)
6. Diagram appears in chat! Click to expand
7. Say: "Add a follow-up appointment task"
8. AI modifies diagram
9. Click "Create as New Process"
10. Enter name, diagram loads in modeler
11. Show it's editable, can add documentation

---

## Success Metrics

- [ ] Generate diagram in <8s
- [ ] Create process in <12s
- [ ] 0 console errors during demo
- [ ] Smooth 60fps animations
- [ ] All generated diagrams are valid
- [ ] Follow-up modifications work
- [ ] Graceful error handling

---

**Ready to implement! Start with Phase 1: Setup & API Routes**
