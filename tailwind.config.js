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
        sans: ['Inter', 'sans-serif'],
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
