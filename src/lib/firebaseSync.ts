import { doc, getDoc, getDocs, setDoc, deleteDoc, collection, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Fetches all documents in a collection from Firebase Firestore
 */
export async function fetchCollectionFromFirebase(collectionName: string): Promise<any[]> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const results: any[] = [];
    snapshot.forEach((docSnap) => {
      if (docSnap.exists()) {
        results.push({ ...docSnap.data() });
      }
    });
    return results;
  } catch (err) {
    console.error(`Error fetching collection ${collectionName} from Firebase:`, err);
    throw err;
  }
}

/**
 * Fetches a single document from a collection in Firebase Firestore
 */
export async function fetchDocFromFirebase(collectionName: string, docId: string): Promise<any | null> {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (err) {
    console.error(`Error fetching document ${docId} from collection ${collectionName}:`, err);
    throw err;
  }
}

/**
 * Syncs a single document (add/update) to Firebase Firestore
 */
export async function syncToFirebase(
  collectionName: string,
  docId: string,
  data: any
): Promise<{ success: boolean; id: string; error?: string }> {
  try {
    if (!docId) {
      throw new Error('Document ID is required for synchronization');
    }
    
    // Clean data for Firestore (remove undefined values to prevent Firestore errors)
    const cleanedData = JSON.parse(JSON.stringify(data, (key, value) => {
      return value === undefined ? null : value;
    }));

    // Add metadata
    cleanedData.lastSyncedAt = new Date().toISOString();
    cleanedData.syncSource = 'marketplace_app';

    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, cleanedData, { merge: true });
    
    return { success: true, id: docId };
  } catch (err: any) {
    console.error(`Error syncing to collection ${collectionName} with ID ${docId}:`, err);
    return { success: false, id: docId, error: err.message || String(err) };
  }
}

/**
 * Deletes a single document from Firebase Firestore
 */
export async function deleteFromFirebase(
  collectionName: string,
  docId: string
): Promise<{ success: boolean; id: string; error?: string }> {
  try {
    if (!docId) {
      throw new Error('Document ID is required for deletion');
    }
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    return { success: true, id: docId };
  } catch (err: any) {
    console.error(`Error deleting from collection ${collectionName} with ID ${docId}:`, err);
    return { success: false, id: docId, error: err.message || String(err) };
  }
}

/**
 * Performs a complete bulk push of an array of entities to Firebase Firestore.
 * Divides data into batches of 500 (Firestore's limits).
 */
export async function bulkPushToFirebase(
  collectionName: string,
  items: any[],
  idKey: string = 'id'
): Promise<{ success: boolean; syncedCount: number; failedCount: number; errors: string[] }> {
  const errors: string[] = [];
  let syncedCount = 0;
  let failedCount = 0;

  try {
    if (!items || !Array.isArray(items)) {
      return { success: false, syncedCount: 0, failedCount: 0, errors: ['Items must be a valid array'] };
    }

    // Firestore batch limits are 500 operations per batch
    const BATCH_SIZE = 400; 
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batchChunk = items.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);

      batchChunk.forEach((item) => {
        const id = item[idKey];
        if (!id) {
          failedCount++;
          errors.push(`Missing identifier '${idKey}' for item: ${JSON.stringify(item).substring(0, 50)}`);
          return;
        }

        const cleanedItem = JSON.parse(JSON.stringify(item, (key, value) => {
          return value === undefined ? null : value;
        }));

        cleanedItem.lastSyncedAt = new Date().toISOString();
        cleanedItem.syncSource = 'bulk_push';

        const docRef = doc(db, collectionName, String(id));
        batch.set(docRef, cleanedItem, { merge: true });
        syncedCount++;
      });

      await batch.commit();
    }

    return {
      success: errors.length === 0,
      syncedCount,
      failedCount,
      errors
    };
  } catch (err: any) {
    console.error(`Bulk push failed for ${collectionName}:`, err);
    return {
      success: false,
      syncedCount,
      failedCount,
      errors: [...errors, err.message || String(err)]
    };
  }
}

/**
 * Purges an entire collection from Firebase Firestore
 */
export async function purgeCollectionFromFirebase(collectionName: string): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    let deletedCount = 0;
    
    if (snapshot.empty) {
      return { success: true, deletedCount: 0 };
    }

    const BATCH_SIZE = 400;
    const docs = snapshot.docs;
    
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batchChunk = docs.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      
      batchChunk.forEach((docSnap) => {
        batch.delete(docSnap.ref);
        deletedCount++;
      });
      
      await batch.commit();
    }
    
    return { success: true, deletedCount };
  } catch (err: any) {
    console.error(`Error purging collection ${collectionName} from Firebase:`, err);
    return { success: false, deletedCount: 0, error: err.message || String(err) };
  }
}


