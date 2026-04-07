/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ai: {
          red: '#EF4444',
          'red-bg': '#FEF2F2',
          'red-border': '#FECACA',
          yellow: '#F59E0B',
          'yellow-bg': '#FFFBEB',
          'yellow-border': '#FDE68A',
          green: '#10B981',
          'green-bg': '#ECFDF5',
          'green-border': '#A7F3D0',
        },
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          900: '#1E1B4B',
        },
        surface: {
          light: '#F8FAFC',
          DEFAULT: '#FFFFFF',
          dark: '#0F172A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bar-fill': 'barFill 1s ease-out forwards',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        barFill: { from: { width: '0%' }, to: { width: 'var(--bar-width)' } },
      }
    },
  },
  plugins: [],
}
