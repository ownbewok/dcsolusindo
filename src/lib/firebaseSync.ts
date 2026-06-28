/**
 * Mock Firestore synchronizer file.
 * All functions resolve successfully to support Offline Local Sandbox mode.
 */

import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const db = null as any;

export interface FirebaseConfigType {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
}

export function getActiveFirebaseConfig(): FirebaseConfigType {
  try {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('digimarket_custom_firebase') : null;
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse custom firebase config from localStorage', e);
  }
  return firebaseConfig;
}

export function getLiveFirestore(): any {
  const activeConfig = getActiveFirebaseConfig();
  if (!activeConfig || !activeConfig.projectId) {
    throw new Error("Konfigurasi Firebase belum diatur.");
  }
  
  // Hash to find or initialize specific app
  const configStr = JSON.stringify(activeConfig);
  let hash = 0;
  for (let i = 0; i < configStr.length; i++) {
    hash = (hash << 5) - hash + configStr.charCodeAt(i);
    hash |= 0;
  }
  const appName = `live-app-${Math.abs(hash)}`;
  
  const existingApps = getApps();
  let app = existingApps.find(a => a.name === appName);
  if (!app) {
    app = initializeApp(activeConfig, appName);
  }
  
  return getFirestore(app, activeConfig.firestoreDatabaseId);
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: {
    projectId: string;
    databaseId: string;
    errorMessage?: string;
    errorType?: string;
    step?: string;
    latencyMs?: number;
  };
}

export async function testFirebaseConnection(customConfig?: FirebaseConfigType): Promise<ConnectionTestResult> {
  const startTime = Date.now();
  const activeConfig = customConfig || getActiveFirebaseConfig();
  const projectId = activeConfig.projectId;
  const databaseId = activeConfig.firestoreDatabaseId || '(default)';

  try {
    let app;
    // Generate a unique app name based on the configuration hash to avoid caching/conflict issues
    const configStr = JSON.stringify(activeConfig);
    let hash = 0;
    for (let i = 0; i < configStr.length; i++) {
      hash = (hash << 5) - hash + configStr.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    const testAppName = `test-conn-app-${Math.abs(hash)}`;
    
    const existingApps = getApps();
    const existingTestApp = existingApps.find(a => a.name === testAppName);
    if (existingTestApp) {
      app = existingTestApp;
    } else {
      app = initializeApp(activeConfig, testAppName);
    }

    const testDb = getFirestore(app, activeConfig.firestoreDatabaseId);
    const testDocRef = doc(testDb, 'test', 'connection');
    
    try {
      await getDocFromServer(testDocRef);
    } catch (readError: any) {
      const errMessage = readError?.message || String(readError);
      const latency = Date.now() - startTime;

      if (
        errMessage.includes('permission') || 
        errMessage.includes('PERMISSION_DENIED') || 
        errMessage.includes('insufficient')
      ) {
        return {
          success: true,
          message: 'Koneksi ke Firestore Berhasil! Namun diblokir oleh aturan keamanan (Security Rules) untuk membaca rute ini.',
          details: {
            projectId,
            databaseId,
            errorMessage: errMessage,
            errorType: 'PERMISSION_DENIED',
            step: 'read_document',
            latencyMs: latency
          }
        };
      }

      if (
        errMessage.includes('offline') || 
        errMessage.includes('failed-precondition') || 
        errMessage.includes('unavailable') ||
        errMessage.includes('client is offline')
      ) {
        return {
          success: false,
          message: 'Gagal Terhubung: Klien sedang offline atau server Firestore tidak dapat dihubungi.',
          details: {
            projectId,
            databaseId,
            errorMessage: errMessage,
            errorType: 'NETWORK_ERROR',
            step: 'read_document',
            latencyMs: latency
          }
        };
      }

      if (errMessage.toLowerCase().includes('quota') || errMessage.toLowerCase().includes('exhausted')) {
        return {
          success: false,
          message: 'Gagal Terhubung: Batas kuota harian Firestore gratis telah terlampaui (Quota Exceeded).',
          details: {
            projectId,
            databaseId,
            errorMessage: errMessage,
            errorType: 'QUOTA_EXCEEDED',
            step: 'read_document',
            latencyMs: latency
          }
        };
      }

      return {
        success: false,
        message: `Terjadi kesalahan saat berkomunikasi dengan Firestore: ${errMessage}`,
        details: {
          projectId,
          databaseId,
          errorMessage: errMessage,
          errorType: 'UNKNOWN_FIRESTORE_ERROR',
          step: 'read_document',
          latencyMs: latency
        }
      };
    }

    const latency = Date.now() - startTime;
    return {
      success: true,
      message: 'Koneksi Sukses! Berhasil terhubung ke database Firestore dan membaca data dengan lancar.',
      details: {
        projectId,
        databaseId,
        step: 'read_document_success',
        latencyMs: latency
      }
    };
  } catch (initError: any) {
    const errMessage = initError?.message || String(initError);
    return {
      success: false,
      message: `Gagal menginisialisasi SDK Firebase. Periksa format konfigurasi Anda.`,
      details: {
        projectId,
        databaseId,
        errorMessage: errMessage,
        errorType: 'INITIALIZATION_ERROR',
        step: 'initialize_app'
      }
    };
  }
}

export async function fetchCollectionFromFirebase(collectionName: string): Promise<any[]> {
  try {
    const liveDb = getLiveFirestore();
    const colRef = collection(liveDb, collectionName);
    const querySnapshot = await getDocs(colRef);
    const data: any[] = [];
    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });
    return data;
  } catch (error) {
    console.error(`Error fetchCollectionFromFirebase for ${collectionName}:`, error);
    throw error;
  }
}

