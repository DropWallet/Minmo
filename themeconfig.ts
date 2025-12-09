// Semantic tokens layer - references tailwind.config.js (source of truth)
const semanticTheme = require('./tailwind.config.js').semanticTheme;
const tailwindColors = require('./tailwind.config.js').tailwindColors;

// ============================================================================
// SEMANTIC COLOR TOKENS
// ============================================================================
export const colors = {
  surface: semanticTheme.colors.surface,
  surfaceStrong: semanticTheme.colors['surface-strong'],
  overlay: semanticTheme.colors.overlay,
  surfaceInverted: semanticTheme.colors['surface-inverted'],
  surfaceBrandWeak: semanticTheme.colors['surface-brand-weak'],
  buttonPrimary: semanticTheme.colors['button-primary'],
  buttonStrong: semanticTheme.colors['button-strong'],
  buttonSecondary: semanticTheme.colors['button-secondary'],
  buttonSecondaryStrong: semanticTheme.colors['button-secondary-strong'],
  buttonGhost: semanticTheme.colors['button-ghost'],
  buttonGhostStrong: semanticTheme.colors['button-ghost-strong'],
  buttonStop: semanticTheme.colors['button-stop'],
  textPrimary: semanticTheme.colors['text-primary'],
  textSecondary: semanticTheme.colors['text-secondary'],
  textMuted: semanticTheme.colors['text-muted'],
  textInverse: semanticTheme.colors['text-inverse'],
  textButtonPrimary: semanticTheme.colors['text-button-primary'],
  textButtonStop: semanticTheme.colors['text-button-stop'],
  textBrand: semanticTheme.colors['text-brand'],
  accent: semanticTheme.colors.accent,
  accentOrange: semanticTheme.colors['accent-orange'],
  accentRed: semanticTheme.colors['accent-red'],
  accentStrong: semanticTheme.colors['accent-strong'],
  borderSubtle: semanticTheme.colors['border-subtle'],
  borderDefault: semanticTheme.colors['border-default'],
  borderButtonPrimary: semanticTheme.colors['border-button-primary'],
  success: semanticTheme.colors.success,
  warning: semanticTheme.colors.warning,
  danger: semanticTheme.colors.danger,
  info: semanticTheme.colors.info,
  'surface-metal-start': semanticTheme.colors['surface-metal-start'],
  'surface-metal-end': semanticTheme.colors['surface-metal-end'],
};

// ============================================================================
// SPACING TOKENS
// ============================================================================
export const spacing = {
  0: 0,
  0.5: 2,    // 0.125rem = 2px
  1: 4,      // 0.25rem = 4px
  1.5: 6,    // 0.375rem = 6px
  2: 8,      // 0.5rem = 8px
  2.5: 10,   // 0.625rem = 10px
  3: 12,     // 0.75rem = 12px
  3.5: 14,   // 0.875rem = 14px
  4: 16,     // 1rem = 16px
  5: 20,     // 1.25rem = 20px
  6: 24,     // 1.5rem = 24px
  7: 28,     // 1.75rem = 28px
  8: 32,     // 2rem = 32px
  9: 36,     // 2.25rem = 36px
  10: 40,    // 2.5rem = 40px
  11: 44,    // 2.75rem = 44px
  12: 48,    // 3rem = 48px
  14: 56,    // 3.5rem = 56px
  16: 64,    // 4rem = 64px
  20: 80,    // 5rem = 80px
  24: 96,    // 6rem = 96px
  28: 112,   // 7rem = 112px
  32: 128,   // 8rem = 128px
  36: 144,   // 9rem = 144px
  40: 160,   // 10rem = 160px
  44: 176,   // 11rem = 176px
  48: 192,   // 12rem = 192px
  52: 208,   // 13rem = 208px
  56: 224,   // 14rem = 224px
  60: 240,   // 15rem = 240px
  64: 256,   // 16rem = 256px
  72: 288,   // 18rem = 288px
  80: 320,   // 20rem = 320px
  96: 384,   // 24rem = 384px
};

