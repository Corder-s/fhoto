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
          primary: '#FAF8F5',    // Warm cream canvas
          secondary: '#F4EFEB',  // Soft stone surface
          tertiary: '#ECE5DE',   // Fill / container surface
          card: '#FFFFFF',
        },
        brand: {
          DEFAULT: '#FF5A1F',    // Vibrant sunset orange
          hover: '#E4480F',
          active: '#CA3C0A',
          subtle: '#FFF0EB',
          border: '#FFD4C4',
        },
        ink: {
          primary: '#121212',    // Near-black headline/body
          secondary: '#57534E',  // Muted editorial charcoal
          muted: '#8A8580',      // Placeholder and subtle hints
          inverse: '#FFFFFF',
        },
        contour: {
          subtle: '#EBE5DF',
          strong: '#D5CDC5',
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
        subtle: '0 2px 8px -2px rgba(18, 18, 18, 0.04), 0 1px 4px -1px rgba(18, 18, 18, 0.02)',
        card: '0 10px 25px -5px rgba(18, 18, 18, 0.05), 0 4px 10px -3px rgba(18, 18, 18, 0.03)',
        elevated: '0 20px 35px -8px rgba(18, 18, 18, 0.09), 0 8px 16px -4px rgba(18, 18, 18, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
