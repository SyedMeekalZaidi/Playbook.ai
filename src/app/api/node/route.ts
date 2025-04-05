import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get nodes (filter by process ID if provided)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const processId = searchParams.get('processId');
    const nodeId = searchParams.get('id');
    
    if (nodeId) {
      // Get a specific node
      const node = await prisma.node.findUnique({
        where: { id: nodeId }
      });
      
      if (!node) {
        return NextResponse.json({ error: 'Node not found' }, { status: 404 });
      }
      
      return NextResponse.json(node);
    } else if (processId) {
      // Get nodes by process ID
      const nodes = await prisma.node.findMany({
        where: { processId }
      });
      
      return NextResponse.json(nodes);
    } else {
      // Get all nodes (may want to limit this in production)
      const nodes = await prisma.node.findMany({
        take: 100
      });
      
      return NextResponse.json(nodes);
    }
  } catch (error: any) {
    console.error('Error fetching nodes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create a new node
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, type, processId, bpmnId } = body;
    
    if (!name || !type || !processId) {
      return NextResponse.json({ error: 'Name, type, and processId are required' }, { status: 400 });
    }
    
    const node = await prisma.node.create({
      data: {
        name,
        type,
        processId,
        bpmnId: bpmnId || null
      }
    });
    
    return NextResponse.json(node, { status: 201 });
  } catch (error: any) {
    console.error('Error creating node:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update a node
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, name, type, bpmnId } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Node ID is required' }, { status: 400 });
    }
    
    const node = await prisma.node.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(bpmnId !== undefined && { bpmnId })
      }
    });
    
    return NextResponse.json(node);
  } catch (error: any) {
    console.error('Error updating node:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete a node
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Node ID is required' }, { status: 400 });
    }
    
    await prisma.node.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting node:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
