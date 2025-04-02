import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  interface Parameter {
    name: string;
    type: string;
    mandatory: boolean;
    options: [];
    //info: string
}

  try {
      const { processName, parameters } = await req.json();

      if (!processName || !parameters || parameters.length === 0) {
          return NextResponse.json({ message: "Missing required fields(route)" }, { status: 400 });
      }

      // Create the process and its parameters
      const newProcess = await prisma.process.create({
          data: {
              name: processName,
              playbookId: 'test-playbook-id',
              parameters: {
                  create: parameters.map((param:Parameter) => ({
                      name: param.name,
                      type: param.type,
                      mandatory: param.mandatory,
                      options: param.options || [],
                  })),
              },
          },
          include: { parameters: true },
      });

      return NextResponse.json(newProcess, { status: 201 });

  } catch (error) {
      console.error("Error saving process(route):", error);
      return NextResponse.json({ message: "Internal Server Error(route)" }, { status: 500 });
  }
}