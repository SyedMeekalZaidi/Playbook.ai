import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get a specific process by ID
export async function GET(
  req: Request,
  { params }: { params: { processId: string } }
) {
  try {
    const { processId } = params;
    
    if (!processId) {
      return NextResponse.json({ error: 'Process ID is required' }, { status: 400 });
    }
    
    const process = await prisma.process.findUnique({
      where: { id: processId }
    });
    
    if (!process) {
      return NextResponse.json({ error: 'Process not found' }, { status: 404 });
    }
    
    return NextResponse.json(process);
  } catch (error: any) {
    console.error('Error fetching process:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update a process by ID
export async function PUT(
  req: Request,
  { params }: { params: { processId: string } }
) {
  try {
    const { processId } = params;
    const data = await req.json();
    
    if (!processId) {
      return NextResponse.json({ error: 'Process ID is required' }, { status: 400 });
    }
    
    // Check if process exists
    const existingProcess = await prisma.process.findUnique({
      where: { id: processId }
    });
    
    if (!existingProcess) {
      return NextResponse.json({ error: 'Process not found' }, { status: 404 });
    }
    
    // Update the process
    const updatedProcess = await prisma.process.update({
      where: { id: processId },
      data: {
        name: data.name,
        bpmnXml: data.bpmnXml,
        bpmnId: data.bpmnId,
        shortDescription: data.shortDescription,
        // Add other fields as needed
      }
    });
    
    return NextResponse.json(updatedProcess);
  } catch (error: any) {
    console.error('Error updating process:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete a process by ID
export async function DELETE(
  req: Request,
  { params }: { params: { processId: string } }
) {
  try {
    const { processId } = params;
    
    if (!processId) {
      return NextResponse.json({ error: 'Process ID is required' }, { status: 400 });
    }
    
    // Check if process exists
    const existingProcess = await prisma.process.findUnique({
      where: { id: processId }
    });
    
    if (!existingProcess) {
      return NextResponse.json({ error: 'Process not found' }, { status: 404 });
    }
    
    // Delete the process - this will cascade delete related nodes due to schema configuration
    await prisma.process.delete({
      where: { id: processId }
    });
    
    return NextResponse.json({ success: true, message: 'Process deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting process:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
