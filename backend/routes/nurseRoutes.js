const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { uploadProfile } = require("../config/cloudinary");

// ============================================================
// AUTH MIDDLEWARE
// ============================================================

const authenticateNurse = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  try {
    const jwtSecret =
      process.env.JWT_SECRET || "your-fallback-secret-key-change-in-production";
    const decoded = jwt.verify(token, jwtSecret);

    if (decoded.type !== "nurse") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Nurse credentials required.",
      });
    }

    req.nurse = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

// ============================================================
// PUBLIC ROUTES
// ============================================================

// Nurse Registration
router.post(
  "/register",
  [
    body("firstName")
      .notEmpty()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("First name must be between 2-50 characters"),
    body("lastName")
      .notEmpty()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Last name must be between 2-50 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("phone")
      .notEmpty()
      .matches(/^[\+]?[1-9][\d]{0,15}$/)
      .withMessage("Valid phone number is required"),
    body("qualification")
      .notEmpty()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Qualification is required"),
    body("licenseNumber")
      .notEmpty()
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage("License number is required"),
    body("currentHospital")
      .notEmpty()
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage("Current hospital is required"),
    body("password")
      .notEmpty()
      .isLength({ min: 8, max: 128 })
      .withMessage("Password must be between 8 and 128 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage(
        "Password must contain uppercase, lowercase, number, and special character"
      ),
    body("confirmPassword")
      .notEmpty()
      .custom((value, { req }) => {
        if (value !== req.body.password) throw new Error("Passwords do not match");
        return true;
      }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const {
        firstName,
        lastName,
        email,
        phone,
        qualification,
        licenseNumber,
        currentHospital,
        password,
      } = req.body;

      // Check email
      db.query(
        "SELECT email FROM nurses WHERE email = ?",
        [email],
        async (err, results) => {
          if (err) {
            return res.status(500).json({ success: false, message: "Database error" });
          }

          if (results.length > 0) {
            return res.status(400).json({
              success: false,
              message: "Email already registered",
            });
          }

          // Check license number
          db.query(
            "SELECT license_number FROM nurses WHERE license_number = ?",
            [licenseNumber],
            async (err, licenseResults) => {
              if (err) {
                return res.status(500).json({ success: false, message: "Database error" });
              }

              if (licenseResults.length > 0) {
                return res.status(400).json({
                  success: false,
                  message: "License number already registered",
                });
              }

              try {
                const hashedPassword = await bcrypt.hash(password, 12);
                const now = new Date().toISOString().slice(0, 19).replace("T", " ");

                const insertSql = `
                  INSERT INTO nurses (
                    first_name, last_name, email, phone,
                    qualification, license_number, current_hospital,
                    password, is_verified, verification_status,
                    created_at, updated_at
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE, 'pending', ?, ?)
                `;

                const values = [
                  firstName.trim(),
                  lastName.trim(),
                  email.toLowerCase(),
                  phone.trim(),
                  qualification.trim(),
                  licenseNumber.trim(),
                  currentHospital.trim(),
                  hashedPassword,
                  now,
                  now,
                ];

                db.query(insertSql, values, (err, result) => {
                  if (err) {
                    console.error("Nurse insert error:", err);
                    return res.status(500).json({
                      success: false,
                      message: "Database error during registration",
                    });
                  }

                  res.status(201).json({
                    success: true,
                    message:
                      "Registration successful! Your account is pending verification.",
                    nurseId: result.insertId,
                    verificationStatus: "pending",
                  });
                });
              } catch (hashError) {
                console.error("Password hashing error:", hashError);
                return res.status(500).json({
                  success: false,
                  message: "Server error during registration",
                });
              }
            }
          );
        }
      );
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

// Nurse Login
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      db.query(
        "SELECT * FROM nurses WHERE email = ?",
        [email.toLowerCase()],
        async (err, results) => {
          if (err) {
            console.error("Login DB error:", err);
            return res.status(500).json({ success: false, message: "Database error" });
          }

          if (results.length === 0) {
            return res.status(401).json({
              success: false,
              message: "Invalid email or password",
            });
          }

          const nurse = results[0];

          try {
            const isPasswordValid = await bcrypt.compare(password, nurse.password);
            if (!isPasswordValid) {
              return res.status(401).json({
                success: false,
                message: "Invalid email or password",
              });
            }

            // Check verification
            if (
              Number(nurse.is_verified) !== 1 ||
              nurse.verification_status.toLowerCase() !== "approved"
            ) {
              return res.status(403).json({
                success: false,
                message: "Account pending verification. Please wait for admin approval.",
                verificationStatus: nurse.verification_status,
              });
            }

            const jwtSecret =
              process.env.JWT_SECRET ||
              "your-fallback-secret-key-change-in-production";

            const token = jwt.sign(
              { id: nurse.id, email: nurse.email, type: "nurse" },
              jwtSecret,
              { expiresIn: "24h" }
            );

            // Update last login
            const now = new Date().toISOString().slice(0, 19).replace("T", " ");
            db.query(
              "UPDATE nurses SET lastLogin = ? WHERE id = ?",
              [now, nurse.id],
              (updateErr) => {
                if (updateErr) console.error("Last login update error:", updateErr);
              }
            );

            res.json({
              success: true,
              message: "Login successful",
              token,
              nurse: {
                id: nurse.id,
                firstName: nurse.first_name,
                lastName: nurse.last_name,
                email: nurse.email,
                phone: nurse.phone,
                qualification: nurse.qualification,
                licenseNumber: nurse.license_number,
                currentHospital: nurse.current_hospital,
                profilePicture: nurse.profile_img,
              },
            });
          } catch (compareError) {
            console.error("Password compare error:", compareError);
            return res.status(500).json({
              success: false,
              message: "Server error during login",
            });
          }
        }
      );
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

// ============================================================
// PROTECTED ROUTES
// ============================================================

// Save push token
router.post("/save-push-token", authenticateNurse, (req, res) => {
  try {
    const { pushToken } = req.body;
    const nurseId = req.nurse.id;

    if (!pushToken) {
      return res.status(400).json({
        success: false,
        message: "Push token is required",
      });
    }

    const sql = "UPDATE nurses SET push_token = ? WHERE id = ?";

    db.query(sql, [pushToken, nurseId], (err, result) => {
      if (err) {
        console.error("Error saving push token:", err);
        return res.status(500).json({
          success: false,
          message: "Error saving push token",
        });
      }

      res.json({
        success: true,
        message: "Push token saved successfully",
      });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get assigned patients
router.get("/assigned-patients", authenticateNurse, (req, res) => {
  const nurseId = req.nurse.id;

  const sql = `
    SELECT 
      p.id,
      p.firstName,
      p.lastName,
      p.email,
      p.phone,
      p.bloodGroup,
      p.allergies,
      p.medicalHistory,
      p.gender,        
      p.city,          
      p.dateOfBirth,   
      npa.assigned_date,
      npa.status,
      npa.notes
    FROM nurse_patient_assignments npa
    LEFT JOIN patients p ON npa.patient_id = p.id
    WHERE npa.nurse_id = ? AND npa.status = 'active'
    ORDER BY npa.assigned_date DESC
  `;

  db.query(sql, [nurseId], (err, results) => {
    if (err) {
      console.error("Error fetching assigned patients:", err);
      return res.status(500).json({
        success: false,
        message: "Error fetching assigned patients",
      });
    }

    res.json({
      success: true,
      data: results,
      count: results.length,
    });
  });
});

// ── MEDICATION LOGS ───────────────────────────────────
router.post('/medication-logs', authenticateNurse, (req, res) => {
  const { prescriptionId, patientId, medicationName, dosage, notes } = req.body;
  const nurseId = req.nurse.id;

  const sql = `
    INSERT INTO medication_logs 
    (prescription_id, nurse_id, patient_id, medication_name, dosage, given_at, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, NOW(), ?, NOW(), NOW())
  `;

  db.query(sql, [prescriptionId || null, nurseId, patientId, medicationName, dosage, notes || null], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Failed to log medication' });
    }
    res.json({ success: true, message: 'Medication logged', logId: result.insertId });
  });
});

router.get('/patient/:patientId/medication-logs', authenticateNurse, (req, res) => {
  const { patientId } = req.params;

  const sql = `
    SELECT id, medication_name, dosage, given_at as administered_at, notes, created_at
    FROM medication_logs
    WHERE patient_id = ?
    ORDER BY given_at DESC
    LIMIT 50
  `;

  db.query(sql, [patientId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error fetching logs' });
    }
    res.json({ success: true, data: results });
  });
});

// ── NOTES ─────────────────────────────────────────────
router.post('/notes', authenticateNurse, (req, res) => {
  const { patientId, observation, observationType, severity } = req.body;
  const nurseId = req.nurse.id;

  const sql = `
    INSERT INTO nurse_notes 
    (nurse_id, patient_id, observation, observation_type, severity, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, NOW(), NOW())
  `;

  db.query(sql, [nurseId, patientId, observation, observationType, severity], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Failed to add note' });
    }
    res.json({ success: true, message: 'Note added', noteId: result.insertId });
  });
});

router.get('/patient/:patientId/notes', authenticateNurse, (req, res) => {
  const { patientId } = req.params;

  const sql = `
    SELECT id, observation, observation_type, severity, created_at
    FROM nurse_notes
    WHERE patient_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `;

  db.query(sql, [patientId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error fetching notes' });
    }
    res.json({ success: true, data: results });
  });
});

// ── ACTIVITY LOG ──────────────────────────────────────
// ── ACTIVITY LOG (for both Doctor and Nurse) ──
router.get('/activity-log', (req, res) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  try {
    const jwtSecret =
      process.env.JWT_SECRET || "your-fallback-secret-key-change-in-production";
    const decoded = jwt.verify(token, jwtSecret);

    let nurseId = null;

    // Allow both nurse and doctor to view
    if (decoded.type === "nurse") {
      nurseId = decoded.id;
    } else if (decoded.type === "doctor") {
      // Doctor can view all nurse activities for their patients
      // No nurseId filter - show all nurses' activities
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied. Invalid user type.",
      });
    }

    const medSql = `
      SELECT 
        ml.id, 'medication' as type, p.firstName, p.lastName,
        ml.medication_name, ml.dosage, ml.given_at as created_at, ml.notes,
        n.first_name, n.last_name,
        CONCAT(n.first_name, ' ', n.last_name) as nurse_name,
        CONCAT(p.firstName, ' ', p.lastName) as patient_name,
        NULL as observation, NULL as observation_type, NULL as severity
      FROM medication_logs ml
      LEFT JOIN patients p ON ml.patient_id = p.id
      LEFT JOIN nurses n ON ml.nurse_id = n.id
      ${nurseId ? 'WHERE ml.nurse_id = ?' : ''}
      
      UNION ALL
      
      SELECT 
        nn.id, 'note' as type, p.firstName, p.lastName,
        NULL as medication_name, NULL as dosage, nn.created_at, NULL as notes,
        n.first_name, n.last_name,
        CONCAT(n.first_name, ' ', n.last_name) as nurse_name,
        CONCAT(p.firstName, ' ', p.lastName) as patient_name,
        nn.observation, nn.observation_type, nn.severity
      FROM nurse_notes nn
      LEFT JOIN patients p ON nn.patient_id = p.id
      LEFT JOIN nurses n ON nn.nurse_id = n.id
      ${nurseId ? 'WHERE nn.nurse_id = ?' : ''}
      
      ORDER BY created_at DESC
      LIMIT 100
    `;

    const params = nurseId ? [nurseId, nurseId] : [];

    db.query(medSql, params, (err, results) => {
      if (err) {
        console.error("Error fetching activity:", err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching activity' 
        });
      }

      res.json({ 
        success: true, 
        data: results,
        count: results.length 
      });
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
});

// ── GET PATIENT PRESCRIPTIONS (for logging medication) ──
router.get('/patient/:patientId/prescriptions', authenticateNurse, (req, res) => {
  const { patientId } = req.params;
  const nurseId = req.nurse.id;

  // First, verify nurse is assigned to this patient
  const verifyAssignment = `
    SELECT id FROM nurse_patient_assignments 
    WHERE nurse_id = ? AND patient_id = ? AND status = 'active'
  `;

  db.query(verifyAssignment, [nurseId, patientId], (err, assignmentResults) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (assignmentResults.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not assigned to this patient' 
      });
    }

    // Get active prescriptions for this patient
    const sql = `
      SELECT 
        p.id, 
        p.medication_name, 
        p.dosage, 
        p.frequency, 
        p.instructions, 
        p.start_date, 
        p.end_date,
        CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
        d.specialization
      FROM prescriptions p
      LEFT JOIN doctors d ON p.doctor_id = d.id
      WHERE p.patient_id = ? 
        AND p.status = 'active'
        AND p.end_date >= CURDATE()
      ORDER BY p.start_date DESC
    `;

    db.query(sql, [patientId], (err, results) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching prescriptions' 
        });
      }

      res.json({ 
        success: true, 
        data: results,
        count: results.length
      });
    });
  });
});

module.exports = router;