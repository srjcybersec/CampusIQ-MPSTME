import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";

let adminApp: App | null = null;
let adminDb: Firestore | null = null;
let adminStorage: Storage | null = null;

export async function initializeAdmin(): Promise<{ db: Firestore; storage: Storage }> {
  if (adminDb && adminStorage) {
    return { db: adminDb, storage: adminStorage };
  }

  try {
    if (!getApps().length) {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error("Firebase Admin credentials are missing. Please check your environment variables.");
      }

      // Handle private key formatting
      let formattedPrivateKey = privateKey;
      
      // Try to parse as JSON first (in case it's stored as JSON string)
      try {
        const parsed = JSON.parse(privateKey);
        if (typeof parsed === "string") {
          formattedPrivateKey = parsed;
        }
      } catch {
        // Not JSON, use as-is
      }
      
      // Replace escaped newlines
      formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, "\n");
      formattedPrivateKey = formattedPrivateKey.replace(/\\\\n/g, "\n");

      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } else {
      adminApp = getApps()[0];
    }

    adminDb = getFirestore(adminApp);
    adminStorage = getStorage(adminApp);
    
    return { db: adminDb, storage: adminStorage };
  } catch (error: any) {
    console.error("Firebase Admin initialization error:", error);
    throw new Error(`Failed to initialize Firebase Admin: ${error.message}`);
  }
}

// Export convenience functions
export async function getAdminDb(): Promise<Firestore> {
  const { db } = await initializeAdmin();
  return db;
}

export async function getAdminStorage(): Promise<Storage> {
  const { storage } = await initializeAdmin();
  return storage;
}
