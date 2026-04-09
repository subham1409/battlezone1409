/**
 * Data Store — Firestore Bridge
 * 
 * This file now re-exports from firebase.js for backward compatibility.
 * All data is persisted in Firebase Firestore.
 */

const { db, ADMIN_CREDENTIALS, JWT_SECRET, COLLECTIONS, getNextId } = require('../firebase');

module.exports = {
  db,
  ADMIN_CREDENTIALS,
  JWT_SECRET,
  COLLECTIONS,
  getNextId
};
