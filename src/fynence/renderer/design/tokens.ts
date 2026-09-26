export interface NewspaperColorPalette {
  paperBackground: string;
  lightPaper: string;
  darkPaper: string;
  ink: string;
  mutedInk: string;
  faintInk: string;
  rule: string;
  lightRule: string;
  accent: string;
  accentCrimson: string;
  accentGreen: string;
}

export const NEWSPAPER_COLORS: NewspaperColorPalette = {
  paperBackground: '#F2E8D0', // Warm aged newsprint
  lightPaper: '#F7F0DE',      // Highlight datelines and banner strips
  darkPaper: '#E6DCBF',       // Weather and market ear boxes
  ink: '#111111',             // Primary broadsheet black ink
  mutedInk: '#3A3732',        // Body paragraphs, author datelines
  faintInk: '#716B61',        // Footers, colophons, image credits
  rule: '#252525',            // Thick ornamental divider rules
  lightRule: '#D1C6AC',       // Thin column separating rules
  accent: '#111111',          // Editorial kickers
  accentCrimson: '#8B261D',   // Negative delta indicator, breaking news kicker
  accentGreen: '#1E5835',     // Positive delta indicator
};

export const THEME_PALETTES: Record<string, NewspaperColorPalette> = {
  retro_black_cream: { ...NEWSPAPER_COLORS },
  vintage_sepia: {
    paperBackground: '#EFE3C3',
    lightPaper: '#F6EBD0',
    darkPaper: '#E0D2AC',
    ink: '#1E1710',
    mutedInk: '#4A3B2C',
    faintInk: '#7A6B5C',
    rule: '#2C2218',
    lightRule: '#C8B896',
    accent: '#1E1710',
    accentCrimson: '#942B1A',
    accentGreen: '#235932',
  },
  classic_monochrome: {
    paperBackground: '#F5F5F0',
    lightPaper: '#FFFFFF',
    darkPaper: '#E8E8E2',
    ink: '#000000',
    mutedInk: '#222222',
    faintInk: '#555555',
    rule: '#000000',
    lightRule: '#CCCCCC',
    accent: '#000000',
    accentCrimson: '#444444',
    accentGreen: '#111111',
  },
};

export const NEWSPAPER_TYPOGRAPHY = {
  fontMasthead: "'Playfair Display', 'Cinzel', Georgia, 'Times New Roman', serif",
  fontHeadline: "'Playfair Display', Merriweather, Georgia, serif",
  fontBody: "'Merriweather', Lora, Georgia, serif",
  fontMetadata: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  fontMono: "'Courier New', Courier, monospace",
};

export const NEWSPAPER_DIMENSIONS = {
  defaultWidth: 1200,
  defaultHeight: 1600,
  pagePadding: 36,
  columnGap: 24,
  headerHeight: 220,
  footerHeight: 60,
};

/**
 * Returns color palette for specified theme token.
 */
export function getThemePalette(themeName = 'retro_black_cream'): NewspaperColorPalette {
  return THEME_PALETTES[themeName] || NEWSPAPER_COLORS;
}

/**
 * Generates an SVG feTurbulence paper grain filter definition.
 */
export function getPaperGrainSvgFilter(): string {
  return `
    <filter id="paper-texture" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.04 0" in="noise" result="coloredNoise" />
      <feComposite operator="in" in2="SourceGraphic" />
    </filter>
  `.trim();
}
