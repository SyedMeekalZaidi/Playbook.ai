import { prisma } from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'ADMIN' // Try hardcoding the role to eliminate frontend issues
      },
    });

    res.status(201).json({ message: 'Test user created', user: testUser });
  } catch (error: any) {
    console.error('Test creation error:', error);
    res.status(500).json({ error: error.message });
  }
}
