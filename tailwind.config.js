/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  // Safelist dynamic color classes used in tuition components
  safelist: [
    // Background colors (light variants)
    'bg-pink-50', 'bg-purple-50', 'bg-blue-50', 'bg-cyan-50', 'bg-green-50', 
    'bg-teal-50', 'bg-orange-50', 'bg-red-50', 'bg-indigo-50', 'bg-yellow-50',
    'bg-amber-50', 'bg-rose-50', 'bg-emerald-50',
    // Background colors (solid)
    'bg-pink-600', 'bg-purple-600', 'bg-blue-600', 'bg-cyan-600', 'bg-green-600',
    'bg-teal-600', 'bg-orange-600', 'bg-red-600', 'bg-indigo-600', 'bg-yellow-600',
    'bg-amber-600', 'bg-rose-600', 'bg-emerald-600',
    // Text colors
    'text-pink-600', 'text-purple-600', 'text-blue-600', 'text-cyan-600', 'text-green-600',
    'text-teal-600', 'text-orange-600', 'text-red-600', 'text-indigo-600', 'text-yellow-600',
    'text-amber-600', 'text-rose-600', 'text-emerald-600',
    'text-pink-900', 'text-purple-900', 'text-blue-900', 'text-cyan-900', 'text-green-900',
    // Border colors
    'border-pink-100', 'border-purple-100', 'border-blue-100', 'border-cyan-100', 
    'border-green-100', 'border-teal-100', 'border-orange-100', 'border-red-100',
    'border-indigo-100', 'border-yellow-100', 'border-amber-100', 'border-rose-100',
    'border-pink-500', 'border-indigo-500',
    // Focus border colors
    'focus:border-pink-500', 'focus:border-purple-500', 'focus:border-blue-500',
    'focus:border-indigo-500', 'focus:border-green-500', 'focus:border-teal-500',
    // Hover backgrounds
    'hover:bg-pink-50', 'hover:bg-purple-50', 'hover:bg-blue-50', 'hover:bg-indigo-50',
    'hover:bg-green-50', 'hover:bg-teal-50', 'hover:bg-orange-50',
    'hover:bg-pink-700', 'hover:bg-indigo-700',
    // Accent colors (for inputs)
    'accent-pink-600', 'accent-purple-600', 'accent-blue-600', 'accent-indigo-600',
    'accent-green-600', 'accent-teal-600', 'accent-orange-600',
    // Gradient classes
    'from-pink-500', 'to-purple-600', 'from-blue-500', 'to-cyan-600',
    'from-green-500', 'to-teal-600', 'from-orange-500', 'to-red-600',
    'from-indigo-500', 'to-purple-600', 'from-yellow-500', 'to-amber-600',
    'from-rose-500', 'to-pink-600', 'from-emerald-500', 'to-green-600',
    // Shadow colors
    'shadow-pink-100', 'shadow-purple-100', 'shadow-blue-100', 'shadow-indigo-100',
    'shadow-green-100', 'shadow-teal-100', 'shadow-orange-100',
    // Ring colors
    'ring-pink-500', 'ring-indigo-500', 'ring-green-500',
  ],
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