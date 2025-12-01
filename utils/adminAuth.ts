// Simple Admin Authentication (UI-based, no database)
// Admin password is stored in localStorage (for development)
// For production, use proper authentication

const ADMIN_PASSWORD_KEY = 'devdex_admin_password';
const ADMIN_SESSION_KEY = 'devdex_admin_session';

// Default admin password (should be changed in production)
const DEFAULT_ADMIN_PASSWORD = 'thoang126';

export const isAdmin = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const session = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!session) return false;
  
  // Check if session is still valid (24 hours)
  try {
    const { timestamp } = JSON.parse(session);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    if (now - timestamp > twentyFourHours) {
      logout();
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

export const login = (password: string): boolean => {
  // Get stored password or use default
  const storedPassword = localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
  
  if (password === storedPassword) {
    const session = {
      timestamp: Date.now(),
      authenticated: true
    };
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    return true;
  }
  
  return false;
};

export const logout = (): void => {
  localStorage.removeItem(ADMIN_SESSION_KEY);
};

export const setAdminPassword = (newPassword: string, currentPassword: string): boolean => {
  if (!isAdmin()) {
    // First time setup - no current password needed
    if (!localStorage.getItem(ADMIN_PASSWORD_KEY)) {
      localStorage.setItem(ADMIN_PASSWORD_KEY, newPassword);
      login(newPassword);
      return true;
    }
    return false;
  }
  
  // Verify current password
  const storedPassword = localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
  if (currentPassword !== storedPassword) {
    return false;
  }
  
  // Set new password
  localStorage.setItem(ADMIN_PASSWORD_KEY, newPassword);
  return true;
};

export const changePassword = (oldPassword: string, newPassword: string): boolean => {
  return setAdminPassword(newPassword, oldPassword);
};

