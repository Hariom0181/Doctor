const express = require("express");
const router = express.Router();
const db = require("../config/db");
const jwt = require("jsonwebtoken");

// Middleware to authenticate doctor
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

// Middleware to authenticate patient
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
    req.patient = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
};

// ==================== DOCTOR ENDPOINTS ====================

// Set/Update Doctor Availability
router.post('/doctor/availability', authenticateDoctor, (req, res) => {
  try {
    const doctorId = req.doctor.id; /////take
    // const { doctorID} = req.params;  
    

    const { availability } = req.body; // Array of availability objects

    if (!availability || !Array.isArray(availability)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid availability data'
      });
    }

    // Delete existing availability for this doctor
    const deleteSql = 'DELETE FROM doctor_availability WHERE doctor_id = ?';
    console.log("JWT doctor id used:", req.doctor.id);

    
    db.query(deleteSql, [doctorId], (deleteErr) => {
      if (deleteErr) {
        console.error('Error deleting old availability:', deleteErr);
        return res.status(500).json({
          success: false,
          message: 'Error updating availability'
        });
      }

      // Insert new availability
      const insertPromises = availability
        .filter(slot => slot.is_available)
        .map(slot => {
          return new Promise((resolve, reject) => {
            const insertSql = `
              INSERT INTO doctor_availability 
              (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_available)
              VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            db.query(
              insertSql,
              [doctorId, slot.day_of_week, slot.start_time, slot.end_time, slot.slot_duration_minutes || 30, true],
              (err, result) => {
                if (err) reject(err);
                else resolve(result);
              }
            );
          });
        });

      Promise.all(insertPromises)
        .then(() => {
          res.json({
            success: true,
            message: 'Availability updated successfully'
          });
        })
        .catch(err => {
          console.error('Error inserting availability:', err);
          res.status(500).json({
            success: false,
            message: 'Error updating availability'
          });
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

// Get Doctor's Availability
router.get('/doctor/availability/:doctorId', (req, res) => {
  try {
    const { doctorId } = req.params;

    const sql = `
      SELECT * FROM doctor_availability
      WHERE doctor_id = ?
      ORDER BY day_of_week, start_time
    `;

    db.query(sql, [doctorId], (err, results) => {
      if (err) {
        console.error('Error fetching availability:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching availability'
        });
      }

      res.json({
        success: true,
        data: results
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

// Set/Update Consultation Fees
router.post('/doctor/consultation-fees', authenticateDoctor, (req, res) => {
  try {
    const doctorId = req.doctor.id;
    const { fees } = req.body; // Array of fee objects

    if (!fees || !Array.isArray(fees)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid fee data'
      });
    }

    // Delete existing fees
    const deleteSql = 'DELETE FROM consultation_fees WHERE doctor_id = ?';
    
    db.query(deleteSql, [doctorId], (deleteErr) => {
      if (deleteErr) {
        console.error('Error deleting old fees:', deleteErr);
        return res.status(500).json({
          success: false,
          message: 'Error updating fees'
        });
      }

      // Insert new fees
      const insertPromises = fees.map(fee => {
        return new Promise((resolve, reject) => {
          const insertSql = `
            INSERT INTO consultation_fees 
            (doctor_id, duration_minutes, fee, is_active)
            VALUES (?, ?, ?, ?)
          `;
          
          db.query(
            insertSql,
            [doctorId, fee.duration_minutes, fee.fee, true],
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );
        });
      });

      Promise.all(insertPromises)
        .then(() => {
          res.json({
            success: true,
            message: 'Consultation fees updated successfully'
          });
        })
        .catch(err => {
          console.error('Error inserting fees:', err);
          res.status(500).json({
            success: false,
            message: 'Error updating fees'
          });
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

// Get Doctor's Consultation Fees
router.get('/doctor/consultation-fees/:doctorId', (req, res) => {
  try {
    const { doctorId } = req.params;

    const sql = `
      SELECT * FROM consultation_fees
      WHERE doctor_id = ? AND is_active = true
      ORDER BY duration_minutes
    `;

    db.query(sql, [doctorId], (err, results) => {
      if (err) {
        console.error('Error fetching fees:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching consultation fees'
        });
      }

      res.json({
        success: true,
        data: results
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

// Get Available Time Slots for a Doctor on a Specific Date
router.get('/doctor/:doctorId/available-slots', (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query; // Format: YYYY-MM-DD

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    // Get day of week (1=Monday, 7=Sunday)
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay() || 7; // Convert Sunday from 0 to 7

    // Get doctor's availability for this day
    const availabilitySql = `
      SELECT * FROM doctor_availability
      WHERE doctor_id = ? AND day_of_week = ? AND is_available = true
    `;

    db.query(availabilitySql, [doctorId, dayOfWeek], (err, availability) => {
      if (err) {
        console.error('Error fetching availability:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching availability'
        });
      }

      if (availability.length === 0) {
        return res.json({
          success: true,
          data: [],
          message: 'Doctor not available on this day'
        });
      }

      const slot = availability[0];

      // Get existing bookings for this date
      const bookingsSql = `
        SELECT scheduled_time, duration_minutes
        FROM video_consultations
        WHERE doctor_id = ? 
        AND scheduled_date = ?
        AND status IN ('pending_approval', 'confirmed', 'in_progress')
      `;

      db.query(bookingsSql, [doctorId, date], (bookErr, bookings) => {
        if (bookErr) {
          console.error('Error fetching bookings:', bookErr);
          return res.status(500).json({
            success: false,
            message: 'Error checking availability'
          });
        }

        // Generate time slots
        const slots = [];
        const startTime = slot.start_time;
        const endTime = slot.end_time;
        const slotDuration = slot.slot_duration_minutes;

        let currentTime = startTime;
        
        while (currentTime < endTime) {
          // Check if this slot is booked
          const isBooked = bookings.some(booking => {
            return booking.scheduled_time === currentTime;
          });

          slots.push({
            time: currentTime,
            available: !isBooked
          });

          // Add slot duration to current time
          const [hours, minutes] = currentTime.split(':');
          const totalMinutes = parseInt(hours) * 60 + parseInt(minutes) + slotDuration;
          const newHours = Math.floor(totalMinutes / 60);
          const newMinutes = totalMinutes % 60;
          currentTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}:00`;
        }

        res.json({
          success: true,
          data: slots,
          slotDuration: slotDuration
        });
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

module.exports = router;