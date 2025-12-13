import { Tutee } from '../types/tuition';
import { fetchTutees, fetchTuteeById } from '../services/tuteeService';

/**
 * Tutee Configuration
 * Fallback tutees if Supabase is unavailable
 */
const FALLBACK_TUTEES: Tutee[] = [
  {
    id: 'primary-school',
    name: 'Rayne & Jeffrey',
    pin: '1234',
    colorScheme: {
      primary: 'pink',
      secondary: 'purple',
      gradient: 'from-pink-500 to-purple-600'
    },
    icon: 'BookOpen',
    description: 'Primary school Science and Math'
  },
  {
    id: 'shermaine',
    name: 'Shermaine',
    pin: '9999',
    colorScheme: {
      primary: 'green',
      secondary: 'teal',
      gradient: 'from-green-500 to-teal-600'
    },
    icon: 'GraduationCap',
    description: 'IB HL Chemistry'
  }
];

// Cache for tutees
let tuteesCache: Tutee[] | null = null;

/**
 * Fetch tutees from Supabase with fallback
 */
export const getTutees = async (): Promise<Tutee[]> => {
  try {
    const tutees = await fetchTutees();
    tuteesCache = tutees;
    return tutees;
  } catch (error) {
    console.warn('Failed to fetch tutees from Supabase, using fallback:', error);
    return FALLBACK_TUTEES;
  }
};

/**
 * Get tutee by ID (from cache or Supabase)
 */
export const getTuteeById = async (id: string): Promise<Tutee | null> => {
  try {
    // Try Supabase first
    const tutee = await fetchTuteeById(id);
    if (tutee) {
      // Update cache
      if (tuteesCache) {
        const index = tuteesCache.findIndex(t => t.id === id);
        if (index >= 0) {
          tuteesCache[index] = tutee;
        } else {
          tuteesCache.push(tutee);
        }
      }
      return tutee;
    }
  } catch (error) {
    console.warn('Failed to fetch tutee from Supabase:', error);
  }
  
  // Fallback to local
  return FALLBACK_TUTEES.find(tutee => tutee.id === id) || null;
};

/**
 * Get tutee by ID (synchronous, from cache or fallback)
 */
export const getTuteeByIdSync = (id: string): Tutee | undefined => {
  if (tuteesCache) {
    return tuteesCache.find(tutee => tutee.id === id);
  }
  return FALLBACK_TUTEES.find(tutee => tutee.id === id);
};

/**
 * Verify PIN for a tutee
 */
export const verifyPin = async (tuteeId: string, pin: string): Promise<boolean> => {
  const tutee = await getTuteeById(tuteeId);
  return tutee?.pin === pin;
};

/**
 * Verify PIN synchronously (from cache or fallback)
 */
export const verifyPinSync = (tuteeId: string, pin: string): boolean => {
  const tutee = getTuteeByIdSync(tuteeId);
  return tutee?.pin === pin;
};

