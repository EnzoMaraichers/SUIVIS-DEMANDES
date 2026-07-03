import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const utilisateurs = data.users
    .filter((u) => u.id !== user.id && u.email_confirmed_at)
    .map((u) => ({
      id: u.id,
      email: u.email || '',
      nom_complet: (u.user_metadata?.nom_complet as string) || u.email || '',
      service: (u.user_metadata?.service as string) || '',
    }))
    .sort((a, b) => a.nom_complet.localeCompare(b.nom_complet));

  return NextResponse.json({ utilisateurs });
}
