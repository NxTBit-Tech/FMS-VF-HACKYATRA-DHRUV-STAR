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
          50: '#f0f4f9',
          100: '#d9e2ec',
          200: '#bcccdc',
          500: '#486581',
          700: '#102a43',
          800: '#0b1d33',
          900: '#030f26',
        },
        sla: {
          green: '#10b981',
          amber: '#f59e0b',
          red: '#ef4444',
        }
      }
    },
  },
  plugins: [],
}
