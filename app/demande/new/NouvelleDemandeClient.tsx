'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES, PRIORITES } from '@/lib/utils';

type Utilisateur = { id: string; email: string; nom_complet: string; service: string };

export default function NouvelleDemandeClient() {
  const router = useRouter();
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [categorie, setCategorie] = useState(CATEGORIES[0]);
  const [priorite, setPriorite] = useState('Normale');
  const [destinataireId, setDestinataireId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/utilisateurs')
      .then((res) => res.json())
      .then((data) => setUtilisateurs(data.utilisateurs || []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!destinataireId) {
      setError('Choisissez un destinataire.');
      return;
    }

    setLoading(true);

    const res = await fetch('/api/demandes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titre,
        description,
        categorie,
        priorite,
        destinataire_id: destinataireId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Erreur lors de la création.');
      setLoading(false);
      return;
    }

    router.push(`/demande/${data.demande.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Destinataire</label>
        <select
          required
          value={destinataireId}
          onChange={(e) => setDestinataireId(e.target.value)}
          className="input-field"
        >
          <option value="">Choisir une personne...</option>
          {utilisateurs.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nom_complet} {u.service ? `— ${u.service}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
          <select
            value={categorie}
            onChange={(e) => setCategorie(e.target.value as typeof categorie)}
            className="input-field"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
          <select
            value={priorite}
            onChange={(e) => setPriorite(e.target.value)}
            className="input-field"
          >
            {PRIORITES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
        <input
          required
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          className="input-field"
          placeholder="Résumé en quelques mots"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          required
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input-field"
          placeholder="Détaillez votre demande..."
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Envoi...' : 'Envoyer la demande'}
      </button>
    </form>
  );
}
