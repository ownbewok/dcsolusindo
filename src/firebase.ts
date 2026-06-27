/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "fir-ownbewok",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:448061634338:web:8b5f765f5276f65a8b977b",
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyDKJW2bFVHnodjPXfg1f-mF2khwsX651mc",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "fir-ownbewok.firebaseapp.com",
  firestoreDatabaseId: metaEnv.VITE_FIREBASE_DATABASE_ID || "ai-studio-7d9b1f02-aeec-43bf-bcb9-bf041e7543cf",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "fir-ownbewok.firebasestorage.app",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "448061634338"
};

const app = initializeApp(firebaseConfig);
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
