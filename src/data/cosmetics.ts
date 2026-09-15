export interface SkinDef {
  id: string;
  name: string;
  swatch: [string, string, string]; // felt, gold, panel — for a quick preview chip
}

export interface DiceColorDef {
  id: string;
  name: string;
  swatch: [string, string]; // die background, pip color
}

export const SKINS: SkinDef[] = [
  { id: 'casino-gold', name: 'Casino Gold', swatch: ['#f6e9cf', '#b3892f', '#fffaf0'] },
  { id: 'midnight', name: 'Midnight Felt', swatch: ['#0b5c34', '#e8c97a', '#12331f'] },
  { id: 'neon', name: 'Neon Vegas', swatch: ['#2a1240', '#ffd23f', '#23103a'] },
];

export const DICE_COLORS: DiceColorDef[] = [
  { id: 'ivory', name: 'Ivory', swatch: ['#f8f4e8', '#2b2015'] },
  { id: 'ruby', name: 'Ruby', swatch: ['#7a1424', '#ffe9c2'] },
  { id: 'obsidian', name: 'Obsidian', swatch: ['#1c1c22', '#e8c97a'] },
];

export const DEFAULT_SKIN = 'casino-gold';
export const DEFAULT_DICE_COLOR = 'ivory';
