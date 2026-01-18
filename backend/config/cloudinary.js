const { v2: cloudinary } = require("cloudinary");
const CloudinaryStorage = require('multer-storage-cloudinary');
const multer = require("multer");

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ==============================
// Profile Image Storage
// ==============================
const profileStorage = CloudinaryStorage({
  cloudinary: cloudinary,
  folder: "patient_profiles",
  allowedFormats: ["jpg", "jpeg", "png"],
  transformation: [{ width: 500, height: 500, crop: "limit" }],
  filename: function (req, file, cb) {
    cb(null, `patient_${req.params.patientId || 'unknown'}_${Date.now()}`);
  }
});

const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ==============================
// Document Storage
// ==============================
const documentStorage = CloudinaryStorage({
  cloudinary: cloudinary,
  folder: "patient_documents",
  allowedFormats: ["jpg", "jpeg", "png", "pdf", "gif"],
  resource_type: "auto",
  filename: function (req, file, cb) {
    cb(null, `patient_${req.body.patientId || 'unknown'}_${Date.now()}`);
  }
});

const uploadDocument = multer({
  storage: documentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = {
  cloudinary,
  uploadProfile,
  uploadDocument
};