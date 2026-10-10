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
          primary: '#FBF8F2',    // Warm cream background
          secondary: '#F5EFE6',  // Soft stone surface
          tertiary: '#EBE2D5',   // Input & container fill
          card: '#FFFFFF',
        },
        brand: {
          DEFAULT: '#FF8500',    // Bright primary orange
          hover: '#E87500',      // Primary hover
          active: '#CF6600',
          subtle: '#FFF3E5',     // Soft orange tint
          border: '#FFD4A8',
        },
        ink: {
          primary: '#171717',    // Near-black typography
          secondary: '#68635D',  // Editorial secondary text
          muted: '#8C857E',      // Placeholder and subtle hints
          inverse: '#FFFFFF',
        },
        contour: {
          subtle: '#E9E2D8',     // Neutral subtle borders
          strong: '#D4C9BC',
        },
        status: {
          success: '#237A45',
          'success-subtle': '#E7F5EC',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        'card-sm': '8px',
        'card-md': '14px',
        'card-lg': '20px',
        'card-xl': '28px',
      },
      boxShadow: {
        subtle: '0 2px 8px -2px rgba(23, 23, 23, 0.04), 0 1px 4px -1px rgba(23, 23, 23, 0.02)',
        card: '0 10px 25px -5px rgba(23, 23, 23, 0.05), 0 4px 10px -3px rgba(23, 23, 23, 0.03)',
        elevated: '0 20px 35px -8px rgba(23, 23, 23, 0.09), 0 8px 16px -4px rgba(23, 23, 23, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
