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
  { id: 'emerald', name: 'Emerald Table', swatch: ['#0d3b2e', '#d4af37', '#134a3a'] },
  { id: 'royal-purple', name: 'Royal Purple', swatch: ['#2e1245', '#e8c97a', '#3a1a59'] },
];

export const DICE_COLORS: DiceColorDef[] = [
  { id: 'ivory', name: 'Ivory', swatch: ['#f8f4e8', '#2b2015'] },
  { id: 'ruby', name: 'Ruby', swatch: ['#7a1424', '#ffe9c2'] },
  { id: 'obsidian', name: 'Obsidian', swatch: ['#1c1c22', '#e8c97a'] },
  { id: 'sapphire', name: 'Sapphire', swatch: ['#12305c', '#f8f4e8'] },
  { id: 'jade', name: 'Jade', swatch: ['#0f4d3a', '#f8f4e8'] },
];

export const DEFAULT_SKIN = 'casino-gold';
export const DEFAULT_DICE_COLOR = 'ivory';
