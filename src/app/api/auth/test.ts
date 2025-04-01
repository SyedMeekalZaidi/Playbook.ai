import { prisma } from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: 'hashedpassword',
          role: 'ADMIN',
        },
      });

      return res.status(201).json({ message: 'Test user created', user: testUser });
    } catch (error: any) {
      console.error('Test creation error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findFirst(); // Adjust as needed (e.g., filter by email)
      if (!user) {
        return res.status(404).json({ error: 'No user found' });
      }
      return res.status(200).json({ user });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).end(); // Method Not Allowed
}
