import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Status } from '@prisma/client';
import { handleApiError } from '@/lib/api-utils';

export async function GET(req:Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const events = await prisma.event.findMany({
            where: {
                ownerId: userId,
            },
        });

        return NextResponse.json(events);
    } catch (error) {
        return handleApiError(error, 'Failed to fetch events');
    }
}

export async function POST(req:Request){
    try{
        const body = await req.json();
        console.log(body);
        const {name, description, ownerId, playbookId, currentProcessId, parameters} = body;

        if (!name) {
            return NextResponse.json({ error: 'Event name is required' }, { status: 400 });
        }
        if (!ownerId) {
            return NextResponse.json({ error: 'Owner ID is required' }, { status: 400 });
        }
        if (!playbookId) {
            return NextResponse.json({ error: 'Playbook ID is required' }, { status: 400 });
        }
        if (!currentProcessId) {
            return NextResponse.json({ error: 'Current Process ID is required' }, { status: 400 });
        }

        const event = await prisma.event.create({
            data:{
                // id is defaulted to uuid() by schema
                name: name,
                description: description,
                ownerId: ownerId,
                playbookId: playbookId,
                currentProcessId: currentProcessId,
                parameters: parameters || [],
                status: Status.PLANNING,
                // Playbook and Process relations are established by foreign keys playbookId and currentProcessId
            }
        });
        return NextResponse.json(event, { status: 201 });

    } catch (error) {
        return handleApiError(error, 'Failed to create event');
    }
}