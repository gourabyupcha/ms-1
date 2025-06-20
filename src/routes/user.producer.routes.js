const express = require('express');
const multer = require('multer')
const router = express.Router();
const producerController = require('../controllers/user.producer.controller');
const { authenticateFirebaseToken } = require('../middleware/authentication');


const upload = multer({ storage: multer.memoryStorage() }); // no disk!
  
router.get('/:id', authenticateFirebaseToken, producerController.getProducerHandler);
router.post('/:id', authenticateFirebaseToken, producerController.createProducerHandler)
router.post("/upload/:id", authenticateFirebaseToken, upload.single("file"), producerController.hanldeProducerFiles)

module.exports = router;
