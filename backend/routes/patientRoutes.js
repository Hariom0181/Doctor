const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const db = require("../config/db");
const jwt = require("jsonwebtoken"); 

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
    req.patient = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
};

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
    db.query(checkEmailSql, [email], (err, results) => {
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
          password, // Note: In production, hash this password before storing!
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
    // Email validation
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),

    // Password validation - SIMPLIFIED FOR LOGIN
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 1 })
      .withMessage("Password cannot be empty"),
      // Removed strict password format validation for login
      // Users should be able to login with their existing passwords
  ],
  (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Login validation errors:", errors.array()); // Debug log
      return res.status(400).json({ 
        success: false,
        message: "Validation failed",
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // 1. Check if patient exists
    const sql = "SELECT * FROM patients WHERE email = ?";
    db.query(sql, [email.toLowerCase()], (err, results) => {
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

      // 2. Compare password (plain-text for now, but should use bcrypt in production)
      if (patient.password !== password) {
        return res.status(401).json({ 
          success: false,
          message: "Invalid email or password" 
        });
      }

      // 3. Generate JWT token
      const jwtSecret = process.env.JWT_SECRET || "your-fallback-secret-key-change-in-production";
      const token = jwt.sign(
        { 
          id: patient.id, 
          email: patient.email,
          type: 'patient' // Add user type for authorization
        },
        jwtSecret,
        { expiresIn: "24h" } // Extended for better UX
      );

      // 4. Update last login time (optional)
      const updateLastLoginSql = "UPDATE patients SET lastLogin = NOW() WHERE id = ?";
      db.query(updateLastLoginSql, [patient.id], (updateErr) => {
        if (updateErr) {
          console.error("Error updating last login:", updateErr);
          // Don't fail the login for this error
        }
      });

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
          // Don't send sensitive information
        },
      });
    });
  }
);

// Test endpoint to list all patients
router.get("/list", (req, res) => {
  const sql = "SELECT id, firstName, lastName, email FROM patients LIMIT 10";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({
        success: false,
        message: "Database error"
      });
    }
    
    res.json({
      success: true,
      message: "Patients list retrieved",
      data: results,
      count: results.length
    });
  });
});

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
router.post("/:patientId/update-doctor", (req, res) => {
  const patientId = req.params.patientId;
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

// Test endpoint to check patient_doctors table
router.get("/check-links", (req, res) => {
  const sql = "SELECT * FROM patient_doctors LIMIT 5";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Database error checking patient_doctor:", err);
      return res.status(500).json({
        success: false,
        message: "Database error checking patient_doctor table",
        details: err.message
      });
    }
    
    res.json({
      success: true,
      message: "Patient-Doctor links check",
      data: results,
      count: results.length,
      tableExists: true
    });
  });
});

// Test endpoint to check doctors table
router.get("/check-doctors", (req, res) => {
  const sql = "SELECT id, first_name, last_name, specialization FROM doctors LIMIT 5";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Database error checking doctors:", err);
      return res.status(500).json({
        success: false,
        message: "Database error checking doctors",
        details: err.message
      });
    }
    
    res.json({
      success: true,
      message: "Doctors table check",
      data: results,
      count: results.length,
      tableExists: true
    });
  });
});


// Get Patient's Linked Doctors API
router.get(
  "/:id/linked-doctors",
  async (req, res) => {
    try {
      const patientId = req.params.id;
      
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
router.get("/health-metrics", authenticatePatient, async (req, res) => {
  try {
    const patientId = req.patient.id; // Get patient ID from token
    
    
    
    // Get health metrics for this patient
    const getMetricsSql = `
      SELECT 
        id, metric_type, value_systolic, value_diastolic, value_numeric,
        unit, status, recorded_date, recorded_time, notes, created_at
      FROM health_metrics 
      WHERE patient_id = ? 
      ORDER BY metric_type, recorded_date DESC, recorded_time DESC
    `;

    db.query(getMetricsSql, [patientId], (metricsErr, metricsResults) => {
      if (metricsErr) {
        console.error("Database error during metrics fetch:", metricsErr);
        return res.status(500).json({
          success: false,
          message: "Database error during metrics retrieval"
        });
      }

      console.log("Raw metrics from database:", metricsResults);
      console.log("Number of raw metrics:", metricsResults.length);

      // If no metrics found, return empty array but with success
      if (metricsResults.length === 0) {
        console.log("No metrics found for patient:", patientId);
        return res.json({
          success: true,
          message: "No health metrics found for this patient",
          data: [],
          patientId: patientId
        });
      }

      // Group by metric type and get the latest for each type
      const groupedMetrics = {};
      metricsResults.forEach(metric => {
        if (!groupedMetrics[metric.metric_type]) {
          groupedMetrics[metric.metric_type] = metric; // Take the first (latest) one
        }
      });

      console.log("Grouped metrics:", groupedMetrics);

      // Format for frontend display
      const formattedMetrics = Object.values(groupedMetrics).map(metric => {
        let displayValue = "";
        let label = "";

        switch (metric.metric_type) {
          case "blood_pressure":
            displayValue = `${metric.value_systolic}/${metric.value_diastolic}`;
            label = "Blood Pressure";
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
          label: label,
          value: displayValue,
          status: metric.status || "normal",
          lastChecked: metric.recorded_date,
          notes: metric.notes
        };
      });

      console.log("Formatted metrics for frontend:", formattedMetrics);

      res.json({
        success: true,
        message: "Health metrics retrieved successfully",
        data: formattedMetrics,
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

// Add this test route right after the authenticatePatient function
router.get("/test", (req, res) => {
  res.json({ 
    message: "Patient routes are working!",
    timestamp: new Date().toISOString()
  });
});
module.exports = router;