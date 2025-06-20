const admin = require('firebase-admin');
require('dotenv').config()

exports.authenticateFirebaseToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
        // 🔹 Mock token support in development
        if (process.env.NODE_ENV === 'development' && idToken === 'mock-dev-token') {
            req.firebaseUid = req.params.id || req.headers['x-mock-uid']; // or use req.headers['x-mock-uid'] if you want dynamic
            return next();
        }

        // 🔐 Real token verification in other environments
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.firebaseUid = decodedToken.uid;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
