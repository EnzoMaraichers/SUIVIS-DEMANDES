import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    return NextResponse.json({ error: 'Note vide' }, { status: 400 });
  }

  // La policy RLS "is_createur_ou_destinataire" bloque automatiquement
  // toute personne qui n'est ni créateur ni destinataire d'origine.
  const { data: note, error } = await supabase
    .from('notes_internes')
    .insert({ demande_id: params.id, auteur_id: user.id, contenu })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Vous n'êtes pas autorisé à ajouter une note sur cette demande." },
      { status: 403 }
    );
  }

  return NextResponse.json({ note });
}
