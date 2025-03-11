import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateProfile,
  UserCredential,
  User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

/**
 * Sign up a new user with email and password
 */
export const signUpWithEmail = async (email: string, password: string, name: string): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with user name
    await updateProfile(userCredential.user, {
      displayName: name,
    });
    
    return userCredential;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email: string, password: string): Promise<UserCredential> => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

/**
 * Sign out the current user
 */
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

/**
 * Update user password
 */
export const changePassword = async (
  user: User,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  try {
    // Re-authenticate user before changing password
    const credential = EmailAuthProvider.credential(user.email!, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Update password
    await updatePassword(user, newPassword);
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  user: User,
  profileData: { displayName?: string; photoURL?: string }
): Promise<void> => {
  try {
    await updateProfile(user, profileData);
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};