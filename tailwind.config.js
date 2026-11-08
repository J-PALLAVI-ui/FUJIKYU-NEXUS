/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fuji: {
          navy: '#0B132B',
          deep: '#1C2541',
          slate: '#3A506B',
          blue: '#0066CC',
          sky: '#00A3E0',
          accent: '#3B82F6',
          snow: '#F8FAFC',
          light: '#F0F4F8'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      }
    },
  },
  plugins: [],
}
