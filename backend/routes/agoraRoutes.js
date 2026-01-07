const express = require("express");
const router = express.Router();
const db = require("../config/db");
const jwt = require("jsonwebtoken");
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

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

// Generate Agora Token for Video Consultation
router.post('/generate-token/:consultationId', async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { userId, role } = req.body; // role: 'doctor' or 'patient'

    console.log('🎥 Generating Agora token for consultation:', consultationId);

    // Validate consultation exists and is confirmed
    const consultationSql = `
      SELECT * FROM video_consultations
      WHERE id = ? AND status = 'confirmed'
    `;

    db.query(consultationSql, [consultationId], (err, results) => {
      if (err) {
        console.error('Error fetching consultation:', err);
        return res.status(500).json({
          success: false,
          message: 'Error validating consultation'
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Consultation not found or not confirmed'
        });
      }

      const consultation = results[0];

      // Agora credentials
      const appId = process.env.AGORA_APP_ID;
      const appCertificate = process.env.AGORA_APP_CERTIFICATE;

      if (!appId || !appCertificate) {
        console.error('❌ Agora credentials not configured');
        return res.status(500).json({
          success: false,
          message: 'Video service not configured'
        });
      }

      // Channel name (unique per consultation)
      const channelName = `consultation_${consultationId}`;

      // User ID (unique identifier)
      const uid = userId || 0; // 0 = Agora will auto-generate

      // Token role (publisher = can send/receive, subscriber = can only receive)
      const agoraRole = RtcRole.PUBLISHER;

      // Token expiration (24 hours from now)
      const expirationTimeInSeconds = 86400; // 24 hours
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

      // Build token
      const token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        uid,
        agoraRole,
        privilegeExpiredTs
      );

      console.log('✅ Agora token generated successfully');

      // Store meeting info in database
      const updateSql = `
        UPDATE video_consultations
        SET meeting_id = ?
        WHERE id = ?
      `;

      db.query(updateSql, [channelName, consultationId], (updateErr) => {
        if (updateErr) {
          console.error('Error updating consultation:', updateErr);
        }

        res.json({
          success: true,
          data: {
            token: token,
            appId: appId,
            channelName: channelName,
            uid: uid
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

// Start Video Consultation
router.post('/start/:consultationId', authenticateDoctor, (req, res) => {
  try {
    const { consultationId } = req.params;
    const doctorId = req.doctor.id;

    console.log('▶️ Starting consultation:', consultationId);

    // Verify consultation
    const consultationSql = `
      SELECT * FROM video_consultations
      WHERE id = ? AND doctor_id = ? AND status = 'confirmed'
    `;

    db.query(consultationSql, [consultationId, doctorId], (err, results) => {
      if (err) {
        console.error('Error fetching consultation:', err);
        return res.status(500).json({
          success: false,
          message: 'Error validating consultation'
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Consultation not found or not confirmed'
        });
      }

      // Update status to in_progress
      const updateSql = `
        UPDATE video_consultations
        SET status = 'in_progress', meeting_started_at = NOW()
        WHERE id = ?
      `;

      db.query(updateSql, [consultationId], (updateErr) => {
        if (updateErr) {
          console.error('Error starting consultation:', updateErr);
          return res.status(500).json({
            success: false,
            message: 'Error starting consultation'
          });
        }

        console.log('✅ Consultation started');

        res.json({
          success: true,
          message: 'Consultation started successfully'
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

// End Video Consultation (with refund calculation)
router.post('/end/:consultationId', authenticateDoctor, (req, res) => {
  try {
    const { consultationId } = req.params;
    const doctorId = req.doctor.id;

    console.log('⏹️ Ending consultation:', consultationId);

    // Get consultation details
    const consultationSql = `
      SELECT * FROM video_consultations
      WHERE id = ? AND doctor_id = ? AND status = 'in_progress'
    `;

    db.query(consultationSql, [consultationId, doctorId], (err, results) => {
      if (err) {
        console.error('Error fetching consultation:', err);
        return res.status(500).json({
          success: false,
          message: 'Error validating consultation'
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Consultation not found or not in progress'
        });
      }

      const consultation = results[0];
      const meetingStartedAt = new Date(consultation.meeting_started_at);
      const meetingEndedAt = new Date();

      // Calculate actual duration in minutes
      const actualDurationMs = meetingEndedAt - meetingStartedAt;
      const actualDurationMinutes = Math.ceil(actualDurationMs / (1000 * 60));

      console.log('⏱️ Booked duration:', consultation.duration_minutes, 'minutes');
      console.log('⏱️ Actual duration:', actualDurationMinutes, 'minutes');

      // Update consultation status
      const updateSql = `
        UPDATE video_consultations
        SET status = 'completed', 
            meeting_ended_at = NOW(),
            actual_duration_minutes = ?
        WHERE id = ?
      `;

      db.query(updateSql, [actualDurationMinutes, consultationId], (updateErr) => {
        if (updateErr) {
          console.error('Error ending consultation:', updateErr);
          return res.status(500).json({
            success: false,
            message: 'Error ending consultation'
          });
        }

        // Calculate refund if ended early
        if (actualDurationMinutes < consultation.duration_minutes) {
          const unusedMinutes = consultation.duration_minutes - actualDurationMinutes;
          const refundAmount = (parseFloat(consultation.consultation_fee) / consultation.duration_minutes) * unusedMinutes;

          console.log('💰 Refund calculation:');
          console.log('   Unused minutes:', unusedMinutes);
          console.log('   Refund amount:', refundAmount);

          // Get current wallet balance
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
              console.error('Error getting balance:', balanceErr);
              return res.json({
                success: true,
                message: 'Consultation ended but error processing refund',
                actualDuration: actualDurationMinutes
              });
            }

            const currentBalance = parseFloat(balanceResults[0].balance || 0);
            const newBalance = currentBalance + refundAmount;

            // Insert refund transaction
            const refundSql = `
              INSERT INTO wallet_transactions
              (patient_id, transaction_type, amount, balance_after, description, consultation_id, transaction_id, status)
              VALUES (?, 'partial_refund', ?, ?, ?, ?, ?, 'completed')
            `;

            const transactionId = `REFUND${Date.now()}`;
            const description = `Partial refund for ${unusedMinutes} unused minutes`;

            db.query(
              refundSql,
              [consultation.patient_id, refundAmount, newBalance, description, consultationId, transactionId],
              (refundErr) => {
                if (refundErr) {
                  console.error('Error processing refund:', refundErr);
                }

                // Update payment status
                const updatePaymentSql = `
                  UPDATE video_consultations
                  SET payment_status = 'partial_refund'
                  WHERE id = ?
                `;

                db.query(updatePaymentSql, [consultationId], () => {
                  console.log('✅ Consultation ended with partial refund');

                  res.json({
                    success: true,
                    message: 'Consultation ended successfully',
                    actualDuration: actualDurationMinutes,
                    refundAmount: refundAmount.toFixed(2)
                  });
                });
              }
            );
          });
        } else {
          // No refund needed
          console.log('✅ Consultation ended, no refund needed');

          res.json({
            success: true,
            message: 'Consultation ended successfully',
            actualDuration: actualDurationMinutes,
            refundAmount: 0
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

module.exports = router;