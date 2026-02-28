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
      },
      fontFamily: {
        sans: ['Sofia Pro', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Sofia Pro', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: '#F2F1F0',
        text: '#3B3B3B',
        button: '#AFAFAF',
        accent: '#CDD973',
        primary: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#3B3B3B',
          800: '#262626',
          900: '#171717',
          DEFAULT: '#3B3B3B'
        },
        'bg-base': '#F5F4F1',
        'bg-surface': '#EFEEE9',
        'text-primary': '#1C1C1A',
        'text-secondary': '#6B6A65',
        'text-muted': '#A8A79F',
        'olive-primary': '#7A8C5E',
        'olive-light': '#A3B082',
        'olive-muted': '#CDD4BC',
        'olive-dark': '#4E5C3A',
        'border-soft': 'rgba(28, 28, 26, 0.08)',
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
