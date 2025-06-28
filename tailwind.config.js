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
        'singapore-red': '#EF4444',
        'singapore-blue': '#3B82F6',
        'singapore-gold': '#F59E0B',
      },
      backgroundColor: {
        'dark-primary': '#000000',
        'dark-secondary': '#111111',
        'dark-tertiary': '#1a1a1a',
      },
      textColor: {
        'dark-primary': '#FFFFFF',
        'dark-secondary': '#E5E5E5',
        'dark-tertiary': '#A3A3A3',
      },
      borderColor: {
        'dark-primary': '#262626',
        'dark-secondary': '#404040',
      },
      placeholderColor: {
        'dark-tertiary': '#A3A3A3',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 