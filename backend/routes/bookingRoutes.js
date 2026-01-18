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

// ==================== PATIENT ENDPOINTS ====================

// Book Video Consultation
router.post('/book', authenticatePatient, (req, res) => {
  try {
    const patientId = req.patient.id;
    const { doctorId, scheduledDate, scheduledTime, durationMinutes, consultationFee } = req.body;
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();
    const diffMinutes = (scheduledDateTime - now) / (1000 * 60);
    console.log('⏰ Scheduled:', scheduledDateTime);
    console.log('⏰ Now:', now);
    console.log('⏰ Difference (minutes):', diffMinutes);

    console.log('📝 Booking request:', { patientId, doctorId, scheduledDate, scheduledTime, durationMinutes, consultationFee });

    // Validation
    if (!doctorId || !scheduledDate || !scheduledTime || !durationMinutes || !consultationFee) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
      
    }
    if (scheduledDateTime < now) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book a slot in the past'
      });
    }

    // Step 1: Check wallet balance
    const getBalanceSql = `
      SELECT 
        COALESCE(SUM(CASE 
          WHEN transaction_type IN ('add_money', 'refund', 'partial_refund') THEN amount
          WHEN transaction_type = 'debit' THEN -amount
          ELSE 0
        END), 0) as balance
      FROM wallet_transactions
      WHERE patient_id = ? AND status = 'completed'
    `;

    db.query(getBalanceSql, [patientId], (balanceErr, balanceResults) => {
      if (balanceErr) {
        console.error('Error checking balance:', balanceErr);
        return res.status(500).json({
          success: false,
          message: 'Error checking wallet balance'
        });
      }

      const balance = parseFloat(balanceResults[0].balance || 0);
      console.log('💰 Wallet balance:', balance, 'Fee:', consultationFee);

      if (balance < consultationFee) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient wallet balance',
          required: consultationFee,
          available: balance
        });
      }

      // Step 2: Check for existing pending/confirmed consultations
      const checkExistingSql = `
        SELECT id FROM video_consultations
        WHERE patient_id = ? 
        AND status IN ('pending_approval', 'confirmed', 'in_progress')
      `;

      db.query(checkExistingSql, [patientId], (existErr, existResults) => {
        if (existErr) {
          console.error('Error checking existing consultations:', existErr);
          return res.status(500).json({
            success: false,
            message: 'Error checking existing consultations'
          });
        }

        if (existResults.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'You already have a pending or confirmed consultation. Please complete or cancel it first.'
          });
        }

        // Step 3: Check if time slot is available (no conflicts)
        const checkSlotSql = `
          SELECT id FROM video_consultations
          WHERE doctor_id = ? 
          AND scheduled_date = ?
          AND scheduled_time = ?
          AND status IN ('pending_approval', 'confirmed', 'in_progress')
        `;

        db.query(checkSlotSql, [doctorId, scheduledDate, scheduledTime], (slotErr, slotResults) => {
          if (slotErr) {
            console.error('Error checking slot availability:', slotErr);
            return res.status(500).json({
              success: false,
              message: 'Error checking slot availability'
            });
          }

          if (slotResults.length > 0) {
            return res.status(400).json({
              success: false,
              message: 'This time slot is already booked. Please select another time.'
            });

          }
          if (diffMinutes <= 5) {
            return res.status(400).json({
              success: false,
              message: 'Cannot book consultation in the past or too close to current time'
            });
          }
          

          // Step 4: Create consultation booking
          const insertSql = `
            INSERT INTO video_consultations 
            (patient_id, doctor_id, scheduled_date, scheduled_time, duration_minutes, consultation_fee, status, payment_status)
            VALUES (?, ?, ?, ?, ?, ?, 'pending_approval', 'pending')
          `;

          db.query(
            insertSql,
            [patientId, doctorId, scheduledDate, scheduledTime, durationMinutes, consultationFee],
            (insertErr, result) => {
              if (insertErr) {
                console.error('Error creating booking:', insertErr);
                return res.status(500).json({
                  success: false,
                  message: 'Error creating booking'
                });
              }

              console.log('✅ Booking created successfully, ID:', result.insertId);

              res.json({
                success: true,
                message: 'Consultation booking request sent to doctor for approval',
                data: {
                  consultationId: result.insertId,
                  status: 'pending_approval'
                }
              });
            }
          );
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

// Get Patient's Video Consultations
router.get('/patient/:patientId', authenticatePatient, (req, res) => {
  try {
    const { patientId } = req.params;

    // Security check
    if (patientId != req.patient.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const sql = `
      SELECT 
        vc.*,
        CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
        d.specialization as doctor_specialization,
        d.current_hospital
      FROM video_consultations vc
      LEFT JOIN doctors d ON vc.doctor_id = d.id
      WHERE vc.patient_id = ?
      ORDER BY vc.scheduled_date DESC, vc.scheduled_time DESC
    `;

    db.query(sql, [patientId], (err, results) => {
      if (err) {
        console.error('Error fetching consultations:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching consultations'
        });
      }

      res.json({
        success: true,
        data: results,
        count: results.length
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

// Cancel Consultation (Patient)
router.delete('/:consultationId/cancel', authenticatePatient, (req, res) => {
  try {
    const { consultationId } = req.params;
    const patientId = req.patient.id;

    // Step 1: Get consultation details
    const getConsultationSql = `
      SELECT * FROM video_consultations
      WHERE id = ? AND patient_id = ?
    `;

    db.query(getConsultationSql, [consultationId, patientId], (err, results) => {
      if (err) {
        console.error('Error fetching consultation:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching consultation'
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Consultation not found'
        });
      }

      const consultation = results[0];

      // Check if already cancelled or completed
      if (['cancelled_by_patient', 'cancelled_by_doctor', 'completed'].includes(consultation.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel this consultation'
        });
      }

      // ✅ FIXED: Check cancellation time (5 minutes before)
      // Format the date properly to avoid timezone issues
      const scheduledDateStr = consultation.scheduled_date.toISOString().split('T')[0];
      const scheduledTimeStr = consultation.scheduled_time;
      const scheduledDateTime = new Date(`${scheduledDateStr}T${scheduledTimeStr}`);
      const now = new Date();
      const timeDiff = (scheduledDateTime - now) / (1000 * 60); // Minutes

      console.log('⏰ Scheduled date:', scheduledDateStr);
      console.log('⏰ Scheduled time:', scheduledTimeStr);
      console.log('⏰ Scheduled datetime:', scheduledDateTime);
      console.log('⏰ Current time:', now);
      console.log('⏰ Time until consultation:', timeDiff, 'minutes');

      if (timeDiff < 5) { // ✅ FIXED: Changed from 25 to 5
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel within 5 minutes of consultation time'
        });
      }

      // Step 2: Update consultation status
      const updateSql = `
        UPDATE video_consultations
        SET status = 'cancelled_by_patient', cancellation_reason = 'Cancelled by patient'
        WHERE id = ?
      `;

      db.query(updateSql, [consultationId], (updateErr) => {
        if (updateErr) {
          console.error('Error cancelling consultation:', updateErr);
          return res.status(500).json({
            success: false,
            message: 'Error cancelling consultation'
          });
        }

        // Step 3: Refund if payment was made
        if (consultation.payment_status === 'paid') {
          // Get current balance
          const getBalanceSql = `
            SELECT 
              COALESCE(SUM(CASE 
                WHEN transaction_type IN ('add_money', 'refund', 'partial_refund') THEN amount
                WHEN transaction_type = 'debit' THEN -amount
                ELSE 0
              END), 0) as balance
            FROM wallet_transactions
            WHERE patient_id = ? AND status = 'completed'
          `;

          db.query(getBalanceSql, [patientId], (balanceErr, balanceResults) => {
            if (balanceErr) {
              console.error('Error getting balance:', balanceErr);
              return res.status(500).json({
                success: false,
                message: 'Error processing refund'
              });
            }

            const currentBalance = parseFloat(balanceResults[0].balance || 0);
            const newBalance = currentBalance + parseFloat(consultation.consultation_fee);

            // Insert refund transaction
            const refundSql = `
              INSERT INTO wallet_transactions
              (patient_id, transaction_type, amount, balance_after, description, consultation_id, transaction_id, status)
              VALUES (?, 'refund', ?, ?, 'Consultation cancelled - Full refund', ?, ?, 'completed')
            `;

            const transactionId = `REFUND${Date.now()}`;

            db.query(
              refundSql,
              [patientId, consultation.consultation_fee, newBalance, consultationId, transactionId],
              (refundErr) => {
                if (refundErr) {
                  console.error('Error processing refund:', refundErr);
                  return res.status(500).json({
                    success: false,
                    message: 'Consultation cancelled but error processing refund'
                  });
                }

                // Update payment status
                const updatePaymentSql = `
                  UPDATE video_consultations
                  SET payment_status = 'refunded'
                  WHERE id = ?
                `;

                db.query(updatePaymentSql, [consultationId], (paymentErr) => {
                  if (paymentErr) {
                    console.error('Error updating payment status:', paymentErr);
                  }

                  res.json({
                    success: true,
                    message: 'Consultation cancelled and refund processed',
                    refundAmount: consultation.consultation_fee
                  });
                });
              }
            );
          });
        } else {
          // No payment made yet
          res.json({
            success: true,
            message: 'Consultation cancelled successfully'
          });
        }
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
// ==================== DOCTOR ENDPOINTS ====================

// Get Pending Approval Requests
router.get('/doctor/:doctorId/pending-requests', authenticateDoctor, (req, res) => {
  try {
    const { doctorId } = req.params;

    // Security check
    if (doctorId != req.doctor.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const sql = `
      SELECT 
        vc.*,
        CONCAT(p.firstName, ' ', p.lastName) as patient_name,
        p.phone as patient_phone,
        p.email as patient_email,
        p.bloodGroup as patient_blood_group,
        p.allergies as patient_allergies
      FROM video_consultations vc
      LEFT JOIN patients p ON vc.patient_id = p.id
      WHERE vc.doctor_id = ? AND vc.status = 'pending_approval'
      ORDER BY vc.created_at DESC
    `;

    db.query(sql, [doctorId], (err, results) => {
      if (err) {
        console.error('Error fetching pending requests:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching pending requests'
        });
      }

      res.json({
        success: true,
        data: results,
        count: results.length
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

// Get Doctor's All Consultations
router.get('/doctor/:doctorId/consultations', authenticateDoctor, (req, res) => {
  try {
    const { doctorId } = req.params;
    const { status } = req.query; // Optional filter

    // Security check
    if (doctorId != req.doctor.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    let sql = `
      SELECT 
        vc.*,
        CONCAT(p.firstName, ' ', p.lastName) as patient_name,
        p.phone as patient_phone,
        p.email as patient_email
      FROM video_consultations vc
      LEFT JOIN patients p ON vc.patient_id = p.id
      WHERE vc.doctor_id = ?
    `;

    const params = [doctorId];

    if (status) {
      sql += ` AND vc.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY vc.scheduled_date DESC, vc.scheduled_time DESC`;

    db.query(sql, params, (err, results) => {
      if (err) {
        console.error('Error fetching consultations:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching consultations'
        });
      }

      res.json({
        success: true,
        data: results,
        count: results.length
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

// Approve Consultation
router.post('/:consultationId/approve', authenticateDoctor, (req, res) => {
  try {
    const { consultationId } = req.params;
    const doctorId = req.doctor.id;

    console.log('✅ Approving consultation:', consultationId);

    // Step 1: Get consultation details
    const getConsultationSql = `
      SELECT * FROM video_consultations
      WHERE id = ? AND doctor_id = ?
    `;

    db.query(getConsultationSql, [consultationId, doctorId], (err, results) => {
      if (err) {
        console.error('Error fetching consultation:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching consultation'
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Consultation not found'
        });
      }

      const consultation = results[0];

      if (consultation.status !== 'pending_approval') {
        return res.status(400).json({
          success: false,
          message: 'Consultation is not pending approval'
        });
      }

      // Step 2: Check patient's wallet balance again
      const getBalanceSql = `
        SELECT 
          COALESCE(SUM(CASE 
            WHEN transaction_type IN ('add_money', 'refund', 'partial_refund') THEN amount
            WHEN transaction_type = 'debit' THEN -amount
            ELSE 0
          END), 0) as balance
        FROM wallet_transactions
        WHERE patient_id = ? AND status = 'completed'
      `;

      db.query(getBalanceSql, [consultation.patient_id], (balanceErr, balanceResults) => {
        if (balanceErr) {
          console.error('Error checking balance:', balanceErr);
          return res.status(500).json({
            success: false,
            message: 'Error checking wallet balance'
          });
        }

        const balance = parseFloat(balanceResults[0].balance || 0);

        if (balance < consultation.consultation_fee) {
          return res.status(400).json({
            success: false,
            message: 'Patient has insufficient wallet balance'
          });
        }

        // Step 3: Debit money from wallet
        const newBalance = balance - parseFloat(consultation.consultation_fee);
        const transactionId = `CONSULT${Date.now()}`;

        const debitSql = `
          INSERT INTO wallet_transactions
          (patient_id, transaction_type, amount, balance_after, description, consultation_id, transaction_id, status)
          VALUES (?, 'debit', ?, ?, 'Video consultation payment', ?, ?, 'completed')
        `;

        db.query(
          debitSql,
          [consultation.patient_id, consultation.consultation_fee, newBalance, consultationId, transactionId],
          (debitErr) => {
            if (debitErr) {
              console.error('Error debiting wallet:', debitErr);
              return res.status(500).json({
                success: false,
                message: 'Error processing payment'
              });
            }

            // Step 4: Update consultation status
            const updateSql = `
              UPDATE video_consultations
              SET status = 'confirmed', payment_status = 'paid'
              WHERE id = ?
            `;

            db.query(updateSql, [consultationId], (updateErr) => {
              if (updateErr) {
                console.error('Error updating consultation:', updateErr);
                return res.status(500).json({
                  success: false,
                  message: 'Error approving consultation'
                });
              }

              console.log('✅ Consultation approved and payment processed');

              res.json({
                success: true,
                message: 'Consultation approved and payment processed',
                data: {
                  consultationId: consultationId,
                  status: 'confirmed',
                  paymentStatus: 'paid'
                }
              });
            });
          }
        );
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

// Reject Consultation
router.post('/:consultationId/reject', authenticateDoctor, (req, res) => {
  try {
    const { consultationId } = req.params;
    const { reason } = req.body;
    const doctorId = req.doctor.id;

    console.log('❌ Rejecting consultation:', consultationId);

    // Verify consultation belongs to this doctor
    const getConsultationSql = `
      SELECT * FROM video_consultations
      WHERE id = ? AND doctor_id = ?
    `;

    db.query(getConsultationSql, [consultationId, doctorId], (err, results) => {
      if (err) {
        console.error('Error fetching consultation:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching consultation'
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Consultation not found'
        });
      }

      const consultation = results[0];

      if (consultation.status !== 'pending_approval') {
        return res.status(400).json({
          success: false,
          message: 'Consultation is not pending approval'
        });
      }

      // Update consultation status
      const updateSql = `
        UPDATE video_consultations
        SET status = 'rejected', rejection_reason = ?
        WHERE id = ?
      `;

      db.query(updateSql, [reason || 'Rejected by doctor', consultationId], (updateErr) => {
        if (updateErr) {
          console.error('Error rejecting consultation:', updateErr);
          return res.status(500).json({
            success: false,
            message: 'Error rejecting consultation'
          });
        }

        console.log('✅ Consultation rejected');

        res.json({
          success: true,
          message: 'Consultation request rejected',
          data: {
            consultationId: consultationId,
            status: 'rejected'
          }
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