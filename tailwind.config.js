/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Merriweather', 'serif'],
        sans: ['Open Sans', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#e0e5eb',
          100: '#b3bcd1',
          200: '#8290b3',
          300: '#506394',
          400: '#2b427d',
          500: '#001F54', // primary
          600: '#001b4a',
          700: '#00163d',
          800: '#001031',
          900: '#000824',
        },
        secondary: {
          50: '#f7f5e8',
          100: '#f0ebc5',
          200: '#e8e09e',
          300: '#e0d577',
          400: '#dacc59',
          500: '#D4AF37', // secondary/gold
          600: '#c39e32',
          700: '#b0892c',
          800: '#9c7526',
          900: '#7a541c',
        },
        gray: {
          50: '#f8f9fa',
          100: '#eaedf0',
          200: '#d5dade',
          300: '#adb5bd',
          400: '#878f99',
          500: '#6B7280', // gray
          600: '#495057',
          700: '#343a40',
          800: '#212529',
          900: '#121416',
        },
        success: {
          500: '#10B981',
        },
        warning: {
          500: '#F59E0B',
        },
        error: {
          500: '#EF4444',
        },
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0, 31, 84, 0.1), 0 2px 4px -1px rgba(0, 31, 84, 0.06)',
      },
    },
  },
  plugins: [],
};