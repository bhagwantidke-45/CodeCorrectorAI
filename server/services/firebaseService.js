import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

let db = null;

const initFirebase = () => {
  if (admin.apps.length > 0) {
    db = admin.firestore();
    return;
  }
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (!process.env.FIREBASE_PROJECT_ID || !privateKey || !process.env.FIREBASE_CLIENT_EMAIL) {
      console.warn('⚠️  Firebase credentials missing — Firestore logging disabled.');
      return;
    }
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    db = admin.firestore();
    console.log('✅ Firebase Admin initialized');
  } catch (err) {
    console.warn('⚠️  Firebase init failed:', err.message);
  }
};

initFirebase();

const safeLog = async (collection, data) => {
  if (!db) return;
  try {
    await db.collection(collection).add({ ...data, timestamp: admin.firestore.FieldValue.serverTimestamp() });
  } catch (err) {
    console.warn(`Firestore log failed [${collection}]:`, err.message);
  }
};

export const logActivity = (userId, action, meta = {}) =>
  safeLog('activityLogs', { userId: userId?.toString() || 'guest', action, ...meta });

export const logApiUsage = (endpoint, userId, tokensUsed = 0, language = '') =>
  safeLog('apiUsage', { endpoint, userId: userId?.toString() || 'guest', tokensUsed, language });

export const logError = (error, context = {}) =>
  safeLog('errorLogs', { message: error.message, stack: error.stack?.substring(0, 500), ...context });

export const updateAnalytics = async (metric, value = 1) => {
  if (!db) return;
  try {
    const ref = db.collection('analytics').doc('global');
    await ref.set({ [metric]: admin.firestore.FieldValue.increment(value), lastUpdated: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  } catch (err) {
    console.warn('Analytics update failed:', err.message);
  }
};

export const getGlobalAnalytics = async () => {
  if (!db) return null;
  try {
    const doc = await db.collection('analytics').doc('global').get();
    return doc.exists ? doc.data() : null;
  } catch {
    return null;
  }
};

export const getRecentActivity = async (limit = 20) => {
  if (!db) return [];
  try {
    const snap = await db.collection('activityLogs').orderBy('timestamp', 'desc').limit(limit).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
};
