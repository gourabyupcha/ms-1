const transformServiceData = require('../utils/parseData');
const axios = require('axios');
const { firestore } = require('../config/firebase');
require('dotenv').config();
const { compressionLogic } = require('../jobs/img_compresser');
const { uploadToFirebase } = require('../jobs/firebaseUpload');

const collection = process.env.PRODUCER_COLLECTION;

exports.createUser = async (userData, paramUid, authenticatedUid) => {
  // UID check for security
  if (paramUid !== authenticatedUid) {
    const error = new Error('UID mismatch. Forbidden.');
    error.status = 403;
    throw error;
  }

  let userRef;
  try {
    // Create user document in Firestore
    userRef = await firestore.collection(collection).doc(paramUid).set(userData);

    // Prepare transformed data for service microservice
    const transformedService = transformServiceData(userData, paramUid);
    const serviceResponse = await axios.post(`${process.env.MS_2_URI}`, transformedService);

    // Return success payload
    return {
      id: paramUid,
      ...userData,
      serviceResponse: serviceResponse.data,
    };
  } catch (error) {
    // Rollback user creation if service creation fails
    if (userRef) {
      await firestore
        .collection(collection)
        .doc(userRef.id)
        .delete()
        .catch(() => {
          console.error('Failed to rollback user creation.');
        });
    }

    // Attach HTTP status if not present
    if (!error.status) error.status = 500;

    error.message = `Failed to create user and service: ${error.message}`;
    throw error;
  }
};

exports.getUser = async (uid) => {
  try {
    const userRef = firestore.collection(collection).doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(doc.data());
  } catch (error) {
    next(error);
  }
};

exports.compressImage = async (buffer, originalName) => {
  try {
    const result = await compressionLogic(buffer, originalName);
    const { resbuffer, originalSize, compressedSize, format } = result;
    const firebaseFile = await uploadToFirebase(
      resbuffer,
      originalName,
      format,
    );
    return {
      originalSize,
      compressedSize,
      url: firebaseFile.publicUrl,
      filename: firebaseFile.filename,
    }
  } catch (err) {
    console.error('Compression failed:', err);
    throw err;
  }
};
