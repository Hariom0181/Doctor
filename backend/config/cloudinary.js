const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

// ==============================
// Cloudinary Configuration
// ==============================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ==============================
// Profile Image Storage
// ==============================
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "patient_profiles",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
    public_id: (req, file) =>
      `patient_${req.params.patientId || "unknown"}_${Date.now()}`
  },
});

const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// ==============================
// Document Storage
// ==============================
const documentStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "patient_documents",
    resource_type: "auto",
    type: "upload",
    access_mode: "public",  // CHANGE THIS
    public_id: (req, file) =>
      `patient_${req.body.patientId || "unknown"}_${Date.now()}`
  },
});

const uploadDocument = multer({
  storage: documentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ==============================
// Exports
// ==============================
module.exports = {
  cloudinary,
  uploadProfile,
  uploadDocument,
};
