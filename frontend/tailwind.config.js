/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        govBlue: {
          50: '#FAF6F0',
          100: '#F5EFEB',
          200: '#EAE1CE',
          500: '#D2C4A5',
          700: '#3F536B',
          800: '#1E314B',
          850: '#192A44',
          900: '#14253D',
          950: '#0E1B2C',
        },
        sla: {
          green: '#1E5A3C',
          amber: '#A05A00',
          red: '#B22222',
        }
      }
    },
  },
  plugins: [],
}
