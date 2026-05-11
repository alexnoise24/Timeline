/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        'mobile': {'max': '767px'},
        'tablet': {'min': '768px', 'max': '1023px'},
        'desktop': {'min': '1024px'},
      },
      fontFamily: {
        sans:    ['"Inter Tight"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        heading: ['"Inter Tight"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono:    ['"JetBrains Mono"', '"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // ── Alto design tokens ──────────────────────────────────
        paper:  '#F1EFEA',   // canvas / page background
        fog:    '#F7F5F0',   // card surface (1 step above paper)
        ink:    '#0A0A0A',   // type, lines, primary fills
        stone:  '#6B6B6B',   // muted labels, dividers
        lavender:      '#7B7FE0',  // accent — CTA, ticket, dot
        'lavender-deep': '#5A5FC9', // accent hover
        moss:   '#3A7A4B',   // status OK / delivered
        ember:  '#C97A2A',   // status warning / unconfirmed
        brick:  '#C4392E',   // status alert / destructive

        // ── Aliases (backward-compat for existing components) ──
        background:      '#F1EFEA',
        text:            '#0A0A0A',
        button:          '#0A0A0A',
        accent:          '#7B7FE0',
        'bg-base':       '#F1EFEA',
        'bg-surface':    '#F7F5F0',
        'text-primary':  '#0A0A0A',
        'text-secondary':'#6B6B6B',
        'text-muted':    '#9E9E9E',
        'border-soft':   'rgba(10,10,10,0.10)',
        'border-glass':  'rgba(10,10,10,0.15)',
        'ink-primary':   '#0A0A0A',
        'ink-medium':    '#3A3A3A',
        'ink-light':     '#6B6B6B',
        'ink-muted':     '#C8C6C0',
        'ink-ghost':     '#F1EFEA',

        // ── Field mode (iOS wedding day — dark inversion) ──────
        'field-bg':        '#0A0A0A',
        'field-surface':   '#1A1A1A',
        'field-text':      '#F1EFEA',
        'field-accent':    '#7B7FE0',
        'field-highlight': '#B0B3F0',
        'field-urgent':    '#C97A2A',

        // Keep primary scale for any legacy usage
        primary: {
          50:  '#EEEDF8',
          100: '#C8C9ED',
          200: '#9A9CD8',
          300: '#6B6EBE',
          400: '#5A5FC9',
          500: '#7B7FE0',
          600: '#5A5FC9',
          700: '#4346A8',
          800: '#2C2E80',
          900: '#161760',
          DEFAULT: '#7B7FE0',
        },
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      // No rounded corners in the Alto system — everything is square
      borderRadius: {
        DEFAULT: '0',
        none: '0',
        sm: '0',
        md: '0',
        lg: '0',
        xl: '0',
        '2xl': '0',
        '3xl': '0',
        full: '9999px', // kept only for pill/badge use if explicitly needed
      },
      fontSize: {
        // Alto typographic scale
        'display-1': ['96px', { lineHeight: '0.85', letterSpacing: '-0.05em', fontWeight: '700' }],
        'h1':        ['56px', { lineHeight: '0.9',  letterSpacing: '-0.04em', fontWeight: '700' }],
        'h2':        ['36px', { lineHeight: '0.95', letterSpacing: '-0.03em', fontWeight: '700' }],
        'h3':        ['22px', { lineHeight: '0.95', letterSpacing: '-0.02em', fontWeight: '700' }],
        'body':      ['14px', { lineHeight: '1.7',  letterSpacing: '0',       fontWeight: '500' }],
        'label':     ['10px', { lineHeight: '1',    letterSpacing: '0.12em',  fontWeight: '700' }],
      },
      transitionDuration: {
        'snap':  '80ms',
        'slide': '200ms',
        'stamp': '400ms',
      },
      transitionTimingFunction: {
        'snap':  'ease-out',
        'slide': 'ease-in-out',
        'stamp': 'cubic-bezier(0.3, 1.4, 0.4, 1)',
      },
      backdropBlur: {
        'glass': '20px',
      },
    },
  },
  plugins: [],
}
