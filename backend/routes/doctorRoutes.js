const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

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
          

          // Remove password from response
          const { password: _, ...doctorData } = doctor;

          res.json({
            success: true,
            message: "Login successful",
            doctor: {
              id: doctor.id,
              firstName: doctor.firstName,
              lastName: doctor.lastName,
              email: doctor.email,
              phone: doctor.phone,

            }
          });

        } catch (compareError) {
          console.error("Password comparison error:", compareError);
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

module.exports = router;