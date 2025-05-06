import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; 
import { handleApiError } from '@/lib/api-utils';
import { Role } from '@prisma/client'; // Role enum for PlaybookCollaborator

interface ShareParams {
  params: {
    playbookId: string;
  };
}

// POST - Share a playbook with a user (creates/updates a PlaybookCollaborator)
export async function POST(req: Request, { params }: ShareParams) {
  try {
    const { playbookId } = params;
    const body = await req.json();
    const { userId, role } = body; // Expect userId (Supabase user ID) and role (from Role enum)

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Validate the provided role against the Role enum
    if (role && !Object.values(Role).includes(role as Role)) {
      return NextResponse.json({ error: 'Invalid role specified. Must be one of: ADMIN, PLAYBOOK_CREATOR, COLLABORATOR' }, { status: 400 });
    }
    
    const playbook = await prisma.playbook.findUnique({
      where: { id: playbookId, isDeleted: false },
    });

    if (!playbook) {
      return NextResponse.json({ error: 'Playbook not found or has been deleted' }, { status: 404 });
    }

    // Upsert the PlaybookCollaborator record
    // This will create a new record if the user is not already a collaborator,
    // or update their role if they are.
    const collaborator = await prisma.playbookCollaborator.upsert({
      where: {
        // This relies on the @@unique([playbookId, userId]) constraint in your PlaybookCollaborator model
        playbookId_userId: { 
          playbookId, 
          userId 
        } 
      },
      update: {
        role: (role as Role) || Role.COLLABORATOR, // Update role, or default to COLLABORATOR if role is provided but empty
      },
      create: {
        id: crypto.randomUUID(), // Ensure PlaybookCollaborator model's id field is populated
        playbookId,
        userId,
        role: (role as Role) || Role.COLLABORATOR, // Set role, default to COLLABORATOR if not provided
      },
    });

    return NextResponse.json({ success: true, collaborator }, { status: 200 });
  } catch (error: any) {
    if ((error as any).code === 'P2002') {
      // This code might be hit if the upsert's where clause isn't specific enough and create is attempted on a duplicate.
      // However, with @@unique([playbookId, userId]), upsert should handle it.
      // This can also happen if the id in create conflicts, though crypto.randomUUID() makes it unlikely.
      return NextResponse.json({ error: 'This user is already a collaborator on this playbook (or a unique constraint was violated).' }, { status: 409 });
    }
    if ((error as any).code === 'P2003') { 
      // Foreign key constraint failed - e.g., playbookId doesn't exist.
      // userId is not a foreign key to a User table in Prisma schema, so this won't be for userId.
      return NextResponse.json({ error: 'Invalid playbookId provided.' }, { status: 400 });
    }
    return handleApiError(error, `Error sharing playbook ${params.playbookId}`);
  }
}
