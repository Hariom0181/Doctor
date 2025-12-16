const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { body, validationResult } = require("express-validator");

// Create new appointment
router.post(
  "/create",
  [
    body("patientId").notEmpty().isInt().withMessage("Valid patient ID is required"),
    body("doctorId").notEmpty().isInt().withMessage("Valid doctor ID is required"),
    body("appointmentDate").notEmpty().isDate().withMessage("Valid date is required"),
    body("appointmentTime").notEmpty().withMessage("Time is required"),
    body("appointmentType").notEmpty().withMessage("Appointment type is required"),
    body("reason").optional()
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

    const { patientId, doctorId, appointmentDate, appointmentTime, appointmentType, reason, notes } = req.body;

    const sql = `
      INSERT INTO appointments 
      (patient_id, doctor_id, appointment_date, appointment_time, appointment_type, reason, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

    db.query(
      sql,
      [patientId, doctorId, appointmentDate, appointmentTime, appointmentType, reason, notes],
      (err, result) => {
        if (err) {
          console.error("Error creating appointment:", err);
          return res.status(500).json({
            success: false,
            message: "Error creating appointment"
          });
        }

        res.status(201).json({
          success: true,
          message: "Appointment booked successfully!",
          appointmentId: result.insertId
        });
      }
    );
  }
);

// Get patient's appointments
router.get("/patient/:patientId", (req, res) => {
  const { patientId } = req.params;

  const sql = `
    SELECT 
      a.id,
      a.appointment_date,
      a.appointment_time,
      a.appointment_type,
      a.status,
      a.reason,
      a.notes,
      a.created_at,
      CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
      d.specialization,
      d.current_hospital
    FROM appointments a
    LEFT JOIN doctors d ON a.doctor_id = d.id
    WHERE a.patient_id = ?
    ORDER BY a.appointment_date DESC, a.appointment_time DESC
  `;

  db.query(sql, [patientId], (err, results) => {
    if (err) {
      console.error("Error fetching appointments:", err);
      return res.status(500).json({
        success: false,
        message: "Error fetching appointments"
      });
    }

    res.json({
      success: true,
      data: results,
      count: results.length
    });
  });
});

// Update appointment status
router.patch("/:appointmentId/status", (req, res) => {
  const { appointmentId } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status"
    });
  }

  const sql = "UPDATE appointments SET status = ?, updated_at = NOW() WHERE id = ?";
  
  db.query(sql, [status, appointmentId], (err, result) => {
    if (err) {
      console.error("Error updating appointment:", err);
      return res.status(500).json({
        success: false,
        message: "Error updating appointment"
      });
    }

    res.json({
      success: true,
      message: "Appointment status updated successfully"
    });
  });
});

// Delete/Cancel appointment
router.delete("/:appointmentId", (req, res) => {
  const { appointmentId } = req.params;

  const sql = "UPDATE appointments SET status = 'cancelled', updated_at = NOW() WHERE id = ?";
  
  db.query(sql, [appointmentId], (err, result) => {
    if (err) {
      console.error("Error cancelling appointment:", err);
      return res.status(500).json({
        success: false,
        message: "Error cancelling appointment"
      });
    }

    res.json({
      success: true,
      message: "Appointment cancelled successfully"
    });
  });
});

module.exports = router;