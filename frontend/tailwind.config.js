/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#c084fc',
          DEFAULT: '#a855f7',
          dark: '#7e22ce',
        },
        dark: {
          deep: '#0a0a0c',
          card: '#16161e',
          border: '#2a2a35',
          text: '#9fa0a6',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-brand': '0 8px 32px 0 rgba(168, 85, 247, 0.2)',
      }
    },
  },
  plugins: [],
}
