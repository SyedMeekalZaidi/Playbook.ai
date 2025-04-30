// src/pages/api/playbook/share.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).end('Unauthenticated');

  const { playbookId, targetEmail } = req.body as { playbookId: string; targetEmail: string };

  try {
    // ensure caller owns the playbook
    const pb = await prisma.playbook.findUnique({ where: { id: playbookId } });
    if (!pb || pb.ownerId !== session.user.id)
      return res.status(403).end('Not owner');

    // locate the target user
    const targetUser = await prisma.user.findUnique({ where: { email: targetEmail } });
    if (!targetUser) return res.status(404).end('Target user not found');

    await prisma.playbookMember.upsert({
      where: { playbookId_userId: { playbookId, userId: targetUser.id } },
      create: { playbookId, userId: targetUser.id, role: 'VIEWER' },
      update: {},   // idempotent: do nothing if already shared
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[share]', err);
    return res.status(500).end('Server error');
  }
}
