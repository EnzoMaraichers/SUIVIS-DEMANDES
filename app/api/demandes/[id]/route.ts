import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { emailChangementStatut } from '@/lib/email';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { data: demande, error } = await supabase
    .from('demandes')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !demande) {
    return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
  }

  const [{ data: messages }, { data: notes }, { data: participants }, { data: historique }] =
    await Promise.all([
      supabase
        .from('messages')
        .select('*')
        .eq('demande_id', params.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('notes_internes')
        .select('*')
        .eq('demande_id', params.id)
        .order('created_at', { ascending: true }),
      supabase.from('demande_participants').select('*').eq('demande_id', params.id),
      supabase
        .from('historique')
        .select('*')
        .eq('demande_id', params.id)
        .order('created_at', { ascending: false }),
    ]);

  // Récupération des infos (nom/email) des utilisateurs impliqués via l'admin API
  const admin = createAdminClient();
  const userIds = new Set<string>([
    demande.createur_id,
    demande.destinataire_id,
    ...(messages || []).map((m) => m.auteur_id),
    ...(notes || []).map((n) => n.auteur_id),
    ...(participants || []).map((p) => p.user_id),
  ]);

  const usersInfo: Record<string, { nom_complet: string; email: string }> = {};
  await Promise.all(
    Array.from(userIds).map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      if (data?.user) {
        usersInfo[id] = {
          nom_complet: (data.user.user_metadata?.nom_complet as string) || data.user.email || '',
          email: data.user.email || '',
        };
      }
    })
  );

  return NextResponse.json({
    demande,
    messages: messages || [],
    notes: notes || [],
    participants: participants || [],
    historique: historique || [],
    usersInfo,
    currentUserId: user.id,
  });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const body = await request.json();
  const { statut } = body;

  const { data: demandeAvant } = await supabase
    .from('demandes')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!demandeAvant) {
    return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
  }

  const updates: Record<string, unknown> = { statut };
  if (statut === 'Résolue' || statut === 'Clôturée') {
    updates.resolved_at = new Date().toISOString();
  }

  const { data: demande, error } = await supabase
    .from('demandes')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from('historique').insert({
    demande_id: params.id,
    auteur_id: user.id,
    action: 'changement_statut',
    ancienne_valeur: demandeAvant.statut,
    nouvelle_valeur: statut,
  });

  // Email au créateur si ce n'est pas lui qui a fait le changement
  try {
    if (demandeAvant.createur_id !== user.id) {
      const admin = createAdminClient();
      const { data: createurUser } = await admin.auth.admin.getUserById(demandeAvant.createur_id);
      if (createurUser?.user?.email) {
        const nomCreateur =
          (createurUser.user.user_metadata?.nom_complet as string) || createurUser.user.email;
        await emailChangementStatut(
          createurUser.user.email,
          nomCreateur,
          demandeAvant.numero,
          demandeAvant.titre,
          statut,
          params.id
        );
      }
    }
  } catch (e) {
    console.error('Erreur email changement statut:', e);
  }

  return NextResponse.json({ demande });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { data: demande } = await supabase
    .from('demandes')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!demande) {
    return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
  }

  const estAutorise = user.id === demande.createur_id || user.id === demande.destinataire_id;
  if (!estAutorise) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  if (demande.statut !== 'Clôturée') {
    return NextResponse.json(
      { error: 'Seule une demande clôturée peut être supprimée.' },
      { status: 400 }
    );
  }

  // Suppression via le client admin : les tables liées (messages, notes, participants,
  // historique) sont supprimées automatiquement grâce aux "on delete cascade" en base.
  const admin = createAdminClient();
  const { error } = await admin.from('demandes').delete().eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
