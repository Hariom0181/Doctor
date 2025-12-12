const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Get dashboard statistics
router.get("/stats", (req, res) => {
  // Get all stats in parallel using Promise.all
  const statsQueries = {
    totalPatients: "SELECT COUNT(*) as count FROM patients",
    totalRecords: "SELECT COUNT(*) as count FROM medical_records",
    totalDoctors: "SELECT COUNT(*) as count FROM doctors",
    recentRecords: "SELECT COUNT(*) as count FROM medical_records WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
  };

  Promise.all([
    new Promise((resolve, reject) => {
      db.query(statsQueries.totalPatients, (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(statsQueries.totalRecords, (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(statsQueries.totalDoctors, (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(statsQueries.recentRecords, (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count);
      });
    })
  ])
    .then(([totalPatients, totalRecords, totalDoctors, recentRecords]) => {
      // Calculate estimated savings (₹500 per avoided checkup)
      const avgCheckupCost = 500;
      const avoidedCheckups = Math.floor(recentRecords * 0.3); // Estimate 30% avoided
      const moneySaved = avoidedCheckups * avgCheckupCost;

      res.json({
        success: true,
        data: {
          totalPatients,
          totalRecords,
          totalDoctors,
          moneySaved,
          avoidedCheckups
        }
        
      });
    
    })
    .catch((err) => {
      console.error("Error fetching dashboard stats:", err);
      res.status(500).json({
        success: false,
        message: "Error fetching dashboard statistics"
      });
    });
});

// Get recent activities
router.get("/recent-activities", (req, res) => {
  const sql = `
    SELECT 
      mr.id,
      mr.examination_type,
      mr.created_at,
      CONCAT(p.firstName, ' ', p.lastName) as patient_name,
      CONCAT(d.first_name, ' ', d.last_name) as doctor_name
    FROM medical_records mr
    LEFT JOIN patients p ON mr.patient_id = p.id
    LEFT JOIN doctors d ON mr.doctor_id = d.id
    ORDER BY mr.created_at DESC
    LIMIT 10
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching recent activities:", err);
      return res.status(500).json({
        success: false,
        message: "Error fetching recent activities"
      });
    }

    const activities = results.map(record => ({
      id: record.id,
      type: record.examination_type,
      patientName: record.patient_name,
      doctorName: record.doctor_name,
      timestamp: record.created_at
    }));

    res.json({
      success: true,
      data: activities
    });
  });
});

// Search patients
router.get("/search-patients", (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({
      success: false,
      message: "Search query is required"
    });
  }

  const sql = `
    SELECT 
      id,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      bloodGroup
    FROM patients
    WHERE 
      firstName LIKE ? OR 
      lastName LIKE ? OR 
      email LIKE ? OR 
      phone LIKE ? OR
      CONCAT(firstName, ' ', lastName) LIKE ?
    LIMIT 10
  `;

  const searchTerm = `%${query}%`;
  
  db.query(
    sql, 
    [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm],
    (err, results) => {
      if (err) {
        console.error("Error searching patients:", err);
        return res.status(500).json({
          success: false,
          message: "Error searching patients"
        });
      }

      res.json({
        success: true,
        data: results,
        count: results.length
      });
    }
  );
});

// Get patient details with records
router.get("/patient/:patientId", (req, res) => {
  const { patientId } = req.params;

  // Get patient basic info
  const patientSql = `
    SELECT 
      id,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      bloodGroup,
      address,
      city,
      state
    FROM patients
    WHERE id = ?
  `;

  // Get patient's medical records
  const recordsSql = `
    SELECT 
      mr.id,
      mr.examination_type,
      mr.diagnosis,
      mr.prescription,
      mr.next_checkup_date,
      mr.created_at,
      CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
      d.specialization
    FROM medical_records mr
    LEFT JOIN doctors d ON mr.doctor_id = d.id
    WHERE mr.patient_id = ?
    ORDER BY mr.created_at DESC
  `;

  Promise.all([
    new Promise((resolve, reject) => {
      db.query(patientSql, [patientId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(recordsSql, [patientId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    })
  ])
    .then(([patient, records]) => {
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found"
        });
      }

      res.json({
        success: true,
        data: {
          patient,
          records
        }
      });
    })
    .catch((err) => {
      console.error("Error fetching patient details:", err);
      res.status(500).json({
        success: false,
        message: "Error fetching patient details"
      });
    });
});

// Get diagnosis analytics
router.get("/analytics/diagnoses", (req, res) => {
  const sql = `
    SELECT 
      examination_type,
      COUNT(*) as count,
      (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM medical_records)) as percentage
    FROM medical_records
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY examination_type
    ORDER BY count DESC
    LIMIT 5
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching diagnosis analytics:", err);
      return res.status(500).json({
        success: false,
        message: "Error fetching diagnosis analytics"
      });
    }

    res.json({
      success: true,
      data: results
    });
  });
});

module.exports = router;