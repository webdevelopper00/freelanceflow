/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        background: '#F0F9FF',
        card: '#FFFFFF',
        sidebar: '#FFFFFF',
        primary: {
          DEFAULT: '#0EA5E9',
          dark: '#0284C7',
        },
        accent: '#06B6D4',
        'text-primary': '#0C1A2E',
        'text-secondary': '#64748B',
        border: {
          DEFAULT: '#E0F2FE',
          light: '#E0F2FE',
        },
        success: '#10B981',
        danger: '#EF4444',
        warning: '#F59E0B',
        dark: {
          background: '#0C1A2E',
          card: '#132338',
          sidebar: '#0F1F33',
          primary: '#38BDF8',
          accent: '#22D3EE',
          'text-primary': '#E0F2FE',
          'text-secondary': '#94A3B8',
          border: '#1E3A5F',
        },
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
      },
      transitionDuration: {
        '300': '300ms',
      },
      animation: {
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'fade-in': 'fadeIn 200ms ease-out',
        'fade-up': 'fadeUp 300ms ease-out',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(2deg)' },
        },
      },
    },
  },
  plugins: [],
};
