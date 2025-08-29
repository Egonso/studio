
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "ai-act-compass-m6o05",
  "appId": "1:516664005385:web:8a51acd112bc94dc4d39d8",
  "storageBucket": "ai-act-compass-m6o05.firebasestorage.app",
  "apiKey": "AIzaSyBH2zJUhiLEK3fPjTb-KltdYjEQGcT--yo",
  "authDomain": "ai-act-compass-m6o05.firebaseapp.com",
  "messagingSenderId": "516664005385"
};


let app: FirebaseApp;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
