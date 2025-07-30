import React from 'react';
import { useAuth } from '../hooks/useAuth';

const UserProfile = () => {
  const { user, userData, loading, updateUser } = useAuth();

  if (loading) {
    return <div>Loading user profile...</div>;
  }

  if (!user) {
    return <div>Please sign in to view your profile.</div>;
  }

  const handleUpdateProfile = async () => {
    // Example: Update user preferences
    const success = await updateUser({
      preferences: {
        theme: 'dark',
        notifications: true
      }
    });
    
    if (success) {
      alert('Profile updated successfully!');
    } else {
      alert('Failed to update profile.');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">User Profile</h2>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          {user.photoURL && (
            <img 
              src={user.photoURL} 
              alt="Profile" 
              className="w-16 h-16 rounded-full"
            />
          )}
          <div>
            <h3 className="text-lg font-semibold">{user.displayName}</h3>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>

        {userData && (
          <div className="space-y-2">
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700">Account Information</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>User ID:</strong> {userData.uid}</p>
                <p><strong>Provider:</strong> {userData.providerId}</p>
                <p><strong>Created:</strong> {new Date(userData.createdAt).toLocaleDateString()}</p>
                <p><strong>Last Login:</strong> {new Date(userData.lastLoginAt).toLocaleDateString()}</p>
                <p><strong>Login Count:</strong> {userData.loginCount}</p>
                <p><strong>Status:</strong> {userData.isActive ? 'Active' : 'Inactive'}</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleUpdateProfile}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Update Profile
        </button>
      </div>
    </div>
  );
};

export default UserProfile; 