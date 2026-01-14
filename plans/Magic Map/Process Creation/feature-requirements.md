# Magic Map - Process Creation Feature Requirements

> **Version**: 1.0 (Demo Ready)  
> **Last Updated**: January 14, 2026  
> **Target**: Wednesday Demo (10 hours)

---

## Overview

Magic Map is an AI-powered chat interface that generates BPMN process diagrams from natural language descriptions. Users can iterate on diagrams through conversation, then create them as editable processes.

---

## Core Features

### 1. Chat Interface

| Requirement | Details |
|-------------|---------|
| **Session Persistence** | Chat persists during session, clears on page reload |
| **Message Limit** | 5 messages per conversation |
| **Limit Behavior** | After 5 messages: grey out input, show "For accurate diagram creation, please start a new chat" |
| **Start Fresh** | Button to clear chat and begin new conversation |

### 2. Welcome Experience

| Requirement | Details |
|-------------|---------|
| **Welcome Message** | Clear instructions on how to use Magic Map |
| **Example Prompts** | 3 pre-baked healthcare example buttons |
| **Examples** | 1. Patient registration workflow |
|  | 2. Cervical cancer screening with decision points |
|  | 3. Site assessment with parallel tasks |

### 3. Magic Prompt (Enhancement)

| Requirement | Details |
|-------------|---------|
| **Trigger** | "✨ Enhance" button inside/near text field |
| **Behavior** | Click → Enhances user's text → Puts enhanced text BACK in input field |
| **User Control** | User can further edit enhanced prompt before sending |
| **Purpose** | Upgrades vague descriptions into BPMN-optimized prompts |

### 4. Magic Map (Generation)

| Requirement | Details |
|-------------|---------|
| **Trigger** | User submits message (Enter or Send button) |
| **Process** | 1. Show thinking animation |
|  | 2. Call OpenAI API with conversation history |
|  | 3. Extract XML from response |
|  | 4. Run bpmn-auto-layout |
|  | 5. Validate XML |
|  | 6. If invalid: auto-retry with simplified prompt |
|  | 7. Return valid diagram |
| **Target Time** | <8 seconds |

### 5. Follow-up Modifications

| Requirement | Details |
|-------------|---------|
| **Enabled** | Yes - users can ask to modify previous diagram |
| **Examples** | "Add a notification step at the end" |
|  | "Remove the eligibility check" |
|  | "Rename 'Task 1' to 'Patient Intake'" |
| **Context** | Full conversation history sent to AI |
| **Limit** | 5 total messages (including modifications) |

### 6. Diagram Preview (View-Only)

| Requirement | Details |
|-------------|---------|
| **Display** | Small diagram preview embedded in chat message |
| **Size** | Fixed size appropriate for chat (e.g., 300x200) |
| **Interaction** | Click to expand into modal |
| **Modal** | Larger view-only diagram, close button |
| **Renderer** | bpmn-js in view-only mode |

### 7. Create Process Action

| Requirement | Details |
|-------------|---------|
| **Button** | "Create as New Process" appears after valid diagram |
| **Flow** | 1. Button clicked |
|  | 2. Text field animates in (for process name) |
|  | 3. User enters name, confirms |
|  | 4. Show loading state |
|  | 5. Create Process in database |
|  | 6. Optimistic update in Macro Sidebar |
|  | 7. Load diagram into Modeler |
|  | 8. Save to database |
|  | 9. User can now edit |
| **Target Time** | <12 seconds total |

---

## Error Handling

### Validation & Retry

| Scenario | Behavior |
|----------|----------|
| **Invalid XML from AI** | Auto-retry with simplified prompt (1 attempt) |
| **Second failure** | Show friendly error: "I couldn't create a valid diagram. Try a simpler description." |
| **Network error** | Show retry button: "Connection issue. Tap to retry." |

### Invalid Requests

| Scenario | Behavior |
|----------|----------|
| **Non-diagram request** | "I'm designed to create process diagrams. Try describing a workflow like: 'Patient registration with eligibility check'" |
| **Examples** | "What is 5+5?" → Rejected with guidance |
|  | "Research X for me" → Rejected with guidance |
| **Empty input** | Prevent submission |

