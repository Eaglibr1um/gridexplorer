/**
 * Admin Configuration
 * Admin PIN for accessing admin features
 */
export const ADMIN_CONFIG = {
  pin: '93889604',
  pinLength: 8,
};

/**
 * Verify admin PIN
 */
export const verifyAdminPin = (pin: string): boolean => {
  return pin === ADMIN_CONFIG.pin;
};

