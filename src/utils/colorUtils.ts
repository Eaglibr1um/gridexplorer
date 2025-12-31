/**
 * Color Utilities for Dynamic Tailwind Class Generation
 * 
 * Tailwind purges unused classes at build time, so dynamic class names
 * like `bg-${color}-500` won't work. This utility provides safe class mappings.
 */

export type ColorKey = 
  | 'pink' | 'purple' | 'blue' | 'cyan' | 'green' | 'teal' 
  | 'orange' | 'red' | 'indigo' | 'yellow' | 'amber' | 'rose' | 'emerald';

/**
 * Background color classes (light variants for cards/containers)
 */
export const bgLight: Record<ColorKey, string> = {
  pink: 'bg-pink-50',
  purple: 'bg-purple-50',
  blue: 'bg-blue-50',
  cyan: 'bg-cyan-50',
  green: 'bg-green-50',
  teal: 'bg-teal-50',
  orange: 'bg-orange-50',
  red: 'bg-red-50',
  indigo: 'bg-indigo-50',
  yellow: 'bg-yellow-50',
  amber: 'bg-amber-50',
  rose: 'bg-rose-50',
  emerald: 'bg-emerald-50',
};

/**
 * Background color classes (solid variants for buttons/badges)
 */
export const bgSolid: Record<ColorKey, string> = {
  pink: 'bg-pink-600',
  purple: 'bg-purple-600',
  blue: 'bg-blue-600',
  cyan: 'bg-cyan-600',
  green: 'bg-green-600',
  teal: 'bg-teal-600',
  orange: 'bg-orange-600',
  red: 'bg-red-600',
  indigo: 'bg-indigo-600',
  yellow: 'bg-yellow-600',
  amber: 'bg-amber-600',
  rose: 'bg-rose-600',
  emerald: 'bg-emerald-600',
};

/**
 * Text color classes
 */
export const textColor: Record<ColorKey, string> = {
  pink: 'text-pink-600',
  purple: 'text-purple-600',
  blue: 'text-blue-600',
  cyan: 'text-cyan-600',
  green: 'text-green-600',
  teal: 'text-teal-600',
  orange: 'text-orange-600',
  red: 'text-red-600',
  indigo: 'text-indigo-600',
  yellow: 'text-yellow-600',
  amber: 'text-amber-600',
  rose: 'text-rose-600',
  emerald: 'text-emerald-600',
};

/**
 * Text color classes (dark variants)
 */
export const textColorDark: Record<ColorKey, string> = {
  pink: 'text-pink-900',
  purple: 'text-purple-900',
  blue: 'text-blue-900',
  cyan: 'text-cyan-900',
  green: 'text-green-900',
  teal: 'text-teal-900',
  orange: 'text-orange-900',
  red: 'text-red-900',
  indigo: 'text-indigo-900',
  yellow: 'text-yellow-900',
  amber: 'text-amber-900',
  rose: 'text-rose-900',
  emerald: 'text-emerald-900',
};

/**
 * Border color classes
 */
export const borderColor: Record<ColorKey, string> = {
  pink: 'border-pink-100',
  purple: 'border-purple-100',
  blue: 'border-blue-100',
  cyan: 'border-cyan-100',
  green: 'border-green-100',
  teal: 'border-teal-100',
  orange: 'border-orange-100',
  red: 'border-red-100',
  indigo: 'border-indigo-100',
  yellow: 'border-yellow-100',
  amber: 'border-amber-100',
  rose: 'border-rose-100',
  emerald: 'border-emerald-100',
};

/**
 * Focus border color classes
 */
export const focusBorder: Record<ColorKey, string> = {
  pink: 'focus:border-pink-500',
  purple: 'focus:border-purple-500',
  blue: 'focus:border-blue-500',
  cyan: 'focus:border-cyan-500',
  green: 'focus:border-green-500',
  teal: 'focus:border-teal-500',
  orange: 'focus:border-orange-500',
  red: 'focus:border-red-500',
  indigo: 'focus:border-indigo-500',
  yellow: 'focus:border-yellow-500',
  amber: 'focus:border-amber-500',
  rose: 'focus:border-rose-500',
  emerald: 'focus:border-emerald-500',
};

/**
 * Hover background color classes
 */
export const hoverBg: Record<ColorKey, string> = {
  pink: 'hover:bg-pink-50',
  purple: 'hover:bg-purple-50',
  blue: 'hover:bg-blue-50',
  cyan: 'hover:bg-cyan-50',
  green: 'hover:bg-green-50',
  teal: 'hover:bg-teal-50',
  orange: 'hover:bg-orange-50',
  red: 'hover:bg-red-50',
  indigo: 'hover:bg-indigo-50',
  yellow: 'hover:bg-yellow-50',
  amber: 'hover:bg-amber-50',
  rose: 'hover:bg-rose-50',
  emerald: 'hover:bg-emerald-50',
};

/**
 * Ring color classes (for focus states)
 */
export const ringColor: Record<ColorKey, string> = {
  pink: 'ring-pink-500',
  purple: 'ring-purple-500',
  blue: 'ring-blue-500',
  cyan: 'ring-cyan-500',
  green: 'ring-green-500',
  teal: 'ring-teal-500',
  orange: 'ring-orange-500',
  red: 'ring-red-500',
  indigo: 'ring-indigo-500',
  yellow: 'ring-yellow-500',
  amber: 'ring-amber-500',
  rose: 'ring-rose-500',
  emerald: 'ring-emerald-500',
};

