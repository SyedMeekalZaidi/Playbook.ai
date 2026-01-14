# BPMN 2.0 Complete Guide for AI Generation



> **Purpose**: This document provides comprehensive context for AI to generate valid, bug-free BPMN 2.0 XML. Every rule here is critical for Magic Map accuracy.



---



## 1. BPMN XML Structure Overview



### 1.1 Core Document Structure



Every BPMN file has **two main sections**:

1. **Process Definition** - The logical workflow (elements + connections)

2. **Diagram Definition (DI)** - The visual layout (shapes + edges)



```xml

<?xml version="1.0" encoding="UTF-8"?>

<bpmn2:definitions

  xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL"

  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"

  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"

  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"

  id="Definitions_1"

  targetNamespace="http://bpmn.io/schema/bpmn">

 

  <!-- SECTION 1: Process Definition (Logic) -->

  <bpmn2:process id="Process_1" isExecutable="false">

    <!-- Flow nodes and sequence flows go here -->

  </bpmn2:process>

 

  <!-- SECTION 2: Diagram Definition (Visual) -->

  <bpmndi:BPMNDiagram id="BPMNDiagram_1">

    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">

      <!-- Shapes and edges go here -->

    </bpmndi:BPMNPlane>

  </bpmndi:BPMNDiagram>

 

</bpmn2:definitions>

```



### 1.2 Namespace Variations (All Valid)



AI may encounter different namespace prefixes. These are all equivalent:



| Prefix Style | Example | Notes |

|--------------|---------|-------|

| `bpmn2:` | `<bpmn2:task>` | Common in Camunda |

| `bpmn:` | `<bpmn:task>` | Also common |

| `semantic:` | `<semantic:task>` | Older tools |

| No prefix | `<task>` | When default namespace used |



**For Magic Map**: Always use `bpmn2:` prefix for consistency with our existing codebase.



---



## 2. BPMN Element Types (Complete Reference)



### 2.1 Events (Start, Intermediate, End)



Events represent something that happens during a process.



#### Start Events (Process entry points)

```xml

<!-- Simple Start Event (most common) -->

<bpmn2:startEvent id="StartEvent_1" name="Process Started">

  <bpmn2:outgoing>Flow_1</bpmn2:outgoing>

</bpmn2:startEvent>



<!-- Message Start Event (triggered by message) -->

<bpmn2:startEvent id="StartEvent_1" name="Order Received">

  <bpmn2:outgoing>Flow_1</bpmn2:outgoing>

  <bpmn2:messageEventDefinition />

</bpmn2:startEvent>



<!-- Timer Start Event (scheduled) -->

<bpmn2:startEvent id="StartEvent_1" name="Daily at 9am">

  <bpmn2:outgoing>Flow_1</bpmn2:outgoing>

  <bpmn2:timerEventDefinition />

</bpmn2:startEvent>

```



#### End Events (Process exit points)

```xml

<!-- Simple End Event (most common) -->

<bpmn2:endEvent id="EndEvent_1" name="Process Complete">

  <bpmn2:incoming>Flow_5</bpmn2:incoming>

</bpmn2:endEvent>



<!-- Terminate End Event (stops all parallel flows) -->

<bpmn2:endEvent id="EndEvent_1" name="Abort All">

  <bpmn2:incoming>Flow_5</bpmn2:incoming>

  <bpmn2:terminateEventDefinition />

</bpmn2:endEvent>

```



#### Visual Dimensions

| Event Type | Width | Height |

|------------|-------|--------|

| All Events | 36 | 36 |



### 2.2 Activities (Tasks)



Tasks are work units in the process.



```xml

<!-- Generic Task (most common for Magic Map) -->

<bpmn2:task id="Task_1" name="Review Application">

  <bpmn2:incoming>Flow_1</bpmn2:incoming>

  <bpmn2:outgoing>Flow_2</bpmn2:outgoing>

</bpmn2:task>



<!-- User Task (requires human action) -->

<bpmn2:userTask id="UserTask_1" name="Approve Request">

  <bpmn2:incoming>Flow_1</bpmn2:incoming>

  <bpmn2:outgoing>Flow_2</bpmn2:outgoing>

</bpmn2:userTask>



<!-- Service Task (automated) -->

<bpmn2:serviceTask id="ServiceTask_1" name="Send Email">

  <bpmn2:incoming>Flow_1</bpmn2:incoming>

  <bpmn2:outgoing>Flow_2</bpmn2:outgoing>

</bpmn2:serviceTask>



<!-- Manual Task (offline work) -->

<bpmn2:manualTask id="ManualTask_1" name="Physical Inspection">

  <bpmn2:incoming>Flow_1</bpmn2:incoming>

  <bpmn2:outgoing>Flow_2</bpmn2:outgoing>

</bpmn2:manualTask>

```



