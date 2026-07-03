import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

async function envoyerEmail(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });
  } catch (err) {
    // On ne bloque jamais une action utilisateur si l'email échoue
    console.error('Erreur envoi email:', err);
  }
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const wrapper = (content: string) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
    <div style="background: #0ea5e9; padding: 16px 24px; border-radius: 8px 8px 0 0;">
      <h2 style="color: white; margin: 0;">SUIVIS-DEMANDES</h2>
    </div>
    <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
      ${content}
    </div>
  </div>
`;

export async function emailNouvelleDemande(
  destinataireEmail: string,
  destinataireNom: string,
  createurNom: string,
  numero: string,
  titre: string,
  demandeId: string
) {
  const html = wrapper(`
    <p>Bonjour ${destinataireNom},</p>
    <p><strong>${createurNom}</strong> vous a envoyé une nouvelle demande :</p>
    <p style="background: #f0f9ff; padding: 12px; border-radius: 6px;">
      <strong>${numero}</strong> — ${titre}
    </p>
    <p><a href="${appUrl}/demande/${demandeId}" style="color: #0ea5e9;">Voir la demande</a></p>
  `);
  await envoyerEmail(destinataireEmail, `Nouvelle demande : ${titre}`, html);
}

export async function emailNouveauMessage(
  destinataireEmail: string,
  destinataireNom: string,
  auteurNom: string,
  numero: string,
  titre: string,
  demandeId: string
) {
  const html = wrapper(`
    <p>Bonjour ${destinataireNom},</p>
    <p><strong>${auteurNom}</strong> a répondu sur la demande <strong>${numero}</strong> — ${titre}.</p>
    <p><a href="${appUrl}/demande/${demandeId}" style="color: #0ea5e9;">Voir la conversation</a></p>
  `);
  await envoyerEmail(destinataireEmail, `Nouveau message : ${titre}`, html);
}

export async function emailChangementStatut(
  destinataireEmail: string,
  destinataireNom: string,
  numero: string,
  titre: string,
  nouveauStatut: string,
  demandeId: string
) {
  const html = wrapper(`
    <p>Bonjour ${destinataireNom},</p>
    <p>Le statut de votre demande <strong>${numero}</strong> — ${titre} est passé à :</p>
    <p style="background: #f0f9ff; padding: 12px; border-radius: 6px; font-weight: bold;">
      ${nouveauStatut}
    </p>
    <p><a href="${appUrl}/demande/${demandeId}" style="color: #0ea5e9;">Voir la demande</a></p>
  `);
  await envoyerEmail(destinataireEmail, `Statut mis à jour : ${titre}`, html);
}

export async function emailAjoutParticipant(
  destinataireEmail: string,
  destinataireNom: string,
  numero: string,
  titre: string,
  demandeId: string
) {
  const html = wrapper(`
    <p>Bonjour ${destinataireNom},</p>
    <p>Vous avez été ajouté(e) à la demande <strong>${numero}</strong> — ${titre}.</p>
    <p><a href="${appUrl}/demande/${demandeId}" style="color: #0ea5e9;">Voir la demande</a></p>
  `);
  await envoyerEmail(destinataireEmail, `Vous avez été ajouté à une demande : ${titre}`, html);
}
