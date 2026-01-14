/**
 * Magic Map - Generate BPMN Diagram API Route
 * Generates BPMN 2.0 XML from natural language using OpenAI
 * AI generates complete XML with positioning (process + diagram sections)
 */

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createApiClient } from '@/utils/supabase/server';
import { handleApiError } from '@/lib/api-utils';

// Helper to require authentication
async function requireUser() {
  const supabase = await createApiClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  return user;
}

// Extract process name and XML from AI response
function extractProcessNameAndXml(content: string): { processName: string; xml: string } {
  // Extract process name from first line (format: "PROCESS_NAME: Name Here")
  const nameMatch = content.match(/PROCESS_NAME:\s*(.+)/i);
  const processName = nameMatch ? nameMatch[1].trim() : 'New Process';
  
  // Remove markdown code fences if present
  const cleaned = content.replace(/```xml\n?/g, '').replace(/```\n?/g, '');
  
  // Extract XML block (support both Definitions and definitions for compatibility)
  const xmlMatch = cleaned.match(/<\?xml[\s\S]*?<\/bpmn:Definitions>/i);
  
  if (!xmlMatch) {
    throw new Error('No valid XML found in AI response');
  }
  
  let xml = xmlMatch[0];
  
  // CRITICAL: Clean invisible characters that break bpmn-moddle parsing
  // Remove BOM (Byte Order Mark)
  xml = xml.replace(/^\uFEFF/, '');
  // Remove zero-width spaces
  xml = xml.replace(/[\u200B-\u200D\uFEFF]/g, '');
  // Normalize whitespace but preserve XML structure
  xml = xml.trim();
  
  return { processName, xml };
}

// Validate BPMN XML structure (enhanced to check for diagram section)
async function validateBpmnXml(xml: string): Promise<boolean> {
  try {
    // Check for required process elements (support both Definitions and definitions for compatibility)
    const hasDefinitions = xml.includes('<bpmn:Definitions') || xml.includes('<bpmn:definitions') || xml.includes('<bpmn2:definitions');
    const hasProcess = xml.includes('<bpmn:process') || xml.includes('<bpmn2:process');
    const hasStartEvent = xml.includes('<bpmn:startEvent') || xml.includes('<bpmn2:startEvent');
    
    // Check for required diagram elements
    const hasDiagram = xml.includes('<bpmndi:BPMNDiagram');
    const hasShape = xml.includes('<bpmndi:BPMNShape');
    const hasEdge = xml.includes('<bpmndi:BPMNEdge');
    
    return hasDefinitions && hasProcess && hasStartEvent && hasDiagram && hasShape && hasEdge;
  } catch {
    return false;
  }
}