#### Visual Dimensions

| Task Type | Width | Height |

|-----------|-------|--------|

| All Tasks | 100 | 80 |



### 2.3 Gateways (Decision Points)



Gateways control flow branching and merging.



```xml

<!-- Exclusive Gateway (XOR) - Only ONE path taken -->

<bpmn2:exclusiveGateway id="Gateway_1" name="Approved?">

  <bpmn2:incoming>Flow_1</bpmn2:incoming>

  <bpmn2:outgoing>Flow_Yes</bpmn2:outgoing>

  <bpmn2:outgoing>Flow_No</bpmn2:outgoing>

</bpmn2:exclusiveGateway>



<!-- Parallel Gateway (AND) - ALL paths taken simultaneously -->

<bpmn2:parallelGateway id="Gateway_2" name="">

  <bpmn2:incoming>Flow_1</bpmn2:incoming>

  <bpmn2:outgoing>Flow_A</bpmn2:outgoing>

  <bpmn2:outgoing>Flow_B</bpmn2:outgoing>

</bpmn2:parallelGateway>



<!-- Inclusive Gateway (OR) - ONE or MORE paths taken -->

<bpmn2:inclusiveGateway id="Gateway_3" name="Select Options">

  <bpmn2:incoming>Flow_1</bpmn2:incoming>

  <bpmn2:outgoing>Flow_A</bpmn2:outgoing>

  <bpmn2:outgoing>Flow_B</bpmn2:outgoing>

</bpmn2:inclusiveGateway>



<!-- Event-Based Gateway - Wait for first event -->

<bpmn2:eventBasedGateway id="Gateway_4" name="">

  <bpmn2:incoming>Flow_1</bpmn2:incoming>

  <bpmn2:outgoing>Flow_Timer</bpmn2:outgoing>

  <bpmn2:outgoing>Flow_Message</bpmn2:outgoing>

</bpmn2:eventBasedGateway>

```



#### Visual Dimensions

| Gateway Type | Width | Height |

|--------------|-------|--------|

| All Gateways | 50 | 50 |



### 2.4 Sequence Flows (Connections)



Connect elements in execution order.



```xml

<!-- Basic Sequence Flow -->

<bpmn2:sequenceFlow

  id="Flow_1"

  sourceRef="StartEvent_1"

  targetRef="Task_1" />



<!-- Named Sequence Flow (for gateway branches) -->

<bpmn2:sequenceFlow

  id="Flow_Yes"

  name="Yes"

  sourceRef="Gateway_1"

  targetRef="Task_2" />



<!-- Conditional Sequence Flow -->

<bpmn2:sequenceFlow

  id="Flow_No"

  name="No"

  sourceRef="Gateway_1"

  targetRef="Task_3" />

```



---



## 3. Diagram Information (Visual Layout)



### 3.1 Shape Definitions



Every element needs a corresponding shape in the DI section.



```xml

<bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">

  <dc:Bounds x="182" y="82" width="36" height="36" />

</bpmndi:BPMNShape>



<bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">

  <dc:Bounds x="270" y="60" width="100" height="80" />

</bpmndi:BPMNShape>



<bpmndi:BPMNShape id="Gateway_1_di" bpmnElement="Gateway_1" isMarkerVisible="true">

  <dc:Bounds x="425" y="75" width="50" height="50" />

</bpmndi:BPMNShape>



<bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">

  <dc:Bounds x="792" y="82" width="36" height="36" />

</bpmndi:BPMNShape>

```



### 3.2 Edge Definitions (Connections)



```xml

<bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">

  <di:waypoint x="218" y="100" />

  <di:waypoint x="270" y="100" />

</bpmndi:BPMNEdge>



<!-- Edge with label (for gateway branches) -->

<bpmndi:BPMNEdge id="Flow_Yes_di" bpmnElement="Flow_Yes">

  <di:waypoint x="475" y="100" />

  <di:waypoint x="530" y="100" />

  <bpmndi:BPMNLabel>

    <dc:Bounds x="490" y="82" width="20" height="14" />

  </bpmndi:BPMNLabel>

</bpmndi:BPMNEdge>

```



