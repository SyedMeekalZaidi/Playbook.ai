import { prisma } from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';

const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end(); // Method Not Allowed
  }

  const { email, password, role, secretKey } = req.body;

  console.log('Signup Request:', { email, password, role, secretKey });

  try {
    // Validate role
    if (!['ADMIN', 'PLAYBOOK_CREATOR', 'COLLABORATOR', 'VIEWER'].includes(role)) {
      console.error('Invalid role:', role);
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Validate secret key for admin
    if (role === 'ADMIN' && secretKey !== ADMIN_SECRET_KEY) {
      console.error('Invalid admin secret key');
      return res.status(403).json({ error: 'Invalid admin secret key' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('Hashed password:', hashedPassword);

    // Attempt to create user
    console.log('Creating user in database...');
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role as 'ADMIN' | 'PLAYBOOK_CREATOR' | 'COLLABORATOR' | 'VIEWER',
      },
    });

    console.log('User created:', newUser);

    return res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error: any) {
    console.error('Prisma Error:', error);

    // Handle Prisma-specific errors
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }

    return res.status(500).json({ error: error.message });
  }
}