// ============================================================================
// RADIUS TOKENS
// ============================================================================
export const radii = {
  none: 0,
  sm: 2,        // 0.125rem = 2px
  DEFAULT: 4,   // 0.25rem = 4px
  md: 6,        // 0.375rem = 6px
  lg: 8,        // 0.5rem = 8px
  xl: 12,       // 0.75rem = 12px
  '2xl': 16,    // 1rem = 16px
  '3xl': 24,    // 1.5rem = 24px
  full: 9999,   // Full circle
};

// ============================================================================
// TYPOGRAPHY TOKENS
// ============================================================================
export const type = {
  xs: { size: 12, weight: '400' },
  sm: { size: 14, weight: '400' },
  base: { size: 16, weight: '400' },
  md: { size: 18, weight: '500' },
  lg: { size: 20, weight: '600' },
  xl: { size: 24, weight: '600' },
  '2xl': { size: 28, weight: '700' },
};

// ============================================================================
// SHADOW TOKENS
// ============================================================================
export const shadows: {
  soft: string;
  hard: string;
  neumorphic: string;
  metalInner: string;
  buttonPrimary: string;
  cardLarge: string;
  shadowColor?: string;
} = {
  soft: '0 6 24 -8 rgba(0,0,0,0.35)',
  hard: '0 8 30 -10 rgba(0,0,0,0.45)',
  neumorphic: '4px 4px 6px -2px rgba(0, 0, 0, 0.24), -4px -4px 6px -2px rgba(255, 255, 255, 0.57)',
  metalInner: 'inset -1px -2px rgba(255, 255, 255, 0.44)',
  buttonPrimary: '2px 8px 24px -2pxrgba(53, 83, 14, 0.16), 0 2px 1px 0rgba(53, 83, 14, 0.40), 0 4px 10px -4pxrgba(53, 83, 14, 0.12), -2px -2px 4px -2px #FFF',
  cardLarge: '0 109px 31px 0 rgba(38, 70, 6, 0.00), 0 70px 28px 0 rgba(38, 70, 6, 0.01), 0 39px 24px 0 rgba(38, 70, 6, 0.04), 0 17px 17px 0 rgba(38, 70, 6, 0.07), 0 4px 10px 0 rgba(38, 70, 6, 0.08)',
};

// ============================================================================
// GRADIENT TOKENS
// ============================================================================
export const gradients = {
  'surface-metal': {
    colors: [
      semanticTheme.colors['surface-metal-start'],
      semanticTheme.colors['surface-metal-end'],
    ],
    start: { x: 0, y: 0 },
    end: { x: 0.017, y: 1 },
    locations: [0.0015, 1],
  },
  'button-border': {
    colors: [
      semanticTheme.colors['button-border-start'],
      semanticTheme.colors['button-border-end'],
    ],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
    locations: [0, 0.9167],
  },
  'button-primary-fill': {
    colors: [
      semanticTheme.colors['button-primary-fill-start'],
      semanticTheme.colors['button-primary-fill-end'],
    ],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
    locations: [0, 1],
  },
  'button-hero-fill': {
    colors: [
      semanticTheme.colors['button-hero-fill-start'],
      semanticTheme.colors['button-hero-fill-mid'],
      semanticTheme.colors['button-hero-fill-end'],
    ],
    start: { x: 1, y: 0 }, // 270deg = right to left
    end: { x: 0, y: 0 },
    locations: [0.0019, 0.5059, 0.9981],
  },
  'surface-card': {
    colors: [
      semanticTheme.colors['surface-card-start'],
      semanticTheme.colors['surface-card-end'],
    ],
    start: { x: 0, y: 0 }, // 136.28deg diagonal
    end: { x: 1, y: 1 },
    locations: [0.0309, 1],
  },
  'surface-card-inner': {
    colors: [
      semanticTheme.colors['surface-card-inner-start'],
      semanticTheme.colors['surface-card-inner-end'],
    ],
    start: { x: 0, y: 0 }, // 135.38deg diagonal
    end: { x: 1, y: 1 },
    locations: [0.023, 1.0],
  },
};

shadows.shadowColor = colors.surface;