### 3.3 Layout Guidelines



**Horizontal Flow (Left to Right)**:

- Start at x=182 (standard starting point)

- Tasks: spacing of 150-200px between centers

- Events: 36x36 pixels

- Tasks: 100x80 pixels

- Gateways: 50x50 pixels



**Standard Y-coordinates**:

- Main flow: y=100 (center of elements)

- Alternative paths: y=200, y=300 (offset by ~100px)



---



## 4. Critical Rules for Valid BPMN



### 4.1 ID Rules (MUST FOLLOW)

```

✅ VALID IDs:

- StartEvent_1, Task_1, Gateway_1, Flow_1

- Activity_abc123, Event_xyz

- Process_1, BPMNDiagram_1, BPMNPlane_1



❌ INVALID IDs:

- 1_Task (cannot start with number)

- Task 1 (no spaces)

- Task-1 (avoid hyphens, use underscores)

```



### 4.2 Connection Rules (MUST FOLLOW)



**Every element must be properly connected:**



```

✅ Start Event:

- 0 incoming flows

- 1+ outgoing flows (typically 1)



✅ End Event:

- 1+ incoming flows (typically 1)

- 0 outgoing flows



✅ Tasks:

- 1+ incoming flows

- 1+ outgoing flows



✅ Gateways:

- Split: 1 incoming, 2+ outgoing

- Merge: 2+ incoming, 1 outgoing

- Can be both (decision + merge)

```



### 4.3 Flow Reference Rules



**Sequence flows must match element references:**



```xml

<!-- Task must reference the flow -->

<bpmn2:task id="Task_1">

  <bpmn2:incoming>Flow_1</bpmn2:incoming>  <!-- Must match flow id -->

  <bpmn2:outgoing>Flow_2</bpmn2:outgoing>

</bpmn2:task>



<!-- Flow must reference the task -->

<bpmn2:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />

<bpmn2:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="Gateway_1" />

```



### 4.4 DI-Element Correspondence



**Every process element needs a DI shape/edge:**



```

Process Element → DI Element

─────────────────────────────

StartEvent_1   → BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1"

Task_1         → BPMNShape id="Task_1_di" bpmnElement="Task_1"

Flow_1         → BPMNEdge id="Flow_1_di" bpmnElement="Flow_1"

```



---



## 5. Common BPMN Patterns



### 5.1 Linear Flow (Simplest)

```

Start → Task → End

```



```xml

<bpmn2:process id="Process_1" isExecutable="false">

  <bpmn2:startEvent id="StartEvent_1">

    <bpmn2:outgoing>Flow_1</bpmn2:outgoing>

  </bpmn2:startEvent>

  <bpmn2:task id="Task_1" name="Do Work">

    <bpmn2:incoming>Flow_1</bpmn2:incoming>

    <bpmn2:outgoing>Flow_2</bpmn2:outgoing>

  </bpmn2:task>

  <bpmn2:endEvent id="EndEvent_1">

    <bpmn2:incoming>Flow_2</bpmn2:incoming>

  </bpmn2:endEvent>

  <bpmn2:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />

  <bpmn2:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1" />

</bpmn2:process>

```



### 5.2 Decision Pattern (XOR Split/Merge)

```

Start → Task → Gateway(?) → [Yes] → Task_A → Gateway(merge) → End

                         → [No]  → Task_B ↗

```



### 5.3 Parallel Pattern (AND Split/Merge)

```

Start → Gateway(+) → Task_A → Gateway(+) → End

                  → Task_B ↗

```



### 5.4 Loop Pattern

```

Start → Task → Gateway(?) → [Retry] → Task (loop back)

                         → [Done]  → End

```



---



## 6. Magic Map AI Prompt Guidelines



### 6.1 For Simple Processes



When user describes: "Register patient, check eligibility, assign room"



**AI should generate:**

1. Start Event

2. Task: "Register Patient"

3. Task: "Check Eligibility"

4. Task: "Assign Room"

5. End Event

6. Linear sequence flows connecting all



### 6.2 For Decision Processes



When user describes: "If patient eligible, proceed. Otherwise, reject."



**AI should generate:**

1. Start Event

2. Task before decision

3. Exclusive Gateway with question as name

4. Two outgoing flows with "Yes"/"No" labels

5. Separate tasks for each path

6. Merge gateway (optional) OR separate end events

