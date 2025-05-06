import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get parameters for a specific process
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const processId = searchParams.get('processId');
    
    if (!processId) {
      return NextResponse.json({ error: 'Process ID is required' }, { status: 400 });
    }

    // Fetch all parameters associated with this process
    const parameters = await prisma.processParameter.findMany({
      where: { processId }
    });
    
    return NextResponse.json(parameters);
  } catch (error: any) {
    console.error('Error fetching process parameters:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create new parameters for a process
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { processId, parameters } = body;
    
    if (!processId || !parameters || !Array.isArray(parameters)) {
      return NextResponse.json(
        { error: 'Process ID and parameters array are required' }, 
        { status: 400 }
      );
    }

    // Delete existing parameters if they exist
    await prisma.processParameter.deleteMany({
      where: { processId }
    });

    // Create all the new parameters
    const createdParameters = await prisma.processParameter.createMany({
      data: parameters.map(param => ({
        name: param.name,
        type: param.type,
        mandatory: param.mandatory,
        options: param.options || [],
        processId
      }))
    });
    
    return NextResponse.json(
      { count: createdParameters.count, success: true }, 
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating process parameters:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update existing parameters
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Parameter ID is required' }, { status: 400 });
    }
    
    const updatedParameter = await prisma.processParameter.update({
      where: { id },
      data: updateData
    });
    
    return NextResponse.json(updatedParameter);
  } catch (error: any) {
    console.error('Error updating process parameter:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete a parameter
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Parameter ID is required' }, { status: 400 });
    }
    
    await prisma.processParameter.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting process parameter:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
