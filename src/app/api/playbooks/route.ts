import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get all playbooks (non-deleted ones)
export async function GET(req: Request) {
  try {
    // Get all active playbooks
    const playbooks = await prisma.playbook.findMany({
      where: {
        isDeleted: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(playbooks);
  } catch (error: any) {
    console.error('Error fetching playbooks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
