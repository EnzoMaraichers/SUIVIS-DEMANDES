'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  STATUT_CONFIG,
  PRIORITE_CONFIG,
  STATUTS,
  formatDate,
  type Statut,
} from '@/lib/utils';

type Demande = {
  id: string;
  numero: string;
  titre: string;
  description: string;
  categorie: string;
  statut: Statut;
  priorite: keyof typeof PRIORITE_CONFIG;
  createur_id: string;
  destinataire_id: string;
  created_at: string;
};

type Message = { id: string; auteur_id: string; contenu: string; created_at: string };
type Note = { id: string; auteur_id: string; contenu: string; created_at: string };
type Participant = { id: string; user_id: string };
type UserInfo = { nom_complet: string; email: string };
type HistoriqueItem = {
  id: string;
  auteur_id: string;
  action: string;
  ancienne_valeur: string | null;
  nouvelle_valeur: string | null;
  created_at: string;
};

export default function DemandeDetailClient({ demandeId }: { demandeId: string }) {
  const router = useRouter();
  const [demande, setDemande] = useState<Demande | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [historique, setHistorique] = useState<HistoriqueItem[]>([]);
  const [usersInfo, setUsersInfo] = useState<Record<string, UserInfo>>({});
  const [currentUserId, setCurrentUserId] = useState('');
  const [tab, setTab] = useState<'discussion' | 'notes' | 'historique'>('discussion');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [nouveauMessage, setNouveauMessage] = useState('');
  const [nouvelleNote, setNouvelleNote] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [utilisateursDispo, setUtilisateursDispo] = useState<
    { id: string; nom_complet: string; email: string }[]
  >([]);
  const [participantChoisi, setParticipantChoisi] = useState('');
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);

  const charger = useCallback(async () => {
    const res = await fetch(`/api/demandes/${demandeId}`);
    if (!res.ok) {
      setError('Demande introuvable ou accès refusé.');
      setLoading(false);
      return;
    }
    const data = await res.json();
    setDemande(data.demande);
    setMessages(data.messages);
    setNotes(data.notes);
    setParticipants(data.participants);
    setHistorique(data.historique);
    setUsersInfo(data.usersInfo);
    setCurrentUserId(data.currentUserId);
    setLoading(false);
  }, [demandeId]);

  useEffect(() => {
    charger();
  }, [charger]);

  const nomDe = (id: string) => usersInfo[id]?.nom_complet || 'Utilisateur';

  async function envoyerMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!nouveauMessage.trim()) return;
    setEnvoiEnCours(true);
    const res = await fetch(`/api/demandes/${demandeId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenu: nouveauMessage }),
    });
    if (res.ok) {
      setNouveauMessage('');
      await charger();
    }
    setEnvoiEnCours(false);
  }

  async function envoyerNote(e: React.FormEvent) {
    e.preventDefault();
    if (!nouvelleNote.trim()) return;
    setEnvoiEnCours(true);
    const res = await fetch(`/api/demandes/${demandeId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenu: nouvelleNote }),
    });
    if (res.ok) {
      setNouvelleNote('');
      await charger();
    }
    setEnvoiEnCours(false);
  }

  async function changerStatut(statut: Statut) {
    const res = await fetch(`/api/demandes/${demandeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    });
    if (res.ok) await charger();
  }

  async function ouvrirAjoutParticipant() {
    setShowAddParticipant(true);
    const res = await fetch('/api/utilisateurs');
    const data = await res.json();
    const dejaParticipants = new Set(participants.map((p) => p.user_id));
    setUtilisateursDispo((data.utilisateurs || []).filter((u: { id: string }) => !dejaParticipants.has(u.id)));
  }

  async function ajouterParticipant() {
    if (!participantChoisi) return;
    const res = await fetch(`/api/demandes/${demandeId}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: participantChoisi }),
    });
    if (res.ok) {
      setShowAddParticipant(false);
      setParticipantChoisi('');
      await charger();
    }
  }

  async function supprimerDemande() {
    const confirme = window.confirm(
      'Supprimer définitivement cette demande ? Cette action est irréversible : messages, notes et historique seront perdus.'
    );
    if (!confirme) return;

    setSuppressionEnCours(true);
    const res = await fetch(`/api/demandes/${demandeId}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/mes-demandes');
    } else {
      const data = await res.json();
      alert(data.error || 'Erreur lors de la suppression.');
      setSuppressionEnCours(false);
    }
  }

  if (loading) return <p className="text-gray-400">Chargement...</p>;
  if (error || !demande) return <p className="text-red-600">{error}</p>;

  const estCreateurOuDestinataire =
    currentUserId === demande.createur_id || currentUserId === demande.destinataire_id;
  const peutChangerStatut = currentUserId === demande.destinataire_id;

  return (
    <div>
      {/* En-tête de la demande */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <span className="text-xs font-mono text-gray-400">{demande.numero}</span>
            <h1 className="text-xl font-bold text-gray-900 mt-1">{demande.titre}</h1>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${PRIORITE_CONFIG[demande.priorite].bg} ${PRIORITE_CONFIG[demande.priorite].color}`}
          >
            {PRIORITE_CONFIG[demande.priorite].label}
          </span>
        </div>

        <p className="text-gray-600 whitespace-pre-wrap mb-4">{demande.description}</p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 mb-4">
          <span>
            De <strong className="text-gray-700">{nomDe(demande.createur_id)}</strong>
          </span>
          <span>
            À <strong className="text-gray-700">{nomDe(demande.destinataire_id)}</strong>
          </span>
          <span>{demande.categorie}</span>
          <span>{formatDate(demande.created_at)}</span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          {peutChangerStatut ? (
            <select
              value={demande.statut}
              onChange={(e) => changerStatut(e.target.value as Statut)}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg border-0 ${STATUT_CONFIG[demande.statut].bg} ${STATUT_CONFIG[demande.statut].color}`}
            >
              {STATUTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : (
            <span
              className={`text-sm font-medium px-3 py-1.5 rounded-lg ${STATUT_CONFIG[demande.statut].bg} ${STATUT_CONFIG[demande.statut].color}`}
            >
              {STATUT_CONFIG[demande.statut].label}
            </span>
          )}

          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {participants.map((p) => (
                <div
                  key={p.id}
                  title={nomDe(p.user_id)}
                  className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 text-xs font-medium flex items-center justify-center border-2 border-white"
                >
                  {nomDe(p.user_id).charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            <button
              onClick={ouvrirAjoutParticipant}
              className="text-xs text-primary-600 hover:underline"
            >
              + Ajouter
            </button>
            {demande.statut === 'Clôturée' && estCreateurOuDestinataire && (
              <button
                onClick={supprimerDemande}
                disabled={suppressionEnCours}
                className="text-xs text-red-600 hover:underline ml-2 disabled:opacity-50"
              >
                {suppressionEnCours ? 'Suppression...' : 'Supprimer'}
              </button>
            )}
          </div>
        </div>

        {showAddParticipant && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
            <select
              value={participantChoisi}
              onChange={(e) => setParticipantChoisi(e.target.value)}
              className="input-field text-sm"
            >
              <option value="">Choisir une personne...</option>
              {utilisateursDispo.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nom_complet}
                </option>
              ))}
            </select>
            <button onClick={ajouterParticipant} className="btn-primary text-sm whitespace-nowrap">
              Ajouter
            </button>
            <button
              onClick={() => setShowAddParticipant(false)}
              className="btn-secondary text-sm"
            >
              Annuler
            </button>
          </div>
        )}
      </div>

      {/* Onglets */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('discussion')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'discussion' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          Discussion ({messages.length})
        </button>
        {estCreateurOuDestinataire && (
          <button
            onClick={() => setTab('notes')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'notes' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
          >
            Notes internes ({notes.length})
          </button>
        )}
        <button
          onClick={() => setTab('historique')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'historique' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          Historique
        </button>
      </div>

      {/* Discussion */}
      {tab === 'discussion' && (
        <div className="card p-6">
          <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucun message pour le moment.</p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.auteur_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-xl px-4 py-2 ${m.auteur_id === currentUserId ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-800'}`}
                  >
                    <p className="text-xs font-medium mb-1 opacity-80">{nomDe(m.auteur_id)}</p>
                    <p className="whitespace-pre-wrap">{m.contenu}</p>
                    <p className="text-xs mt-1 opacity-60">{formatDate(m.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <form onSubmit={envoyerMessage} className="flex gap-2">
            <input
              value={nouveauMessage}
              onChange={(e) => setNouveauMessage(e.target.value)}
              className="input-field"
              placeholder="Écrire un message..."
            />
            <button type="submit" disabled={envoiEnCours} className="btn-primary whitespace-nowrap">
              Envoyer
            </button>
          </form>
        </div>
      )}

      {/* Notes internes */}
      {tab === 'notes' && estCreateurOuDestinataire && (
        <div className="card p-6">
          <p className="text-xs text-gray-400 mb-4">
            Visibles uniquement par le créateur et le destinataire de la demande.
          </p>
          <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
            {notes.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucune note pour le moment.</p>
            ) : (
              notes.map((n) => (
                <div key={n.id} className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <p className="text-xs font-medium text-amber-800 mb-1">
                    {nomDe(n.auteur_id)} · {formatDate(n.created_at)}
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{n.contenu}</p>
                </div>
              ))
            )}
          </div>
          <form onSubmit={envoyerNote} className="flex gap-2">
            <input
              value={nouvelleNote}
              onChange={(e) => setNouvelleNote(e.target.value)}
              className="input-field"
              placeholder="Ajouter une note interne..."
            />
            <button type="submit" disabled={envoiEnCours} className="btn-primary whitespace-nowrap">
              Ajouter
            </button>
          </form>
        </div>
      )}

      {/* Historique */}
      {tab === 'historique' && (
        <div className="card p-6">
          {historique.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucun événement pour le moment.</p>
          ) : (
            <ul className="space-y-3">
              {historique.map((h) => (
                <li key={h.id} className="text-sm text-gray-600 border-l-2 border-primary-200 pl-3">
                  <span className="font-medium text-gray-800">{nomDe(h.auteur_id)}</span>{' '}
                  {h.action === 'changement_statut' && (
                    <>
                      a changé le statut de <strong>{h.ancienne_valeur}</strong> à{' '}
                      <strong>{h.nouvelle_valeur}</strong>
                    </>
                  )}
                  {h.action === 'ajout_participant' && <>a ajouté un participant</>}
                  <br />
                  <span className="text-xs text-gray-400">{formatDate(h.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
