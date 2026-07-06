import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { genererNumero } from '@/lib/utils';
import { emailNouvelleDemande } from '@/lib/email';

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const body = await request.json();
  const { titre, description, categorie, priorite, destinataire_id } = body;

  if (!titre || !description || !categorie || !destinataire_id) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
  }

  const numero = genererNumero();
  const admin = createAdminClient();

  // On utilise le client admin (service_role) pour l'écriture : l'authentification
  // a déjà été vérifiée juste au-dessus via la session utilisateur, donc createur_id
  // est fiable. Ça évite un conflit de timing entre le trigger d'ajout des participants
  // et la vérification RLS sur la ligne retournée par insert().select().
  const { data: demande, error } = await admin
    .from('demandes')
    .insert({
      numero,
      titre,
      description,
      categorie,
      priorite: priorite || 'Normale',
      createur_id: user.id,
      destinataire_id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Envoi de l'email au destinataire (best-effort, ne bloque pas la réponse)
  try {
    const { data: destUser } = await admin.auth.admin.getUserById(destinataire_id);
    if (destUser?.user?.email) {
      const nomDest = (destUser.user.user_metadata?.nom_complet as string) || destUser.user.email;
      const nomCreateur =
        (user.user_metadata?.nom_complet as string) || user.email || 'Un collègue';
      await emailNouvelleDemande(
        destUser.user.email,
        nomDest,
        nomCreateur,
        numero,
        titre,
        demande.id
      );
    }
  } catch (e) {
    console.error('Erreur email nouvelle demande:', e);
  }

  return NextResponse.json({ demande });
}

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filtre = searchParams.get('filtre'); // 'envoyees' | 'recues' | null (toutes)

  let query = supabase
    .from('demandes')
    .select('*')
    .order('created_at', { ascending: false });

  if (filtre === 'envoyees') {
    query = query.eq('createur_id', user.id);
  } else if (filtre === 'recues') {
    query = query.eq('destinataire_id', user.id);
  }

  const { data: demandes, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ demandes });
}
