import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get all nodes for a specific playbook (across all processes)
export async function GET(
  req: Request,
  { params }: { params: { playbookId: string } }
) {
  try {
    // In Next.js App Router, we need to use await when accessing params
    const { playbookId } = params;
    
    if (!playbookId) {
      return NextResponse.json({ error: 'Playbook ID is required' }, { status: 400 });
    }
    
    // Check if playbook exists
    const playbook = await prisma.playbook.findUnique({
      where: { id: playbookId }
    });
    
    if (!playbook) {
      return NextResponse.json({ error: 'Playbook not found' }, { status: 404 });
    }
    
    // Get all process IDs for this playbook
    const processes = await prisma.process.findMany({
      where: { playbookId },
      select: { id: true }
    });
    
    const processIds = processes.map(process => process.id);
    
    if (processIds.length === 0) {
      return NextResponse.json([]);
    }
    
    // Get all nodes for these processes
    const nodes = await prisma.node.findMany({
      where: {
        processId: {
          in: processIds
        }
      },
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json(nodes);
  } catch (error: any) {
    console.error('Error fetching nodes for playbook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
