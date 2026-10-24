import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { MemoryItem } from '../types';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with custom databaseId if configured
export const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

// Save user profile in Firestore
export async function syncUserProfile(user: FirebaseUser) {
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      });
    } else {
      await setDoc(
        userRef,
        {
          lastLoginAt: Date.now(),
          displayName: user.displayName || snap.data().displayName || 'User',
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('Notice syncing user profile:', err);
  }
}

// Fetch all memories for a user from Firestore
export async function fetchUserMemories(userId: string): Promise<MemoryItem[]> {
  try {
    const memRef = collection(db, 'users', userId, 'memories');
    const q = query(memRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const results: MemoryItem[] = [];
    snapshot.forEach((docSnap) => {
      results.push(docSnap.data() as MemoryItem);
    });
    return results;
  } catch (err) {
    console.warn('Failed to fetch user memories from Firestore:', err);
    return [];
  }
}

// Save or update a memory in Firestore for a user
export async function saveUserMemory(userId: string, memory: MemoryItem): Promise<void> {
  try {
    const memDoc = doc(db, 'users', userId, 'memories', memory.id);
    await setDoc(memDoc, {
      ...memory,
      userId,
    });
  } catch (err) {
    console.warn('Failed to save memory to Firestore:', err);
    throw err;
  }
}

// Delete a memory in Firestore
export async function deleteUserMemory(userId: string, memoryId: string): Promise<void> {
  try {
    const memDoc = doc(db, 'users', userId, 'memories', memoryId);
    await deleteDoc(memDoc);
  } catch (err) {
    console.warn('Failed to delete memory from Firestore:', err);
    throw err;
  }
}

// Batch import local memories into Firestore on user's first login
export async function migrateLocalMemoriesToCloud(
  userId: string,
  localMemories: MemoryItem[]
): Promise<void> {
  if (!localMemories || localMemories.length === 0) return;
  for (const item of localMemories) {
    try {
      await saveUserMemory(userId, item);
    } catch (e) {
      // ignore individual failures
    }
  }
}

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
};
export type { FirebaseUser };
