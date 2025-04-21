import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get all nodes for a specific process
export async function GET(
  req: Request,
  { params }: { params: { processId: string } }
) {
  try {
    const { processId } = params;
    
    if (!processId) {
      return NextResponse.json({ error: 'Process ID is required' }, { status: 400 });
    }
    
    // Check if process exists
    const process = await prisma.process.findUnique({
      where: { id: processId }
    });
    
    if (!process) {
      return NextResponse.json({ error: 'Process not found' }, { status: 404 });
    }
    
    // Get all nodes for this process
    const nodes = await prisma.node.findMany({
      where: { processId },
      orderBy: { createdAt: 'asc' }
    });
    
    return NextResponse.json(nodes);
  } catch (error: any) {
    console.error('Error fetching nodes for process:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
