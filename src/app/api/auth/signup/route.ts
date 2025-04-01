import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password, role, secretKey } = body;

  // Validate & hash password
  if (role === 'ADMIN' && secretKey !== ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Invalid admin secret key' }, { status: 403 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const newUser = await prisma.user.create({
      data: { email, password: hashedPassword, role },
    });

    return NextResponse.json({ message: 'User created successfully', user: newUser }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
