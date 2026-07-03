import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/Header';
import NouvelleDemandeClient from './NouvelleDemandeClient';

export default async function NouvelleDemandePage() {
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
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Nouvelle demande</h1>
        <NouvelleDemandeClient />
      </main>
    </div>
  );
}
