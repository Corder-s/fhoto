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
          primary: '#FAF7F2',    // Signature warm cream background
          secondary: '#F2ECE3',  // Soft stone pill & surface fill
          tertiary: '#EAE2D7',   // Hover & active neutral container fill
          card: '#FFFFFF',       // Clean card surface
        },
        brand: {
          DEFAULT: '#FF6E00',    // Signature SnapShoot primary orange
          hover: '#E86300',      // Vibrant dark hover state
          active: '#D65B00',     // Pressed tactile state
          subtle: '#FFF3E5',     // Soft orange tint pill background
          border: '#FFD4A8',     // Subtle orange badge/card border
        },
        ink: {
          primary: '#1A1816',    // Deep charcoal near-black typography
          secondary: '#5A544D',  // Editorial secondary text
          muted: '#8C847A',      // Subtle captions, icons, and placeholder hints
          inverse: '#FFFFFF',
        },
        contour: {
          subtle: '#E8E2D8',     // Neutral warm border
          strong: '#D5CEC4',     // Defined border / divider
        },
        status: {
          success: '#16A34A',
          'success-subtle': '#E7F5EC',
          warning: '#D97706',
          'warning-subtle': '#FEF3C7',
          error: '#DC2626',
          'error-subtle': '#FEE2E2',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
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
