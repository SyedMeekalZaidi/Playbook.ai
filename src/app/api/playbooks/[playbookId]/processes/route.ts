import { NextResponse } from 'next/server';
import { prisma, withRetry } from '@/lib/prisma';

// Get all processes for a specific playbook
export async function GET(
  _req: Request,
  context: { params: { playbookId: string } }
) {
  try {
    // Correctly handle params by accessing them from the context
    const playbookId = context.params.playbookId;
    
    if (!playbookId) {
      return NextResponse.json({ error: 'Playbook ID is required' }, { status: 400 });
    }
    
    // Check if playbook exists with retry logic
    const playbook = await withRetry(async () => {
      return await prisma.playbook.findUnique({
        where: { id: playbookId }
      });
    });
    
    if (!playbook) {
      return NextResponse.json({ error: 'Playbook not found' }, { status: 404 });
    }
    
    // Get all processes for this playbook with retry logic
    const processes = await withRetry(async () => {
      return await prisma.process.findMany({
        where: { playbookId },
        orderBy: { name: 'asc' }
      });
    });
    
    return NextResponse.json(processes);
  } catch (error: any) {
    console.error('Error fetching processes for playbook:', error);
    return NextResponse.json({ 
      error: error.message || 'Database connection error',
      code: error.code
    }, { status: 500 });
  }
}
