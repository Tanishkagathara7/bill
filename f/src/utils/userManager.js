import { authApi } from './api';

export const USER_ROLES = {
  OWNER: 'Owner',
  STAFF: 'Staff'
};

export const STORAGE_KEYS = {
  CURRENT_USER: 'quickbill_user',
  JWT_TOKEN: 'quickbill_jwt_token'
};

// Validate email format
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
export const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }
  if (password.length > 50) {
    return { isValid: false, message: 'Password must be less than 50 characters' };
  }
  return { isValid: true, message: '' };
};

// Register a new user
export const registerUser = async (userData) => {
  const { email, password, name, role, ownerId } = userData;
  
  if (!validateEmail(email)) {
    return { success: false, message: 'Invalid email format' };
  }
  
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return { success: false, message: passwordValidation.message };
  }
  
  if (!name || name.trim().length < 2) {
    return { success: false, message: 'Name must be at least 2 characters long' };
  }
  
  try {
    const res = await authApi.register({ email, password, name, role, ownerId });
    if (res.success) {
      // Automatically log them in by setting token and user
      localStorage.setItem(STORAGE_KEYS.JWT_TOKEN, res.data.token);
      
      const { token, ...userWithoutToken } = res.data;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userWithoutToken));
      
      return { success: true, message: 'User registered successfully', user: userWithoutToken };
    }
    return { success: false, message: res.message || 'Registration failed' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Authenticate user
export const authenticateUser = async (email, password) => {
  try {
    const res = await authApi.login(email, password);
    if (res.success) {
      localStorage.setItem(STORAGE_KEYS.JWT_TOKEN, res.data.token);
      
      const { token, ...userWithoutToken } = res.data;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userWithoutToken));
      
      return { success: true, user: userWithoutToken };
    }
    return { success: false, message: res.message || 'Login failed' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Get current logged-in user
export const getCurrentUser = () => {
  try {
    const currentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return currentUser ? JSON.parse(currentUser) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Update current user locally
export const setCurrentUser = (user) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return true;
  } catch (error) {
    console.error('Error setting current user:', error);
    return false;
  }
};

// Sign out current user
export const signOutUser = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
    return true;
  } catch (error) {
    console.error('Error signing out user:', error);
    return false;
  }
};

// Check if current user has specific role
export const hasRole = (requiredRole) => {
  const currentUser = getCurrentUser();
  return currentUser && currentUser.role === requiredRole;
};

// Check if current user is owner
export const isOwner = () => hasRole(USER_ROLES.OWNER);

// Check if current user is staff
export const isStaff = () => hasRole(USER_ROLES.STAFF);

// Change user password - Needs a new backend endpoint, mock failure for now until Phase 2
export const changePassword = async (userId, currentPassword, newPassword) => {
  return { success: false, message: 'Change password not implemented on backend yet.' };
};

// Reset password - Needs a new backend endpoint
export const resetPassword = (email, newPassword) => {
  return { success: false, message: 'Reset password not implemented on backend yet.' };
};

// Staff Management Functions
export const createStaffMember = async (ownerUserId, staffData) => {
  const { name, email, password } = staffData;
  return registerUser({
    name,
    email,
    password,
    role: USER_ROLES.STAFF,
    ownerId: ownerUserId
  });
};

// Needs a new backend endpoint
export const getOwnerStaff = async (ownerUserId) => {
  return []; 
};

// Needs a new backend endpoint
export const removeStaffMember = async (ownerUserId, staffUserId) => {
  return { success: false, message: 'Not implemented on backend yet.' };
};

// Needs a new backend endpoint
export const updateStaffMember = async (ownerUserId, staffUserId, updates) => {
  return { success: false, message: 'Not implemented on backend yet.' };
};

// Needs a new backend endpoint
export const getOrganizationStats = async (ownerUserId) => {
  return null;
};