7. End Event(s)



### 6.3 For Parallel Processes



When user describes: "Simultaneously prepare room AND notify doctor"



**AI should generate:**

1. Start Event

2. Parallel Gateway (split)

3. Parallel tasks

4. Parallel Gateway (merge)

5. End Event



---



## 7. Minimum Valid BPMN Template



Use this as the base for all Magic Map generation:



```xml

<?xml version="1.0" encoding="UTF-8"?>

<bpmn2:definitions

  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"

  xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL"

  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"

  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"

  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"

  id="Definitions_1"

  targetNamespace="http://bpmn.io/schema/bpmn"

  xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd">

 

  <bpmn2:process id="Process_1" isExecutable="false">

    <!-- Elements go here -->

  </bpmn2:process>

 

  <bpmndi:BPMNDiagram id="BPMNDiagram_1">

    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">

      <!-- Shapes and edges go here -->

    </bpmndi:BPMNPlane>

  </bpmndi:BPMNDiagram>

 

</bpmn2:definitions>

```



---



## 8. Common Mistakes to Avoid



### ❌ Missing DI Information

```xml

<!-- WRONG: Element has no shape -->

<bpmn2:task id="Task_1" name="Do Work" />

<!-- Missing BPMNShape in diagram section -->

```



### ❌ Mismatched References

```xml

<!-- WRONG: Flow references don't match -->

<bpmn2:task id="Task_1">

  <bpmn2:incoming>Flow_99</bpmn2:incoming>  <!-- Flow_99 doesn't exist! -->

</bpmn2:task>

```



### ❌ Orphan Elements

```xml

<!-- WRONG: Task not connected to anything -->

<bpmn2:task id="Task_1" name="Floating Task">

  <!-- No incoming/outgoing flows -->

</bpmn2:task>

```



### ❌ Invalid Gateway Usage

```xml

<!-- WRONG: Exclusive gateway with only 1 outgoing -->

<bpmn2:exclusiveGateway id="Gateway_1">

  <bpmn2:incoming>Flow_1</bpmn2:incoming>

  <bpmn2:outgoing>Flow_2</bpmn2:outgoing>  <!-- Needs 2+ outgoing for decision -->

</bpmn2:exclusiveGateway>

```



### ❌ End Event with Outgoing Flow

```xml

<!-- WRONG: End event can't have outgoing -->

<bpmn2:endEvent id="EndEvent_1">

  <bpmn2:incoming>Flow_1</bpmn2:incoming>

  <bpmn2:outgoing>Flow_2</bpmn2:outgoing>  <!-- INVALID! -->

</bpmn2:endEvent>

```



---



## 9. Coordinate System for Auto-Layout



### 9.1 Standard Positioning



```

X-axis (horizontal): Left to right

Y-axis (vertical): Top to bottom



Standard starting point: x=182, y=100



Element spacing:

- Between tasks: 150px horizontal

- Between branches: 110px vertical

- Gateway to task: 100px

```



### 9.2 Waypoint Calculation for Edges



```

Horizontal flow (Task_1 center x=320, Task_2 center x=470):

- Waypoint 1: x=370 (Task_1 right edge: 320 + 50)

- Waypoint 2: x=420 (Task_2 left edge: 470 - 50)



Vertical flow adjustment for branches:

- Main path: y=100

- Branch 1: y=210 (100 + 110)

- Branch 2: y=320 (100 + 220)

```



---



## 10. Quick Reference Card



| Element | XML Tag | Default Size | ID Pattern |

|---------|---------|--------------|------------|

| Start Event | `<bpmn2:startEvent>` | 36x36 | StartEvent_N |

| End Event | `<bpmn2:endEvent>` | 36x36 | EndEvent_N |

| Task | `<bpmn2:task>` | 100x80 | Task_N or Activity_X |

| User Task | `<bpmn2:userTask>` | 100x80 | UserTask_N |

| Service Task | `<bpmn2:serviceTask>` | 100x80 | ServiceTask_N |

| Exclusive Gateway | `<bpmn2:exclusiveGateway>` | 50x50 | Gateway_N |

| Parallel Gateway | `<bpmn2:parallelGateway>` | 50x50 | Gateway_N |

| Sequence Flow | `<bpmn2:sequenceFlow>` | N/A | Flow_N |



---



**Document Version**: 1.0  

**Last Updated**: January 13, 2026  

**Purpose**: AI Context for Magic Map BPMN Generation

