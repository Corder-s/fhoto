import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          primary: '#F5F7F9',    // REEPY light cool grey background
          secondary: '#F1F3F5',  // Muted surface / pill fill
          tertiary: '#E2E8F0',   // Container hover fill
          card: '#FFFFFF',       // Card background
          dark: '#0D0F12',       // REEPY dark marketing background
          darkSurface: '#171A1F',// REEPY dark card/panel surface
        },
        brand: {
          DEFAULT: '#14B8A6',    // REEPY Primary teal
          hover: '#0D9488',      // Teal hover
          active: '#0F766E',     // Teal dark/active
          subtle: '#EFFCF8',     // Subtle teal background
          border: '#99F6E4',     // Subtle teal border
        },
        ink: {
          primary: '#191C22',    // Primary text
          secondary: '#64748B',  // Secondary text
          muted: '#94A3B8',      // Muted supporting text
          inverse: '#FFFFFF',
        },
        contour: {
          subtle: '#E7EAEE',     // Subtle border
          strong: '#CBD5E1',     // Defined border / divider
          dark: '#262B33',       // Dark surface border
        },
        status: {
          success: '#16A34A',
          'success-subtle': '#ECFDF5',
          warning: '#D97706',
          'warning-subtle': '#FFFBEB',
          error: '#DC2626',
          'error-subtle': '#FEF2F2',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'Inter', 'sans-serif'],
        script: ['var(--font-caveat)', 'Caveat', 'cursive', 'sans-serif'],
      },
      borderRadius: {
        'card-sm': '12px',
        'card-md': '16px',
        'card-lg': '24px',
        'card-xl': '32px',
        pill: '9999px',
      },
      boxShadow: {
        subtle: '0 2px 8px -2px rgba(26, 24, 22, 0.04), 0 1px 4px -1px rgba(26, 24, 22, 0.02)',
        card: '0 10px 25px -5px rgba(26, 24, 22, 0.06), 0 4px 10px -3px rgba(26, 24, 22, 0.03)',
        elevated: '0 20px 35px -8px rgba(26, 24, 22, 0.10), 0 8px 16px -4px rgba(26, 24, 22, 0.05)',
      },
    },
  },
  plugins: [],
};

export default config;
