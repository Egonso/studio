
// Import the functions you need from the SDKs you need
import {initializeApp, getApps, getApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "ai-act-compass-m6o05",
  "appId": "1:516664005385:web:8a51acd112bc94dc4d39d8",
  "storageBucket": "ai-act-compass-m6o05.firebasestorage.app",
  "apiKey": "AIzaSyBH2zJUhiLEK3fPjTb-KltdYjEQGcT--yo",
  "authDomain": "ai-act-compass-m6o05.firebaseapp.com",
  "messagingSenderId": "516664005385"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : get_app();
const auth = getAuth(app);

export {app, auth};
