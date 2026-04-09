/**
 * Firebase Admin SDK Configuration
 * Initializes Firestore and exports the db instance + config constants
 */

const admin = require('firebase-admin');
const path = require('path');

// Load service account key
const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

// Firestore instance
const db = admin.firestore();

// ─── Config Constants ─────────────────────────────────────────
// In production, use environment variables
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'battlezone@123'  // Change this!
};

const JWT_SECRET = 'bgmi-battlezone-secret-2024';

// ─── Collection References ────────────────────────────────────
const COLLECTIONS = {
  tournaments: 'tournaments',
  registrations: 'registrations',
  chatMessages: 'chatMessages',
  results: 'results',
  counters: 'counters'  // For auto-increment IDs
};

// ─── Auto-Increment ID Helper ─────────────────────────────────
// Uses a `counters` collection with a document per entity type
async function getNextId(entityName) {
  const counterRef = db.collection(COLLECTIONS.counters).doc(entityName);
  
  const result = await db.runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let nextId;
    
    if (!counterDoc.exists) {
      nextId = 1;
      transaction.set(counterRef, { current: nextId });
    } else {
      nextId = counterDoc.data().current + 1;
      transaction.update(counterRef, { current: nextId });
    }
    
    return nextId;
  });
  
  return result;
}

module.exports = {
  admin,
  db,
  ADMIN_CREDENTIALS,
  JWT_SECRET,
  COLLECTIONS,
  getNextId
};
