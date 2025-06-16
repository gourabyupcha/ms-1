const { firestore } = require('../config/firebase');
const transformServiceData = require('../utils/parseData')

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


exports.addUser = async(req, res, next) => {
  try {
    const userData = req.body;
    
    console.log(transformServiceData(userData))

    // const serviceResponse = await axios.post(`${SERVICE_API_URL}`, transformedService);
    // const userRef = await firestore.collection('users').add(userData);
    return res.status(201).json({ id: '123', ...userData });

  } catch (error) {
    next(error);
  }
}