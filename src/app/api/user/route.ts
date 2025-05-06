import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { handleApiError } from '@/lib/api-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // must be service role key
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error || !data) {
      console.error('Supabase listUsers error:', error);
      return NextResponse.json({ error: 'Failed to list users from authentication provider', supabaseError: error?.message }, { status: 500 });
    }

    const match = data.users.find((user) => user.email === email);

    if (!match) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ id: match.id }, { status: 200 });
  } catch (err) {
    return handleApiError(err, "Unexpected error in user route");
  }
}