/**
 * Shadow color classes
 */
export const shadowColor: Record<ColorKey, string> = {
  pink: 'shadow-pink-100',
  purple: 'shadow-purple-100',
  blue: 'shadow-blue-100',
  cyan: 'shadow-cyan-100',
  green: 'shadow-green-100',
  teal: 'shadow-teal-100',
  orange: 'shadow-orange-100',
  red: 'shadow-red-100',
  indigo: 'shadow-indigo-100',
  yellow: 'shadow-yellow-100',
  amber: 'shadow-amber-100',
  rose: 'shadow-rose-100',
  emerald: 'shadow-emerald-100',
};

/**
 * Accent color classes (for range inputs, checkboxes)
 */
export const accentColor: Record<ColorKey, string> = {
  pink: 'accent-pink-600',
  purple: 'accent-purple-600',
  blue: 'accent-blue-600',
  cyan: 'accent-cyan-600',
  green: 'accent-green-600',
  teal: 'accent-teal-600',
  orange: 'accent-orange-600',
  red: 'accent-red-600',
  indigo: 'accent-indigo-600',
  yellow: 'accent-yellow-600',
  amber: 'accent-amber-600',
  rose: 'accent-rose-600',
  emerald: 'accent-emerald-600',
};

/**
 * Gradient button class (from primary to secondary)
 */
export const gradientButton: Record<string, string> = {
  'from-pink-500 to-purple-600': 'bg-gradient-to-r from-pink-500 to-purple-600',
  'from-blue-500 to-cyan-600': 'bg-gradient-to-r from-blue-500 to-cyan-600',
  'from-green-500 to-teal-600': 'bg-gradient-to-r from-green-500 to-teal-600',
  'from-orange-500 to-red-600': 'bg-gradient-to-r from-orange-500 to-red-600',
  'from-indigo-500 to-purple-600': 'bg-gradient-to-r from-indigo-500 to-purple-600',
  'from-yellow-500 to-amber-600': 'bg-gradient-to-r from-yellow-500 to-amber-600',
  'from-rose-500 to-pink-600': 'bg-gradient-to-r from-rose-500 to-pink-600',
  'from-emerald-500 to-green-600': 'bg-gradient-to-r from-emerald-500 to-green-600',
};

/**
 * Get color classes for a tutee based on their color scheme
 */
export function getColorClasses(primary: string) {
  const color = primary as ColorKey;
  
  // Map similar colors to base colors
  const colorMap: Record<string, ColorKey> = {
    pink: 'pink',
    purple: 'purple', 
    blue: 'blue',
    cyan: 'cyan',
    green: 'green',
    teal: 'teal',
    orange: 'orange',
    red: 'red',
    indigo: 'indigo',
    yellow: 'yellow',
    amber: 'amber',
    rose: 'rose',
    emerald: 'emerald',
  };
  
  const mappedColor = colorMap[color] || 'indigo';
  
  return {
    bgLight: bgLight[mappedColor] || 'bg-indigo-50',
    bgSolid: bgSolid[mappedColor] || 'bg-indigo-600',
    text: textColor[mappedColor] || 'text-indigo-600',
    textDark: textColorDark[mappedColor] || 'text-indigo-900',
    border: borderColor[mappedColor] || 'border-indigo-100',
    focusBorder: focusBorder[mappedColor] || 'focus:border-indigo-500',
    hoverBg: hoverBg[mappedColor] || 'hover:bg-indigo-50',
    ring: ringColor[mappedColor] || 'ring-indigo-500',
    shadow: shadowColor[mappedColor] || 'shadow-indigo-100',
    accent: accentColor[mappedColor] || 'accent-indigo-600',
  };
}

/**
 * Get quiz card specific classes based on color scheme
 */
export function getQuizCardClasses(primary: string) {
  const classes = getColorClasses(primary);
  
  return {
    cardBg: classes.bgLight,
    statsBg: classes.bgLight,
    statsText: classes.text,
    buttonGradient: `bg-gradient-to-r ${classes.bgSolid.replace('bg-', 'from-')} to-${primary === 'pink' ? 'purple' : primary === 'blue' ? 'cyan' : primary === 'green' ? 'teal' : 'purple'}-600`,
  };
}

/**
 * Determine best stat background/text combo for light-on-light situations
 */
export function getStatClasses(primary: string): { bg: string; text: string } {
  const p = primary.toLowerCase();
  
  if (['pink', 'purple', 'rose'].includes(p)) {
    return { bg: 'bg-purple-50', text: 'text-purple-600' };
  }
  if (['green', 'teal', 'emerald'].includes(p)) {
    return { bg: 'bg-teal-50', text: 'text-teal-600' };
  }
  if (['blue', 'cyan'].includes(p)) {
    return { bg: 'bg-cyan-50', text: 'text-cyan-600' };
  }
  if (['indigo'].includes(p)) {
    return { bg: 'bg-indigo-50', text: 'text-indigo-600' };
  }
  if (['orange', 'red', 'amber'].includes(p)) {
    return { bg: 'bg-orange-50', text: 'text-orange-600' };
  }
  if (['yellow'].includes(p)) {
    return { bg: 'bg-yellow-50', text: 'text-yellow-600' };
  }
  
  return { bg: 'bg-purple-50', text: 'text-purple-600' };
}

