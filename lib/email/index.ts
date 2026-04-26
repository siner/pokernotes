interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const DEFAULT_FROM = 'PokerReads <onboarding@resend.dev>';

/**
 * Send a transactional email via Resend's HTTP API. In dev, when no
 * RESEND_API_KEY is set, logs the message to the console so flows can
 * be exercised end-to-end without a real account.
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? DEFAULT_FROM;

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY is required to send email in production');
    }
    console.warn('[email:dev]', { from, ...params });
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, ...params }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend send failed (${res.status}): ${body}`);
  }
}
