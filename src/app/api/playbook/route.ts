import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {Status} from '@prisma/client';


// Get a playbook by ID or get all playbooks for a user
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    // include processes when retrieveing specific id, input value: true
    const includeProcess = searchParams.get('includeProcess') === 'true'? true : false
    const includeNodes = searchParams.get('includeNodes') === 'true'? true : false;
    const includeNodeParams = searchParams.get('includeNodeParams') === 'true'? true : false;

    const includeAll = searchParams.get('includeAll') === 'true'?true:false

    const status = searchParams.get('status');

    // If ID is provided, get a specific playbook
    if (id) {
      const playbook = await prisma.playbook.findUnique({
        where: {
          id,
          isDeleted: false
        },
        include: { //fetch processes and its contents if provided.
          Process: (includeProcess || includeAll) ? {
            include: {
              Node: (includeNodes || includeAll)? {
                include: {
                  ProcessParameter: (includeNodeParams || includeAll)
                }
              } : includeNodes,
            }
          } : includeProcess,
        }
      });

      if (!playbook) {
        return NextResponse.json({ error: 'Playbook not found' }, { status: 404 });
      }

      return NextResponse.json(playbook);
    }

    // If userId is provided, get all playbooks for that user
    if (userId) {
      const playbooks = await prisma.playbook.findMany({
        where: {
          ownerId: userId,
          isDeleted: false
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return NextResponse.json(playbooks);
    }

    // fetch and filter playbooks by status
    if (status) {
      if (Object.values(Status).includes(status as unknown as Status)) {
        console.log('[API Playbook.Get] Fetching by Status...')
        const playbooks = await prisma.playbook.findMany({
          where: {
            status: status as unknown as Status,
            isDeleted: false,

          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        return NextResponse.json(playbooks);
      } else {
          return NextResponse.json({ error: '[API Playbook.GET] Invalid status value' }, { status: 400 });
      }
    }

    // If neither id nor userId is provided
    return NextResponse.json({ error: 'Either playbook ID or user ID is required' }, { status: 400 });
  } catch (error: any) {
    console.error('Error fetching playbook(s):', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create a new playbook
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, ownerId, shortDescription } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Playbook name is required' }, { status: 400 });
    }

    if (!ownerId) {
      return NextResponse.json({ error: 'Owner ID is required' }, { status: 400 });
    }

    // We'll skip the Supabase user verification since it requires admin privileges
    // Instead, we'll trust the client-side authentication and the user ID it provides

    // Create the playbook with the provided owner ID
    const playbook = await prisma.playbook.create({
      data: {
        id: crypto.randomUUID(),
        name,
        ownerId,
        shortDescription: shortDescription || null,
        updatedAt: new Date(),
      }
    });


    return NextResponse.json(playbook, { status: 201 });
  } catch (error: any) {
    console.error('Error creating playbook:', error);

    // Handle specific database errors with more context
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A playbook with this ID already exists' }, { status: 409 });
    }

    if (error.code === 'P2003') {
      return NextResponse.json({ error: 'The owner ID provided does not exist' }, { status: 400 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


// Update a playbook
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, name, shortDescription } = body;

    // Validate ID
    if (!id) {
      return NextResponse.json({ error: 'Playbook ID is required' }, { status: 400 });
    }

    // Check if playbook exists
    const existingPlaybook = await prisma.playbook.findUnique({
      where: { id, isDeleted: false }
    });

    if (!existingPlaybook) {
      return NextResponse.json({ error: 'Playbook not found' }, { status: 404 });
    }

    // Update the playbook
    const updatedPlaybook = await prisma.playbook.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(shortDescription !== undefined && { shortDescription }),
      }
    });

    return NextResponse.json(updatedPlaybook);
  } catch (error: any) {
    console.error('Error updating playbook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete a playbook (soft delete)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Playbook ID is required' }, { status: 400 });
    }

    // Check if playbook exists
    const existingPlaybook = await prisma.playbook.findUnique({
      where: { id, isDeleted: false }
    });

    if (!existingPlaybook) {
      return NextResponse.json({ error: 'Playbook not found or already deleted' }, { status: 404 });
    }

    // Soft delete the playbook
    const deletedPlaybook = await prisma.playbook.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    return NextResponse.json({
      message: `Playbook "${deletedPlaybook.name}" has been deleted`,
      success: true
    });
  } catch (error: any) {
    console.error('Error deleting playbook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
