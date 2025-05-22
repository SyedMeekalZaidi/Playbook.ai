import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-utils';

let supabase: SupabaseClient;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL environment variable is not set.");
}
if (!supabaseServiceRoleKey) {
  console.error("ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is not set. This is required for admin operations.");
}

if (supabaseUrl && supabaseServiceRoleKey) {
  supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });
}

export async function GET(req: Request) {
  if (!supabaseUrl || !supabaseServiceRoleKey || !supabase) {
    return NextResponse.json(
      { error: "Supabase client is not configured. Check server logs for missing environment variables (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email query parameter is required' }, { status: 400 });
  }

  try {
    const { data, error: listUsersError } = await supabase.auth.admin.listUsers();

    if (listUsersError) {
      console.error('Supabase admin API error (listUsers):', listUsersError);
      return handleApiError(listUsersError, `Error fetching users from Supabase: ${listUsersError.message}`);
    }

    const user = data.users.find((u: any) => u.email === email);

    if (user) {
      return NextResponse.json({ id: user.id, email: user.email }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
  } catch (error: any) {
    console.error('Catch-all error in /api/user GET:', error);
    return handleApiError(error, 'Failed to retrieve user data due to an unexpected error.');
  }
}
