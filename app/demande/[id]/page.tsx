import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/Header';
import DemandeDetailClient from './DemandeDetailClient';

export default async function DemandeDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const nomComplet = (user.user_metadata?.nom_complet as string) || user.email || '';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header nomComplet={nomComplet} />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <DemandeDetailClient demandeId={params.id} />
      </main>
    </div>
  );
}
