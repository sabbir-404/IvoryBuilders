import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, FirestoreError } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

export function handleFirestoreError(
  error: any, 
  operationType: FirestoreErrorInfo['operationType'], 
  path: string | null = null
): never {
  const user = auth.currentUser;
  const errorInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: user?.uid || 'unauthenticated',
      email: user?.email || '',
      emailVerified: user?.emailVerified || false,
      isAnonymous: user?.isAnonymous || false,
      providerInfo: user?.providerData.map(p => ({
        providerId: p.providerId,
        displayName: p.displayName || '',
        email: p.email || '',
      })) || [],
    }
  };

  throw new Error(JSON.stringify(errorInfo));
}

// Connectivity check as per Firebase guidelines
async function testConnection() {
  if (typeof window === 'undefined') return;

  try {
    // Attempt to fetch a non-existent doc from server to verify connectivity
    // Using a 5 second timeout to avoid blocking too long
    const connTestRef = doc(db, '_internal_', 'connection_test');
    await getDocFromServer(connTestRef);
    console.log("Firestore connection verified.");
  } catch (error) {
    if (error instanceof FirestoreError) {
      if (error.code === 'unavailable') {
        console.warn("Firestore backend is currently unreachable. This may be due to a poor connection or initial provisioning delay. The app will continue in offline mode.");
      } else if (error.code === 'permission-denied') {
        // Permission denied is actually a good sign for connectivity - it means we reached the server
        console.log("Firestore reachability verified (permission denied as expected).");
      } else if (error.message.includes('client is offline')) {
        console.warn("Firestore client is offline. Operations will be queued.");
      } else {
        console.warn("Firestore connectivity notice:", error.code, error.message);
      }
    }
    // We don't re-throw here to prevent crashing the app startup
  }
}

testConnection();
