import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Silence internal Firestore SDK logs (e.g. quota limit notices and backoff retries)
try {
  setLogLevel('silent');
} catch (e) {}

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with databaseId as required by AI Studio environment
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const savedTime = localStorage.getItem('kbc_mi_firestore_quota_exceeded_v1');
    if (savedTime) {
      const timeMs = parseInt(savedTime, 10);
      if (!isNaN(timeMs) && Date.now() - timeMs < 24 * 60 * 60 * 1000) {
        console.warn('Firestore daily free quota limit reached (cached). LocalStorage fallback active.');
        return false;
      }
    }
    const docRef = doc(db, 'test', 'connection');
    const getDocPromise = getDoc(docRef);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection check timeout (operating in offline mode)')), 2500)
    );
    await Promise.race([getDocPromise, timeoutPromise]);
    console.log('Firestore connection verified successfully.');
    return true;
  } catch (error: any) {
    const errStr = String(error?.message || error || '');
    if (error?.code === 'resource-exhausted' || errStr.includes('Quota limit exceeded')) {
      try {
        localStorage.setItem('kbc_mi_firestore_quota_exceeded_v1', Date.now().toString());
      } catch (e) {}
      console.warn('Firestore daily free quota limit reached. LocalStorage fallback active.');
    } else if (errStr.includes('offline') || errStr.includes('Could not reach Cloud') || errStr.includes('timeout') || errStr.includes('unavailable')) {
      console.warn('Firestore operating in offline mode. LocalStorage fallback active.');
    } else {
      console.log('Firestore connection check finished.');
    }
    return false;
  }
}

// Connection test helper (called on-demand when needed)
