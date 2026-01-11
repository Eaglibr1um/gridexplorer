/**
 * Chemistry Notation Converter
 * Converts shorthand chemistry notation to proper chemical symbols
 */

// Subscript mapping for numbers
const subscriptMap: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
};

// Superscript mapping for charges and exponents
const superscriptMap: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾'
};

/**
 * Convert /C2H4/ format to C₂H₄ (subscript numbers)
 * Uses /formula/ format to clearly delimit chemistry formulas
 */
export const convertSubscripts = (text: string): string => {
  // Match patterns like /C2H4/, /H2O/, /CO2/, etc.
  // The /formula/ format clearly delimits chemistry notation
  return text.replace(/\/([A-Z][A-Za-z0-9]*)\//g, (match, formula) => {
    // Convert all numbers in the formula to subscripts
    return formula.replace(/\d/g, (digit: string) => subscriptMap[digit] || digit);
  });
};

/**
 * Convert <-> to reversible arrow ⇌
 */
export const convertReversibleArrow = (text: string): string => {
  return text.replace(/<->/g, '⇌').replace(/<->/g, '⇌');
};

/**
 * Convert ^text^ format to superscript
 * Uses ^text^ format to clearly delimit superscript text
 * Examples: cm^3^, x^2^, 10^-5^
 */
export const convertSuperscripts = (text: string): string => {
  // Match patterns like ^3^, ^2^, ^-1^, etc.
  return text.replace(/\^([0-9+\-=()]+)\^/g, (match, content) => {
    // Convert all characters in the content to superscripts
    return content.split('').map((char: string) => superscriptMap[char] || char).join('');
  });
};

/**
 * Convert charge notation: +, -, 2+, 3-, etc. to superscripts
 */
export const convertCharges = (text: string): string => {
  // Match patterns like +, -, 2+, 3-, etc. after elements or compounds
  return text.replace(/([A-Za-z0-9]+)\s*([+-]|\d+[+-])/g, (match, compound, charge) => {
    // Convert charge to superscript
    const superscriptCharge = charge.split('').map((char: string) => 
      superscriptMap[char] || char
    ).join('');
    return compound + superscriptCharge;
  });
};

/**
 * Convert state notation: (s), (l), (g), (aq)
 */
export const convertStates = (text: string): string => {
  // States are already in correct format, but ensure proper spacing
  return text.replace(/\s*\(([slgaq]+)\)/gi, ' ($1)');
};

/**
 * Convert temperature and units
 */
export const convertUnits = (text: string): string => {
  // Convert degree symbols
  // Support both degC and number+C format (e.g., "25C" -> "25°C")
  return text
    .replace(/(\d+)\s*C(?![a-z])/g, '$1°C') // Match numbers followed by C (not Ca, Cl, etc.)
    .replace(/(\d+)\s*F(?![a-z])/g, '$1°F') // Match numbers followed by F (not Fe, Fl, etc.)
    .replace(/degC/gi, '°C')
    .replace(/degF/gi, '°F')
    .replace(/degK/gi, 'K')
    .replace(/delta/gi, 'Δ')
    .replace(/lambda/gi, 'λ')
    .replace(/alpha/gi, 'α')
    .replace(/beta/gi, 'β')
    .replace(/gamma/gi, 'γ');
};

/**
 * Convert Greek letters
 */
export const convertGreekLetters = (text: string): string => {
  const greekMap: Record<string, string> = {
    'alpha': 'α', 'beta': 'β', 'gamma': 'γ', 'delta': 'Δ',
    'epsilon': 'ε', 'theta': 'θ', 'lambda': 'λ', 'mu': 'μ',
    'pi': 'π', 'sigma': 'σ', 'phi': 'φ', 'omega': 'ω',
    'Alpha': 'Α', 'Beta': 'Β', 'Gamma': 'Γ', 'Delta': 'Δ',
    'Lambda': 'Λ', 'Pi': 'Π', 'Sigma': 'Σ', 'Omega': 'Ω'
  };
  
  let result = text;
  for (const [key, value] of Object.entries(greekMap)) {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    result = result.replace(regex, value);
  }
  return result;
};

/**
 * Main chemistry notation converter
 * Processes text and converts all chemistry notation
 */
export const convertChemistryNotation = (text: string): string => {
  if (!text) return text;
  
  let result = text;
  
  // Apply conversions in order
  result = convertSubscripts(result);
  result = convertSuperscripts(result);
  result = convertReversibleArrow(result);
  result = convertGreekLetters(result);
  result = convertUnits(result);
  result = convertCharges(result);
  result = convertStates(result);
  
  return result;
};

/**
 * Process text on space or enter key
 * Converts /C2H4/ to C₂H₄ when space is pressed
 */
export const processChemistryInput = (text: string, triggerChar: string = ' '): string => {
  // Process all /formula/ patterns in the text
  return convertChemistryNotation(text);
};

