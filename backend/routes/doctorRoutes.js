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
const authenticateDoctor = (req, res, next) => {
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

    // Ensure the token belongs to a doctor (not a patient)
    if (decoded.type !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Doctor credentials required.",
      });
    }

    req.doctor = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};
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

// ============================================================
// PUBLIC ROUTES (no auth required)
// ============================================================

// Doctor Registration
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

    body("dateOfBirth")
      .isISO8601()
      .toDate()
      .withMessage("Valid date of birth is required (YYYY-MM-DD format)"),

    body("gender")
      .notEmpty()
      .trim()
      .isIn(["male", "female", "other"])
      .withMessage("Gender must be male, female, or other"),

    body("address").notEmpty().trim().withMessage("Address is required"),

    body("city")
      .notEmpty()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("City must be between 2-50 characters"),

    body("state")
      .notEmpty()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("State must be between 2-50 characters"),

    body("pincode")
      .matches(/^\d{6}$/)
      .withMessage("Pincode must be exactly 6 digits"),

    body("emergencyContact")
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ max: 100 }),

    body("emergencyPhone")
      .optional({ nullable: true, checkFalsy: true })
      .matches(/^[\+]?[1-9][\d]{0,15}$/),

    body("medicalLicenseNumber")
      .notEmpty()
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage("Medical license number must be between 3-50 characters"),

    body("specialization")
      .notEmpty()
      .trim()
      .isIn([
        "general", "cardiology", "dermatology", "endocrinology",
        "gastroenterology", "neurology", "orthopedics", "pediatrics",
        "psychiatry", "gynecology", "other",
      ])
      .withMessage("Valid specialization is required"),

    body("yearsOfExperience")
      .notEmpty()
      .trim()
      .isIn(["0-1", "2-5", "6-10", "11-20", "20+"])
      .withMessage("Years of experience is required"),

    body("qualifications")
      .notEmpty()
      .trim()
      .isLength({ min: 2, max: 1000 })
      .withMessage("Qualifications must not exceed 1000 characters"),

    body("consultationFee")
      .isNumeric()
      .isFloat({ min: 0, max: 99999.99 })
      .withMessage("Consultation fee must be between 0 and 99999.99"),

    body("currentHospital")
      .notEmpty()
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage("Current hospital must be between 2-200 characters"),

    body("hospitalAddress")
      .notEmpty()
      .trim()
      .withMessage("Hospital address is required"),

    body("availableHours")
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ max: 100 }),

    body("languages")
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ max: 200 }),

    body("bio")
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ max: 2000 }),

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

    body("agreeTerms")
      .equals("true")
      .withMessage("You must agree to the terms and conditions"),

    body("verifyIdentity")
      .equals("true")
      .withMessage("You must agree to identity verification"),
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
        firstName, lastName, email, phone, dateOfBirth, gender,
        address, city, state, pincode, emergencyContact, emergencyPhone,
        medicalLicenseNumber, specialization, yearsOfExperience,
        qualifications, consultationFee, currentHospital, hospitalAddress,
        availableHours, languages, bio, password,
      } = req.body;

      // Check doctor email
      db.query(
        "SELECT email FROM doctors WHERE email = ?",
        [email],
        async (err, doctorResults) => {
          if (err) {
            return res.status(500).json({ success: false, message: "Database error" });
          }
          if (doctorResults.length > 0) {
            return res.status(400).json({
              success: false,
              message: "Email already registered as doctor",
            });
          }

          // Check patient email
          db.query(
            "SELECT email FROM patients WHERE email = ?",
            [email],
            async (err, patientResults) => {
              if (err) {
                return res.status(500).json({ success: false, message: "Database error" });
              }
              if (patientResults.length > 0) {
                return res.status(400).json({
                  success: false,
                  message: "Email already registered as patient. Please use a different email.",
                });
              }

              // Check license number
              db.query(
                "SELECT medical_license_number FROM doctors WHERE medical_license_number = ?",
                [medicalLicenseNumber],
                async (err, licenseResults) => {
                  if (err) {
                    return res.status(500).json({ success: false, message: "Database error" });
                  }
                  if (licenseResults.length > 0) {
                    return res.status(400).json({
                      success: false,
                      message: "Medical license number already registered",
                    });
                  }

                  try {
                    const hashedPassword = await bcrypt.hash(password, 12);

                    const insertSql = `
                      INSERT INTO doctors (
                        first_name, last_name, email, phone, date_of_birth, gender,
                        address, city, state, pincode, emergency_contact, emergency_phone,
                        medical_license_number, specialization, years_of_experience,
                        qualifications, consultation_fee, current_hospital, hospital_address,
                        available_hours, languages, bio, password, is_verified, verification_status
                      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, 'pending')
                    `;

                    const values = [
                      firstName.trim(), lastName.trim(), email.toLowerCase(),
                      phone.trim(), dateOfBirth, gender.toLowerCase(),
                      address.trim(), city.trim(), state.trim(), pincode.trim(),
                      emergencyContact ? emergencyContact.trim() : null,
                      emergencyPhone ? emergencyPhone.trim() : null,
                      medicalLicenseNumber.trim(), specialization, yearsOfExperience,
                      qualifications.trim(), parseFloat(consultationFee),
                      currentHospital.trim(), hospitalAddress.trim(),
                      availableHours ? availableHours.trim() : null,
                      languages ? languages.trim() : null,
                      bio ? bio.trim() : null,
                      hashedPassword,
                    ];

                    db.query(insertSql, values, (err, result) => {
                      if (err) {
                        console.error("Doctor insert error:", err);
                        return res.status(500).json({ success: false, message: "Database error during registration" });
                      }

                      res.status(201).json({
                        success: true,
                        message: "Registration successful! Your account is pending verification.",
                        doctorId: result.insertId,
                        verificationStatus: "pending",
                      });
                    });
                  } catch (hashError) {
                    console.error("Password hashing error:", hashError);
                    return res.status(500).json({ success: false, message: "Server error during registration" });
                  }
                }
              );
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

// Doctor Login
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
        "SELECT * FROM doctors WHERE email = ?",
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

          const doctor = results[0];

          try {
            const isPasswordValid = await bcrypt.compare(password, doctor.password);
            if (!isPasswordValid) {
              return res.status(401).json({
                success: false,
                message: "Invalid email or password",
              });
            }

            // Check verification
            if (
              Number(doctor.is_verified) !== 1 ||
              doctor.verification_status.toLowerCase() !== "approved"
            ) {
              return res.status(403).json({
                success: false,
                message: "Account pending verification. Please wait for admin approval.",
                verificationStatus: doctor.verification_status,
              });
            }

            const jwtSecret =
              process.env.JWT_SECRET ||
              "your-fallback-secret-key-change-in-production";

            const token = jwt.sign( 
              { id: doctor.id, email: doctor.email, type: "doctor" },
              jwtSecret,
              { expiresIn: "24h" }
            );

            // Update last login (non-blocking)
            db.query(
              "UPDATE doctors SET lastLogin = NOW() WHERE id = ?",
              [doctor.id],
              (updateErr) => {
                if (updateErr) console.error("Last login update error:", updateErr);
              }
            );

            res.json({
              success: true,
              message: "Login successful",
              token,
              doctor: {
                id: doctor.id,
                firstName: doctor.first_name,
                lastName: doctor.last_name,
                email: doctor.email,
                phone: doctor.phone,
                specialization: doctor.specialization,
                current_hospital: doctor.current_hospital,
                licenseNumber: doctor.medical_license_number,
                years_of_experience: doctor.years_of_experience,
                qualifications: doctor.qualifications,
                consultation_fee: doctor.consultation_fee,
                available_hours: doctor.available_hours,
                bio: doctor.bio,
                profilePicture: doctor.profile_img,
                lastLogin: new Date().toISOString().slice(0, 19).replace("T", " "),
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
// PROTECTED ROUTES — all require authenticateDoctor below
// ============================================================

// Upload profile picture
router.post(
  "/upload-profile",
  authenticateDoctor,
  (req, res, next) => {
    uploadProfile.single("profileImage")(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "File upload failed",
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const doctorId = req.doctor.id; // From JWT — no longer taken from URL param
      const cloudinaryUrl = req.file.path;

      db.query(
        "UPDATE doctors SET profile_img = ? WHERE id = ?",
        [cloudinaryUrl, doctorId],
        (err) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "Error updating profile picture",
            });
          }
          res.json({ success: true, profileImagePath: cloudinaryUrl });
        }
      );
    } catch (error) {
      console.error("Profile upload failed:", error);
      res.status(500).json({ success: false, message: "Profile upload failed" });
    }
  }
);

// Get doctor's own profile image
router.get("/profile-image", authenticateDoctor, (req, res) => {
  const doctorId = req.doctor.id;

  db.query(
    "SELECT profile_img FROM doctors WHERE id = ?",
    [doctorId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Error fetching profile" });
      }
      if (results.length === 0 || !results[0].profile_img) {
        return res.status(404).json({ success: false, message: "No profile image found" });
      }
      res.json({ success: true, profileImagePath: results[0].profile_img });
    }
  );
});

// Get recent activities for the logged-in doctor
router.get("/recent-activities", authenticateDoctor, (req, res) => {
  const doctorId = req.doctor.id;
  const { limit = 10 } = req.query;

  const sql = `
    SELECT 
      'medical_record' as activity_type,
      mr.id,
      CONCAT(p.firstName, ' ', p.lastName) as patient_name,
      mr.examination_type as activity_title,
      'Medical record created' as activity_description,
      mr.created_at as activity_time,
      'normal' as priority
    FROM medical_records mr
    LEFT JOIN patients p ON mr.patient_id = p.id
    WHERE mr.doctor_id = ?

    UNION ALL

    SELECT 
      'appointment' as activity_type,
      a.id,
      CONCAT(p.firstName, ' ', p.lastName) as patient_name,
      CONCAT('Appointment ', a.status) as activity_title,
      a.appointment_type as activity_description,
      a.updated_at as activity_time,
      CASE 
        WHEN a.status = 'pending' THEN 'medium'
        WHEN a.status = 'confirmed' THEN 'normal'
        WHEN a.status = 'cancelled' THEN 'low'
        ELSE 'normal'
      END as priority
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    WHERE a.doctor_id = ?

    UNION ALL

    SELECT 
      'prescription' as activity_type,
      pr.id,
      CONCAT(p.firstName, ' ', p.lastName) as patient_name,
      'Prescription created' as activity_title,
      pr.medication_name as activity_description,
      pr.created_at as activity_time,
      'normal' as priority
    FROM prescriptions pr
    LEFT JOIN patients p ON pr.patient_id = p.id
    WHERE pr.doctor_id = ?

    ORDER BY activity_time DESC
    LIMIT ?
  `;

  db.query(sql, [doctorId, doctorId, doctorId, parseInt(limit)], (err, results) => {
    if (err) {
      console.error("Error fetching activities:", err);
      return res.status(500).json({ success: false, message: "Error fetching activities" });
    }
    res.json({ success: true, data: results, count: results.length });
  });
});

// Get doctor profile image by doctor ID (for patients)
router.get("/profile-image/:doctorId", authenticatePatient, (req, res) => {
  const { doctorId } = req.params;

  db.query(
    "SELECT profile_img FROM doctors WHERE id = ?",
    [doctorId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Error fetching profile image" });
      }

      if (results.length === 0 || !results[0].profile_img) {
        return res.status(404).json({ success: false, message: "No profile image found" });
      }

      res.json({
        success: true,
        profileImagePath: results[0].profile_img
      });
    }
  );
});

// Patient risk assessment for logged-in doctor
router.get("/patients/risk-assessment", authenticateDoctor, (req, res) => {
  const doctorId = req.doctor.id;

  const sql = `
    SELECT 
      p.id,
      CONCAT(p.firstName, ' ', p.lastName) as patient_name,
      p.bloodGroup,
      p.allergies,
      p.medicalHistory,
      p.dateOfBirth,
      (SELECT COUNT(*) FROM medical_records mr 
       WHERE mr.patient_id = p.id 
       AND mr.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as recent_visits,
      (SELECT status FROM health_metrics hm 
       WHERE hm.patient_id = p.id 
       ORDER BY hm.recorded_date DESC LIMIT 1) as latest_metric_status,
      (SELECT diagnosis FROM medical_records mr 
       WHERE mr.patient_id = p.id 
       ORDER BY mr.created_at DESC LIMIT 1) as latest_diagnosis,
      (SELECT medication_name FROM prescriptions pr 
       WHERE pr.patient_id = p.id 
       AND pr.status = 'active'
       ORDER BY pr.created_at DESC LIMIT 1) as active_medication
    FROM patients p
    INNER JOIN patient_doctors pd ON p.id = pd.patient_id
    WHERE pd.doctor_id = ? AND pd.status = 'active'
  `;

  db.query(sql, [doctorId], (err, results) => {
    if (err) {
      console.error("Risk assessment DB error:", err);
      return res.status(500).json({ success: false, message: "Error calculating risk" });
    }

    const patientsWithRisk = results.map((patient) => {
      let riskScore = 0;
      let riskFactors = [];

      const age =
        new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
      if (age > 65) { riskScore += 2; riskFactors.push("Elderly patient"); }
      if (patient.recent_visits > 5) { riskScore += 3; riskFactors.push("Frequent visits"); }
      if (patient.latest_metric_status === "warning") { riskScore += 2; riskFactors.push("Warning health metrics"); }
      else if (patient.latest_metric_status === "critical") { riskScore += 4; riskFactors.push("Critical health metrics"); }

      const criticalKeywords = ["critical", "severe", "emergency", "acute", "urgent"];
      const warningKeywords = ["elevated", "high", "low", "irregular", "abnormal"];

      if (patient.latest_diagnosis) {
        const d = patient.latest_diagnosis.toLowerCase();
        if (criticalKeywords.some((k) => d.includes(k))) { riskScore += 4; riskFactors.push("Critical diagnosis"); }
        else if (warningKeywords.some((k) => d.includes(k))) { riskScore += 2; riskFactors.push("Attention needed"); }
      }

      let status, priority;
      if (riskScore >= 7) { status = "Critical"; priority = "critical"; }
      else if (riskScore >= 4) { status = "Attention Needed"; priority = "medium"; }
      else { status = "Normal"; priority = "normal"; }

      return { ...patient, riskScore, riskFactors, status, priority, age };
    });

    patientsWithRisk.sort((a, b) => b.riskScore - a.riskScore);

    res.json({
      success: true,
      data: patientsWithRisk,
      count: patientsWithRisk.length,
    });
  });
});

// Get linked patients
router.get("/linked-patients", authenticateDoctor, async (req, res) => {
  try {
    const doctorId = req.doctor.id;

    const getLinkedPatientsSql = `
      SELECT 
        p.id, p.firstName, p.lastName, p.email, p.phone,
        p.dateOfBirth, p.gender, p.address, p.city, p.state,
        p.pincode, p.bloodGroup, p.allergies, p.medicalHistory,
        p.emergencyContact, p.emergencyPhone, p.created_at as patient_created_at,
        pd.linked_date, pd.status as relationship_status,
        pd.notes as relationship_notes, pd.created_at as relationship_created_at
      FROM patient_doctors pd
      INNER JOIN patients p ON pd.patient_id = p.id
      WHERE pd.doctor_id = ? AND pd.status = 'active'
      ORDER BY pd.linked_date DESC
    `;

    db.query(getLinkedPatientsSql, [doctorId], (err, results) => {
      if (err) {
        console.error("Linked patients DB error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error during linked patients retrieval",
        });
      }

      const transformedPatients = results.map((patient) => {
        let age = null;
        if (patient.dateOfBirth) {
          const birthDate = new Date(patient.dateOfBirth);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }

        const medicalHistory = patient.medicalHistory || "";
        const allergies = patient.allergies || "";
        let status = "Normal";
        if (
          medicalHistory.toLowerCase().includes("critical") ||
          medicalHistory.toLowerCase().includes("severe") ||
          medicalHistory.toLowerCase().includes("emergency")
        ) {
          status = "Critical";
        } else if (
          medicalHistory.toLowerCase().includes("attention") ||
          medicalHistory.toLowerCase().includes("follow") ||
          medicalHistory.toLowerCase().includes("monitor") ||
          (allergies && allergies.trim() !== "")
        ) {
          status = "Attention Needed";
        }

        let condition = "Regular Checkup";
        if (medicalHistory && medicalHistory.trim() !== "") {
          const firstSentence = medicalHistory.split(".")[0];
          condition =
            firstSentence.length > 50
              ? firstSentence.substring(0, 50) + "..."
              : firstSentence;
        }

        return {
          id: patient.id,
          name: `${patient.firstName} ${patient.lastName}`,
          firstName: patient.firstName,
          lastName: patient.lastName,
          age,
          email: patient.email,
          phone: patient.phone,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender,
          address: patient.address,
          city: patient.city,
          state: patient.state,
          pincode: patient.pincode,
          bloodGroup: patient.bloodGroup,
          allergies: patient.allergies,
          medicalHistory: patient.medicalHistory,
          emergencyContact: patient.emergencyContact,
          emergencyPhone: patient.emergencyPhone,
          lastVisit: patient.linked_date,
          status,
          condition,
          nextAppointment: null,
          linkedDate: patient.linked_date,
          relationshipStatus: patient.relationship_status,
          relationshipNotes: patient.relationship_notes,
          patientCreatedAt: patient.patient_created_at,
          relationshipCreatedAt: patient.relationship_created_at,
        };
      });

      res.status(200).json({
        success: true,
        message: "Linked patients retrieved successfully",
        data: transformedPatients,
        count: transformedPatients.length,
        doctorId,
      });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Get health metrics for a specific patient
router.get("/patient/:patientId/health-metrics", authenticateDoctor, async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.doctor.id;

    const checkLinkSql = `
      SELECT id FROM patient_doctors 
      WHERE patient_id = ? AND doctor_id = ? AND status = 'active'
    `;

    db.query(checkLinkSql, [patientId, doctorId], (err, linkResults) => {
      if (err) return res.status(500).json({ success: false, message: "Database error" });
      if (linkResults.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Access denied - Patient not linked to this doctor",
        });
      }

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
          return res.status(500).json({ success: false, message: "Database error during metrics retrieval" });
        }

        const groupedMetrics = {};
        metricsResults.forEach((metric) => {
          if (!groupedMetrics[metric.metric_type]) {
            groupedMetrics[metric.metric_type] = metric;
          }
        });

        const formattedMetrics = Object.values(groupedMetrics).map((metric) => {
          let displayValue = "";
          let label = "";

          switch (metric.metric_type) {
            case "blood_pressure":
              displayValue = `${metric.value_systolic}/${metric.value_diastolic}`;
              label = "Blood Pressure";
              break;
            case "blood_sugar":
              displayValue = `${metric.value_numeric} ${metric.unit || "mg/dL"}`;
              label = "Blood Sugar";
              break;
            case "weight":
              displayValue = `${metric.value_numeric} ${metric.unit || "kg"}`;
              label = "Weight";
              break;
            case "heart_rate":
              displayValue = `${metric.value_numeric} ${metric.unit || "bpm"}`;
              label = "Heart Rate";
              break;
            default:
              displayValue = metric.value_numeric
                ? `${metric.value_numeric} ${metric.unit || ""}`.trim()
                : "";
              label = metric.metric_type
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase());
          }

          return {
            id: metric.id,
            label,
            value: displayValue,
            status: metric.status || "normal",
            lastChecked: metric.recorded_date,
            notes: metric.notes,
          };
        });

        res.json({
          success: true,
          message: "Health metrics retrieved successfully",
          data: formattedMetrics,
          patientId,
        });
      });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Add or update health metrics
router.post(
  "/patient/:patientId/health-metrics",
  authenticateDoctor,
  [
    body("metricType")
      .notEmpty()
      .isIn(["blood_pressure", "blood_sugar", "weight", "heart_rate"])
      .withMessage("Valid metric type is required"),
    body("valueSystolic").optional({ nullable: true }).isNumeric(),
    body("valueDiastolic").optional({ nullable: true }).isNumeric(),
    body("valueNumeric").optional({ nullable: true }).isNumeric(),
    body("unit").optional({ nullable: true }).trim().isLength({ max: 20 }),
    body("status").optional({ nullable: true }).isIn(["normal", "warning", "critical"]),
    body("notes").optional({ nullable: true }).trim().isLength({ max: 1000 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
      }

      const { patientId } = req.params;
      const doctorId = req.doctor.id;
      const { metricType, valueSystolic, valueDiastolic, valueNumeric, unit, status, notes } = req.body;

      const checkLinkSql = `
        SELECT id FROM patient_doctors 
        WHERE patient_id = ? AND doctor_id = ? AND status = 'active'
      `;

      db.query(checkLinkSql, [patientId, doctorId], (err, linkResults) => {
        if (err) return res.status(500).json({ success: false, message: "Database error" });
        if (linkResults.length === 0) {
          return res.status(403).json({
            success: false,
            message: "Access denied - Patient not linked to this doctor",
          });
        }

        const checkExistingSql = `
          SELECT id FROM health_metrics 
          WHERE patient_id = ? AND metric_type = ?
          ORDER BY created_at DESC LIMIT 1
        `;

        db.query(checkExistingSql, [patientId, metricType], (checkErr, existingResults) => {
          if (checkErr) return res.status(500).json({ success: false, message: "Database error" });

          const currentDate = new Date().toISOString().split("T")[0];
          const currentTime = new Date().toTimeString().slice(0, 5);

          if (existingResults.length > 0) {
            const updateSql = `
              UPDATE health_metrics SET
                value_systolic = ?, value_diastolic = ?, value_numeric = ?,
                unit = ?, status = ?, recorded_date = ?, recorded_time = ?,
                notes = ?, created_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `;
            db.query(
              updateSql,
              [valueSystolic || null, valueDiastolic || null, valueNumeric || null,
               unit || null, status || "normal", currentDate, currentTime,
               notes || null, existingResults[0].id],
              (updateErr) => {
                if (updateErr) return res.status(500).json({ success: false, message: "Failed to update health metric" });
                res.json({ success: true, message: "Health metric updated successfully", action: "updated", metricId: existingResults[0].id });
              }
            );
          } else {
            const insertSql = `
              INSERT INTO health_metrics 
              (patient_id, metric_type, value_systolic, value_diastolic, value_numeric, unit, status, recorded_date, recorded_time, notes)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            db.query(
              insertSql,
              [patientId, metricType, valueSystolic || null, valueDiastolic || null,
               valueNumeric || null, unit || null, status || "normal",
               currentDate, currentTime, notes || null],
              (insertErr, insertResult) => {
                if (insertErr) return res.status(500).json({ success: false, message: "Failed to add health metric" });
                res.status(201).json({ success: true, message: "Health metric added successfully", action: "created", metricId: insertResult.insertId });
              }
            );
          }
        });
      });
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

// Add medical record
router.post("/medical-records", authenticateDoctor, (req, res) => {
  const { patientId, type, diagnosis, prescription, nextCheckup, notes } = req.body;

  if (!patientId || !type || !diagnosis) {
    return res.status(400).json({
      success: false,
      message: "Patient ID, examination type, and diagnosis are required",
    });
  }

  const sql = `
    INSERT INTO medical_records (
      patient_id, doctor_id, examination_type, diagnosis,
      prescription, next_checkup_date, additional_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [patientId, req.doctor.id, type, diagnosis, prescription || null, nextCheckup || null, notes || null],
    (err, result) => {
      if (err) {
        console.error("Medical record insert error:", err);
        return res.status(500).json({ success: false, message: "Database error adding medical record" });
      }
      res.json({
        success: true,
        message: "Medical record added successfully",
        data: {
          id: result.insertId, patientId, type, diagnosis,
          prescription, nextCheckup, notes, doctorId: req.doctor.id, createdAt: new Date(),
        },
      });
    }
  );
});

// Get medical records for a patient (doctor view)
router.get("/patients/:patientId/medical-records", authenticateDoctor, (req, res) => {
  const { patientId } = req.params;

  const sql = `
    SELECT 
      mr.*,
      d.first_name as doctor_first_name,
      d.last_name as doctor_last_name,
      d.specialization as doctor_specialization
    FROM medical_records mr
    JOIN doctors d ON mr.doctor_id = d.id
    WHERE mr.patient_id = ?
    ORDER BY mr.created_at DESC
  `;

  db.query(sql, [patientId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Database error fetching medical records" });
    }

    const transformedRecords = results.map((record) => ({
      id: record.id,
      patientId: record.patient_id,
      doctorId: record.doctor_id,
      doctorName: `${record.doctor_first_name} ${record.doctor_last_name}`,
      doctorSpecialization: record.doctor_specialization,
      examinationType: record.examination_type,
      diagnosis: record.diagnosis,
      prescription: record.prescription,
      nextCheckupDate: record.next_checkup_date,
      additionalNotes: record.additional_notes,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }));

    res.json({
      success: true,
      message: "Medical records retrieved successfully",
      data: transformedRecords,
      count: transformedRecords.length,
    });
  });
});

// Get all medical records created by current doctor
router.get("/my-medical-records", authenticateDoctor, (req, res) => {
  db.query(
    "SELECT * FROM medical_records WHERE doctor_id = ? ORDER BY created_at DESC",
    [req.doctor.id],
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Database error fetching medical records" });
      }

      const transformedRecords = results.map((record) => ({
        id: record.id,
        patientId: record.patient_id,
        examinationType: record.examination_type,
        diagnosis: record.diagnosis,
        prescription: record.prescription,
        nextCheckupDate: record.next_checkup_date,
        additionalNotes: record.additional_notes,
        createdAt: record.created_at,
      }));

      res.json({
        success: true,
        message: "Medical records retrieved successfully",
        data: transformedRecords,
        count: transformedRecords.length,
      });
    }
  );
});

// Medical records count
router.get("/medical-records/count", authenticateDoctor, (req, res) => {
  db.query(
    "SELECT COUNT(*) as total_records FROM medical_records WHERE doctor_id = ?",
    [req.doctor.id],
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Database error fetching records count" });
      }
      res.json({
        success: true,
        message: "Records count retrieved successfully",
        data: { count: results[0].total_records },
      });
    }
  );
});

// Dashboard statistics
router.get("/dashboard/stats", authenticateDoctor, (req, res) => {
  const sql = `
    SELECT 
      COUNT(*) as total_records,
      COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_records,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as week_records,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as month_records,
      COUNT(DISTINCT patient_id) as unique_patients
    FROM medical_records 
    WHERE doctor_id = ?
  `;

  db.query(sql, [req.doctor.id], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Database error fetching dashboard statistics" });
    }

    const stats = results[0];
    res.json({
      success: true,
      message: "Dashboard statistics retrieved successfully",
      data: {
        totalRecords: stats.total_records,
        todayRecords: stats.today_records,
        weekRecords: stats.week_records,
        monthRecords: stats.month_records,
        uniquePatients: stats.unique_patients,
      },
    });
  });
});

router.get('/nurses/list', authenticateDoctor, (req, res) => {
  const sql = `
    SELECT id, first_name, last_name, qualification, current_hospital
    FROM nurses
    WHERE is_verified = TRUE AND verification_status = 'approved'
    ORDER BY first_name ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch nurses' });
    }

    res.json({
      success: true,
      data: results
    });
  });
});


// Assign nurse to patient
router.post('/:patientId/assign-nurse', authenticateDoctor, (req, res) => {
  const { patientId } = req.params;
  const { nurseId } = req.body;
  const doctorId = req.doctor.id;

  const sql = `
    INSERT INTO nurse_patient_assignments 
    (nurse_id, patient_id, assigned_date, status, notes, created_at, updated_at)
    VALUES (?, ?, CURDATE(), 'active', ?, NOW(), NOW())
  `;

  db.query(sql, [nurseId, patientId, req.body.notes || null], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Assignment failed' });
    }

    res.json({
      success: true,
      message: 'Nurse assigned successfully',
      assignmentId: result.insertId
    });
  });
});

// Get patient's medication logs (nurse administered)
router.get("/patients/:patientId/medication-logs", authenticateDoctor, (req, res) => {
  const { patientId } = req.params;

  const sql = `
    SELECT 
      ml.id,
      ml.medication_name,
      ml.dosage,
      ml.given_at,
      ml.notes,
      CONCAT(n.first_name, ' ', n.last_name) as nurse_name,
      ml.created_at
    FROM medication_logs ml
    LEFT JOIN nurses n ON ml.nurse_id = n.id
    WHERE ml.patient_id = ?
    ORDER BY ml.given_at DESC
  `;

  db.query(sql, [patientId], (err, results) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching medication logs' 
      });
    }

    res.json({ 
      success: true, 
      data: results,
      count: results.length
    });
  });
});

// Get patient's nurse notes (observations)
router.get("/patients/:patientId/nurse-notes", authenticateDoctor, (req, res) => {
  const { patientId } = req.params;

  const sql = `
    SELECT 
      nn.id,
      nn.observation,
      nn.observation_type,
      nn.severity,
      CONCAT(n.first_name, ' ', n.last_name) as nurse_name,
      nn.created_at
    FROM nurse_notes nn
    LEFT JOIN nurses n ON nn.nurse_id = n.id
    WHERE nn.patient_id = ?
    ORDER BY nn.created_at DESC
  `;

  db.query(sql, [patientId], (err, results) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching nurse notes' 
      });
    }

    res.json({ 
      success: true, 
      data: results,
      count: results.length
    });
  });
});

// Get patient's self-reported medication (home-based patients)
router.get("/patients/:patientId/medication-reports", authenticateDoctor, (req, res) => {
  const { patientId } = req.params;

  const sql = `
    SELECT 
      pmr.id,
      pmr.medication_name,
      pmr.dosage,
      pmr.taken_at,
      pmr.notes,
      pmr.created_at
    FROM patient_medication_reports pmr
    WHERE pmr.patient_id = ?
    ORDER BY pmr.taken_at DESC
  `;

  db.query(sql, [patientId], (err, results) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching medication reports' 
      });
    }

    res.json({ 
      success: true, 
      data: results,
      count: results.length
    });
  });
});

// Get all nurses for dropdown

module.exports = router;