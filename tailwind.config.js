/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
        executive: {
          bg: '#09090b',
          surface: '#0f172a',
          card: '#111827',
          border: '#27272a',
          purple: '#7C3AED',
          cyan: '#3B82F6',
          emerald: '#10B981',
          amber: '#F59E0B',
        },
        slate: {
          850: '#121827',
          925: '#0b0f19',
          950: '#020617',
        },
        zinc: {
          850: '#1f1f23',
          925: '#0e0e11',
          950: '#09090b',
        },
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'glow-purple': '0 0 20px -5px rgba(124, 58, 237, 0.3)',
        'glow-cyan': '0 0 20px -5px rgba(59, 130, 246, 0.3)',
        'glow-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.3)',
      },
    },
  },
  plugins: [],
};
