import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { emailNouveauMessage } from '@/lib/email';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const body = await request.json();
  const { contenu } = body;

  if (!contenu?.trim()) {
    return NextResponse.json({ error: 'Message vide' }, { status: 400 });
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({ demande_id: params.id, auteur_id: user.id, contenu })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notifier les autres participants
  try {
    const { data: demande } = await supabase
      .from('demandes')
      .select('numero, titre')
      .eq('id', params.id)
      .single();

    const { data: participants } = await supabase
      .from('demande_participants')
      .select('user_id')
      .eq('demande_id', params.id);

    if (demande && participants) {
      const admin = createAdminClient();
      const nomAuteur = (user.user_metadata?.nom_complet as string) || user.email || 'Un collègue';

      await Promise.all(
        participants
          .filter((p) => p.user_id !== user.id)
          .map(async (p) => {
            const { data } = await admin.auth.admin.getUserById(p.user_id);
            if (data?.user?.email) {
              const nomDest = (data.user.user_metadata?.nom_complet as string) || data.user.email;
              await emailNouveauMessage(
                data.user.email,
                nomDest,
                nomAuteur,
                demande.numero,
                demande.titre,
                params.id
              );
            }
          })
      );
    }
  } catch (e) {
    console.error('Erreur email nouveau message:', e);
  }

  return NextResponse.json({ message });
}
