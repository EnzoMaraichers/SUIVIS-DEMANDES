import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { emailAjoutParticipant } from '@/lib/email';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const body = await request.json();
  const { user_id } = body;

  if (!user_id) {
    return NextResponse.json({ error: 'Utilisateur manquant' }, { status: 400 });
  }

  const { error } = await supabase
    .from('demande_participants')
    .insert({ demande_id: params.id, user_id, added_by: user.id });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Cette personne est déjà participante.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from('historique').insert({
    demande_id: params.id,
    auteur_id: user.id,
    action: 'ajout_participant',
    nouvelle_valeur: user_id,
  });

  try {
    const { data: demande } = await supabase
      .from('demandes')
      .select('numero, titre')
      .eq('id', params.id)
      .single();

    if (demande) {
      const admin = createAdminClient();
      const { data } = await admin.auth.admin.getUserById(user_id);
      if (data?.user?.email) {
        const nomDest = (data.user.user_metadata?.nom_complet as string) || data.user.email;
        await emailAjoutParticipant(data.user.email, nomDest, demande.numero, demande.titre, params.id);
      }
    }
  } catch (e) {
    console.error('Erreur email ajout participant:', e);
  }

  return NextResponse.json({ success: true });
}
