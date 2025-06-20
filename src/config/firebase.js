const admin = require('firebase-admin');

// You can use env variables or a service account key JSON
const serviceAccount = require('../../fsa.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'fcmtest-7bb83.firebasestorage.app'
});

const firestore = admin.firestore();
const bucket = admin.storage().bucket();

module.exports = { admin, firestore, bucket };
