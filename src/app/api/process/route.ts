import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get all processes or a single process by ID
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (id) {
      // Get a single process with its nodes
      const process = await prisma.process.findUnique({
        where: { id },
        include: { nodes: true }
      });
      
      if (!process) {
        return NextResponse.json({ error: 'Process not found' }, { status: 404 });
      }
      
      return NextResponse.json(process);
    } else {
      // Get all processes
      const processes = await prisma.process.findMany({
        include: { nodes: true }
      });
      
      return NextResponse.json(processes);
    }
  } catch (error: any) {
    console.error('Error fetching processes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create a new process
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, playbookId, bpmnXml, bpmnId } = body;
    
    if (!name || !playbookId) {
      return NextResponse.json({ error: 'Name and playbookId are required' }, { status: 400 });
    }
    
    // First check if the specified playbook exists
    const playbook = await prisma.playbook.findUnique({
      where: { id: playbookId }
    });
    
    // If playbook doesn't exist, create it with the specified ID
    if (!playbook) {
      // Find or create a default user for the playbook
      let defaultUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      });
      
      if (!defaultUser) {
        defaultUser = await prisma.user.create({
          data: {
            email: 'admin@example.com',
            password: 'admin-password',
            role: 'ADMIN',
            name: 'System Admin'
          }
        });
      }
      
      // Create the playbook with the exact ID provided
      await prisma.playbook.create({
        data: {
          id: playbookId, // Use the exact ID
          name: 'Test Playbook',
          ownerId: defaultUser.id
        }
      });
    }
    
    // Now create the process
    const process = await prisma.process.create({
      data: {
        name,
        playbookId,
        bpmnXml: bpmnXml || null,
        bpmnId: bpmnId || null
      }
    });
    
    return NextResponse.json(process, { status: 201 });
  } catch (error: any) {
    console.error('Error creating process:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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