// ============================================================================
// DARK MODE COLOR HELPER
// ============================================================================
export type ThemeColors = {
  surface: string;
  surfaceStrong: string;
  surfaceMid: string;
  surfaceBrandWeak: string;
  overlay: string;
  surfaceInverted: string;
  buttonPrimary: string;
  buttonStrong: string;
  buttonSecondary: string;
  buttonSecondaryStrong: string;
  buttonGhost: string;
  buttonGhostStrong: string;
  buttonStop: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  textButtonPrimary: string;
  textButtonStop: string;
  textBrand: string;
  accent: string;
  accentOrange: string;
  accentRed: string;
  accentStrong: string;
  borderSubtle: string;
  borderDefault: string;
  borderButtonPrimary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  'surface-metal-start': string;
  'surface-metal-end': string;
};

export function getColors(isDark: boolean = false): ThemeColors {
  if (isDark) {
    return {
      surface: semanticTheme.colors['surface-dark'],
      surfaceStrong: semanticTheme.colors['surface-strong-dark'],
      surfaceMid: semanticTheme.colors['surface-mid-dark'],
      surfaceBrandWeak: semanticTheme.colors['surface-brand-weak-dark'],
      overlay: semanticTheme.colors['overlay-dark'],
      surfaceInverted: semanticTheme.colors['surface-inverted-dark'],
      buttonPrimary: semanticTheme.colors['button-primary-dark'],
      buttonStrong: semanticTheme.colors['button-strong-dark'],
      buttonSecondary: semanticTheme.colors['button-secondary-dark'],
      buttonSecondaryStrong: semanticTheme.colors['button-secondary-strong-dark'],
      buttonGhost: semanticTheme.colors['button-ghost-dark'],
      buttonGhostStrong: semanticTheme.colors['button-ghost-strong-dark'],
      buttonStop: semanticTheme.colors['button-stop-dark'],
      textPrimary: semanticTheme.colors['text-primary-dark'],
      textSecondary: semanticTheme.colors['text-secondary-dark'],
      textMuted: semanticTheme.colors['text-muted-dark'],
      textInverse: semanticTheme.colors['text-inverse-dark'],
      textButtonPrimary: semanticTheme.colors['text-button-primary-dark'],
      textButtonStop: semanticTheme.colors['text-button-stop-dark'],
      textBrand: semanticTheme.colors['text-brand-dark'],
      accent: semanticTheme.colors.accent,
      accentOrange: semanticTheme.colors['accent-orange-dark'],
      accentRed: semanticTheme.colors['accent-red-dark'],
      accentStrong: semanticTheme.colors['accent-strong'],
      borderSubtle: semanticTheme.colors['border-subtle-dark'],
      borderDefault: semanticTheme.colors['border-default-dark'],
      borderButtonPrimary: semanticTheme.colors['border-button-primary-dark'],
      success: semanticTheme.colors.success,
      warning: semanticTheme.colors.warning,
      danger: semanticTheme.colors.danger,
      info: semanticTheme.colors.info,
      'surface-metal-start': semanticTheme.colors['surface-metal-start-dark'],
      'surface-metal-end': semanticTheme.colors['surface-metal-end-dark'],
    };
  }

  return {
    surface: semanticTheme.colors.surface,
    surfaceStrong: semanticTheme.colors['surface-strong'],
    surfaceMid: semanticTheme.colors['surface-mid'],
    surfaceBrandWeak: semanticTheme.colors['surface-brand-weak'],
    overlay: semanticTheme.colors.overlay,
    surfaceInverted: semanticTheme.colors['surface-inverted'],
    buttonPrimary: semanticTheme.colors['button-primary'],
    buttonStrong: semanticTheme.colors['button-strong'],
    buttonSecondary: semanticTheme.colors['button-secondary'],
    buttonSecondaryStrong: semanticTheme.colors['button-secondary-strong'],
    buttonGhost: semanticTheme.colors['button-ghost'],
    buttonGhostStrong: semanticTheme.colors['button-ghost-strong'],
    buttonStop: semanticTheme.colors['button-stop'],
    textPrimary: semanticTheme.colors['text-primary'],
    textSecondary: semanticTheme.colors['text-secondary'],
      textMuted: semanticTheme.colors['text-muted'],
      textInverse: semanticTheme.colors['text-inverse'],
      textButtonPrimary: semanticTheme.colors['text-button-primary'],
    textButtonStop: semanticTheme.colors['text-button-stop'],
    textBrand: semanticTheme.colors['text-brand'],
      accent: semanticTheme.colors.accent,
      accentOrange: semanticTheme.colors['accent-orange'],
      accentRed: semanticTheme.colors['accent-red'],
      accentStrong: semanticTheme.colors['accent-strong'],
    borderSubtle: semanticTheme.colors['border-subtle'],
    borderDefault: semanticTheme.colors['border-default'],
    borderButtonPrimary: semanticTheme.colors['border-button-primary'],
    success: semanticTheme.colors.success,
    warning: semanticTheme.colors.warning,
    danger: semanticTheme.colors.danger,
    info: semanticTheme.colors.info,
    'surface-metal-start': semanticTheme.colors['surface-metal-start'],
    'surface-metal-end': semanticTheme.colors['surface-metal-end'],
  };
}

