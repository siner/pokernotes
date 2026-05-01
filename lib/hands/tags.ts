// Controlled vocabulary for hand-level tags. English keys, never translated —
// they are stable identifiers used for filtering and search. The AI structurer
// uses this list as its approved set; the hand editor uses it for the manual
// tag picker. Kept in a tiny client-safe module so neither side pulls extra
// dependencies just for the constants.

export const HAND_TAGS = [
  // action types
  'bluff',
  'semi-bluff',
  'value-bet',
  'thin-value',
  'slowplay',
  'overbet',
  'check-raise',
  'donk-bet',
  '3bet',
  '4bet',
  'squeeze',
  'cold-call',
  'iso-raise',
  'limp',
  // hero perspective
  'hero-call',
  'hero-fold',
  'hero-shove',
  'hero-bluff',
  'hero-trap',
  // hand archetypes
  'cooler',
  'setup',
  'bad-beat',
  'suckout',
  // table dynamics
  'multiway',
  'heads-up',
  'srp',
  '3bp',
  '4bp',
  // board textures
  'wet-board',
  'dry-board',
  'paired-board',
  'monotone',
  'two-tone',
  'straighty',
  // villain perspective
  'villain-bluff',
  'villain-value',
  'villain-station',
  'villain-spew',
] as const;

export type HandTag = (typeof HAND_TAGS)[number];

export const POSITIONS = [
  'UTG',
  'UTG+1',
  'UTG+2',
  'MP',
  'MP+1',
  'LJ',
  'HJ',
  'CO',
  'BTN',
  'SB',
  'BB',
] as const;

export type Position = (typeof POSITIONS)[number];
