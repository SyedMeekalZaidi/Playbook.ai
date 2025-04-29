import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Node {
  id: number,
  name: string,
  type: string,
  description: string | null,
  parameters: ProcessParameter[]
}


interface ProcessParameter {
  name: string
  type: string
  mandatory: boolean
  options: string[]
}

interface ProcessDependency {
  processId: string;
  parentProcess: string;
  trigger?: string;

}

// Get a list of all processes or a specific process by ID
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const playbookId = searchParams.get('playbookId');

    if (id) {
      // Get a specific process with all its nodes and parameters
      const process = await prisma.process.findUnique({
        where: { id },
        include: {
          Node: true,
        }
      });

      if (!process) {
        return NextResponse.json({ message: 'Process not found' }, { status: 404 });
      }

      return NextResponse.json(process);
    }

    if (playbookId) {
      // get processes of a specific playbook
      const processes = await prisma.process.findMany({
        where: { playbookId: playbookId },
        include: {
          Node: true,
        }
      });

      return NextResponse.json(processes);

    }

    // Get all processes
    const processes = await prisma.process.findMany();
    return NextResponse.json(processes);

  } catch (error) {
    console.error("Error fetching processes:", error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Create a new process
export async function POST(req: Request) {
  try {
    // const { processName, nodeList, processParameters, playbookId = 'test-playbook-id' } = await req.json();
    const body = await req.json();
    const {
      playbookId, processName,
      shortDescription,
      nodeList,
      processParameters,
      processDependency
    } = body;

    console.log('[new process route.tsx data:]', body);


    if (!processName || !playbookId) {
      console.error('[new process route] Missing or invalid required fields:', { processName, playbookId });
      return NextResponse.json({ message: "Missing or invalid required fields" }, { status: 400 });
    }

    const newProcess = await prisma.process.create({
      data: {
        id:crypto.randomUUID(),
        name: processName,
        shortDescription: shortDescription,
        playbookId: playbookId,
        updatedAt: new Date(),
        Node:{
          create: nodeList.map((node:Node) => ({
            id: crypto.randomUUID(),
            name: node.name,
            shortDescription: node.description,
            type: node.type,
            updatedAt: new Date(),
            ProcessParameter: {
              create: node.parameters.map((param:ProcessParameter) => ({
                id: crypto.randomUUID(),
                name: param.name,
                type: param.type,
                mandatory: param.mandatory,
                options: param.options
              }))
            },
          }))
        },

        ProcessParameter: {
          create: processParameters.map((param:ProcessParameter) => ({
            id: crypto.randomUUID(),
            name: param.name,
            type: param.type,
            mandatory: param.mandatory,
            options: param.options
          }))
        },
      }
    })

    console.log('[new process route] new process created successfully')

    if (processDependency){
      console.log('[new process route] creating proceses dependency')

      try {
        const newDependency = await prisma.processDependency.create(
          {
            data: {
              id: crypto.randomUUID(),
              parentProcessId: processDependency.parentProcessId,
              processId: newProcess.id,
              trigger: processDependency.trigger,
            }
          }
        )

      } catch (error: any) {
        console.error('[new process route] Error creating process dependency')
      }

      console.log('[new process route] new dependency created successfully')
    }

    return NextResponse.json(newProcess, { status: 201 });
  } catch (error) {
    console.error("[new process route] Error creating process:", error);
    return NextResponse.json({ message: "[new process route] Internal Server Error", error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// Update a process
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, name, bpmnXml, bpmnId } = body;

    if (!id) {
      return NextResponse.json({ error: 'Process ID is required' }, { status: 400 });
    }

    const process = await prisma.process.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(bpmnXml !== undefined && { bpmnXml }),
        ...(bpmnId !== undefined && { bpmnId })
      }
    });

    return NextResponse.json(process);
  } catch (error: any) {
    console.error('Error updating process:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete a process
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Process ID is required' }, { status: 400 });
    }

    // Delete all nodes associated with this process first
    await prisma.node.deleteMany({
      where: { processId: id }
    });

    // Delete the process
    await prisma.process.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting process:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}