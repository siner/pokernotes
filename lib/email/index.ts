interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Send a transactional email via Unosend's REST API. In dev, when no
 * UNOSEND_API_KEY is set, logs the message to the console so flows can
 * be exercised end-to-end without a real account.
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  const apiKey = process.env.UNOSEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('UNOSEND_API_KEY is required to send email in production');
    }
    console.warn('[email:dev]', { from, ...params });
    return;
  }

  if (!from) {
    throw new Error('EMAIL_FROM is required when UNOSEND_API_KEY is set');
  }

  const res = await fetch('https://api.unosend.co/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      text: params.text,
      ...(params.html && { html: params.html }),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Unosend send failed (${res.status}): ${body}`);
  }
}