### User Feedback

| Principle | Implementation |
|-----------|----------------|
| **Never show raw errors** | All errors have friendly messages |
| **Always provide next step** | Error messages include what to do |
| **Tone** | Professional but friendly |

---

## UI/UX Requirements

### Animations (Framer Motion)

| Element | Animation |
|---------|-----------|
| **New message** | Fade in + slide up |
| **Thinking state** | 3 bouncing dots (gold color) |
| **Diagram appear** | Scale 0.95→1 + fade in |
| **Process name field** | Height expand animation |
| **Button hover** | Scale 1.02 + subtle shadow |

### Loading States

| State | Display |
|-------|---------|
| **Generating** | "✨ Creating your diagram..." with thinking dots |
| **Enhancing** | "✨ Enhancing your prompt..." |
| **Creating process** | "Setting up your process..." with progress feel |

### Layout

```
┌─────────────────────────────────────┐
│  Magic Map ✨        [Start Fresh]  │  ← Header
├─────────────────────────────────────┤
│                                     │
│  🤖 Welcome! Describe a process...  │  ← Messages
│     [Example 1] [Example 2] [Ex 3]  │
│                                     │
│  👤 Create patient registration...  │
│                                     │
│  🤖 Here's your diagram:            │
│  ┌─────────────────────────────┐   │
│  │   [DIAGRAM PREVIEW]         │   │  ← Click to expand
│  └─────────────────────────────┘   │
│  [Create as New Process]            │
│                                     │
├─────────────────────────────────────┤
│  [✨ Enhance]                       │  ← Enhancement button
│  ┌─────────────────────────────┐   │
│  │ Describe your process...  ➤│   │  ← Input
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## Acceptance Criteria

| Criteria | Target |
|----------|--------|
| Diagram generation time | <8 seconds |
| Process creation + modeler load | <12 seconds |
| Chat responsiveness | 60fps, no lag |
| All generated diagrams | Must be valid BPMN |
| Error handling | Graceful, no raw errors |
| Follow-up modifications | Working for 5 messages |
| Example prompts | 3 clickable examples |
| Animations | Smooth, professional |

---

## Out of Scope (Post-Demo)

| Feature | Reason |
|---------|--------|
| Overwrite current process | Risk of demo disaster, complexity |
| Database-persisted chat | Not needed for 15min demo |
| Copy XML button | Power user feature, not demo priority |
| More than 5 messages | Token control, quality assurance |

---

## Technical Architecture

### API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/magic-map/enhance` | Magic Prompt enhancement |
| `POST /api/magic-map/generate` | Generate/modify BPMN diagram |
| `POST /api/magic-map/create-process` | Create process from diagram |

### Data Flow

```
User Input
    ↓
[Optional: Enhance] → Return to input field
    ↓
Submit Message
    ↓
/api/magic-map/generate
    ↓
OpenAI API (with conversation history)
    ↓
bpmn-auto-layout
    ↓
Validate XML
    ↓ (if invalid, retry once with simpler prompt)
Return valid diagram
    ↓
Display in chat
    ↓
[Create as New Process]
    ↓
/api/magic-map/create-process
    ↓
Load in Modeler
```

### State Management

```typescript
interface MagicMapState {
  messages: ChatMessage[];
  isGenerating: boolean;
  isEnhancing: boolean;
  currentXml: string | null;
  messageCount: number;  // Track for 5-message limit
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  xml?: string;          // Attached diagram XML
  isLoading?: boolean;
  timestamp: Date;
}
```

---

## Dependencies

| Package | Purpose | Status |
|---------|---------|--------|
| `openai` | AI generation | Need to install |
| `bpmn-auto-layout` | Diagram layout | Need to install |
| `bpmn-js` | Diagram viewer | Already installed |
| `framer-motion` | Animations | Already installed |

---

## Questions Answered

**Q: Suggest process name or empty?**  
A: Empty - user chooses name (faster to implement, user control)

**Q: Error message tone?**  
A: Professional but friendly: "I couldn't create that diagram. Try describing a simpler workflow."

**Q: How does AI handle follow-ups?**  
A: Full conversation history sent with each request. System prompt instructs AI to modify previous XML based on latest user message.
