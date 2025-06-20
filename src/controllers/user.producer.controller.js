const producerServices = require('../services/user.producer.service');
const fs = require("fs");
const path = require("path");



exports.getProducerHandler = async (req, res) => {
  try {
    const result = await producerServices.getUser(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.createProducerHandler = async (req, res) => {
  const userData = req.body;
  const paramUid = req.params.id;
  const authenticatedUid = req.firebaseUid;

  try {
    const result = await producerServices.createUser(userData, paramUid, authenticatedUid);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

function formatBytes(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(2)} ${units[i]}`;
}

exports.hanldeProducerFiles = async(req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded." });

    const originalBuffer = file.buffer;
    const originalSize = originalBuffer.length;

    const result = await producerServices.compressImage(originalBuffer, file.originalname);

    res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
