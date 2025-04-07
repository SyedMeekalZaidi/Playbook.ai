import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Process {
    name: string,
    description: string | null,
    nodes: Node[],
    parentId: string | null,
    subProcesses: Process[]

    fromProcess: ProcessDependency[]
    toProcess: ProcessDependency[]

    playbookId: string,
}

interface Node {
    name: string,
    type: string,   // Event | Task |  Gateway | ... (bpmn symbols)
    description: string | null,
    // processId: string,
    parameters: NodeParameter[]
}

interface NodeParameter {
    name: string    //(question/title)
    type: string    // checkbox | textbox | radio | ...
    mandatory: boolean
    info: string | null
    options: []
    // nodeId: string
}

interface ProcessDependency {
    fromId: string
    toId: string
    playbookId: string
    trigger:string
}


export async function POST(req: Request) {
  try {
    const { processName, nodeList, processParameters, playbookId = 'test-playbook-id' } = await req.json();

    if (!processName) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Create process with nodes, parameters, and their relationships
    const newProcess = await prisma.process.create({
      data: {
        name: processName,
        playbookId,
        // Add process parameters if provided
        parameters: processParameters?.length > 0 ? {
          create: processParameters.map((param: any) => ({
            name: param.name,
            type: param.type,
            mandatory: param.mandatory,
            options: param.options || []
          }))
        } : undefined,
        // Add nodes with their parameters
        nodes: {
          create: nodeList.map((node: any) => ({
            name: node.name,
            type: node.type,
            parameters: {
              create: (node.parameters || []).map((param: any) => ({
                name: param.name,
                type: param.type,
                mandatory: param.mandatory,
                options: param.options || []
              }))
            }
          }))
        }
      },
      // Include related data in the response
      include: {
        parameters: true,
        nodes: {
          include: {
            parameters: true
          }
        }
      }
    });

    return NextResponse.json(newProcess, { status: 201 });
  } catch (error) {
    console.error("Error creating process:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}