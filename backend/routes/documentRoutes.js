const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for document upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads/patient_documents");
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `patient_${req.body.patientId}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
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

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// Upload patient document
router.post("/upload", upload.single("document"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const {
      patientId,
      documentType,
      documentDate,
      hospitalName,
      notes
    } = req.body;

    if (!patientId || !documentType || !documentDate) {
      return res.status(400).json({
        success: false,
        message: "Patient ID, document type, and date are required"
      });
    }

    const filePath = `/uploads/patient_documents/${req.file.filename}`;
    const documentName = req.file.originalname;

    const sql = `
      INSERT INTO patient_documents 
      (patient_id, document_type, document_name, file_path, document_date, hospital_name, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [patientId, documentType, documentName, filePath, documentDate, hospitalName, notes],
      (err, result) => {
        if (err) {
          console.error("Error saving document:", err);
          return res.status(500).json({
            success: false,
            message: "Error saving document to database"
          });
        }

        res.status(201).json({
          success: true,
          message: "Document uploaded successfully",
          documentId: result.insertId,
          filePath: filePath
        });
      }
    );

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error uploading document"
    });
  }
});

// Get patient's documents
router.get("/patient/:patientId", (req, res) => {
  const { patientId } = req.params;

  const sql = `
    SELECT 
      id,
      document_type,
      document_name,
      file_path,
      document_date,
      hospital_name,
      notes,
      uploaded_at
    FROM patient_documents
    WHERE patient_id = ?
    ORDER BY document_date DESC, uploaded_at DESC
  `;

  db.query(sql, [patientId], (err, results) => {
    if (err) {
      console.error("Error fetching documents:", err);
      return res.status(500).json({
        success: false,
        message: "Error fetching documents"
      });
    }

    res.json({
      success: true,
      data: results,
      count: results.length
    });
  });
});

// Delete document
router.delete("/:documentId", (req, res) => {
  const { documentId } = req.params;

  // First get file path
  const getFileSql = "SELECT file_path FROM patient_documents WHERE id = ?";
  
  db.query(getFileSql, [documentId], (err, results) => {
    if (err) {
      console.error("Error fetching document:", err);
      return res.status(500).json({
        success: false,
        message: "Error fetching document"
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    const filePath = path.join(__dirname, "..", results[0].file_path);

    // Delete from database
    const deleteSql = "DELETE FROM patient_documents WHERE id = ?";
    
    db.query(deleteSql, [documentId], (deleteErr) => {
      if (deleteErr) {
        console.error("Error deleting document:", deleteErr);
        return res.status(500).json({
          success: false,
          message: "Error deleting document"
        });
      }

      // Delete file from storage
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (fileErr) {
          console.error("Error deleting file:", fileErr);
        }
      }

      res.json({
        success: true,
        message: "Document deleted successfully"
      });
    });
  });
});

module.exports = router;