// Comprehensive BPMN generation system prompt
const BPMN_SYSTEM_PROMPT = `You are a BPMN 2.0 XML diagram generator. Create valid, complete BPMN diagrams from natural language descriptions.

OUTPUT FORMAT:
You must respond with TWO parts in this EXACT format:
1. First line: "PROCESS_NAME: [3-5 word descriptive process name]"
2. Second part: Complete BPMN XML

Example response format:
PROCESS_NAME: Patient Registration Workflow
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:Definitions ...>
...
</bpmn:Definitions>

PROCESS NAME RULES:
- 3-5 words maximum
- Descriptive and professional
- Title Case (e.g., "Site Selection Process", "HPV Test Workflow")
- No generic names like "Process_1" or "My Process"
- Focus on the main business activity

CRITICAL RULES:
1. Generate COMPLETE XML with BOTH process definition AND diagram positioning (BPMNDiagram section)
2. Always include EXACTLY ONE startEvent
3. Connect ALL elements with sequenceFlow - NO ORPHANED ELEMENTS
4. Use exclusiveGateway for if/else decisions (MUST converge paths back together)
5. Use parallelGateway for parallel/simultaneous tasks
6. Every element MUST have incoming/outgoing references (except start has no incoming, end has no outgoing)
7. IMPORTANT: Use bpmn: namespace prefix (NOT bpmn2:) for process elements
8. Use element IDs like: StartEvent_1, Task_1, Gateway_1, Flow_1, EndEvent_1

ELEMENT TYPES:
- startEvent: Process entry (only ONE per diagram)
- task: Generic work step
- exclusiveGateway: XOR decision (one path taken) - MUST merge back
- parallelGateway: AND split/merge (all paths taken)
- endEvent: Process exit (can have multiple)
- sequenceFlow: Connects elements (sourceRef and targetRef)

DIAGRAM POSITIONING RULES:
1. Layout: Horizontal left-to-right flow
2. Starting point: (100, 100)
3. Element spacing: 150px horizontally between centers
4. Keep Y-axis aligned for linear flows

STANDARD DIMENSIONS:
- Start Event: width="36" height="36" (circle)
- Task: width="100" height="80" (rectangle)
- Exclusive Gateway: width="50" height="50" (diamond, add isMarkerVisible="true")
- Parallel Gateway: width="50" height="50" (diamond, add isMarkerVisible="true")
- End Event: width="36" height="36" (circle)

COORDINATE CALCULATION:
For linear sequence (element at position N, 0-indexed):
- X = 100 + (N × 150)
- Y = 100 (same for all)
- Shape ID = ElementID + "_di"

GATEWAY PATTERNS (CRITICAL - MUST FOLLOW):
Pattern 1: Exclusive Gateway (Decision Point)
  Structure: Gateway splits → Both paths do tasks → Paths merge before End
  
  Example positions (assuming gateway at position 2):
  - Gateway: (400, 75) - centered on Y=100
  - Top task: (550, 20) - Y = 100 - 80 = 20
  - Bottom task: (550, 140) - Y = 100 + 80 = 220
  - Merge point: (700, 100) - back to center, or directly to End
  
  Waypoint rules for splits:
  - Gateway to Top Task: (425, 100) → (425, 60) → (550, 60)
  - Gateway to Bottom Task: (425, 100) → (425, 180) → (550, 180)
  
  Waypoint rules for merges (both tasks converge):
  - Top Task to End: (650, 60) → (700, 60) → (700, 100) → (End X, 100)
  - Bottom Task to End: (650, 180) → (700, 180) → (700, 100) → (End X, 100)

Pattern 2: Parallel Gateway (Simultaneous Tasks)
  Same positioning as exclusive, but ALL paths execute and merge
  
VALIDATION CHECKLIST:
- ✓ Every gateway has equal number of outgoing and converging paths
- ✓ All branches eventually connect to a common element or End
- ✓ No floating tasks or disconnected elements
- ✓ Waypoints show clear visual split and merge

EDGE WAYPOINTS (BPMNEdge):
For LINEAR connections (no branching):
- ID = FlowID + "_di"
- bpmnElement = FlowID
- Just 2 waypoints: source center-right → target center-left
- Example: <di:waypoint x="136" y="100" /> <di:waypoint x="200" y="100" />

For GATEWAY splits (branching):
- Add intermediate waypoints to show clear visual separation
- Use 3-4 waypoints per branch to create smooth curves
- Ensure proper merge back to centerline (Y=100)

COMPLETE XML STRUCTURE (COPY THIS EXACTLY):
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:Definitions 
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="Definitions_1"
  targetNamespace="http://bpmn.io/schema/bpmn">
  
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Start">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    
    <bpmn:task id="Task_1" name="Task Name">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    
    <bpmn:endEvent id="EndEvent_1" name="End">
      <bpmn:incoming>Flow_2</bpmn:incoming>
    </bpmn:endEvent>
    
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1" />
  </bpmn:process>
  
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="100" y="82" width="36" height="36" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
        <dc:Bounds x="200" y="60" width="100" height="80" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="350" y="82" width="36" height="36" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="136" y="100" />
        <di:waypoint x="200" y="100" />
      </bpmndi:BPMNEdge>
      
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="300" y="100" />
        <di:waypoint x="350" y="100" />
      </bpmndi:BPMNEdge>
      
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
  
</bpmn:Definitions>

CRITICAL NAMESPACE NOTES:
- ROOT ELEMENT: <bpmn:Definitions> with CAPITAL D (NOT <bpmn:definitions> lowercase)
- Use <bpmn:process> NOT <bpmn2:process>
- Use <bpmn:startEvent> NOT <bpmn2:startEvent>
- Use <dc:Bounds> for shapes (NOT omg:Bounds)
- Use <di:waypoint> for edges (NOT omg:waypoint)
- Process elements: bpmn: prefix with camelCase
- Diagram shapes: bpmndi: prefix with dc:Bounds
- Diagram edges: bpmndi: prefix with di:waypoint

POSITIONING NOTES:
- Center Y-axis: For 36px high elements use y=82 (100-18), for 80px high use y=60 (100-40), for 50px use y=75 (100-25)
- This centers all elements around Y=100 horizontal line
- Waypoints always use center coordinates for clean connections

When modifying existing diagrams:
- Keep the same structure and namespaces
- Apply the requested changes
- Update BOTH process and diagram sections
- Output the complete updated XML

OUTPUT FORMAT:
Return ONLY the complete XML. No explanations, no markdown, no extra text. Start with <?xml and end with </bpmn:Definitions> (capital D). Include BOTH process and diagram sections. Use correct namespaces: <bpmn:Definitions> root (capital D), bpmn: prefix (not bpmn2:), dc:Bounds (not omg:Bounds), di:waypoint (not omg:waypoint).`;

