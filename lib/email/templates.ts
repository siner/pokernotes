export type EmailLocale = 'en' | 'es';

interface EmailContent {
  subject: string;
  text: string;
}

function normalizeLocale(locale: string | null | undefined): EmailLocale {
  return locale === 'es' ? 'es' : 'en';
}

function greeting(locale: EmailLocale, name: string | undefined): string {
  if (locale === 'es') return name ? `Hola ${name},` : 'Hola,';
  return name ? `Hi ${name},` : 'Hi,';
}

export function resetPasswordTemplate(
  rawLocale: string | null | undefined,
  params: { name?: string; url: string }
): EmailContent {
  const locale = normalizeLocale(rawLocale);
  const hi = greeting(locale, params.name);

  if (locale === 'es') {
    return {
      subject: 'Restablece tu contraseña de PokerReads',
      text: [
        hi,
        '',
        'Has solicitado restablecer tu contraseña de PokerReads. Abre este enlace para elegir una nueva (caduca en 1 hora):',
        '',
        params.url,
        '',
        'Si no fuiste tú, puedes ignorar este correo — tu contraseña no cambiará.',
        '',
        '— PokerReads',
      ].join('\n'),
    };
  }

  return {
    subject: 'Reset your PokerReads password',
    text: [
      hi,
      '',
      'You requested to reset your PokerReads password. Open this link to choose a new one (expires in 1 hour):',
      '',
      params.url,
      '',
      "If you didn't ask for this, you can safely ignore this email — your password won't change.",
      '',
      '— PokerReads',
    ].join('\n'),
  };
}

export function verifyEmailTemplate(
  rawLocale: string | null | undefined,
  params: { name?: string; url: string }
): EmailContent {
  const locale = normalizeLocale(rawLocale);
  const hi = greeting(locale, params.name);

  if (locale === 'es') {
    return {
      subject: 'Verifica tu email en PokerReads',
      text: [
        hi,
        '',
        'Confirma tu dirección de correo para activar tu cuenta de PokerReads. Abre este enlace:',
        '',
        params.url,
        '',
        'Si no creaste esta cuenta, puedes ignorar este correo.',
        '',
        '— PokerReads',
      ].join('\n'),
    };
  }

  return {
    subject: 'Verify your PokerReads email',
    text: [
      hi,
      '',
      'Confirm your email address to activate your PokerReads account. Open this link:',
      '',
      params.url,
      '',
      "If you didn't create this account, you can safely ignore this email.",
      '',
      '— PokerReads',
    ].join('\n'),
  };
}

export function welcomeProTemplate(
  rawLocale: string | null | undefined,
  params: { name?: string }
): EmailContent {
  const locale = normalizeLocale(rawLocale);
  const hi = greeting(locale, params.name);

  if (locale === 'es') {
    return {
      subject: '¡Bienvenido/a a PokerReads Pro!',
      text: [
        hi,
        '',
        'Gracias por subir a Pro. Ahora tienes:',
        '',
        '· Notas y jugadores ilimitados',
        '· Sincronización en la nube entre dispositivos',
        '· Fotos de jugadores',
        '· Exportación CSV',
        '',
        'Algunos consejos para empezar:',
        '· Tira de la búsqueda en /notes para encontrar reads viejos por nombre, etiqueta o texto de la nota.',
        '· Activa una sesión antes de jugar para que las nuevas notas queden agrupadas por mesa.',
        '· Usa la cámara para subir una foto discreta y reconocer al jugador en la próxima sesión.',
        '',
        'Si tienes cualquier duda, responde a este email.',
        '',
        '— PokerReads',
      ].join('\n'),
    };
  }

  return {
    subject: 'Welcome to PokerReads Pro!',
    text: [
      hi,
      '',
      'Thanks for upgrading to Pro. You now have:',
      '',
      '· Unlimited notes and players',
      '· Cloud sync across devices',
      '· Player photos',
      '· CSV export',
      '',
      'A few tips to get the most out of it:',
      '· Use the search bar in /notes to dig up old reads by name, tag, or note text.',
      '· Start a session before you sit down so your new notes get grouped by table.',
      '· Snap a discreet photo to recognize a player in your next session.',
      '',
      'If you have any questions, just reply to this email.',
      '',
      '— PokerReads',
    ].join('\n'),
  };
}
