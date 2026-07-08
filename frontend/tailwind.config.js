/** @type {import('tailwindcss').Config} */
// Force Vite to reload config for dark mode
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#daa54e',
          DEFAULT: '#c8872b',
          dark: '#a66d1f',
        },
        dark: {
          deep: '#faf7f2',
          card: '#ffffff',
          border: '#e8e0d4',
          text: '#6b6155',
        }
      },
      fontFamily: {
        sans: ['Quicksand', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.06)',
        'glass-brand': '0 8px 32px 0 rgba(200, 135, 43, 0.15)',
      }
    },
  },
  plugins: [],
}
