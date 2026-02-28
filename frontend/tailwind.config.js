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
        sans: ['Sofia Pro', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Sofia Pro', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: '#F5F5F7',
        text: '#2D3142',
        button: '#2D3142',
        accent: '#7B82A8',
        primary: {
          50: '#ECEEF4',
          100: '#D0D3E0',
          200: '#8B90A8',
          300: '#4A5068',
          400: '#2D3142',
          500: '#2D3142',
          600: '#252836',
          700: '#1C1E2A',
          800: '#15171F',
          900: '#0D0E14',
          DEFAULT: '#2D3142'
        },
        // Fondos
        'bg-base': '#F5F5F7',
        'bg-surface': '#EDEDEF',
        // Texto
        'text-primary': '#2D3142',
        'text-secondary': '#6B6E82',
        'text-muted': '#A8AABB',
        // Bordes
        'border-soft': 'rgba(45, 49, 66, 0.08)',
        'border-glass': 'rgba(255, 255, 255, 0.80)',
        // Acento Tinta — escala completa
        'ink-primary': '#2D3142',
        'ink-medium': '#4A5068',
        'ink-light': '#8B90A8',
        'ink-muted': '#D0D3E0',
        'ink-ghost': '#ECEEF4',
        // Modo Field (iOS — día de boda)
        'field-bg': '#1C1E2A',
        'field-surface': '#252836',
        'field-text': '#F5F5F7',
        'field-accent': '#7B82A8',
        'field-highlight': '#A8AFCC',
        'field-urgent': '#C4956A',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      backdropBlur: {
        'glass': '20px',
      },
    },
  },
  plugins: [],
}
