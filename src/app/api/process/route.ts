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
    const { name, description, playbookId, bpmnXml } = body;
    
    if (!name || !playbookId) {
      return NextResponse.json({ error: 'Name and playbookId are required' }, { status: 400 });
    }
    
    const process = await prisma.process.create({
      data: {
        name,
        description,
        playbookId,
        bpmnXml: bpmnXml || null
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
    const { id, name, description, bpmnXml } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Process ID is required' }, { status: 400 });
    }
    
    const process = await prisma.process.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(bpmnXml !== undefined && { bpmnXml })
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
    
    await prisma.process.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting process:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}