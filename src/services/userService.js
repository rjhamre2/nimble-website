import { apiConfig } from '../config/api';
import { getCurrentUser } from './authService';

// Get current user data from database via Lambda
export const getCurrentUserData = async () => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return null;

    const token = localStorage.getItem('authToken');
    if (!token) return null;

    const response = await fetch(apiConfig.endpoints.auth.verify(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Update user data in database via Lambda
export const updateUserData = async (updates) => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No authenticated user');

    const response = await fetch(`${apiConfig.endpoints.auth.verify()}/update`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update user data');
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user data:', error);
    return false;
  }
};

// Note: These functions would need to be implemented in the Lambda if needed
// For now, they're commented out as they require admin privileges

// Get all users (admin function - would need Lambda implementation)
export const getAllUsers = async () => {
  console.warn('getAllUsers: This function needs to be implemented in Lambda');
  return [];
};

// Search users by email (would need Lambda implementation)
export const searchUsersByEmail = async (email) => {
  console.warn('searchUsersByEmail: This function needs to be implemented in Lambda');
  return [];
};

// Check if user exists in database (would need Lambda implementation)
export const userExists = async (uid) => {
  console.warn('userExists: This function needs to be implemented in Lambda');
  return false;
}; 