const express = require("express");
const router = express.Router();
const { initiateSTKPush } = require('./mpesaconfig');

// Create mpesa_transactions table if it doesn't exist
const createMpesaTransactionsTable = (db) => {
    const sql = `
        CREATE TABLE IF NOT EXISTS mpesa_transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            checkout_request_id VARCHAR(100),
            result_code INT,
            result_desc VARCHAR(255),
            receipt_number VARCHAR(50),
            amount DECIMAL(10,2),
            phone_number VARCHAR(15),
            status VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `;
    
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error creating mpesa_transactions table:', err);
            return;
        }
        console.log('mpesa_transactions table created or already exists');
    });
};

// Add payment-related columns to appointments table if they don't exist
const addPaymentColumnsToAppointments = (db) => {
    const sql = `
        ALTER TABLE appointments 
        ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS mpesa_receipt VARCHAR(50),
        ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2),
        ADD COLUMN IF NOT EXISTS checkout_request_id VARCHAR(100)
    `;
    
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error adding payment columns to appointments table:', err);
            return;
        }
        console.log('Payment columns added to appointments table or already exist');
    });
};

// Initialize database tables
const initDatabase = (db) => {
    createMpesaTransactionsTable(db);
    addPaymentColumnsToAppointments(db);
};

// Middleware to initialize database when the router is used
router.use((req, res, next) => {
    if (req.app.locals.db && !req.app.locals.mpesaTablesInitialized) {
        initDatabase(req.app.locals.db);
        req.app.locals.mpesaTablesInitialized = true;
    }
    next();
});

// Initiate booking and M-Pesa STK push
router.post('/create-booking', async (req, res) => {
    try {
        const { phoneNumber, amount, bookingDetails } = req.body;
        
        // Validate required fields
        if (!phoneNumber || !amount || !bookingDetails) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }
        
        // Validate phone number format (starts with 07 and has 10 digits)
        const phoneRegex = /^07\d{8}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format. Must start with 07 and be 10 digits long'
            });
        }

        // Format phone number (remove leading 0 and add 254)
        const formattedPhone = `254${phoneNumber.slice(1)}`;

        // Initiate STK Push
        const stkPushResponse = await initiateSTKPush(formattedPhone, amount);
        
        // Extract user from session or request
        const username = req.body.username || (req.session && req.session.user ? req.session.user.username : null);
        
        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // Store booking details in appointments table with pending status
        const insertSql = `
            INSERT INTO appointments 
            (username, date, time, haircut, style, mpesa, status, checkout_request_id, payment_status) 
            VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, 'pending')
        `;
        
        const values = [
            username,
            bookingDetails.date,
            bookingDetails.time,
            bookingDetails.service,
            bookingDetails.style || '',
            phoneNumber,
            stkPushResponse.CheckoutRequestID
        ];

        req.app.locals.db.query(insertSql, values, (err, result) => {
            if (err) {
                console.error('Error creating appointment:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to create appointment',
                    error: err.message
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'STK push sent successfully',
                checkoutRequestID: stkPushResponse.CheckoutRequestID,
                responseDescription: stkPushResponse.ResponseDescription,
                appointmentId: result.insertId
            });
        });
    } catch (error) {
        console.error('STK Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'STK Push Failed', details: error.response?.data || error.message });
    };
});

// M-Pesa callback endpoint
router.post('/callback', async (req, res) => {
    try {
        // Extract callback data from M-Pesa response
        const { 
            ResultCode, 
            ResultDesc, 
            CheckoutRequestID,
            CallbackMetadata 
        } = req.body.Body.stkCallback;
        
        // Get transaction details from metadata if payment successful
        let transactionDetails = {
            receipt: null,
            amount: null,
            phone: null
        };
        
        if (ResultCode === 0 && CallbackMetadata && CallbackMetadata.Item) {
            CallbackMetadata.Item.forEach(item => {
                if (item.Name === 'MpesaReceiptNumber') transactionDetails.receipt = item.Value;
                if (item.Name === 'Amount') transactionDetails.amount = item.Value;
                if (item.Name === 'PhoneNumber') transactionDetails.phone = item.Value;
            });
        }

        // Update appointment status in database
        const status = ResultCode === 0 ? 'paid' : 'failed';
        
        const updateSql = `
            UPDATE appointments 
            SET 
                payment_status = ?,
                mpesa_receipt = ?,
                payment_amount = ?
            WHERE checkout_request_id = ?
        `;

        const updateValues = [
            status,
            transactionDetails.receipt,
            transactionDetails.amount,
            CheckoutRequestID
        ];

        req.app.locals.db.query(updateSql, updateValues, (err, result) => {
            if (err) {
                console.error('Error updating appointment:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update appointment',
                    error: err.message
                });
            }
            
            // Log the transaction
            const logSql = `
                INSERT INTO mpesa_transactions 
                (checkout_request_id, result_code, result_desc, receipt_number, amount, phone_number, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            const logValues = [
                CheckoutRequestID,
                ResultCode,
                ResultDesc,
                transactionDetails.receipt,
                transactionDetails.amount,
                transactionDetails.phone,
                status
            ];
            
            req.app.locals.db.query(logSql, logValues, (logErr) => {
                if (logErr) {
                    console.error('Error logging transaction:', logErr);
                }
                
                // Send response to M-Pesa
                res.status(200).json({ 
                    success: true,
                    message: 'Callback processed successfully',
                    resultCode: ResultCode,
                    status: status
                });
            });
        });
    } catch (error) {
        console.error('Callback error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process callback',
            error: error.message
        });
    }
});

// Get transaction status
router.get('/transaction/:checkoutRequestId', (req, res) => {
    const { checkoutRequestId } = req.params;
    
    const sql = `
        SELECT a.*, t.* 
        FROM appointments a
        LEFT JOIN mpesa_transactions t ON a.checkout_request_id = t.checkout_request_id
        WHERE a.checkout_request_id = ?
    `;
    
    req.app.locals.db.query(sql, [checkoutRequestId], (err, results) => {
        if (err) {
            console.error('Error fetching transaction:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch transaction',
                error: err.message
            });
        }
        
        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }
        
        res.status(200).json({
            success: true,
            transaction: results[0]
        });
    });
});

module.exports = router;