// POST /api/magic-map/generate
export async function POST(req: Request) {
  try {
    // 1. Authentication
    await requireUser();
    
    // 2. Request parsing
    const body = await req.json();
    const { messages } = body;
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array required' },
        { status: 400 }
      );
    }
    
    // 3. OpenAI client setup
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }
    
    const openai = new OpenAI({ apiKey });
    
    // 4. First attempt - generate diagram
    let attempt = 1;
    let xml: string | null = null;
    let processName: string = 'New Process';
    let isValid = false;
    
    while (attempt <= 2 && !isValid) {
      try {
        // Determine messages to send
        const messagesToSend = attempt === 1 
          ? messages 
          : [{
              role: 'user' as const,
              content: 'Create a simple linear process with 3-5 steps based on the previous request'
            }];
        
        // 5. Call OpenAI
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: BPMN_SYSTEM_PROMPT },
            ...messagesToSend
          ],
          max_tokens: 2500,
          temperature: 0.3
        });
        
        const responseContent = completion.choices[0]?.message?.content;
        
        if (!responseContent) {
          throw new Error('Empty response from OpenAI');
        }
        
        // 6. Extract process name and XML
        const extracted = extractProcessNameAndXml(responseContent);
        xml = extracted.xml;
        processName = extracted.processName;
        
        // 7. Validate (AI generates complete XML with positioning)
        isValid = await validateBpmnXml(xml || '');
        
        if (!isValid && attempt === 1) {
          console.log('[Magic Map] First attempt invalid, retrying with simpler prompt');
          attempt++;
        } else {
          break;
        }
        
      } catch (error: any) {
        if (attempt === 2) {
          throw error;
        }
        console.error('[Magic Map] Attempt', attempt, 'failed:', error.message);
        attempt++;
      }
    }
    
    // 9. Return response
    if (!xml || !isValid) {
      return NextResponse.json({
        xml: null,
        processName: null,
        valid: false,
        error: "I couldn't create a valid diagram. Try describing a simpler workflow with clear steps."
      }, { status: 200 }); // Return 200 with error message for graceful frontend handling
    }
    
    return NextResponse.json({
      xml,
      processName,
      valid: true,
      message: 'Diagram created successfully'
    });
    
  } catch (error: any) {
    console.error('[Magic Map Generate] Error:', error);
    
    // Friendly error messages
    if (error.message === 'User not authenticated') {
      return NextResponse.json(
        { error: 'Please sign in to use Magic Map' },
        { status: 401 }
      );
    }
    
    if (error.message?.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429 }
      );
    }
    
    return handleApiError(error, 'Error generating diagram');
  }
}
