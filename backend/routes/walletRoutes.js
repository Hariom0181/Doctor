const express = require("express");
const router = express.Router();
const db = require("../config/db");
const jwt = require("jsonwebtoken");

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

// Get wallet balance for a patient
router.get('/balance/:patientId', authenticatePatient, (req, res) => {
  try {
    const { patientId } = req.params;

    // Security check: Patient can only access their own wallet
    if (patientId != req.patient.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Calculate balance from transactions
    const sql = `
      SELECT 
        COALESCE(SUM(CASE 
          WHEN transaction_type IN ('add_money', 'refund', 'partial_refund') THEN amount
          WHEN transaction_type = 'debit' THEN -amount
          ELSE 0
        END), 0) as balance
      FROM wallet_transactions
      WHERE patient_id = ? AND status = 'completed'
    `;

    db.query(sql, [patientId], (err, results) => {
      if (err) {
        console.error('Error fetching wallet balance:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching wallet balance'
        });
      }

      res.json({
        success: true,
        balance: parseFloat(results[0].balance || 0).toFixed(2)
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

// Get wallet transaction history
router.get('/transactions/:patientId', authenticatePatient, (req, res) => {
  try {
    const { patientId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    // Security check
    if (patientId != req.patient.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const sql = `
      SELECT 
        wt.*,
        vc.scheduled_date,
        vc.scheduled_time,
        CONCAT(d.first_name, ' ', d.last_name) as doctor_name
      FROM wallet_transactions wt
      LEFT JOIN video_consultations vc ON wt.consultation_id = vc.id
      LEFT JOIN doctors d ON vc.doctor_id = d.id
      WHERE wt.patient_id = ?
      ORDER BY wt.created_at DESC
      LIMIT ? OFFSET ?
    `;

    db.query(sql, [patientId, parseInt(limit), parseInt(offset)], (err, results) => {
      if (err) {
        console.error('Error fetching transactions:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching transactions'
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

// Add money to wallet (Demo payment)
router.post('/add-money', authenticatePatient, (req, res) => {
  try {
    const { patientId, amount } = req.body;

    // Security check
    if (patientId != req.patient.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    // Demo payment - generate fake transaction ID
    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

    // First, get current balance
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

    db.query(getBalanceSql, [patientId], (err, balanceResults) => {
      if (err) {
        console.error('Error fetching balance:', err);
        return res.status(500).json({
          success: false,
          message: 'Error processing transaction'
        });
      }

      const currentBalance = parseFloat(balanceResults[0].balance || 0);
      const newBalance = currentBalance + parseFloat(amount);

      // Insert transaction
      const insertSql = `
        INSERT INTO wallet_transactions 
        (patient_id, transaction_type, amount, balance_after, description, transaction_id, payment_method, status)
        VALUES (?, 'add_money', ?, ?, 'Money added to wallet', ?, 'demo_payment', 'completed')
      `;

      db.query(insertSql, [patientId, amount, newBalance, transactionId], (insertErr, result) => {
        if (insertErr) {
          console.error('Error adding money:', insertErr);
          return res.status(500).json({
            success: false,
            message: 'Error adding money to wallet'
          });
        }

        res.json({
          success: true,
          message: 'Money added successfully',
          transactionId: transactionId,
          amount: parseFloat(amount).toFixed(2),
          newBalance: newBalance.toFixed(2)
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