import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SUIVIS-DEMANDES',
  description: 'Demandes internes entre collègues avec suivi et messagerie',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
