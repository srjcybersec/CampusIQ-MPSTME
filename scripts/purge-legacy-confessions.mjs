import dotenv from "dotenv";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

dotenv.config();

const COLLECTIONS = ["confessionReports", "confessionLikes", "confessions"];

function init() {
  if (getApps().length) return getFirestore();

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || "";

  try {
    const parsed = JSON.parse(privateKey);
    if (typeof parsed === "string") privateKey = parsed;
  } catch {}
  privateKey = privateKey.replace(/\\n/g, "\n").replace(/\\\\n/g, "\n");

  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore();
}

async function purgeCollection(db, name) {
  const snap = await db.collection(name).get();
  if (snap.empty) {
    console.log(`${name}: 0 docs`);
    return 0;
  }

  let deleted = 0;
  const batchSize = 400;
  for (let i = 0; i < snap.docs.length; i += batchSize) {
    const batch = db.batch();
    snap.docs.slice(i, i + batchSize).forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += Math.min(batchSize, snap.docs.length - i);
  }
  console.log(`${name}: deleted ${deleted} docs`);
  return deleted;
}

const db = init();
let total = 0;
for (const name of COLLECTIONS) {
  total += await purgeCollection(db, name);
}
console.log(`Done. Total deleted: ${total}`);
