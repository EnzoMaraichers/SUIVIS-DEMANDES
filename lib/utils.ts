export const CATEGORIES = [
  'RH',
  'Informatique',
  'Achat/Matériel',
  'Administratif',
  'Autre',
] as const;

export type Categorie = (typeof CATEGORIES)[number];

export const STATUTS = [
  'Nouvelle',
  'En cours',
  'En attente',
  'Résolue',
  'Clôturée',
] as const;

export type Statut = (typeof STATUTS)[number];

export const STATUT_CONFIG: Record<Statut, { label: string; color: string; bg: string }> = {
  Nouvelle: { label: 'Nouvelle', color: 'text-primary-700', bg: 'bg-primary-100' },
  'En cours': { label: 'En cours', color: 'text-amber-700', bg: 'bg-amber-100' },
  'En attente': { label: 'En attente', color: 'text-orange-700', bg: 'bg-orange-100' },
  Résolue: { label: 'Résolue', color: 'text-green-700', bg: 'bg-green-100' },
  Clôturée: { label: 'Clôturée', color: 'text-gray-700', bg: 'bg-gray-200' },
};

export const PRIORITES = ['Basse', 'Normale', 'Haute', 'Urgente'] as const;

export type Priorite = (typeof PRIORITES)[number];

export const PRIORITE_CONFIG: Record<Priorite, { label: string; color: string; bg: string }> = {
  Basse: { label: 'Basse', color: 'text-gray-600', bg: 'bg-gray-100' },
  Normale: { label: 'Normale', color: 'text-primary-700', bg: 'bg-primary-100' },
  Haute: { label: 'Haute', color: 'text-orange-700', bg: 'bg-orange-100' },
  Urgente: { label: 'Urgente', color: 'text-red-700', bg: 'bg-red-100' },
};

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function genererNumero(): string {
  const annee = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `DEM-${annee}-${rand}`;
}
