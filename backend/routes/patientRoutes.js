const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const db = require("../config/db");
const jwt = require("jsonwebtoken"); 

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


module.exports = router;