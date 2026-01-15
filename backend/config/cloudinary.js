const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'patient_documents', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'gif'],
    resource_type: 'auto', // Automatically detect file type
    public_id: (req, file) => `patient_${req.body.patientId}_${Date.now()}` // Unique filename
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only images (JPEG, JPG, PNG, GIF) and PDF files are allowed!"));
  }
};