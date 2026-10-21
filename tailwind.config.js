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
        brand: {
          primary: '#6C63FF',
          secondary: '#5B8CFF',
          accent: '#00D4FF',
        },
        bg: {
          main: '#0F172A',
          card: '#1E293B',
        },
        border: {
          slate: '#334155',
        },
        text: {
          main: '#F8FAFC',
          muted: '#94A3B8',
        },
        status: {
          success: '#22C55E',
          error: '#EF4444',
          warning: '#F59E0B',
        }
      },
      borderRadius: {
        'large': '16px',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
