import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(req: Request) {
  const body = await req.json();
  const { playbookId, userId } = body;

  if (!playbookId || !userId) {
    return NextResponse.json({ error: 'playbookId and userId are required' }, { status: 400 });
  }

  const { error } = await supabase.from('PlaybookCollaborator').insert([
    {
      playbookId,
      userId,
    },
  ]);

  if (error) {
    return NextResponse.json({ error: 'Failed to share playbook' }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}