// ============================================================================
// DARK MODE GRADIENT HELPER
// ============================================================================
export function getGradients(isDark: boolean = false) {
  const darkGradients = {
    'surface-metal': {
      colors: [
        semanticTheme.colors['surface-metal-start-dark'],
        semanticTheme.colors['surface-metal-end-dark'],
      ],
      start: { x: 0, y: 0 },
      end: { x: 0.017, y: 1 },
      locations: [0.0015, 1],
    },
    'button-border': {
      colors: [
        semanticTheme.colors['button-border-start-dark'],
        semanticTheme.colors['button-border-end-dark'],
      ],
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      locations: [0, 0.9167],
    },
    'button-primary-fill': {
      colors: [
        semanticTheme.colors['button-primary-fill-start-dark'],
        semanticTheme.colors['button-primary-fill-end-dark'],
      ],
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      locations: [0, 1],
    },
    'button-hero-fill': {
      colors: [
        semanticTheme.colors['button-hero-fill-start-dark'],
        semanticTheme.colors['button-hero-fill-mid-dark'],
        semanticTheme.colors['button-hero-fill-end-dark'],
      ],
      start: { x: 1, y: 0 }, // 270deg = right to left
      end: { x: 0, y: 0 },
      locations: [0.0019, 0.5059, 0.9981],
    },
    'surface-card': {
      colors: [
        semanticTheme.colors['surface-card-start-dark'],
        semanticTheme.colors['surface-card-end-dark'],
      ],
      start: { x: 0, y: 0 }, // 136.28deg diagonal
      end: { x: 1, y: 1 },
      locations: [0.0309, 1],
    },
    'surface-card-inner': {
      colors: [
        semanticTheme.colors['surface-card-inner-start-dark'],
        semanticTheme.colors['surface-card-inner-end-dark'],
      ],
      start: { x: 0, y: 0 }, // 135.38deg diagonal
      end: { x: 1, y: 1 },
      locations: [0.023, 1.0],
    },
  };

  if (isDark) {
    return darkGradients;
  }

  return gradients;
}

// ============================================================================
// DARK MODE SHADOW HELPER
// ============================================================================
export function getShadows(isDark: boolean = false) {
  if (isDark) {
    return {
      soft: '0 6 24 -8 rgba(0,0,0,0.5)',
      hard: '0 8 30 -10 rgba(0,0,0,0.6)',
      neumorphic: '4px 4px 6px -2px rgba(0, 0, 0, 0.4), -4px -4px 6px -2px rgba(255, 255, 255, 0.07)',
      metalInner: 'inset -1px -2px 0 rgba(255, 255, 255, 0.26)',
      buttonPrimary: '2px 3px 12px -2px #35530E, 0 3px 1px 0 #35530E, 0 4px 10px -4px #35530E, -2px -2px 4px -2px rgba(255, 255, 255, 0.1)',
      cardLarge: '0 109px 31px 0 rgba(38, 70, 6, 0.00), 0 70px 28px 0 rgba(38, 70, 6, 0.01), 0 39px 24px 0 rgba(38, 70, 6, 0.04), 0 17px 17px 0 rgba(38, 70, 6, 0.07), 0 4px 10px 0 rgba(38, 70, 6, 0.08)',
      shadowColor: shadows.shadowColor,
    };
  }

  return {
    ...shadows,
  };
}
