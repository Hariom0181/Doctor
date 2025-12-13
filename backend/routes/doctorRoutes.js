const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for doctor profile upload
const doctorStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads/doctors_profile");
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  name: function (req, file, cb) {
    const uniqueName = `doctor_${req.params.doctorId}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files (JPEG, JPG, PNG, GIF, WEBP) are allowed!"));
  }
};


const doctorUpload = multer({
  storage: doctorStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});




// Add this middleware function
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
    req.doctor = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
};

router.post("/:doctorId/upload-profile", doctorUpload.single("profileImage"), async (req, res) => {
  try {
    const doctorId = req.params.doctorId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const profileImagePath = `/uploads/doctors_profile/${req.file.filename}`;

    // Delete old image if exists
    const getOldImageSql = "SELECT profile_img FROM doctors WHERE id = ?";
    db.query(getOldImageSql, [doctorId], (err, results) => {
      if (err) {
        console.error("Error checking old image:", err);
      } else if (results.length > 0 && results[0].profile_img) {
        const oldImagePathStr = typeof results[0].profile_img === 'string' 
          ? results[0].profile_img 
          : results[0].profile_img.toString();
        
        if (oldImagePathStr && oldImagePathStr.startsWith('/')) {
          const oldImagePath = path.join(__dirname, "..", oldImagePathStr);
          if (fs.existsSync(oldImagePath)) {
            try {
              fs.unlinkSync(oldImagePath);
              console.log('✅ Old doctor profile image deleted');
            } catch (deleteErr) {
              console.error('Error deleting old image:', deleteErr);
            }
          }
        }
      }
    });

    // Update database
    const updateSql = "UPDATE doctors SET profile_img = ? WHERE id = ?";
    db.query(updateSql, [profileImagePath, doctorId], (err, result) => {
      if (err) {
        console.error("Error updating profile image:", err);
        return res.status(500).json({
          success: false,
          message: "Error updating profile image"
        });
      }

      res.json({
        success: true,
        message: "Doctor profile image uploaded successfully",
        profileImagePath: profileImagePath
      });
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error uploading profile image"
    });
  }
});

// Get doctor profile image
router.get("/:doctorId/profile-image", (req, res) => {
  const doctorId = req.params.doctorId;

  const sql = "SELECT profile_img FROM doctors WHERE id = ?";
  db.query(sql, [doctorId], (err, results) => {
    if (err) {
      console.error("Error fetching profile image:", err);
      return res.status(500).json({
        success: false,
        message: "Error fetching profile image"
      });
    }

    if (results.length === 0 || !results[0].profile_img) {
      return res.status(404).json({
        success: false,
        message: "No profile image found"
      });
    }

    res.json({
      success: true,
      profileImagePath: results[0].profile_img
    });
  });
});

// Doctor Registration Route
router.post(
  "/register",
  [
    // Personal Information Validation
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
      .isIn(['male', 'female', 'other'])
      .withMessage("Gender is required and must be male, female, or other"),

    // Contact Information Validation
    body("address")
      .notEmpty()
      .trim()
      .withMessage("Address is required"),

    body("city")
      .notEmpty()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("City is required and must be between 2-50 characters"),

    body("state")
      .notEmpty()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("State is required and must be between 2-50 characters"),

    body("pincode")
      .matches(/^\d{6}$/)
      .withMessage("Pincode must be exactly 6 digits"),

    // Emergency Contact (Optional)
    body("emergencyContact")
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ max: 100 })
      .withMessage("Emergency contact name must not exceed 100 characters"),

    body("emergencyPhone")
      .optional({ nullable: true, checkFalsy: true })
      .matches(/^[\+]?[1-9][\d]{0,15}$/)
      .withMessage("Emergency phone must be a valid phone number"),

    // Professional Credentials Validation
    body("medicalLicenseNumber")
      .notEmpty()
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage("Medical license number is required and must be between 3-50 characters"),

    body("specialization")
      .notEmpty()
      .trim()
      .isIn([
        'general', 'cardiology', 'dermatology', 'endocrinology',
        'gastroenterology', 'neurology', 'orthopedics', 'pediatrics',
        'psychiatry', 'gynecology', 'other'
      ])
      .withMessage("Valid specialization is required"),

    body("yearsOfExperience")
      .notEmpty()
      .trim()
      .isIn(['0-1', '2-5', '6-10', '11-20', '20+'])
      .withMessage("Years of experience is required"),

    body("qualifications")
      .notEmpty()
      .trim()
      .isLength({ min: 2, max: 1000 })
      .withMessage("Qualifications are required and must not exceed 1000 characters"),

    body("consultationFee")
      .isNumeric()
      .isFloat({ min: 0, max: 99999.99 })
      .withMessage("Consultation fee must be a valid number between 0 and 99999.99"),

    // Practice Information Validation
    body("currentHospital")
      .notEmpty()
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage("Current hospital is required and must be between 2-200 characters"),

    body("hospitalAddress")
      .notEmpty()
      .trim()
      .withMessage("Hospital address is required"),

    // Optional Practice Information
    body("availableHours")
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ max: 100 })
      .withMessage("Available hours must not exceed 100 characters"),

    body("languages")
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ max: 200 })
      .withMessage("Languages must not exceed 200 characters"),

    body("bio")
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ max: 2000 })
      .withMessage("Bio must not exceed 2000 characters"),

    // Account Security Validation
    body("password")
      .notEmpty()
      .isLength({ min: 8, max: 128 })
      .withMessage("Password must be between 8 and 128 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage("Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"),

    // Frontend validation fields
    body("confirmPassword")
      .notEmpty()
      .withMessage("Please confirm your password")
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords do not match');
        }
        return true;
      }),

    body("agreeTerms")
      .equals('true')
      .withMessage("You must agree to the terms and conditions"),

    body("verifyIdentity")
      .equals('true')
      .withMessage("You must agree to identity verification")
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array());
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
        medicalLicenseNumber,
        specialization,
        yearsOfExperience,
        qualifications,
        consultationFee,
        currentHospital,
        hospitalAddress,
        availableHours,
        languages,
        bio,
        password
      } = req.body;

      // Check if email already exists in doctors table
      const checkDoctorEmailSql = "SELECT email FROM doctors WHERE email = ?";

      db.query(checkDoctorEmailSql, [email], async (err, doctorResults) => {
        if (err) {
          console.error("Database error during doctor email check:", err);
          return res.status(500).json({
            success: false,
            message: "Database error during registration"
          });
        }

        if (doctorResults.length > 0) {
          return res.status(400).json({
            success: false,
            message: "Email already registered as doctor"
          });
        }

        // Check if email exists in patients table (if you want to prevent cross-registration)
        const checkPatientEmailSql = "SELECT email FROM patients WHERE email = ?";

        db.query(checkPatientEmailSql, [email], async (err, patientResults) => {
          if (err) {
            console.error("Database error during patient email check:", err);
            return res.status(500).json({
              success: false,
              message: "Database error during registration"
            });
          }

          if (patientResults.length > 0) {
            return res.status(400).json({
              success: false,
              message: "Email already registered as patient. Please use a different email."
            });
          }

          // Check if medical license number already exists
          const checkLicenseSql = "SELECT medical_license_number FROM doctors WHERE medical_license_number = ?";

          db.query(checkLicenseSql, [medicalLicenseNumber], async (err, licenseResults) => {
            if (err) {
              console.error("Database error during license check:", err);
              return res.status(500).json({
                success: false,
                message: "Database error during registration"
              });
            }

            if (licenseResults.length > 0) {
              return res.status(400).json({
                success: false,
                message: "Medical license number already registered"
              });
            }

            try {
              // Hash password
              const hashedPassword = await bcrypt.hash(password, 12);

              // Insert new doctor
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
                firstName.trim(),
                lastName.trim(),
                email.toLowerCase(),
                phone.trim(),
                dateOfBirth,
                gender.toLowerCase(),
                address.trim(),
                city.trim(),
                state.trim(),
                pincode.trim(),
                emergencyContact ? emergencyContact.trim() : null,
                emergencyPhone ? emergencyPhone.trim() : null,
                medicalLicenseNumber.trim(),
                specialization,
                yearsOfExperience,
                qualifications.trim(),
                parseFloat(consultationFee),
                currentHospital.trim(),
                hospitalAddress.trim(),
                availableHours ? availableHours.trim() : null,
                languages ? languages.trim() : null,
                bio ? bio.trim() : null,
                hashedPassword
              ];

              db.query(insertSql, values, (err, result) => {
                if (err) {
                  console.error("Database error during doctor insertion:", err);
                  return res.status(500).json({
                    success: false,
                    message: "Database error during registration"
                  });
                }

                // Registration successful
                res.status(201).json({
                  success: true,
                  message: "Doctor registration successful! Your account is pending verification.",
                  doctorId: result.insertId,
                  verificationStatus: "pending"
                });
              });

            } catch (hashError) {
              console.error("Password hashing error:", hashError);
              return res.status(500).json({
                success: false,
                message: "Server error during registration"
              });
            }
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
// Dont handle the logic of login as it is yet to make the routes and all 
// Doctor Login Route
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
    try {
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

      const sql = "SELECT * FROM doctors WHERE email = ?";

      db.query(sql, [email.toLowerCase()], async (err, results) => {
        if (err) {
          console.error("Database error during login:", err);
          return res.status(500).json({
            success: false,
            message: "Database error"
          });
        }

        if (results.length === 0) {
          return res.status(401).json({
            success: false,
            message: "Invalid email or password"
          });
        }

        const doctor = results[0];

        try {
          const isPasswordValid = await bcrypt.compare(password, doctor.password);

          if (!isPasswordValid) {
            return res.status(401).json({
              success: false,
              message: "Invalid email or password"
            });
          }

          // Check if doctor is verified
          if (Number(doctor.is_verified) !== 1 || doctor.verification_status.toLowerCase() !== 'approved') {
            return res.status(403).json({
              success: false,
              message: "Account pending verification. Please wait for admin approval.",
              verificationStatus: doctor.verification_status
            });
          }
          const jwtSecret = process.env.JWT_SECRET || "your-fallback-secret-key-change-in-production";
          const token = jwt.sign(
            {
              id: doctor.id,
              email: doctor.email,
              type: 'doctor' // Add user type for authorization
            },
            jwtSecret,
            { expiresIn: "24h" } // Extended for better UX
          );
          const updateLastLoginSql = "UPDATE doctors SET lastLogin = NOW() WHERE id = ?";
          db.query(updateLastLoginSql, [doctor.id], (updateErr) => {
            if (updateErr) {
              console.error("Error updating last login:", updateErr);
              // Don't fail the login for this error
            }
          });

          // Remove password from response
          const { password: _, ...doctorData } = doctor;

          // Replace this section in your existing doctor login:

          res.json({
            success: true,
            message: "Login successful",
            token: token,
            doctor: {
              id: doctor.id,
              firstName: doctor.first_name,                    // Map snake_case to camelCase
              lastName: doctor.last_name,
              email: doctor.email,
              phone: doctor.phone,
              specialization: doctor.specialization,
              current_hospital: doctor.current_hospital,
              licenseNumber: doctor.medical_license_number,   // Map snake_case to camelCase
              years_of_experience: doctor.years_of_experience,
              qualifications: doctor.qualifications,
              consultation_fee: doctor.consultation_fee,
              available_hours: doctor.available_hours,
              bio: doctor.bio,
              profilePicture: doctor.profilePicture,
              lastLogin: new Date().toISOString().slice(0, 19).replace('T', ' ')
            }
          });

        } catch (compareError) {
          console.error("Password comparison error:", compareError);
          console.log("Doctor password from DB:", doctor.password);

          return res.status(500).json({
            success: false,
            message: "Server error during login"
          });
        }
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
// Add this route to your doctorRoutes.js file
router.get("/linked-patients", authenticateDoctor, async (req, res) => {
  try {
    const doctorId = req.doctor.id; // Get from JWT token instead of URL param

    // Rest of your code remains the same...
    // Validate doctor ID
    if (!doctorId || isNaN(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "Valid doctor ID is required"
      });
    }

    // Check if doctor exists and is verified
    const checkDoctorSql = "SELECT id, is_verified, verification_status FROM doctors WHERE id = ?";
    db.query(checkDoctorSql, [doctorId], (err, doctorResults) => {
      if (err) {
        console.error("Database error during doctor check:", err);
        return res.status(500).json({
          success: false,
          message: "Database error during doctor verification"
        });
      }

      if (doctorResults.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found"
        });
      }

      // // Check if doctor is verified (assuming is_verified should be true or verification_status should be 'verified')
      // if (!doctorResults[0].is_verified  || doctorResults[0].verification_status !== 'approved') {
      //   return res.status(403).json({
      //     success: false,
      //     message: "Doctor account is not verified"
      //   });
      // }

      // Fetch linked patients for the doctor
      const getLinkedPatientsSql = `
        SELECT 
          p.id,
          p.firstName,
          p.lastName,
          p.email,
          p.phone,
          p.dateOfBirth,
          p.gender,
          p.address,
          p.city,
          p.state,
          p.pincode,
          p.bloodGroup,
          p.allergies,
          p.medicalHistory,
          p.emergencyContact,
          p.emergencyPhone,
          p.created_at as patient_created_at,
          pd.linked_date,
          pd.status as relationship_status,
          pd.notes as relationship_notes,
          pd.created_at as relationship_created_at
        FROM patient_doctors pd
        INNER JOIN patients p ON pd.patient_id = p.id
        WHERE pd.doctor_id = ? AND pd.status = 'active'
        ORDER BY pd.linked_date DESC
      `;

      db.query(getLinkedPatientsSql, [doctorId], (patientsErr, patientsResults) => {
        if (patientsErr) {
          console.error("Database error during linked patients fetch:", patientsErr);
          return res.status(500).json({
            success: false,
            message: "Database error during linked patients retrieval",
            details: patientsErr.message
          });
        }

        // Transform the data to match frontend expectations
        const transformedPatients = patientsResults.map(patient => {
          // Calculate age from date of birth
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

          // Determine health status based on medical history or allergies
          let status = "Normal";
          const medicalHistory = patient.medicalHistory || "";
          const allergies = patient.allergies || "";

          if (medicalHistory.toLowerCase().includes('critical') ||
            medicalHistory.toLowerCase().includes('severe') ||
            medicalHistory.toLowerCase().includes('emergency')) {
            status = "Critical";
          } else if (medicalHistory.toLowerCase().includes('attention') ||
            medicalHistory.toLowerCase().includes('follow') ||
            medicalHistory.toLowerCase().includes('monitor') ||
            (allergies && allergies.trim() !== "")) {
            status = "Attention Needed";
          }

          // Determine condition from medical history or set default
          let condition = "Regular Checkup";
          if (medicalHistory && medicalHistory.trim() !== "") {
            // Extract the first sentence or first 50 characters as condition
            const firstSentence = medicalHistory.split('.')[0];
            condition = firstSentence.length > 50 ?
              firstSentence.substring(0, 50) + "..." :
              firstSentence;
          }

          return {
            id: patient.id,
            name: `${patient.firstName} ${patient.lastName}`,
            firstName: patient.firstName,
            lastName: patient.lastName,
            age: age,
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
            lastVisit: patient.linked_date, // Since there's no last_visit_date, using linked_date
            status: status,
            condition: condition,
            nextAppointment: null, // No next_appointment_date column exists
            linkedDate: patient.linked_date,
            relationshipStatus: patient.relationship_status,
            relationshipNotes: patient.relationship_notes,
            patientCreatedAt: patient.patient_created_at,
            relationshipCreatedAt: patient.relationship_created_at
          };
        });

        res.status(200).json({
          success: true,
          message: "Linked patients retrieved successfully",
          data: transformedPatients,
          count: transformedPatients.length,
          doctorId: doctorId
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
});
// Get health metrics for a specific patient
// Get health metrics for a specific patient
router.get("/patient/:patientId/health-metrics", authenticateDoctor, async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.doctor.id;

    // Verify patient is linked to this doctor
    const checkLinkSql = `
      SELECT id FROM patient_doctors 
      WHERE patient_id = ? AND doctor_id = ? AND status = 'active'
    `;

    db.query(checkLinkSql, [patientId, doctorId], (err, linkResults) => {
      if (err) {
        console.error("Database error during link check:", err);
        return res.status(500).json({
          success: false,
          message: "Database error"
        });
      }

      if (linkResults.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Access denied - Patient not linked to this doctor"
        });
      }

      // Get health metrics for the patient
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

        // Group by metric type and get the latest for each type
        const groupedMetrics = {};
        metricsResults.forEach(metric => {
          if (!groupedMetrics[metric.metric_type]) {
            groupedMetrics[metric.metric_type] = metric; // Take the first (latest) one
          }
        });

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

        res.json({
          success: true,
          message: "Health metrics retrieved successfully",
          data: formattedMetrics,
          patientId: patientId
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
});

// Add or UPDATE health metrics (this handles both create and update)
router.post("/patient/:patientId/health-metrics", authenticateDoctor, [
  body("metricType")
    .notEmpty()
    .isIn(['blood_pressure', 'blood_sugar', 'weight', 'heart_rate'])
    .withMessage("Valid metric type is required (blood_pressure, blood_sugar, weight, heart_rate)"),

  body("valueSystolic")
    .optional({ nullable: true })
    .isNumeric()
    .withMessage("Systolic value must be numeric"),

  body("valueDiastolic")
    .optional({ nullable: true })
    .isNumeric()
    .withMessage("Diastolic value must be numeric"),

  body("valueNumeric")
    .optional({ nullable: true })
    .isNumeric()
    .withMessage("Numeric value must be numeric"),

  body("unit")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 20 })
    .withMessage("Unit must not exceed 20 characters"),

  body("status")
    .optional({ nullable: true })
    .isIn(['normal', 'warning', 'critical'])
    .withMessage("Status must be normal, warning, or critical"),

  body("notes")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes must not exceed 1000 characters")
], async (req, res) => {
  try {
    // Check validation errors
    console.log("🟢 Received body:", req.body);
    console.log("🟢 PatientId param:", req.params.patientId);

    const errors = validationResult(req);
    console.log("Validation errors:", errors.array());
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
    }

    const { patientId } = req.params;
    const doctorId = req.doctor.id;
    const {
      metricType,
      valueSystolic,
      valueDiastolic,
      valueNumeric,
      unit,
      status,
      notes
    } = req.body;

    // Verify patient is linked to this doctor
    const checkLinkSql = `
      SELECT id FROM patient_doctors 
      WHERE patient_id = ? AND doctor_id = ? AND status = 'active'
    `;

    db.query(checkLinkSql, [patientId, doctorId], (err, linkResults) => {
      if (err) {
        console.error("Database error during link check:", err);
        return res.status(500).json({
          success: false,
          message: "Database error"
        });
      }

      if (linkResults.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Access denied - Patient not linked to this doctor"
        });
      }

      // Check if metric already exists for this patient and metric type
      const checkExistingSql = `
        SELECT id FROM health_metrics 
        WHERE patient_id = ? AND metric_type = ?
        ORDER BY created_at DESC LIMIT 1
      `;

      db.query(checkExistingSql, [patientId, metricType], (checkErr, existingResults) => {
        if (checkErr) {
          console.error("Database error during existing metric check:", checkErr);
          return res.status(500).json({
            success: false,
            message: "Database error during metric check"
          });
        }

        const currentDate = new Date().toISOString().split('T')[0];
        const currentTime = new Date().toTimeString().slice(0, 5);

        if (existingResults.length > 0) {
          // UPDATE existing metric
          const updateSql = `
            UPDATE health_metrics SET
              value_systolic = ?,
              value_diastolic = ?,
              value_numeric = ?,
              unit = ?,
              status = ?,
              recorded_date = ?,
              recorded_time = ?,
              notes = ?,
              created_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `;

          const updateValues = [
            valueSystolic || null,
            valueDiastolic || null,
            valueNumeric || null,
            unit || null,
            status || 'normal',
            currentDate,
            currentTime,
            notes || null,
            existingResults[0].id
          ];

          db.query(updateSql, updateValues, (updateErr, updateResult) => {
            if (updateErr) {
              console.error("Database error during metric update:", updateErr);
              return res.status(500).json({
                success: false,
                message: "Failed to update health metric"
              });
            }

            res.json({
              success: true,
              message: "Health metric updated successfully",
              action: "updated",
              metricId: existingResults[0].id
            });
          });

        } else {
          // INSERT new metric
          const insertSql = `
            INSERT INTO health_metrics 
            (patient_id, metric_type, value_systolic, value_diastolic, value_numeric, unit, status, recorded_date, recorded_time, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const insertValues = [
            patientId,
            metricType,
            valueSystolic || null,
            valueDiastolic || null,
            valueNumeric || null,
            unit || null,
            status || 'normal',
            currentDate,
            currentTime,
            notes || null
          ];

          db.query(insertSql, insertValues, (insertErr, insertResult) => {
            if (insertErr) {
              console.error("Database error during metric insertion:", insertErr);
              return res.status(500).json({
                success: false,
                message: "Failed to add health metric"
              });
            }

            res.status(201).json({
              success: true,
              message: "Health metric added successfully",
              action: "created",
              metricId: insertResult.insertId
            });
          });
        }
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

// Add these routes to your doctor routes file (e.g., doctorRoutes.js)

// POST - Add new medical record
router.post("/medical-records", authenticateDoctor, (req, res) => {
  try {
    console.log("Adding medical record for doctor:", req.doctor.id);
    console.log("Medical record data:", req.body);

    const {
      patientId,
      type,
      diagnosis,
      prescription,
      nextCheckup,
      notes
    } = req.body;

    // Validation
    if (!patientId || !type || !diagnosis) {
      return res.status(400).json({
        success: false,
        message: "Patient ID, examination type, and diagnosis are required"
      });
    }
    // ----------------------------------------------------------------------------------

    const sql = `
      INSERT INTO medical_records (
        patient_id, 
        doctor_id, 
        examination_type, 
        diagnosis, 
        prescription, 
        next_checkup_date, 
        additional_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      patientId,
      req.doctor.id, // From authenticated doctor token
      type,
      diagnosis,
      prescription || null,
      nextCheckup || null,
      notes || null
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Database error adding medical record:", err);
        return res.status(500).json({
          success: false,
          message: "Database error adding medical record",
          details: err.message
        });
      }

      console.log("Medical record added successfully, ID:", result.insertId);

      res.json({
        success: true,
        message: "Medical record added successfully",
        data: {
          id: result.insertId,
          patientId,
          type,
          diagnosis,
          prescription,
          nextCheckup,
          notes,
          doctorId: req.doctor.id,
          createdAt: new Date()
        }
      });
    });

  } catch (error) {
    console.error("Unexpected error adding medical record:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      details: error.message
    });
  }
});

// GET - Fetch medical records for a specific patient (for doctor to view)
router.get("/patients/:patientId/medical-records", authenticateDoctor, (req, res) => {
  try {
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
        console.error("Database error fetching medical records:", err);
        return res.status(500).json({
          success: false,
          message: "Database error fetching medical records",
          details: err.message
        });
      }

      const transformedRecords = results.map(record => ({
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
        updatedAt: record.updated_at
      }));

      res.json({
        success: true,
        message: "Medical records retrieved successfully",
        data: transformedRecords,
        count: transformedRecords.length
      });
    });

  } catch (error) {
    console.error("Unexpected error fetching medical records:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      details: error.message
    });
  }
});

// GET - Fetch all medical records created by the current doctor
router.get("/my-medical-records", authenticateDoctor, (req, res) => {
  try {
    const sql = `
      SELECT 
        mr.*
      FROM medical_records mr
      WHERE mr.doctor_id = ?
      ORDER BY mr.created_at DESC
    `;

    db.query(sql, [req.doctor.id], (err, results) => {
      if (err) {
        console.error("Database error fetching doctor's medical records:", err);
        return res.status(500).json({
          success: false,
          message: "Database error fetching medical records",
          details: err.message
        });
      }

      const transformedRecords = results.map(record => ({
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
        count: transformedRecords.length
      });
    });

  } catch (error) {
    console.error("Unexpected error fetching doctor's medical records:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      details: error.message
    });
  }
});
// doctorRoute.js
// Add this route to your doctor routes file for better performance

// GET - Get count of medical records created by current doctor
router.get("/medical-records/count", authenticateDoctor, (req, res) => {
  try {
    console.log("Fetching medical records count for doctor:", req.doctor.id);

    const sql = `
      SELECT COUNT(*) as total_records
      FROM medical_records 
      WHERE doctor_id = ?
    `;

    db.query(sql, [req.doctor.id], (err, results) => {
      if (err) {
        console.error("Database error fetching medical records count:", err);
        return res.status(500).json({
          success: false,
          message: "Database error fetching records count",
          details: err.message
        });
      }

      const count = results[0].total_records;
      console.log("✅ Records count retrieved:", count);

      res.json({
        success: true,
        message: "Records count retrieved successfully",
        data: {
          count: count
        }
      });
    });

  } catch (error) {
    console.error("Unexpected error fetching records count:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      details: error.message
    });
  }
});

// BONUS: You can also add a route that gets counts for different time periods
router.get("/dashboard/stats", authenticateDoctor, (req, res) => {
  try {
    console.log("Fetching dashboard statistics for doctor:", req.doctor.id);

    // Get various counts in a single query
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
        console.error("Database error fetching dashboard stats:", err);
        return res.status(500).json({
          success: false,
          message: "Database error fetching dashboard statistics",
          details: err.message
        });
      }

      const stats = results[0];
      console.log("✅ Dashboard statistics retrieved:", stats);

      res.json({
        success: true,
        message: "Dashboard statistics retrieved successfully",
        data: {
          totalRecords: stats.total_records,
          todayRecords: stats.today_records,
          weekRecords: stats.week_records,
          monthRecords: stats.month_records,
          uniquePatients: stats.unique_patients
        }
      });
    });

  } catch (error) {
    console.error("Unexpected error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      details: error.message
    });
  }
});


module.exports = router;