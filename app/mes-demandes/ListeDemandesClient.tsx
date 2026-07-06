'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { STATUT_CONFIG, PRIORITE_CONFIG, formatDate, type Statut, type Priorite } from '@/lib/utils';

type Demande = {
  id: string;
  numero: string;
  titre: string;
  categorie: string;
  statut: Statut;
  priorite: Priorite;
  createur_id: string;
  destinataire_id: string;
  created_at: string;
};

export default function ListeDemandesClient({ currentUserId }: { currentUserId: string }) {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [filtre, setFiltre] = useState<'toutes' | 'envoyees' | 'recues'>('toutes');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const query = filtre === 'toutes' ? '' : `?filtre=${filtre}`;
    fetch(`/api/demandes${query}`)
      .then((res) => res.json())
      .then((data) => {
        setDemandes(data.demandes || []);
        setLoading(false);
      });
  }, [filtre]);

  const tabs: { key: typeof filtre; label: string }[] = [
    { key: 'toutes', label: 'Toutes' },
    { key: 'recues', label: 'Reçues' },
    { key: 'envoyees', label: 'Envoyées' },
  ];

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFiltre(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtre === tab.key
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400">Chargement...</p>
      ) : demandes.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          Aucune demande pour le moment.{' '}
          <Link href="/demande/new" className="text-primary-600 hover:underline">
            Créer une demande
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {demandes.map((d) => (
            <Link
              key={d.id}
              href={`/demande/${d.id}`}
              className="card p-4 flex items-center justify-between hover:border-primary-300 transition-colors relative overflow-hidden"
            >
              <span
                className={`absolute top-0 right-0 text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-bl-lg ${PRIORITE_CONFIG[d.priorite].bg} ${PRIORITE_CONFIG[d.priorite].color}`}
              >
                {PRIORITE_CONFIG[d.priorite].label}
              </span>

              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-gray-400">{d.numero}</span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-500">{d.categorie}</span>
                  {d.createur_id === currentUserId ? (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      Envoyée
                    </span>
                  ) : (
                    <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">
                      Reçue
                    </span>
                  )}
                </div>
                <p className="font-medium text-gray-900 truncate">{d.titre}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(d.created_at)}</p>
              </div>

              <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-4 mt-3">
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${STATUT_CONFIG[d.statut].bg} ${STATUT_CONFIG[d.statut].color}`}
