# User Database Setup

This document explains how the user database functionality works in your Nimble AI app.

## Overview

When a user logs in with Google, their data is automatically saved to a Firestore database. This includes:

- User profile information (name, email, photo)
- Authentication details
- Login timestamps
- Login count
- Account status

## Files Added/Modified

### 1. `src/firebase.js`
- Added Firestore import and initialization
- Added `saveUserToDatabase()` function
- Exports `db` instance for database operations

### 2. `src/services/userService.js` (New)
- Utility functions for user data management
- Functions to get, update, and search user data
- Admin functions for user management

### 3. `src/hooks/useAuth.js` (New)
- Custom hook for authentication state management
- Automatically saves user data on login
- Provides user data throughout the app

### 4. `src/components/SignInButton.js`
- Updated to use the new `useAuth` hook
- Improved loading states and error handling

### 5. `src/components/UserProfile.js` (New)
- Example component showing how to display user data
- Demonstrates updating user information

## How It Works

1. **User Login**: When a user clicks "Sign in with Google", the authentication flow begins
2. **Data Save**: After successful authentication, `saveUserToDatabase()` is called automatically
3. **Database Structure**: User data is stored in Firestore with the following structure:

```javascript
{
  uid: "user-unique-id",
  email: "user@example.com",
  displayName: "User Name",
  photoURL: "https://...",
  providerId: "google.com",
  lastLoginAt: "2024-01-01T00:00:00.000Z",
  createdAt: "2024-01-01T00:00:00.000Z",
  isActive: true,
  loginCount: 1,
  // Additional custom fields can be added here
}
```

## Usage Examples

### Using the useAuth Hook

```javascript
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { user, userData, loading, updateUser, isAuthenticated } = useAuth();

  if (loading) return <div>Loading...</div>;
  
  if (!isAuthenticated) return <div>Please sign in</div>;

  return (
    <div>
      <h1>Welcome, {user.displayName}!</h1>
      <p>You've logged in {userData.loginCount} times</p>
    </div>
  );
}
```

### Updating User Data

```javascript
const { updateUser } = useAuth();

const handleUpdate = async () => {
  const success = await updateUser({
    preferences: { theme: 'dark' },
    lastActivity: new Date().toISOString()
  });
  
  if (success) {
    console.log('User data updated!');
  }
};
```

### Using User Service Functions

```javascript
import { getCurrentUserData, searchUsersByEmail } from '../services/userService';

// Get current user's data
const userData = await getCurrentUserData();

// Search for users by email
const users = await searchUsersByEmail('user@example.com');
```

## Database Security Rules

Make sure to set up proper Firestore security rules. Here's a basic example:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Customization

You can customize the user data structure by modifying the `saveUserToDatabase()` function in `src/firebase.js`. Add any additional fields you want to track:

```javascript
const userData = {
  // ... existing fields
  customField: 'custom value',
  preferences: {
    theme: 'light',
    notifications: true
  },
  // Add more fields as needed
};
```

## Testing

1. Start your development server: `npm start`
2. Click "Sign in with Google"
3. Check the browser console for success messages
4. Verify data is saved in your Firestore database

## Troubleshooting

- **Database not saving**: Check Firestore security rules
- **Authentication errors**: Verify Firebase configuration
- **Import errors**: Make sure all files are in the correct locations

## Next Steps

- Add more user data fields as needed
- Implement user preferences and settings
- Add admin functionality for user management
- Set up proper error handling and user feedback 