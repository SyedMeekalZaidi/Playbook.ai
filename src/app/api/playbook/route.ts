import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get a playbook by ID
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Playbook ID is required' }, { status: 400 });
    }
    
    const playbook = await prisma.playbook.findUnique({
      where: { id }
    });
    
    if (!playbook) {
      return NextResponse.json({ error: 'Playbook not found' }, { status: 404 });
    }
    
    return NextResponse.json(playbook);
  } catch (error: any) {
    console.error('Error fetching playbook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create a new playbook
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, ownerId, shortDescription } = body;
    
    if (!name) {
      return NextResponse.json({ error: 'Playbook name is required' }, { status: 400 });
    }
    
    // Find or create a default user if ownerId is not provided
    let userId = ownerId;
    
    if (!userId) {
      const defaultUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      });
      
      if (defaultUser) {
        userId = defaultUser.id;
      } else {
        const newUser = await prisma.user.create({
          data: {
            email: 'admin@example.com',
            password: 'admin-password', // In production, this should be hashed
            role: 'ADMIN',
            name: 'System Admin'
          }
        });
        userId = newUser.id;
      }
    }
    
    // Create the playbook, optionally with the specific ID
    const playbook = await prisma.playbook.create({
      data: {
        ...(id && { id }), // Only include id if provided
        name,
        ownerId: userId,
        shortDescription: shortDescription || null,
      }
    });
    
    return NextResponse.json(playbook, { status: 201 });
  } catch (error: any) {
    console.error('Error creating playbook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
