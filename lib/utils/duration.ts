export function formatSessionDuration(
  startedAt: Date | undefined,
  endedAt: Date | undefined,
  t: (key: string, values?: Record<string, unknown>) => string
): string {
  if (!startedAt) return '';
  const end = endedAt ?? new Date();
  const mins = Math.floor((end.getTime() - startedAt.getTime()) / 60_000);
  if (mins < 1) return t('durationShort');
  if (mins < 60) return t('durationMinutes', { minutes: mins });
  return t('duration', { hours: Math.floor(mins / 60), minutes: mins % 60 });
}
