/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Bricolage Grotesque', 'Geist Sans', 'system-ui', 'sans-serif'],
        sans:    ['Geist Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono:    ['DM Mono', 'Geist Mono', 'ui-monospace', 'monospace'],
        serif:   ['Instrument Serif', 'Georgia', 'serif'],
      },
      colors: {
        canvas: 'rgb(var(--color-canvas) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          0:       'rgb(var(--color-surface-0) / <alpha-value>)',
          1:       'rgb(var(--color-surface-1) / <alpha-value>)',
          2:       'rgb(var(--color-surface-2) / <alpha-value>)',
          3:       'rgb(var(--color-surface-3) / <alpha-value>)',
          elevated:'rgb(var(--color-surface-elevated) / <alpha-value>)',
        },
        primary:   'rgb(var(--color-text-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
        tertiary:  'rgb(var(--color-text-tertiary) / <alpha-value>)',
        muted:     'rgb(var(--color-text-muted) / <alpha-value>)',
        inverse:   'rgb(var(--color-text-inverse) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          hover:   'rgb(var(--color-accent-hover) / <alpha-value>)',
        },
        iris:  'rgb(var(--color-iris) / <alpha-value>)',
        gold:  'rgb(var(--color-gold) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        danger:  'rgb(var(--color-danger) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        info:    'rgb(var(--color-info) / <alpha-value>)',
        border: {
          DEFAULT: 'rgba(var(--color-border-rgb), var(--border-alpha))',
          hover:   'rgba(var(--color-border-rgb), var(--border-alpha-hover))',
          strong:  'rgba(var(--color-border-rgb), var(--border-alpha-strong))',
        },
      },
      boxShadow: {
        'xs':           'var(--shadow-xs)',
        'card':         'var(--shadow-card)',
        'card-hover':   'var(--shadow-card-hover)',
        'raised':       'var(--shadow-raised)',
        'floating':     'var(--shadow-floating)',
        'iris':         'var(--shadow-iris)',
        'gold':         'var(--shadow-gold)',
        // legacy
        'soft':         'var(--shadow-card)',
        'card-lift':    'var(--shadow-raised)',
        'sm': '0 1px 2px rgba(0,0,0,0.05)',
      },
      borderRadius: {
        xs:   'var(--radius-xs)',
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        '2xl':'var(--radius-2xl)',
        '3xl':'var(--radius-3xl)',
      },
      animation: {
        'fade-in':    'fade-in 0.3s ease-out forwards',
        'fade-up':    'fade-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in':   'scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float':      'float 6s ease-in-out infinite',
        'aurora':     'aurora 60s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'spin-slow':  'spin-slow 8s linear infinite',
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        'aurora': {
          from: { backgroundPosition: '50% 50%, 50% 50%' },
          to:   { backgroundPosition: '350% 50%, 350% 50%' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(var(--color-success), 0.4)' },
          '50%':      { opacity: '0.8', boxShadow: '0 0 0 6px rgba(var(--color-success), 0)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':  'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
