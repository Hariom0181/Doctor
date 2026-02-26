const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const db = require("../config/db");
const jwt = require("jsonwebtoken");
const CloudinaryStorage = require('multer-storage-cloudinary').CloudinaryStorage;
const { uploadProfile } = require("../config/cloudinary");
const bcrypt = require("bcrypt");

const authenticatePatient = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided."
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || "your-fallback-secret-key-change-in-production";
    const decoded = jwt.verify(token, jwtSecret);
    // ✅ FIXED: Set req.patient instead of req.doctor
    if (decoded.type !== 'patient') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Patient credentials required."
      });
    }
    req.patient = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
};
const authenticateDoctor = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided."
    });
  }
  try {
    const jwtSecret = process.env.JWT_SECRET || "your-fallback-secret-key-change-in-production";
    const decoded = jwt.verify(token, jwtSecret);
    if (decoded.type !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Doctor credentials required."
      });
    }
    req.doctor = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
};

// Doctor view patient details
router.get('/:patientId/details', authenticateDoctor, (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.doctor.id;

    console.log('🔍 Checking link for - Patient:', patientId, 'Doctor:', doctorId);

    const checkLinkSql = `
      SELECT id FROM patient_doctors 
      WHERE patient_id = ? AND doctor_id = ? AND status = 'active'
    `;

    db.query(checkLinkSql, [patientId, doctorId], (err, linkResults) => {
      console.log('📊 Link query result:', linkResults, 'Error:', err);
      
      if (err || linkResults.length === 0) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const sql = `
        SELECT 
          id, firstName, lastName, email, phone, dateOfBirth, gender,
          address, city, state, pincode, emergencyContact, emergencyPhone,
          bloodGroup, allergies, medicalHistory, created_at, profile_img
        FROM patients 
        WHERE id = ?
      `;

      db.query(sql, [patientId], (err, results) => {
        if (err || results.length === 0) {
          return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        res.json({
          success: true,
          data: results[0]
        });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// Get patient's next checkup date from medical records
// Get patient's next checkup date from medical records
router.get('/:patientId/next-checkup', authenticatePatient, (req, res) => {
  try {
    const { patientId } = req.params;

    const sql = `
    SELECT 
      mr.next_checkup_date,
      DATEDIFF(mr.next_checkup_date, CURDATE()) as days_remaining,
      COALESCE(CONCAT(d.first_name, ' ', d.last_name), 'Doctor') as doctor_name,
      d.specialization,
      mr.examination_type
    FROM medical_records mr
    LEFT JOIN doctors d ON mr.doctor_id = d.id
    WHERE mr.patient_id = ? AND mr.next_checkup_date IS NOT NULL
    ORDER BY mr.next_checkup_date DESC
    LIMIT 1
  `;

    db.query(sql, [patientId], (err, results) => {
      if (err) {
        console.error('Error:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching checkup'
        });
      }

      if (results.length === 0) {
        return res.json({
          success: true,
          data: null,
          message: 'No upcoming checkup'
        });
      }

      const checkup = results[0];
      res.json({
        success: true,
        data: {
          date: checkup.next_checkup_date,
          daysRemaining: checkup.days_remaining,
          doctorName: `${checkup.first_name} ${checkup.last_name}`,
          specialization: checkup.specialization,
          examinationType: checkup.examination_type
        }
      });
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});
// Configure multer for profile image upload

// Upload patient profile image
router.post(
  "/:patientId/upload-profile",
  authenticatePatient,
  (req, res, next) => {
    uploadProfile.single("profileImage")(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "File upload failed"
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const authenticatedPatientId = req.patient.id;

      // Security: Patient can only upload their own profile
      if (patientId != authenticatedPatientId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only upload your own profile image"
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded"
        });
      }

      const cloudinaryUrl = req.file.path;
      const sql = "UPDATE patients SET profile_img = ? WHERE id = ?";

      db.query(sql, [cloudinaryUrl, patientId], (err) => {
        if (err) {
          console.error("Error updating profile image:", err);
          return res.status(500).json({
            success: false,
            message: "Error updating profile image"
          });
        }

        res.json({
          success: true,
          message: "Profile image uploaded successfully",
          profileImagePath: cloudinaryUrl
        });
      });
    } catch (error) {
      console.error("Profile upload failed:", error);
      res.status(500).json({
        success: false,
        message: "Profile upload failed"
      });
    }
  }
);

// Save push notification token
router.post('/save-push-token', authenticatePatient, (req, res) => {
  try {
    const { pushToken } = req.body;
    const patientId = req.patient.id;

    if (!pushToken) {
      return res.status(400).json({
        success: false,
        message: 'Push token is required'
      });
    }

    const sql = 'UPDATE patients SET push_token = ? WHERE id = ?';
    
    db.query(sql, [pushToken, patientId], (err, result) => {
      if (err) {
        console.error('Error saving push token:', err);
        return res.status(500).json({
          success: false,
          message: 'Error saving push token'
        });
      }

      res.json({
        success: true,
        message: 'Push token saved successfully'
      });
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


// Send test notification
router.post('/send-test-notification', authenticatePatient, async (req, res) => {
  try {
    const patientId = req.patient.id;
    const { title, body } = req.body;

    await sendNotificationToPatient(
      patientId, 
      title || 'Test Notification',
      body || 'This is a test push notification'
    );

    res.json({
      success: true,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send notification',
      error: error.message 
    });
  }
});

// Update medical record
router.put('/medical-records/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    const {
      examinationType,
      diagnosis,
      prescription,
      nextCheckupDate,
      additionalNotes
    } = req.body;

    const updateSql = `
      UPDATE medical_records 
      SET 
        examination_type = ?,
        diagnosis = ?,
        prescription = ?,
        next_checkup_date = ?,
        additional_notes = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    db.query(
      updateSql,
      [examinationType, diagnosis, prescription, nextCheckupDate, additionalNotes, recordId],
      (err, result) => {
        if (err) {
          console.error('Error updating medical record:', err);
          return res.status(500).json({
            success: false,
            message: 'Error updating medical record'
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            message: 'Medical record not found'
          });
        }

        res.json({
          success: true,
          message: 'Medical record updated successfully'
        });
      }
    );
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get single medical record by ID
router.get('/medical-records/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;

    const sql = `
      SELECT 
        mr.*,
        CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
        d.specialization AS doctor_specialization,
        d.current_hospital,
        CONCAT(p.firstName, ' ', p.lastName) AS patient_name
      FROM medical_records mr
      LEFT JOIN doctors d ON mr.doctor_id = d.id
      LEFT JOIN patients p ON mr.patient_id = p.id
      WHERE mr.id = ?
    `;

    db.query(sql, [recordId], (err, results) => {
      if (err) {
        console.error('Error fetching medical record:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching medical record'
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Medical record not found'
        });
      }

      res.json({
        success: true,
        data: results[0]
      });
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});
// Get profile image endpoint
router.get("/:patientId/profile-image", (req, res) => {
  const { patientId } = req.params;

  const sql = "SELECT profile_img FROM patients WHERE id = ?";

  db.query(sql, [patientId], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error fetching profile"
      });
    }

    if (results.length === 0 || !results[0].profile_img) {
      return res.status(404).json({
        success: false,
        message: "No profile image"
      });
    }

    res.json({
      success: true,
      profileImagePath: results[0].profile_img // Already Cloudinary URL
    });
  });
});
// Patient Registration API
router.post(
  "/register",
  [
    // Email validation
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),

    // Phone validation
    body("phone")
      .isMobilePhone("en-IN")
      .withMessage("Valid Indian phone number is required"),

    // Date of birth validation
    body("dateOfBirth")
      .isISO8601()
      .toDate()
      .withMessage("Valid date of birth is required (YYYY-MM-DD format)"),

    // Gender validation
    body("gender")
      .notEmpty()
      .trim()
      .isIn(['male', 'female', 'other', 'Male', 'Female', 'Other'])
      .withMessage("Gender is required and must be male, female, or other"),

    // Pincode validation
    body("pincode")
      .matches(/^\d{6}$/)
      .withMessage("Pincode must be exactly 6 digits"),

    // Password validation
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6, max: 128 })
      .withMessage("Password must be between 6 and 128 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("Password must contain at least one lowercase letter, one uppercase letter, and one number"),

    // Confirm password validation - FIXED
    body("confirmPassword")
      .notEmpty()
      .withMessage("Please confirm your password")
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords do not match');
        }
        return true;
      }),

    // Optional: Add validation for required fields
    body("firstName")
      .notEmpty()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("First name is required and must be between 2-50 characters"),

    body("lastName")
      .notEmpty()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Last name is required and must be between 2-50 characters"),
  ],
  (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array()); // Debug log
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      pincode,
      emergencyContact,
      emergencyPhone,
      bloodGroup,
      allergies,
      medicalHistory,
      password,
    } = req.body;

    // Check if email already exists
    const checkEmailSql = "SELECT email FROM patients WHERE email = ?";
    db.query(checkEmailSql, [email], async (err, results) => {
      if (err) {
        console.error("Database error during email check:", err);
        return res.status(500).json({
          success: false,
          message: "Database error"
        });
      }

      if (results.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Email already registered"
        });
      }

      // Insert new patient
      const sql = `
        INSERT INTO patients
        (firstName, lastName, email, phone, dateOfBirth, gender, address, city, state, pincode,
        emergencyContact, emergencyPhone, bloodGroup, allergies, medicalHistory, password)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        sql,
        [
          firstName,
          lastName,
          email,
          phone,
          dateOfBirth,
          gender,
          address,
          city,
          state,
          pincode,
          emergencyContact,
          emergencyPhone,
          bloodGroup,
          allergies,
          medicalHistory,
          await bcrypt.hash(password, 12), // Note: In production, hash this password before storing!
        ],
        (err, result) => {
          if (err) {
            console.error("Database error during insertion:", err);
            return res.status(500).json({
              success: false,
              message: "Database error during registration"
            });
          }

          res.status(201).json({
            success: true,
            message: "Patient registered successfully!",
            patientId: result.insertId
          });


        }
      );
    });
  }
);
////////dont see the above one keep it same just see the down one to verify 
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),

    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 1 })
      .withMessage("Password cannot be empty"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Login validation errors:", errors.array());
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // 1. Check if patient exists
    const sql = "SELECT * FROM patients WHERE email = ?";
    db.query(sql, [email.toLowerCase()], async (err, results) => {
      if (err) {
        console.error("Database error during login:", err);
        return res.status(500).json({
          success: false,
          message: "Database error during login"
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password"
        });
      }

      const patient = results[0];

      // 2. Compare password using bcrypt ✅ FIXED
      try {
        const isPasswordValid = await bcrypt.compare(password, patient.password);
        
        if (!isPasswordValid) {
          return res.status(401).json({
            success: false,
            message: "Invalid email or password"
          });
        }

        // 3. Update last login time
        const updateLastLoginSql = "UPDATE patients SET lastLogin = NOW() WHERE id = ?";
        db.query(updateLastLoginSql, [patient.id], (updateErr) => {
          if (updateErr) {
            console.error("Error updating last login:", updateErr);
          }

          // 4. Generate JWT token
          const jwtSecret = process.env.JWT_SECRET || "your-fallback-secret-key-change-in-production";
          const token = jwt.sign(
            {
              id: patient.id,
              email: patient.email,
              type: 'patient'
            },
            jwtSecret,
            { expiresIn: "24h" }
          );

          // 5. Send successful response
          res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            patient: {
              id: patient.id,
              firstName: patient.firstName,
              lastName: patient.lastName,
              email: patient.email,
              phone: patient.phone,
              address: patient.address,
            },
          });
        });
      } catch (compareErr) {
        console.error("Password comparison error:", compareErr);
        return res.status(500).json({
          success: false,
          message: "Server error during authentication"
        });
      }
    });
  }
);

// Get all available doctors for patient selection
router.get("/available-doctors", authenticatePatient, (req, res) => {
  // consol.log("Patient_id",req.patient.id);
  const sql = `
    SELECT 
      id, 
      first_name, 
      last_name, 
      specialization, 
      current_hospital,
      consultation_fee
    FROM doctors 
    ORDER BY first_name, last_name
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Database error fetching available doctors:", err);
      return res.status(500).json({
        success: false,
        message: "Database error fetching available doctors",
        details: err.message
      });
    }

    const transformedDoctors = results.map(doctor => ({
      id: doctor.id,
      name: `${doctor.first_name} ${doctor.last_name}`,
      specialization: doctor.specialization,
      hospital: doctor.current_hospital,
      consultationFee: doctor.consultation_fee
    }));

    res.json({
      success: true,
      message: "Available doctors retrieved successfully",
      data: transformedDoctors,
      count: transformedDoctors.length
    });
  });
});

// Update patient's doctor relationship
// Update patient's doctor relationship
// Update patient's doctor relationship - FIXED VERSION
// Update patient's doctor relationship - ONE DOCTOR PER PATIENT VERSION
// Update patient's doctor relationship - HANDLES REACTIVATION
router.post("/update-doctor", authenticatePatient, (req, res) => {
  const patientId = req.patient.id;
  const { doctorId } = req.body;

  if (!patientId || !doctorId) {
    return res.status(400).json({
      success: false,
      message: "Patient ID and doctor ID are required"
    });
  }

  // First, check if this patient-doctor relationship already exists (active or inactive)
  const checkExistingSql = "SELECT * FROM patient_doctors WHERE patient_id = ? AND doctor_id = ?";

  db.query(checkExistingSql, [patientId, doctorId], (checkErr, existingRelation) => {
    if (checkErr) {
      console.error("Error checking existing relationship:", checkErr);
      return res.status(500).json({
        success: false,
        message: "Database error checking relationship"
      });
    }

    // Deactivate all other doctor relationships for this patient
    const deactivateOthersSql = "UPDATE patient_doctors SET status = 'inactive' WHERE patient_id = ? AND doctor_id != ? AND status = 'active'";

    db.query(deactivateOthersSql, [patientId, doctorId], (deactivateErr) => {
      if (deactivateErr) {
        console.error("Error deactivating other relationships:", deactivateErr);
        return res.status(500).json({
          success: false,
          message: "Database error updating relationships"
        });
      }

      if (existingRelation.length > 0) {
        // Relationship exists - reactivate it
        const reactivateSql = `
          UPDATE patient_doctors 
          SET status = 'active', linked_date = NOW(), notes = 'Doctor reactivated by patient selection'
          WHERE patient_id = ? AND doctor_id = ?
        `;

        db.query(reactivateSql, [patientId, doctorId], (reactivateErr) => {
          if (reactivateErr) {
            console.error("Error reactivating relationship:", reactivateErr);
            return res.status(500).json({
              success: false,
              message: "Database error reactivating relationship"
            });
          }

          res.json({
            success: true,
            message: "Doctor relationship reactivated successfully",
            action: "reactivated"
          });
        });
      } else {
        // No existing relationship - create new one
        const insertSql = `
          INSERT INTO patient_doctors 
          (patient_id, doctor_id, linked_date, status, notes, created_at) 
          VALUES (?, ?, NOW(), 'active', 'Doctor selected by patient', NOW())
        `;

        db.query(insertSql, [patientId, doctorId], (insertErr) => {
          if (insertErr) {
            console.error("Error creating new relationship:", insertErr);
            return res.status(500).json({
              success: false,
              message: "Database error creating relationship"
            });
          }

          res.json({
            success: true,
            message: "Doctor relationship created successfully",
            action: "created"
          });
        });
      }
    });
  });
});



// Get Patient's Linked Doctors API
router.get(
  "/linked-doctors",
  authenticatePatient,
  async (req, res) => {
    try {
      const patientId = req.patient.id;
      // Validate patient ID
      if (!patientId || isNaN(patientId)) {
        return res.status(400).json({
          success: false,
          message: "Valid patient ID is required"
        });
      }

      // Check if patient exists
      const checkPatientSql = "SELECT id FROM patients WHERE id = ?";
      db.query(checkPatientSql, [patientId], (err, patientResults) => {
        if (err) {
          console.error("Database error during patient check:", err);
          return res.status(500).json({
            success: false,
            message: "Database error during patient verification"
          });
        }

        if (patientResults.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Patient not found"
          });
        }

        // Fetch linked doctors for the patient
        const getLinkedDoctorsSql = `
          SELECT 
            d.id,
            d.first_name,
            d.last_name,
            d.specialization,
            d.medical_license_number,
            d.current_hospital,
            d.consultation_fee,
            pd.linked_date,
            pd.status as relationship_status,
            pd.notes as relationship_notes
          FROM patient_doctors pd
          INNER JOIN doctors d ON pd.doctor_id = d.id
          WHERE pd.patient_id = ? AND pd.status = 'active'
          ORDER BY pd.linked_date DESC
        `;

        db.query(getLinkedDoctorsSql, [patientId], (doctorsErr, doctorsResults) => {
          if (doctorsErr) {
            console.error("Database error during linked doctors fetch:", doctorsErr);
            console.error("SQL Query:", getLinkedDoctorsSql);
            console.error("Patient ID:", patientId);
            return res.status(500).json({
              success: false,
              message: "Database error during linked doctors retrieval",
              details: doctorsErr.message
            });
          }

          // Transform the data to match frontend expectations
          const transformedDoctors = doctorsResults.map(doctor => ({
            id: doctor.id,
            name: `${doctor.first_name} ${doctor.last_name}`,
            specialization: doctor.specialization,
            licenseNumber: doctor.medical_license_number,
            hospital: doctor.current_hospital,
            consultationFee: doctor.consultation_fee,
            linkedDate: doctor.linked_date,
            relationshipStatus: doctor.relationship_status,
            relationshipNotes: doctor.relationship_notes
          }));

          res.status(200).json({
            success: true,
            message: "Linked doctors retrieved successfully",
            data: transformedDoctors,
            count: transformedDoctors.length
          });

        });
      });

    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
);
// Add this to your patientRoutes.js file
// getting own specific health metrics 
router.get("/health-metrics", authenticatePatient, async (req, res) => {
  try {
    const patientId = req.patient.id;

    // Get from BOTH tables
    const iotQuery = `
      SELECT 
        id, metric_type, value as value_numeric, unit, 
        'normal' as status, DATE(reading_timestamp) as recorded_date,
        TIME(reading_timestamp) as recorded_time, 
        'IoT Device' as notes, reading_timestamp as created_at
      FROM patient_health_metrics 
      WHERE patient_id = ? AND status = 'confirmed'
    `;

    const manualQuery = `
      SELECT 
        id, metric_type, value_systolic, value_diastolic, value_numeric,
        unit, status, recorded_date, recorded_time, notes, created_at
      FROM health_metrics 
      WHERE patient_id = ?
    `;

    // Execute both queries
    db.query(iotQuery, [patientId], (err1, iotResults) => {
      db.query(manualQuery, [patientId], (err2, manualResults) => {
        if (err1 || err2) {
          return res.status(500).json({ success: false, message: "Database error" });
        }

        // Combine and group by metric type (latest only)
        const allMetrics = [...iotResults, ...manualResults];
        const groupedMetrics = {};

        allMetrics.forEach(metric => {
          if (!groupedMetrics[metric.metric_type]) {
            groupedMetrics[metric.metric_type] = metric;
          }
        });

        // Format for frontend
        const formattedMetrics = Object.values(groupedMetrics).map(metric => {
          let displayValue = "";
          let label = "";
          
          switch (metric.metric_type) {
            case "blood_pressure":
              displayValue = `${metric.value_systolic}/${metric.value_diastolic}`;
              label = "Blood Pressure";
              break;
            case "temperature":
              displayValue = `${metric.value_numeric} ${metric.unit || '°C'}`;
              label = "Temperature";
              break;
            case "blood_sugar":
              displayValue = `${metric.value_numeric} ${metric.unit || 'mg/dL'}`;
              label = "Blood Sugar";
              break;
            case "weight":
              displayValue = `${metric.value_numeric} ${metric.unit || 'kg'}`;
              label = "Weight";
              break;
            case "heart_rate":
              displayValue = `${metric.value_numeric} ${metric.unit || 'bpm'}`;
              label = "Heart Rate";
              break;
            default:
              displayValue = metric.value_numeric ? `${metric.value_numeric} ${metric.unit || ''}`.trim() : "";
              label = metric.metric_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          }

          return {
            id: metric.id,
            label,
            value: displayValue,
            status: metric.status || "normal",
            lastChecked: metric.recorded_date,
            notes: metric.notes
          };
        });

        res.json({
          success: true,
          message: "Health metrics retrieved successfully",
          data: formattedMetrics,
          patientId
        });
      });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get('/details', authenticatePatient, (req, res) => {  try {
  const patientId = req.patient.id;
    const sql = `
      SELECT 
        id,
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth,
        gender,
        address,
        city,
        state,
        pincode,
        emergencyContact,
        emergencyPhone,
        bloodGroup,
        allergies,
        medicalHistory,
        created_at,
        profile_img
      FROM patients 
      WHERE id = ?
    `;

    db.query(sql, [patientId], (err, results) => {
      if (err) {
        console.error('Database error fetching patient details:', err);
        return res.status(500).json({
          success: false,
          message: 'Database error fetching patient details'
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      const patient = results[0];

      // Calculate age from dateOfBirth
      const age = patient.dateOfBirth
        ? Math.floor((new Date() - new Date(patient.dateOfBirth)) / 31557600000)
        : null;

      res.json({
        success: true,
        message: 'Patient details retrieved successfully',
        data: {
          ...patient,
          age,
          name: `${patient.firstName} ${patient.lastName}`
        }
      });
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});
router.get('/:patientId/medical-records', authenticatePatient, async (req, res) => {
  try {
    const { patientId } = req.params;
    const authenticatedPatientId = req.patient.id; // From token

    // Security check: ensure patient can only access their own records
    if (patientId != authenticatedPatientId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own medical records'
      });
    }

    // console.log(`Fetching medical records for authenticated patient: ${patientId}`);

    // Query to get medical records with doctor information
    const query = `
      SELECT 
        mr.id,
        mr.patient_id,
        mr.doctor_id,
        mr.examination_type,
        mr.diagnosis,
        mr.prescription,
        mr.next_checkup_date,
        mr.additional_notes,
        mr.created_at,
        mr.updated_at,
        CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
        d.specialization AS doctor_specialization,
        d.current_hospital
      FROM medical_records mr
      LEFT JOIN doctors d ON mr.doctor_id = d.id
      WHERE mr.patient_id = ?
      ORDER BY mr.created_at DESC
    `;

    // Use db.query() to match your existing pattern
    db.query(query, [patientId], (err, results) => {
      if (err) {
        console.error("Database error during medical records fetch:", err);
        return res.status(500).json({
          success: false,
          message: "Database error during medical records retrieval"
        });
      }

      // console.log("Raw medical records from database:", results);
      // console.log("Number of medical records:", results.length);

      // If no records found, return empty array but with success
      if (results.length === 0) {
        console.log("No medical records found for patient:", patientId);
        return res.json({
          success: true,
          message: "No medical records found for this patient",
          data: [],
          patientId: patientId
        });
      }

      // Transform the data to match the expected format
      // Transform the data to match the expected format
      const transformedRecords = results.map(record => ({
        id: record.id,
        patientId: record.patient_id,
        doctorId: record.doctor_id,
        doctorName: record.doctor_name,
        doctorSpecialization: record.doctor_specialization,
        currentHospital: record.current_hospital, // ✅ Add this line
        examinationType: record.examination_type,
        diagnosis: record.diagnosis,
        prescription: record.prescription,
        nextCheckupDate: record.next_checkup_date,
        additionalNotes: record.additional_notes,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      }));

      // console.log("Transformed medical records for frontend:", transformedRecords);

      res.json({
        success: true,
        message: "Medical records retrieved successfully",
        data: transformedRecords,
        count: results.length,
        patientId: patientId
      });
    });

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Optional: GET specific medical record by ID
router.get('/:patientId/medical-records/:recordId', authenticatePatient, async (req, res) => {
  try {
    const { patientId, recordId } = req.params;
    const authenticatedPatientId = req.patient.id; // From token

    // Security check: ensure patient can only access their own records
    if (patientId != authenticatedPatientId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own medical records'
      });
    }

    console.log(`Fetching medical record ${recordId} for authenticated patient ${patientId}`);

    const query = `
      SELECT 
        mr.id,
        mr.patient_id,
        mr.doctor_id,
        mr.examination_type,
        mr.diagnosis,
        mr.prescription,
        mr.next_checkup_date,
        mr.additional_notes,
        mr.created_at,
        mr.updated_at,
        CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
        d.specialization AS doctor_specialization,
        d.current_hospital
      FROM medical_records mr
      LEFT JOIN doctors d ON mr.doctor_id = d.id
      WHERE mr.patient_id = ? AND mr.id = ?
    `;

    db.query(query, [patientId, recordId], (err, results) => {
      if (err) {
        console.error("Database error during medical record fetch:", err);
        return res.status(500).json({
          success: false,
          message: "Database error during medical record retrieval"
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Medical record not found'
        });
      }

      const record = results[0];
      const transformedRecord = {
        id: record.id,
        patientId: record.patient_id,
        doctorId: record.doctor_id,
        doctorName: record.doctor_name,
        doctorSpecialization: record.doctor_specialization,
        currentHospital: record.current_hospital,
        examinationType: record.examination_type,
        diagnosis: record.diagnosis,
        prescription: record.prescription,
        nextCheckupDate: record.next_checkup_date,
        additionalNotes: record.additional_notes,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      };

      res.json({
        success: true,
        message: 'Medical record retrieved successfully',
        data: transformedRecord
      });
    });

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});
// Add this test route right after the authenticatePatient function

// Get upcoming appointments for patient
router.get('/:patientId/appointments/upcoming', authenticatePatient, (req, res) => {
  const { patientId } = req.params;

  const sql = `
    SELECT 
      a.id,
      a.appointment_date,
      a.appointment_time,
      a.appointment_type,
      a.status,
      a.reason,
      CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
      d.specialization
    FROM appointments a
    LEFT JOIN doctors d ON a.doctor_id = d.id
    WHERE a.patient_id = ? 
      AND a.status = 'confirmed'
      AND a.appointment_date >= CURDATE()
    ORDER BY a.appointment_date ASC, a.appointment_time ASC
  `;

  db.query(sql, [patientId], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching appointments'
      });
    }

    res.json({
      success: true,
      data: results
    });
  });
});


module.exports = router;