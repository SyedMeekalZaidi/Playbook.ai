import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import {Status} from '@prisma/client';


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
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}

export async function POST(req:Request){
    try{
        const body = await req.json();
        console.log(body)
        const {name, description, ownerId, playbookId} = body;

        if (!name) {
            return NextResponse.json({ error: 'Event name is required' }, { status: 400 });
          }

        if (!ownerId) {
        return NextResponse.json({ error: 'Owner ID is required' }, { status: 400 });
        }

        const event = await prisma.event.create({
            data:{
                id: crypto.randomUUID(), // Generate a u/nique ID
                // ...(id && { id }),
                name: name,
                description: description,
                ownerId: ownerId,
                playbookId: playbookId,
                status: Status.PLANNING,
                Playbook: { connect: { id: playbookId } } // Assuming Playbook relation
            }
        })


    } catch (error) {}
}