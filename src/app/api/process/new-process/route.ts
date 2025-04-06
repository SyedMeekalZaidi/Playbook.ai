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
      const { processName, nodeList } = await req.json();

      if (!processName) {
          return NextResponse.json({ message: "Missing required fields(route.tsx)" }, { status: 400 });
      }

      const newProcess = await prisma.process.create({
        data: {
            name: processName,
            playbookId: 'test-playbook-id',
            nodes: {
                create: nodeList.map((node:Node) => ({
                    name: node.name,
                    type: node.type,
                    parameters: {
                        create: node.parameters.map((param: NodeParameter) => ({
                            name: param.name,
                            type: param.type,
                            mandatory: param.mandatory
                        }))
                    }
                }))
            }
        }
      })

      return NextResponse.json(newProcess, { status: 201 });

  } catch (error) {
      console.error("Error creating process:", error);
      return NextResponse.json({ message: "Internal Server Error(route)" }, { status: 500 });
  }
}