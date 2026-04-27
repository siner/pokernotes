import { ImageResponse } from 'next/og';

// No `runtime = 'edge'` — OpenNext Cloudflare can't bundle edge routes
// alongside the default function. ImageResponse uses Web APIs only, so it
// runs fine under the default runtime on Workers.
export const alt = 'PokerReads — AI-powered live poker notes';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type Props = { params: Promise<{ locale: string }> };

export default async function OpengraphImage({ params }: Props) {
  const { locale } = await params;
  const isEs = locale === 'es';
  const tagline = isEs
    ? 'Lee a tus rivales. Gana más al poker en vivo.'
    : 'Read your opponents. Win more live poker.';
  const subtitle = isEs ? 'Notas con IA · Calculadoras · PWA' : 'AI Notes · Calculators · PWA';

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#060d08',
        padding: '80px',
        position: 'relative',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-220px',
          right: '-220px',
          width: '640px',
          height: '640px',
          background: 'radial-gradient(circle, rgba(16,185,129,0.32) 0%, rgba(16,185,129,0) 70%)',
          display: 'flex',
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          marginBottom: 'auto',
        }}
      >
        <div
          style={{
            width: '88px',
            height: '88px',
            backgroundColor: '#10b981',
            borderRadius: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 20px 50px rgba(16,185,129,0.45)',
          }}
        >
          <span style={{ fontSize: '56px', color: 'white', lineHeight: 1 }}>♠</span>
        </div>
        <span
          style={{
            fontSize: '56px',
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-0.02em',
          }}
        >
          PokerReads
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            fontSize: '76px',
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
            maxWidth: '960px',
            display: 'flex',
          }}
        >
          {tagline}
        </div>
        <div
          style={{
            fontSize: '32px',
            color: '#94a3b8',
            marginTop: '36px',
            display: 'flex',
          }}
        >
          {subtitle}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '70px',
          right: '80px',
          fontSize: '24px',
          color: '#64748b',
          display: 'flex',
        }}
      >
        pokerreads.app
      </div>
    </div>,
    { ...size }
  );
}
