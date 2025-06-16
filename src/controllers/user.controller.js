const { firestore } = require('../config/firebase');
const transformServiceData = require('../utils/parseData')
const axios = require('axios')

// GET /api/users/:id
exports.getUser = async (req, res, next) => {
  try {
    const userRef = firestore.collection('users').doc(req.params.id);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(doc.data());
  } catch (error) {
    next(error);
  }
};


exports.addUser = async (req, res, next) => {
  // add this as a middleware -> authenticateFirebaseToken
  try {
    const userData = req.body
    const paramUid = req.params.id;
    // const authenticatedUid = req.firebaseUid;

    // if (paramUid !== authenticatedUid) {
    //   return res.status(403).json({ error: 'UID mismatch. Forbidden.' });
    // }

    const userRef = await firestore.collection('users').doc(paramUid).set(userData);
    const transformedService = transformServiceData(userData, userRef.id);

    const serviceResponse = await axios.post(`${process.env.MS_2_URI}/api/services`, transformedService);

    return res.status(201).json({
      id: userRef.id,
      ...userData,
      serviceResponse: serviceResponse.data  // include only the data part
    });
  } catch (error) {
    // console.error('Error occurred during user creation:', error);
    // // Optional: Clean up (e.g. delete user record if service creation fails)
    // if (userRef) {
    //   await firestore.collection('users').doc(userRef.id).delete();
    // }
    // return res.status(500).json({ message: 'Failed to create user and service.', error: error.message });
    next(error)
  }

}