import { prisma } from '../../lib/prisma';
import { supabase } from '../../lib/supabase';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Test Prisma connection by counting users
    // This will create the table if it doesn't exist (using db push under the hood)
    await prisma.user.count();
    
    // Test Supabase connection with a simple health check
    const { data, error } = await supabase.auth.getSession();
    
    return res.status(200).json({
      success: true,
      message: 'Database connection successful!',
      prisma: 'Connected',
      supabase: error ? 'Error: ' + error.message : 'Connected'
    });
  } catch (error: any) {
    console.error('Database connection failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
}
