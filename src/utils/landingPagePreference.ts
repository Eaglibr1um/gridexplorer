/**
 * Landing page preference system
 * Stores user's preferred landing page per device using localStorage
 */

const LANDING_PAGE_KEY = 'landingPagePreference';
const AVAILABLE_LANDING_PAGES = [
  { value: '/explorer', label: 'Grid Explorer', description: 'Main data dashboard' },
  { value: '/work-progress', label: 'Work Progress Tracker', description: 'Daily task tracking (public)' },
  { value: '/tuition', label: 'Tuition Portal', description: 'Student management' },
  { value: '/profile', label: 'Profile', description: 'User profile' }
] as const;

export type LandingPageValue = typeof AVAILABLE_LANDING_PAGES[number]['value'];

/**
 * Get device fingerprint (simple version using screen size + user agent)
 */
const getDeviceFingerprint = (): string => {
  const screen = `${window.screen.width}x${window.screen.height}`;
  const userAgent = navigator.userAgent.substring(0, 50);
  return `${screen}-${userAgent}`;
};

/**
 * Get landing page preference for current device
 * Returns null if no preference has been explicitly set
 */
export const getLandingPagePreference = (): LandingPageValue | null => {
  try {
    const stored = localStorage.getItem(LANDING_PAGE_KEY);
    if (!stored) return null; // No preference set
    
    const data = JSON.parse(stored);
    const deviceFingerprint = getDeviceFingerprint();
    
    // Check if preference exists for this device
    if (data[deviceFingerprint]) {
      return data[deviceFingerprint];
    }
    
    return null; // No preference for this device
  } catch (error) {
    console.error('Error reading landing page preference:', error);
    return null;
  }
};

/**
 * Set landing page preference for current device
 */
export const setLandingPagePreference = (page: LandingPageValue): void => {
  try {
    const stored = localStorage.getItem(LANDING_PAGE_KEY);
    const data = stored ? JSON.parse(stored) : {};
    const deviceFingerprint = getDeviceFingerprint();
    
    data[deviceFingerprint] = page;
    localStorage.setItem(LANDING_PAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving landing page preference:', error);
  }
};

/**
 * Get all available landing pages
 */
export const getAvailableLandingPages = () => AVAILABLE_LANDING_PAGES;

