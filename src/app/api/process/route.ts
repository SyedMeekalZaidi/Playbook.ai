import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const processses = await prisma.process.findMany({
            include: {parameters:true}
        });

        return NextResponse.json(processses, {status: 200});
    } catch (error){
        console.log("ERrror fetching processes:",error)
        return NextResponse.json({message:"internal server error"}, {status:500})
    }

}