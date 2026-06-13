/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: 'rgb(var(--color-base) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-hover': 'rgb(var(--color-surface-hover) / <alpha-value>)',
        overlay: 'rgba(0, 0, 0, 0.7)',
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          light: 'rgb(var(--color-accent-light) / <alpha-value>)',
          dim: 'rgba(var(--color-accent), 0.15)',
        },
        profit: {
          DEFAULT: 'rgb(var(--color-profit) / <alpha-value>)',
          dim: 'rgba(var(--color-profit), 0.08)',
          border: 'rgba(var(--color-profit), 0.25)',
        },
        loss: {
          DEFAULT: 'rgb(var(--color-loss) / <alpha-value>)',
          dim: 'rgba(var(--color-loss), 0.08)',
          border: 'rgba(var(--color-loss), 0.25)',
        },
        gold: {
          DEFAULT: 'rgb(var(--color-gold) / <alpha-value>)',
          dim: 'rgba(var(--color-gold), 0.08)',
          border: 'rgba(var(--color-gold), 0.25)',
        },
        'tv-border': {
          DEFAULT: 'rgba(var(--color-border), 0.12)',
          bright: 'rgba(var(--color-border), 0.3)',
          active: 'rgba(var(--color-border), 0.5)',
        },
      },
      textColor: {
        primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
        muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
        inverse: 'rgb(var(--color-text-inverse) / <alpha-value>)',
      },
      fontFamily: {
        ui: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'tv-xs': ['10px', { letterSpacing: '0.1em' }],
        'tv-sm': ['12px', { lineHeight: '1.5' }],
        'tv-base': ['13px', { lineHeight: '1.5' }],
        'tv-md': ['15px', { lineHeight: '1.4' }],
        'tv-lg': ['18px', { lineHeight: '1.3' }],
        'tv-xl': ['22px', { lineHeight: '1.2' }],
        'tv-2xl': ['28px', { lineHeight: '1.2' }],
      },
      borderRadius: {
        'tv-sm': '4px',
        'tv-md': '6px',
        'tv-lg': '8px',
        'tv-xl': '10px',
        'tv-2xl': '12px',
        'tv-3xl': '16px',
      },
      boxShadow: {
        'neu': '2px 2px 5px var(--shadow-dark), 6px 6px 15px var(--shadow-dark), -2px -2px 5px var(--shadow-light), -6px -6px 15px var(--shadow-light)',
        'neu-sm': '1px 1px 3px var(--shadow-dark), 3px 3px 6px var(--shadow-dark), -1px -1px 3px var(--shadow-light), -3px -3px 6px var(--shadow-light)',
        'neu-pressed': 'inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light)',
        'neu-hover': '4px 4px 10px var(--shadow-dark), 10px 10px 25px var(--shadow-dark), -4px -4px 10px var(--shadow-light), -10px -10px 25px var(--shadow-light)',
        'glow-profit': '0 0 25px rgba(var(--color-profit), 0.15), 2px 2px 5px var(--shadow-dark), 6px 6px 15px var(--shadow-dark), -2px -2px 5px var(--shadow-light), -6px -6px 15px var(--shadow-light)',
        'glow-loss': '0 0 25px rgba(var(--color-loss), 0.15), 2px 2px 5px var(--shadow-dark), 6px 6px 15px var(--shadow-dark), -2px -2px 5px var(--shadow-light), -6px -6px 15px var(--shadow-light)',
      },
      animation: {
        'fade-in': 'fadeIn 300ms ease forwards',
        'slide-up': 'slideUp 200ms ease forwards',
        'spin-slow': 'spin 1s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
