/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./index.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        mint: {
          50: '#f4fbf9',
          100: '#e5f5f0',
          200: '#ccebe4',
          300: '#a5dccf',
          400: '#7ac5b3',
          500: '#54ac98',
          600: '#408776',
          700: '#31524a',
          800: '#213a34',
          900: '#0d1f1a',
        },
        brand: {
          bg: 'var(--color-bg)',
          surface: 'var(--color-surface)',
          textPrimary: 'var(--color-text-primary)',
          textSecondary: 'var(--color-text-secondary)',

          // Dynamic brand palette using CSS variables
          primary: 'var(--color-primary)',
          primaryDark: 'var(--color-primary-dark)',
          accent: 'var(--color-accent)',

          border: 'var(--color-border)',
          hover: 'var(--color-hover)',

          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['"Product Sans"', '"Google Sans"', 'sans-serif'],
      },
      animation: {
        'float-slow': 'float 15s infinite ease-in-out',
        'pulse-soft': 'pulseSoft 2s infinite',
        'spin-slow': 'spin 20s linear infinite',
        'spin-reverse-slow': 'spin 15s linear infinite reverse',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(20px, -20px)' },
        }
      }
    }
  },
  plugins: [],
}
