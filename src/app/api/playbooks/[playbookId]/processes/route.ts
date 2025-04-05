import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get all processes for a specific playbook
export async function GET(
  req: Request,
  { params }: { params: { playbookId: string } }
) {
  try {
    // In Next.js App Router, we need to use the params object directly
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
    
    // Get all processes for this playbook
    const processes = await prisma.process.findMany({
      where: { playbookId },
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json(processes);
  } catch (error: any) {
    console.error('Error fetching processes for playbook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
