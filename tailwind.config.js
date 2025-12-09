/** @type {import('tailwindcss').Config} */

// Import Tailwind default colors
const tailwindColors = require('tailwindcss/colors');

// SEMANTIC CLASS MAPPINGS - SOURCE OF TRUTH
// Light mode = default values, Dark mode = use dark: variant with -dark suffix
// Example: className="bg-surface dark:bg-surface-dark"
// All semantic color values are defined here first, then referenced in themeconfig.ts
const semanticTheme = {
  colors: {
    // Surface colors - Light mode defaults with dark mode variants
    surface: tailwindColors.slate[50],        // Light: #f8fafc
    'surface-dark': tailwindColors.slate[800],  // Dark: #0f172a
    'surface-strong': tailwindColors.slate[200], // Light: #f1f5f9
    'surface-strong-dark': tailwindColors.slate[950],  // Dark: #020617
    'surface-mid': tailwindColors.stone[300], // Light: #e4e4e7
    'surface-mid-dark': tailwindColors.slate[800],  // Dark: #27272a
    'surface-brand-weak': tailwindColors.lime[100],
    'surface-brand-weak-dark': tailwindColors.lime[900],
    overlay: 'rgba(248,250,252,0.7)',         // Light: slate-50 with opacity
    'overlay-dark': 'rgba(15,23,42,0.7)',     // Dark: slate-900 with opacity
    'surface-inverted': tailwindColors.slate[950], // Light: dark bg
    'surface-inverted-dark': tailwindColors.slate[100], // Dark: light bg
    
    // Button colors - Light mode defaults with dark mode variants
    'button-primary': tailwindColors.lime[300],
    'button-primary-dark': tailwindColors.lime[400],
    'button-strong': tailwindColors.lime[600],
    'button-strong-dark': tailwindColors.lime[500],
    'button-secondary': tailwindColors.slate[200],
    'button-secondary-dark': tailwindColors.slate[700],
    'button-secondary-strong': tailwindColors.lime[800],
    'button-secondary-strong-dark': tailwindColors.lime[700],
    'button-ghost': tailwindColors.lime[900],
    'button-ghost-dark': tailwindColors.lime[800],
    'button-ghost-strong': tailwindColors.lime[950],
    'button-ghost-strong-dark': tailwindColors.lime[900],
    'button-stop': tailwindColors.red[200],
    'button-stop-dark': tailwindColors.red[900],
    
    // Text colors - Light mode defaults with dark mode variants
    'text-primary': tailwindColors.slate[950],    // Light: #0f172a
    'text-primary-dark': tailwindColors.slate[100],  // Dark: #e2e8f0
    'text-secondary': tailwindColors.slate[700],   // Light: #334155
    'text-secondary-dark': tailwindColors.slate[300],  // Dark: #cbd5e1
    'text-muted': tailwindColors.slate[500],       // Light: #64748b
    'text-muted-dark': tailwindColors.slate[400],  // Dark: #94a3b8
    'text-inverse': tailwindColors.slate[200],     // Light: light text
    'text-inverse-dark': tailwindColors.slate[900],  // Dark: dark text
    'text-button-primary': tailwindColors.lime[900],  // Light: lime-900
    'text-button-primary-dark': tailwindColors.lime[800],  // Dark: lime-50
    'text-button-stop': tailwindColors.red[900],
    'text-button-stop-dark': tailwindColors.red[200],
    'text-brand': tailwindColors.lime[600],       // Light: lime-700
    'text-brand-dark': tailwindColors.lime[300],  // Dark: lime-300
    
    // Accent colors - Multiple accent variants with dark mode support
    accent: tailwindColors.sky[400],                    // Original blue value (backward compat)
    'accent-orange': tailwindColors.orange[300],        // Light: orange-300
    'accent-orange-dark': tailwindColors.orange[900],    // Dark: orange-900
    'accent-red': tailwindColors.red[400],              // Light: red-400
    'accent-red-dark': tailwindColors.red[200],         // Dark: red-200
    'accent-strong': tailwindColors.sky[500],           // Same for both modes: sky-500
    
    // Border colors - Light mode defaults with dark mode variants
    'border-subtle': tailwindColors.slate[200],    // Light: #e2e8f0
    'border-subtle-dark': tailwindColors.slate[800],  // Dark: #1e293b
    'border-default': tailwindColors.slate[300],   // Light: #cbd5e1
    'border-default-dark': tailwindColors.slate[700],  // Dark: #334155
    'border-button-primary': tailwindColors.lime[400],  // Light: lime-400
    'border-button-primary-dark': tailwindColors.lime[600],  // Dark: lime-600
    
    // Status colors (same for both modes)
    success: tailwindColors.green[500],        // #22c55e
    warning: tailwindColors.amber[500],        // #f59e0b
    danger: tailwindColors.red[500],           // #ef4444
    info: tailwindColors.sky[400],              // #38bdf8
    
    // Metal gradient colors - Light mode defaults with dark mode variants
    'surface-metal-start': tailwindColors.stone[200],  // Light: #e7e5e4
    'surface-metal-start-dark': tailwindColors.stone[800],  // Dark: #292524
    'surface-metal-end': tailwindColors.stone[300],     // Light: #d6d3d1
    'surface-metal-end-dark': tailwindColors.stone[900],     // Dark: #1c1917
    
    // Button border gradient colors - Light mode defaults with dark mode variants
    'button-border-start': tailwindColors.stone[100],  // Light: #F5F5F4
    'button-border-start-dark': tailwindColors.stone[700],  // Dark: #44403c
    'button-border-end': tailwindColors.stone[300],     // Light: #d6d3d1
    'button-border-end-dark': tailwindColors.stone[800],     // Dark: #292524
    
    // Button primary fill gradient colors - Light mode defaults with dark mode variants
    'button-primary-fill-start': tailwindColors.lime[400],  // Light: #BBF451
    'button-primary-fill-start-dark': tailwindColors.lime[500],  // Dark: lime-400
    'button-primary-fill-end': tailwindColors.lime[200],     // Light: lime-200
    'button-primary-fill-end-dark': tailwindColors.lime[300],     // Dark: lime-300
    
    // Button hero fill gradient colors - Light mode defaults with dark mode variants
    'button-hero-fill-start': tailwindColors.lime[200],  // Light: #D8F999
    'button-hero-fill-start-dark': tailwindColors.lime[300],  // Dark: lime-300
    'button-hero-fill-mid': tailwindColors.yellow[200],     // Light: #FFF085
    'button-hero-fill-mid-dark': tailwindColors.yellow[300],     // Dark: yellow-300
    'button-hero-fill-end': tailwindColors.lime[400],     // Light: #9AE600
    'button-hero-fill-end-dark': tailwindColors.lime[500],     // Dark: lime-500
    
    // Surface card gradient colors - Light mode defaults with dark mode variants
    'surface-card-start': tailwindColors.slate[50],  // Light: #f8fafc (surface)
    'surface-card-start-dark': tailwindColors.slate[900],  // Dark: #0f172a (surface-dark)
    'surface-card-end': tailwindColors.slate[200],  // Light: #f1f5f9 (surface-strong)
    'surface-card-end-dark': tailwindColors.slate[800],  // Dark: #0f172a (surface-strong-dark)
    
    // Surface card inner gradient colors - Light mode defaults with dark mode variants
    'surface-card-inner-start': tailwindColors.slate[200],  // Light: #e2e8f0 (button-secondary)
    'surface-card-inner-start-dark': tailwindColors.slate[800],  // Dark: #1e293b (button-secondary-dark)
    'surface-card-inner-end': tailwindColors.slate[300],  // Light: #cbd5e1 (border-default)
    'surface-card-inner-end-dark': tailwindColors.slate[700],  // Dark: #334155 (border-default-dark)
  },
};

const config = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class', // Enable class-based dark mode for NativeWind
  theme: {
    extend: {
      ...semanticTheme, // Extends Tailwind defaults with semantic mappings
      fontFamily: {
        // Set DM Sans as the default sans-serif font family
        sans: ['DMSans-Regular', 'system'],
        // Font weight variants for DM Sans
        'sans-medium': ['DMSans-Medium', 'system'],
        'sans-semibold': ['DMSans-SemiBold', 'system'],
        'sans-bold': ['DMSans-Bold', 'system'],
        // Fraunces serif font family
        serif: ['Fraunces-Regular', 'system'],
        // Font weight variants for Fraunces
        'serif-medium': ['Fraunces-Medium', 'system'],
        'serif-semibold': ['Fraunces-SemiBold', 'system'],
        'serif-bold': ['Fraunces-Bold', 'system'],
        'serif-black': ['Fraunces-Black', 'system'],
      },
    },
  },
  plugins: [],
};

// Export config for Tailwind
module.exports = config;

// Export semantic theme colors for use in themeconfig.ts (single source of truth)
module.exports.semanticTheme = semanticTheme;

// Export Tailwind default colors for reference
module.exports.tailwindColors = tailwindColors;
