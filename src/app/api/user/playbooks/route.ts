import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    // Fetch playbooks owned by the user
    const playbooks = await prisma.playbook.findMany({
      where: {
        ownerId: userId,
        isDeleted: false,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Also fetch playbooks where the user is a collaborator
    const collaborations = await prisma.playbookCollaborator.findMany({
      where: {
        userId: userId,
      },
      include: {
        playbook: {
          where: {
            isDeleted: false,
          },
        },
      },
    });

    // Combine both sets of playbooks and remove duplicates
    const collaboratedPlaybooks = collaborations
      .map(collab => collab.playbook)
      .filter((playbook): playbook is typeof playbook & { id: string } => 
        !!playbook && !playbooks.some(p => p.id === playbook.id)
      );

    const allPlaybooks = [...playbooks, ...collaboratedPlaybooks];

    return NextResponse.json(allPlaybooks, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
