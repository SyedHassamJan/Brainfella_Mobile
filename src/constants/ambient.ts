export type AmbientScene = 'water' | 'rain' | 'lake';

type Palette = {
  /** Three-stop vertical gradient, top to bottom. */
  sky: [string, string, string];
  /** Colour of the drifting glows. */
  glow: string;
  /** Colour of ripples, droplets and mist. */
  accent: string;
};

/**
 * Colours for each scene. Muted on purpose (sage, misty blue, lavender): nothing
 * bright, nothing alarming. The scenes themselves are drawn in code
 * (AmbientBackground), so there are no media files to ship.
 */
export const AMBIENT_PALETTES: Record<AmbientScene, { light: Palette; dark: Palette }> = {
  water: {
    light: { sky: ['#e3f0ee', '#d5e9e6', '#e8f0e6'], glow: '#bfe0da', accent: '#7fb5ad' },
    dark: { sky: ['#122328', '#15292c', '#172a25'], glow: '#2a5a5a', accent: '#6fa8a0' },
  },
  rain: {
    light: { sky: ['#e4e9f1', '#dbe0ee', '#ebe7f4'], glow: '#c9cfe8', accent: '#8d97c4' },
    dark: { sky: ['#131b27', '#181d2e', '#1d1b30'], glow: '#35406b', accent: '#8791c0' },
  },
  lake: {
    light: { sky: ['#e9eef0', '#dcebee', '#e6f0e8'], glow: '#f2e6d6', accent: '#a7c7cb' },
    dark: { sky: ['#101d24', '#132630', '#162821'], glow: '#4a4a3a', accent: '#6f9aa2' },
  },
};
