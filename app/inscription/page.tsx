'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function InscriptionPage() {
  const supabase = createClient();
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [service, setService] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nom,
          prenom,
          nom_complet: `${prenom} ${nom}`,
          service,
        },
      },
    });

    if (error) {
      setError(error.message.includes('already registered') ? 'Cet email est déjà utilisé.' : error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white px-4">
        <div className="card w-full max-w-md p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Compte créé !</h1>
          <p className="text-gray-500 mb-6">
            Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous.
          </p>
          <Link href="/login" className="btn-primary inline-block">
            Aller à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white px-4 py-8">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Créer un compte</h1>
        <p className="text-gray-500 mb-6">Rejoignez SUIVIS-DEMANDES</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input
                required
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
            <input
              required
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="input-field"
              placeholder="ex: Comptabilité, Production, RH..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-500">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-primary-600 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
