import { ImageResponse } from 'next/og';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '@/lib/db';
import { hands } from '@/lib/db/schema';

// No `runtime = 'edge'` — OpenNext Cloudflare can't bundle edge routes
// alongside the default function. ImageResponse uses Web APIs only.
export const alt = 'Shared poker hand on PokerReads';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type Props = { params: Promise<{ locale: string; token: string }> };

interface StructuredHand {
  title?: string;
  summary?: string;
  heroPosition?: string;
  villainPosition?: string;
  heroHand?: string;
  board?: string;
  stakes?: string;
  result?: string;
}

const RESULT_LABEL: Record<string, string> = {
  hero_won: 'Won',
  hero_lost: 'Lost',
  split: 'Split',
  no_showdown: 'No showdown',
};

const RESULT_COLOR: Record<string, string> = {
  hero_won: '#10b981',
  hero_lost: '#f43f5e',
  split: '#f59e0b',
  no_showdown: '#94a3b8',
};

async function loadStructured(token: string): Promise<StructuredHand | null> {
  if (!token || token.length > 80) return null;
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const row = await db
    .select({ structuredData: hands.structuredData })
    .from(hands)
    .where(and(eq(hands.shareToken, token), isNotNull(hands.shareToken), isNull(hands.deletedAt)))
    .get();
  if (!row) return null;
  return row.structuredData as StructuredHand;
}

export default async function HandShareOgImage({ params }: Props) {
  const { token } = await params;
  const data = await loadStructured(token);

  const title = data?.title ?? 'Shared poker hand';
  const summary = data?.summary ?? 'A hand worth analyzing.';
  const heroPos = data?.heroPosition;
  const heroHand = data?.heroHand;
  const board = data?.board;
  const stakes = data?.stakes;
  const result = data?.result ?? 'unknown';
  const resultColor = RESULT_COLOR[result] ?? '#94a3b8';

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#060d08',
        padding: '64px 72px',
        position: 'relative',
        fontFamily: 'sans-serif',
      }}
    >
      {/* glow */}
      <div
        style={{
          position: 'absolute',
          top: '-220px',
          right: '-220px',
          width: '640px',
          height: '640px',
          background: `radial-gradient(circle, ${resultColor}33 0%, ${resultColor}00 70%)`,
          display: 'flex',
        }}
      />

      {/* brand strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
        <div
          style={{
            width: '52px',
            height: '52px',
            backgroundColor: '#10b981',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: '32px', color: 'white', lineHeight: 1 }}>♠</span>
        </div>
        <span style={{ fontSize: '32px', fontWeight: 800, color: 'white' }}>PokerReads</span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '16px',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontWeight: 700,
            display: 'flex',
          }}
        >
          Shared hand
        </span>
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: '60px',
          fontWeight: 800,
          color: 'white',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          maxWidth: '1056px',
          display: 'flex',
        }}
      >
        {title}
      </div>

      {/* Summary */}
      <div
        style={{
          fontSize: '24px',
          color: '#cbd5e1',
          marginTop: '24px',
          lineHeight: 1.4,
          maxWidth: '1000px',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {summary}
      </div>

      {/* Chips row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          marginTop: 'auto',
          paddingTop: '32px',
        }}
      >
        {heroPos && <Chip label={`Hero ${heroPos}`} accent />}
        {heroHand && <Chip label={heroHand} accent mono />}
        {board && <Chip label={board} mono />}
        {stakes && <Chip label={stakes} />}
        {result !== 'unknown' && (
          <Chip label={RESULT_LABEL[result] ?? result} color={resultColor} />
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: '32px',
          right: '72px',
          fontSize: '20px',
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

function Chip({
  label,
  accent,
  mono,
  color,
}: {
  label: string;
  accent?: boolean;
  mono?: boolean;
  color?: string;
}) {
  const bg = color ? `${color}22` : accent ? 'rgba(16,185,129,0.15)' : 'rgba(30,41,59,0.6)';
  const border = color ? `${color}66` : accent ? 'rgba(16,185,129,0.4)' : 'rgba(71,85,105,0.6)';
  const fg = color ?? (accent ? '#34d399' : '#cbd5e1');
  return (
    <div
      style={{
        backgroundColor: bg,
        border: `1px solid ${border}`,
        color: fg,
        padding: '8px 16px',
        borderRadius: '10px',
        fontSize: '22px',
        fontWeight: 600,
        fontFamily: mono ? 'monospace' : 'sans-serif',
        display: 'flex',
      }}
    >
      {label}
    </div>
  );
}