export async function fetchDocFromFirebase(collectionName: string, docId: string): Promise<any | null> {
  try {
    const liveDb = getLiveFirestore();
    const docRef = doc(liveDb, collectionName, docId);
    const docSnap = await getDocFromServer(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error(`Error fetchDocFromFirebase for ${collectionName}/${docId}:`, error);
    throw error;
  }
}

export async function syncToFirebase(
  collectionName: string,
  docId: string,
  data: any
): Promise<{ success: boolean; id: string; error?: string }> {
  try {
    const liveDb = getLiveFirestore();
    const docRef = doc(liveDb, collectionName, docId);
    
    // Clean data to avoid undefined values which Firestore doesn't like
    const cleanData = JSON.parse(JSON.stringify(data));
    
    await setDoc(docRef, cleanData, { merge: true });
    return { success: true, id: docId };
  } catch (error: any) {
    console.error(`Error syncToFirebase for ${collectionName}/${docId}:`, error);
    return { success: false, id: docId, error: error.message || String(error) };
  }
}

export async function deleteFromFirebase(
  collectionName: string,
  docId: string
): Promise<{ success: boolean; id: string; error?: string }> {
  try {
    const liveDb = getLiveFirestore();
    const docRef = doc(liveDb, collectionName, docId);
    await deleteDoc(docRef);
    return { success: true, id: docId };
  } catch (error: any) {
    console.error(`Error deleteFromFirebase for ${collectionName}/${docId}:`, error);
    return { success: false, id: docId, error: error.message || String(error) };
  }
}

export async function bulkPushToFirebase(
  collectionName: string,
  items: any[],
  idKey: string = 'id'
): Promise<{ success: boolean; syncedCount: number; failedCount: number; errors: string[] }> {
  if (!items || items.length === 0) {
    return { success: true, syncedCount: 0, failedCount: 0, errors: [] };
  }

  try {
    const liveDb = getLiveFirestore();
    let syncedCount = 0;
    const failedCount = 0;
    const errors: string[] = [];

    // Process in chunks of 400 to be safe (max Firestore batch limit is 500)
    const chunkSize = 400;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const batch = writeBatch(liveDb);

      for (const item of chunk) {
        // Ensure we have a valid doc ID string
        const docId = String(item[idKey] || item.id || item.code || Math.random().toString(36).substring(7));
        const docRef = doc(liveDb, collectionName, docId);
        
        // Deep clean undefined or complex objects
        const cleanItem = JSON.parse(JSON.stringify(item));
        batch.set(docRef, cleanItem, { merge: true });
      }

      await batch.commit();
      syncedCount += chunk.length;
    }

    return {
      success: true,
      syncedCount,
      failedCount,
      errors
    };
  } catch (error: any) {
    console.error(`Error bulkPushToFirebase for ${collectionName}:`, error);
    return {
      success: false,
      syncedCount: 0,
      failedCount: items.length,
      errors: [error.message || String(error)]
    };
  }
}

export async function purgeCollectionFromFirebase(collectionName: string): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    const liveDb = getLiveFirestore();
    const colRef = collection(liveDb, collectionName);
    const querySnapshot = await getDocs(colRef);
    
    let deletedCount = 0;
    const docs = querySnapshot.docs;
    
    const chunkSize = 400;
    for (let i = 0; i < docs.length; i += chunkSize) {
      const chunk = docs.slice(i, i + chunkSize);
      const batch = writeBatch(liveDb);
      
      for (const d of chunk) {
        batch.delete(d.ref);
      }
      
      await batch.commit();
      deletedCount += chunk.length;
    }
    
    return { success: true, deletedCount };
  } catch (error: any) {
    console.error(`Error purgeCollectionFromFirebase for ${collectionName}:`, error);
    return { success: false, deletedCount: 0, error: error.message || String(error) };
  }
}
