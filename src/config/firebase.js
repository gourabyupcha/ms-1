const admin = require('firebase-admin');

// You can use env variables or a service account key JSON
const serviceAccount = require('../../fsa.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const firestore = admin.firestore();

module.exports = { admin, firestore };
