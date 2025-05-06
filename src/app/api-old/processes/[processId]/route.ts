import { NextResponse } from 'next/server';
import { prisma, withRetry } from '@/lib/prisma';

// Get a specific process by ID
export async function GET(
  req: Request,
  context: { params: { processId: string } }
) {
  try {
    const processId = context.params.processId;
    
    if (!processId) {
      return NextResponse.json({ error: 'Process ID is required' }, { status: 400 });
    }
    
    const process = await withRetry(async () => {
      return await prisma.process.findUnique({
        where: { id: processId }
      });
    });
    
    if (!process) {
      return NextResponse.json({ error: 'Process not found' }, { status: 404 });
    }
    
    return NextResponse.json(process);
  } catch (error: any) {
    console.error('Error fetching process:', error);
    return NextResponse.json({ 
      error: error.message || 'Database connection error',
      code: error.code
    }, { status: 500 });
  }
}

// Update a process by ID
export async function PUT(
  req: Request,
  context: { params: { processId: string } }
) {
  try {
    const processId = context.params.processId;
    const data = await req.json();
    
    if (!processId) {
      return NextResponse.json({ error: 'Process ID is required' }, { status: 400 });
    }
    
    // Check if process exists
    const existingProcess = await withRetry(async () => {
      return await prisma.process.findUnique({
        where: { id: processId }
      });
    });
    
    if (!existingProcess) {
      return NextResponse.json({ error: 'Process not found' }, { status: 404 });
    }
    
    // Update the process
    const updatedProcess = await withRetry(async () => {
      return await prisma.process.update({
        where: { id: processId },
        data: {
          name: data.name,
          bpmnXml: data.bpmnXml,
          bpmnId: data.bpmnId,
          shortDescription: data.shortDescription,
          // Add other fields as needed
        }
      });
    });
    
    return NextResponse.json(updatedProcess);
  } catch (error: any) {
    console.error('Error updating process:', error);
    return NextResponse.json({ 
      error: error.message || 'Database connection error',
      code: error.code
    }, { status: 500 });
  }
}

// Delete a process by ID
export async function DELETE(
  req: Request,
  context: { params: { processId: string } }
) {
  try {
    const processId = context.params.processId;
    
    if (!processId) {
      return NextResponse.json({ error: 'Process ID is required' }, { status: 400 });
    }
    
    // Check if process exists
    const existingProcess = await withRetry(async () => {
      return await prisma.process.findUnique({
        where: { id: processId }
      });
    });
    
    if (!existingProcess) {
      return NextResponse.json({ error: 'Process not found' }, { status: 404 });
    }
    
    // Delete the process - this will cascade delete related nodes due to schema configuration
    await withRetry(async () => {
      return await prisma.process.delete({
        where: { id: processId }
      });
    });
    
    return NextResponse.json({ success: true, message: 'Process deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting process:', error);
    return NextResponse.json({ 
      error: error.message || 'Database connection error',
      code: error.code
    }, { status: 500 });
  }
}
