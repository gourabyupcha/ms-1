const transformServiceData = require("../utils/parseData");
const axios = require('axios')
const { firestore } = require('../config/firebase');



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
    userRef = firestore.collection('users').doc(paramUid);
    await userRef.set(userData);

    // Prepare transformed data for service microservice
    const transformedService = transformServiceData(userData, userRef.id);

    // Call external microservice to create the service
    const serviceResponse = await axios.post(
      `${process.env.MS_2_URI}/api/services`,
      transformedService
    );

    // Return success payload
    return {
      id: userRef.id,
      ...userData,
      serviceResponse: serviceResponse.data,
    };
  } catch (error) {
    // Rollback user creation if service creation fails
    if (userRef) {
      await firestore.collection('users').doc(userRef.id).delete().catch(() => {
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
    const userRef = firestore.collection('users').doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(doc.data());
  } catch (error) {
    next(error);
  }
};