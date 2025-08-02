// src/firebase.js (or wherever you initialize Firebase)
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, signOut } from 'firebase/auth'; // We need this for authentication
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore'; // Add Firestore for database operations

const firebaseConfig = {
    apiKey: "AIzaSyDF7VLqX7qWmqre7L8lGZxx_GTiSiU9bHI",
    authDomain: "nimbleai-firebase.firebaseapp.com",
    projectId: "nimbleai-firebase",
    storageBucket: "nimbleai-firebase.firebasestorage.app",
    messagingSenderId: "919316988485",
    appId: "1:919316988485:web:18c9b97cccddd38d9a992c",
    measurementId: "G-D3ZJ4FFTER"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // Export the auth instance
export const db = getFirestore(app); // Export the Firestore instance

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Configure Facebook provider with additional scopes and security settings
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');
facebookProvider.setCustomParameters({
  'display': 'popup',
  'auth_type': 'reauthenticate'
});

// Configure Google provider with security settings
googleProvider.setCustomParameters({
  'prompt': 'select_account'
});

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signInWithFacebook = () => signInWithPopup(auth, facebookProvider);
export const logout = () => signOut(auth);

// Function to save user data to Firestore
export const saveUserToDatabase = async (user) => {
  try {
    const userRef = doc(db, 'users', user.uid);
    
    // Check if user already exists
    const userDoc = await getDoc(userRef);
    
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      providerId: user.providerId,
      lastLoginAt: new Date().toISOString(),
      createdAt: userDoc.exists() ? userDoc.data().createdAt : new Date().toISOString(),
      // Add any additional fields you want to track
      isActive: true,
      loginCount: userDoc.exists() ? (userDoc.data().loginCount || 0) + 1 : 1,
      // Add security-related fields
      lastLoginIP: null, // You can add IP tracking if needed
      loginMethod: user.providerId || 'unknown',
      isEmailVerified: user.emailVerified || false
    };

    await setDoc(userRef, userData, { merge: true });
    console.log('User data saved to Firestore successfully');
    return true;
  } catch (error) {
    console.error('Error saving user data to database:', error);
    return false;
  }
};


