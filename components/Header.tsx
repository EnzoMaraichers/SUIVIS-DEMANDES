'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Header({ nomComplet }: { nomComplet: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/mes-demandes" className="font-bold text-lg text-gray-900">
          SUIVIS-<span className="text-primary-500">DEMANDES</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/demande/new" className="btn-primary text-sm">
            + Nouvelle demande
          </Link>
          <span className="text-sm text-gray-500 hidden sm:inline">{nomComplet}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
}
