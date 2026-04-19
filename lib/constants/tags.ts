export const PLAYER_TAGS = {
  aggression: ['aggro', 'passive', 'nit', 'maniac'],
  style: ['fish', 'reg', 'shark', 'calling-station'],
  tendencies: [
    '3bet-happy',
    'slow-player',
    'bluffer',
    'value-heavy',
    'overbet',
    'scared-money',
    'tilt-prone',
    'solid',
    'tricky',
  ],
} as const;

export type TagCategory = keyof typeof PLAYER_TAGS;
export type PlayerTag =
  | (typeof PLAYER_TAGS.aggression)[number]
  | (typeof PLAYER_TAGS.style)[number]
  | (typeof PLAYER_TAGS.tendencies)[number];

export const ALL_TAGS: PlayerTag[] = [
  ...PLAYER_TAGS.aggression,
  ...PLAYER_TAGS.style,
  ...PLAYER_TAGS.tendencies,
];
