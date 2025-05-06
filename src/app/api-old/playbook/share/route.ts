import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { playbookId, userId } = body;

    console.log("Sharing request received with:", { playbookId, userId });

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
      console.error("Insert error:", error.message);
      return NextResponse.json({ error: `Supabase insert failed: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("Unexpected server error:", err.message);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}