import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getCurrentUserData, updateUserData } from '../services/userService';
import { saveUserToDatabase } from '../firebase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Save user data to database first
        try {
          await saveUserToDatabase(firebaseUser);
        } catch (error) {
          console.error('Failed to save user data:', error);
        }
        
        // Then get user data from database
        const data = await getCurrentUserData();
        setUserData(data);
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateUser = async (updates) => {
    if (!user) return false;
    
    const success = await updateUserData(updates);
    if (success) {
      // Refresh user data
      const data = await getCurrentUserData();
      setUserData(data);
    }
    return success;
  };

  return {
    user,
    userData,
    loading,
    updateUser,
    isAuthenticated: !!user
  };
}; 