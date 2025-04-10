import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get all playbooks (non-deleted ones)
export async function GET(req: Request) {
  try {
    // Defensive check: ensure Prisma is initialized
    if (!prisma || !prisma.playbook) {
      console.error("Prisma client or playbook model not available.");
      return NextResponse.json({ error: "Server misconfiguration." }, { status: 500 });
    }

    // Fetch active playbooks
    const playbooks = await prisma.playbook.findMany({
      where: {
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // If no playbooks found, return empty array
    return NextResponse.json(playbooks || []);
  } catch (error: any) {
    console.error('Error fetching playbooks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playbooks. Please try again later.' },
      { status: 500 }
    );
  }
}
