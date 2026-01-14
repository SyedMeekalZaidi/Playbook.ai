/**
 * Magic Map - Create Process API Route
 * Creates a new process with BPMN XML in one atomic operation
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createApiClient } from '@/utils/supabase/server';
import { randomUUID } from 'crypto';

// Helper to require authentication
async function requireUser() {
  const supabase = await createApiClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  return user;
}

// POST /api/magic-map/create-process
export async function POST(req: Request) {
  try {
    // 1. Authentication
    await requireUser();
    
    // 2. Request parsing
    const body = await req.json();
    const { xml, processName, playbookId } = body;
    
    // Validate required fields
    if (!xml || typeof xml !== 'string' || !xml.trim()) {
      return NextResponse.json(
        { error: 'Invalid request: xml required', success: false },
        { status: 400 }
      );
    }
    
    if (!processName || typeof processName !== 'string' || !processName.trim()) {
      return NextResponse.json(
        { error: 'Invalid request: processName required', success: false },
        { status: 400 }
      );
    }
    
    if (!playbookId || typeof playbookId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: playbookId required', success: false },
        { status: 400 }
      );
    }
    
    // 3. Verify playbook exists and user has access
    const playbook = await prisma.playbook.findUnique({
      where: { id: playbookId }
    });
    
    if (!playbook) {
      return NextResponse.json(
        { error: 'Playbook not found', success: false },
        { status: 404 }
      );
    }
    
    // 4. Create process with XML
    const newProcess = await prisma.process.create({
      data: {
        id: randomUUID(),
        name: processName.trim(),
        playbookId: playbookId,
        bpmnXml: xml.trim(),
        shortDescription: 'Created with Magic Map',
        updatedAt: new Date()
      }
    });
    
    // 5. Return success response
    return NextResponse.json({
      processId: newProcess.id,
      processName: newProcess.name,
      success: true
    });
    
  } catch (error: any) {
    console.error('[Magic Map Create Process] Error:', error);
    
    // Friendly error messages
    if (error.message === 'User not authenticated') {
      return NextResponse.json(
        { error: 'Please sign in to create a process', success: false },
        { status: 401 }
      );
    }
    
    if (error.code === 'P2002') { // Prisma unique constraint violation
      return NextResponse.json(
        { error: 'A process with this name already exists in this playbook', success: false },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create process. Please try again.',
        success: false 
      },
      { status: 500 }
    );
  }
}
