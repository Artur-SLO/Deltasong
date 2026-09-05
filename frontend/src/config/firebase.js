import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const hasConfig = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

if (!hasConfig) {
    console.warn(
        '[Deltasong] Firebase environment variables (VITE_FIREBASE_*) not detected. ' +
        'Local guest gameplay is enabled, but cloud features require GitHub Secrets or .env configuration.'
    );
}

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyPlaceholderKeyForOfflineInit0000',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'deltasong-app.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'deltasong-app',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'deltasong-app.appspot.com',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '100000000000',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:100000000000:web:abcdef1234567890'
};

// Initialize Firebase App
const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore
export const db = getFirestore(app);

export default app;
