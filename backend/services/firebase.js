import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let firebaseApp = null;

export const initializeFirebase = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Check if we're using environment variable (production) or file (development)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // Production: use environment variable
      let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
      
      // Fix: Replace literal \n with actual newlines in private_key
      // This is needed because environment variables treat \n as literal text
      const serviceAccount = JSON.parse(serviceAccountJson);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin initialized from environment variable');
    } else {
      // Development: use local file
      const serviceAccountPath = join(__dirname, '..', 'config', 'firebase-service-account.json');
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin initialized from local file');
    }
    
    return firebaseApp;
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error);
    throw error;
  }
};

export const getFirebaseApp = () => {
  if (!firebaseApp) {
    throw new Error('Firebase Admin not initialized. Call initializeFirebase() first.');
  }
  return firebaseApp;
};

export default admin;
