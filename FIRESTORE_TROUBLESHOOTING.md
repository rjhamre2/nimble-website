# Firestore Troubleshooting Guide

If you're not seeing user data in Firestore after logging in, follow these steps:

## 🔍 Step 1: Check Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Try logging in with Google
4. Look for these console messages:
   - "Auth state changed: User logged in"
   - "Attempting to save user data to database..."
   - "User data saved to database successfully"

## 🔍 Step 2: Test Database Connection

1. The DatabaseTest component is now added to your app
2. Go to your app and look for the "Database Test" section
3. Click "Test Firestore Connection" first
4. Check the test result

## 🔍 Step 3: Check Firestore Security Rules

The most common issue is incorrect security rules. Go to Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `nimbleai-firebase`
3. Click "Firestore Database" in the left sidebar
4. Click the "Rules" tab
5. Make sure your rules allow write access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /test/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🔍 Step 4: Check Firestore Database Setup

1. In Firebase Console, go to "Firestore Database"
2. If you see "Create database", click it
3. Choose "Start in test mode" for now
4. Select a location (choose the closest to your users)

## 🔍 Step 5: Common Error Messages

### "Missing or insufficient permissions"
- **Solution**: Update Firestore security rules (see Step 3)

### "Firestore is not enabled"
- **Solution**: Enable Firestore in Firebase Console

### "Project not found"
- **Solution**: Check your Firebase config in `src/firebase.js`

### "Network error"
- **Solution**: Check your internet connection

## 🔍 Step 6: Debug Steps

1. **Test Connection**: Use the "Test Firestore Connection" button
2. **Test User Save**: Login first, then use "Test User Save" button
3. **Check Console**: Look for detailed error messages
4. **Verify Project**: Make sure you're in the right Firebase project

## 🔍 Step 7: Manual Database Check

1. In Firebase Console, go to "Firestore Database"
2. Look for a `users` collection
3. Look for a `test` collection (from connection test)
4. If you see the `test` collection but not `users`, the issue is with user data saving
5. If you don't see either, the issue is with Firestore setup or permissions

## 🚨 Emergency Fix

If nothing works, try this temporary rule to allow all access (REMOVE AFTER TESTING):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **WARNING**: This allows anyone to read/write your database. Only use for testing!

## 📞 Still Having Issues?

1. Check the browser console for specific error messages
2. Verify your Firebase project ID matches in the config
3. Make sure Firestore is enabled in your Firebase project
4. Try the test component to isolate the issue

## 🧹 Cleanup

After testing, remove the DatabaseTest component from your App.js and the temporary security rules. 