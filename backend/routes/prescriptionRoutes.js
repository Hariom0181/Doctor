const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { body, validationResult } = require("express-validator");

// Create prescription
router.post(
  "/create",
  [
    body("patientId").notEmpty().isInt().withMessage("Valid patient ID is required"),
    body("doctorId").notEmpty().isInt().withMessage("Valid doctor ID is required"),
    body("medicationName").notEmpty().trim().withMessage("Medication name is required"),
    body("dosage").notEmpty().trim().withMessage("Dosage is required"),
    body("frequency").notEmpty().isIn(['once','twice','thrice','four_times','weekly','as_needed']).withMessage("Valid frequency is required"),
    body("duration").notEmpty().trim().withMessage("Duration is required"),
    body("startDate").notEmpty().isDate().withMessage("Valid start date is required")
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
    }

    const {
      patientId,
      doctorId,
      medicationName,
      dosage,
      frequency,
      duration,
      instructions,
      startDate,
      endDate
    } = req.body;

    const sql = `
      INSERT INTO prescriptions 
      (patient_id, doctor_id, medication_name, dosage, frequency, duration, instructions, start_date, end_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `;

    db.query(
      sql,
      [patientId, doctorId, medicationName, dosage, frequency, duration, instructions, startDate, endDate],
      (err, result) => {
        if (err) {
          console.error("Error creating prescription:", err);
          return res.status(500).json({
            success: false,
            message: "Error creating prescription"
          });
        }

        res.status(201).json({
          success: true,
          message: "Prescription created successfully",
          prescriptionId: result.insertId
        });
      }
    );
  }
);

// Get patient's prescriptions
router.get("/patient/:patientId", (req, res) => {
  const { patientId } = req.params;
  const { status } = req.query; // Optional filter by status

  let sql = `
    SELECT 
      p.id,
      p.medication_name,
      p.dosage,
      p.frequency,
      p.duration,
      p.instructions,
      p.start_date,
      p.end_date,
      p.status,
      p.created_at,
      CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
      d.specialization
    FROM prescriptions p
    LEFT JOIN doctors d ON p.doctor_id = d.id
    WHERE p.patient_id = ?
  `;

  const params = [patientId];

  if (status) {
    sql += " AND p.status = ?";
    params.push(status);
  }

  sql += " ORDER BY p.created_at DESC";

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching prescriptions:", err);
      return res.status(500).json({
        success: false,
        message: "Error fetching prescriptions"
      });
    }

    res.json({
      success: true,
      data: results,
      count: results.length
    });
  });
});

// Get doctor's prescribed medications
router.get("/doctor/:doctorId", (req, res) => {
  const { doctorId } = req.params;

  const sql = `
    SELECT 
      p.id,
      p.medication_name,
      p.dosage,
      p.frequency,
      p.duration,
      p.start_date,
      p.status,
      p.created_at,
      CONCAT(pt.firstName, ' ', pt.lastName) as patient_name,
      pt.id as patient_id
    FROM prescriptions p
    LEFT JOIN patients pt ON p.patient_id = pt.id
    WHERE p.doctor_id = ?
    ORDER BY p.created_at DESC
  `;

  db.query(sql, [doctorId], (err, results) => {
    if (err) {
      console.error("Error fetching doctor prescriptions:", err);
      return res.status(500).json({
        success: false,
        message: "Error fetching prescriptions"
      });
    }

    res.json({
      success: true,
      data: results,
      count: results.length
    });
  });
});

// Update prescription status
router.patch("/:prescriptionId/status", (req, res) => {
  const { prescriptionId } = req.params;
  const { status } = req.body;

  const validStatuses = ['active', 'completed', 'stopped'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status"
    });
  }

  const sql = "UPDATE prescriptions SET status = ?, updated_at = NOW() WHERE id = ?";
  
  db.query(sql, [status, prescriptionId], (err, result) => {
    if (err) {
      console.error("Error updating prescription:", err);
      return res.status(500).json({
        success: false,
        message: "Error updating prescription"
      });
    }

    res.json({
      success: true,
      message: "Prescription status updated successfully"
    });
  });
});

// Get patient's current medications for a specific doctor
router.get("/patient/:patientId/doctor/:doctorId", (req, res) => {
  const { patientId, doctorId } = req.params;

  const sql = `
    SELECT 
      id,
      medication_name,
      dosage,
      frequency,
      duration,
      instructions,
      start_date,
      end_date,
      status
    FROM prescriptions
    WHERE patient_id = ? AND doctor_id = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [patientId, doctorId], (err, results) => {
    if (err) {
      console.error("Error fetching prescriptions:", err);
      return res.status(500).json({
        success: false,
        message: "Error fetching prescriptions"
      });
    }

    res.json({
      success: true,
      data: results,
      count: results.length
    });
  });
});

module.exports = router;