const express = require("express");
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bookingRoutes = require('./bookingRoutes');

const app = express();

//CORS and JSON parsing/middleware
app.use(cors());
app.use(express.json());

// database configs
const db = mysql.createConnection({
    host: "localHost",
    user: "root",
    password:"",
    database: "groommate",
    multipleStatements: true 
});

// Make db available to routes
app.locals.db = db;

//Api routes /api/booking
app.use('/api/booking', bookingRoutes);
db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database');

    // Verify tables exist
    const checkTables = `
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'groommate' 
        AND table_name IN ('signup', 'appointments', 'services', 'reviews')
    `;
    
    db.query(checkTables, (err, results) => {
        if (err) {
            console.error('Error checking tables:', err);
            return;
        }
        
        if (results[0].count < 4) {
            console.error('Missing required tables. Please run database setup script.');
        } else {
            console.log('All required tables exist');
        }
    });
});

// Add global error handler for database queries
const queryWithErrorHandling = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) {
                console.error('Database Error:', err);
                reject(err);
                return;
            }
            resolve(results);
        });
    });
};

// error handler for lost connections
db.on('error', function(err) {
    console.error('Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Reconnecting to database...');
        db.connect();
    } else {
        throw err;
    }
});

app.post('/api/booking/callback', (req, res) => {
    const body = req.body;

    console.log("M-PESA Callback Received:", JSON.stringify(body, null, 2));

    // Check if STKCallback exists
    if (body.Body && body.Body.stkCallback) {
        const callback = body.Body.stkCallback;
        const merchantRequestID = callback.MerchantRequestID;
        const checkoutRequestID = callback.CheckoutRequestID;
        const resultCode = callback.ResultCode;
        const resultDesc = callback.ResultDesc;

        let amount = null;
        let mpesaReceiptNumber = null;
        let phoneNumber = null;

        // Extract details if the transaction was successful
        if (resultCode === 0 && callback.CallbackMetadata) {
            const metadata = callback.CallbackMetadata.Item;

            for (let item of metadata) {
                if (item.Name === "Amount") amount = item.Value;
                if (item.Name === "MpesaReceiptNumber") mpesaReceiptNumber = item.Value;
                if (item.Name === "PhoneNumber") phoneNumber = item.Value;
            }
        }

        // Save to your database
        const sql = `INSERT INTO mpesa_transactions 
            (merchantRequestID, checkoutRequestID, resultCode, resultDesc, amount, mpesaReceiptNumber, phoneNumber) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`;

        db.query(sql, [
            merchantRequestID,
            checkoutRequestID,
            resultCode,
            resultDesc,
            amount,
            mpesaReceiptNumber,
            phoneNumber
        ], (err, result) => {
            if (err) {
                console.error("DB Insert Error:", err);
                return res.status(500).send("Error saving transaction");
            }
            console.log("Transaction saved to database");
            res.sendStatus(200); // Tell Safaricom you received it
        });
    } else {
        console.warn("Invalid STK Callback format");
        res.sendStatus(400);
    }
});


// Upload configuration
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

// Configure multer for image upload with error handling
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, 'uploads/'));
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function(req, file, cb) {
       console.log('Uploading file:', file);
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Only jpg, jpeg, png and gif files are allowed. Received: ${file.mimetype}`));
        }
    },
    limits: {
        fileSize: 20 * 1024
    }
});

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));


// Create services table
app.get('/admin/create-services-table', (req, res) => {
    const sql = `
        CREATE TABLE IF NOT EXISTS services (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            description TEXT,
            image VARCHAR(255)
        )
    `;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Services table created" });
    });
});

// Add endpoint to fetch services for the landing page
app.get('/services', (req, res) => {
    const sql = "SELECT * FROM services ORDER BY created_at DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

// Get all services
app.get('/admin/services', (req, res) => {
    db.query("SELECT * FROM services", (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

// Create new service
app.post('/admin/services', upload.single('image'), (req, res) => {
    try {
        const { name, price, description } = req.body;
        
        if (!name || !price || !description) {
            return res.status(400).json({ 
                error: "All fields are required" 
            });
        }

        if (!req.file) {
            return res.status(400).json({ 
                error: "Image is required" 
            });
        }

        const image = req.file.filename;
        
        const sql = "INSERT INTO services (name, price, description, image) VALUES (?, ?, ?, ?)";
        db.query(sql, [name, price, description, image], (err, result) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json({ 
                    error: "Failed to create service" 
                });
            }
            res.status(201).json({
                success: true,
                id: result.insertId,
                message: "Service created successfully"
            });
        });
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ 
            error: "Internal server error" 
        });
    }
});

app.put('/admin/services/:id', upload.single('image'), (req, res) => {
    try {
        const { name, price, description } = req.body;
        const id = req.params.id;
        
        if (!name || !price || !description) {
            return res.status(400).json({ 
                error: "All fields are required" 
            });
        }

        let sql, params;
        if (req.file) {
            sql = "UPDATE services SET name=?, price=?, description=?, image=? WHERE id=?";
            params = [name, price, description, req.file.filename, id];
        } else {
            sql = "UPDATE services SET name=?, price=?, description=? WHERE id=?";
            params = [name, price, description, id];
        }

        db.query(sql, params, (err, result) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json({ 
                    error: "Failed to update service" 
                });
            }
            res.json({
                success: true,
                message: "Service updated successfully"
            });
        });
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ 
            error: "Internal server error" 
        });
    }
});

app.delete('/admin/services/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM services WHERE id = ?";
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ 
                error: "Failed to delete service" 
            });
        }
        res.json({
            success: true,
            message: "Service deleted successfully"
        });
    });
});

app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size is too large. Max size is 5MB' });
        }
        return res.status(400).json({ error: error.message });
    }
    
    if (error.message.includes('Only')) {
        return res.status(400).json({ error: error.message });
    }
    
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

app.post('/groommate', (req, res) => {
    const sql = "INSERT INTO signup (`username`,`email`,`password`, `role`) VALUES (?, ?, ?, 'user')";
    const values = [
        req.body.username,
        req.body.email,
        req.body.password
    ];
    db.query(sql, values, (err, data) => {
        if(err) {
            console.error("MySQL Error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        return res.json({ success: true, data });
    });
})

// Services on home page fetch
app.get('/services', (req, res) => {
    const sql = "SELECT * FROM services ORDER BY id DESC";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ 
                error: "Failed to fetch services" 
            });
        }
        res.json(results);
    });
});

app.post('/admin/register', (req, res) => {
    // Example: check for a secret admin code (for demo purposes)
    const { username, email, password, adminCode } = req.body;
    if (adminCode !== "Groommate") {
        return res.status(403).json({ error: "Unauthorized" });
    }
    const sql = "INSERT INTO signup (`username`,`email`,`password`,`role`) VALUES (?, ?, ?, 'admin')";
    db.query(sql, [username, email, password], (err, data) => {
        if (err) {
            console.error("MySQL Error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        return res.json({ success: true, data });
    });
});
    // User Login Endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM signup WHERE email = ? AND password = ?";
    
    db.query(sql, [email, password], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        if (results.length > 0) {
            const user = results[0];
            return res.json({ 
                success: true, 
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        } else {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid email or password" 
            });
        }
    });
});

// Add or update the appointments endpoint
app.post('/appointments', async (req, res) => {
    try {
        const { username, date, time, haircut, style, mpesa } = req.body;

        // Validate required fields
        if (!username || !date || !time || !haircut || !style || !mpesa) {
            return res.status(400).json({
                error: "All fields are required"
            });
        }

        // Validate mpesa number format (starts with 07 and has 10 digits)
        const mpesaRegex = /^07\d{8}$/;
        if (!mpesaRegex.test(mpesa)) {
            return res.status(400).json({
                error: "Invalid Mpesa number format. Must start with 07 and be 10 digits long"
            });
        }

        // Check if user exists
        const userExists = await queryWithErrorHandling(
            "SELECT username FROM signup WHERE username = ?",
            [username]
        );

        if (userExists.length === 0) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        // Check for duplicate appointments
        const existingAppointment = await queryWithErrorHandling(
            "SELECT id FROM appointments WHERE date = ? AND time = ? AND status != 'cancelled'",
            [date, time]
        );

        if (existingAppointment.length > 0) {
            return res.status(409).json({
                error: "This time slot is already booked"
            });
        }

        // Create the appointment
        const result = await queryWithErrorHandling(
            `INSERT INTO appointments 
            (username, date, time, haircut, style, mpesa, status) 
            VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [username, date, time, haircut, style, mpesa]
        );

        console.log('Appointment created:', result);

        res.status(201).json({
            success: true,
            message: "Appointment booked successfully",
            appointmentId: result.insertId
        });

    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({
            error: "Failed to create appointment",
            details: error.message
        });
    }
});

app.post('/reviews', (req, res) => {
    const sql = "INSERT INTO reviews (`review`, `rating`, `username`) VALUES (?, ?, ?)";
    const values = [
        req.body.review,
        req.body.rating,
        req.body.username
    ];
    db.query(sql, values, (err, data) => {
        if (err) {
            console.error("MySQL Error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        return res.json({ success: true, data });
    });
});

app.get('/reviews', (req, res) => {
    db.query("SELECT * FROM reviews ORDER BY id DESC", (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});

app.get('/notifications', (req, res) => {
    // For demo, fetch all appointments. For real use, filter by user.
    db.query("SELECT * FROM appointments ORDER BY id DESC", (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});

// updates status
app.patch('/notifications/:id', (req, res) => {
    const id = req.params.id;
    db.query("UPDATE appointments SET status = 'done' WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ success: true });
    });
});

app.delete('/notifications/:id', (req, res) => {
    const id = req.params.id;
    // Only delete if status is 'done'
    db.query("DELETE FROM appointments WHERE id = ? AND status = 'done'", [id], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (result.affectedRows === 0) {
            return res.status(400).json({ error: "Can only delete receipts marked as done." });
        }
        res.json({ success: true });
    });
});

// Get all users
app.get('/admin/users', async (req, res) => {
    try {
        const results = await queryWithErrorHandling(
            "SELECT id, username, email, role, created_at FROM signup"
        );
        res.json(results);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
            error: "Failed to fetch users",
            details: error.message 
        });
    }
});

app.post('/admin/users', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({ 
                error: "Username, email and password are required" 
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        // Check if username or email already exists
        const checkExisting = await queryWithErrorHandling(
            "SELECT id FROM signup WHERE username = ? OR email = ?",
            [username, email]
        );

        if (checkExisting.length > 0) {
            return res.status(409).json({ 
                error: "Username or email already exists" 
            });
        }

        // Insert new user
        const result = await queryWithErrorHandling(
            "INSERT INTO signup (username, email, password, role) VALUES (?, ?, ?, ?)",
            [username, email, password, role || 'user']
        );

        res.json({ 
            success: true, 
            id: result.insertId,
            message: "User created successfully" 
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ 
            error: "Failed to create user",
            details: error.message 
        });
    }
});

// Update user
app.put('/admin/users/:id', async (req, res) => {
    try {
        const { username, email, role } = req.body;
        const userId = req.params.id;

        // Validate required fields
        if (!username || !email) {
            return res.status(400).json({ 
                error: "Username and email are required" 
            });
        }

        // Check if user exists
        const userExists = await queryWithErrorHandling(
            "SELECT id FROM signup WHERE id = ?",
            [userId]
        );

        if (userExists.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if new username/email conflicts with other users
        const checkConflict = await queryWithErrorHandling(
            "SELECT id FROM signup WHERE (username = ? OR email = ?) AND id != ?",
            [username, email, userId]
        );

        if (checkConflict.length > 0) {
            return res.status(409).json({ 
                error: "Username or email already in use" 
            });
        }

        // Update user
        await queryWithErrorHandling(
            "UPDATE signup SET username = ?, email = ?, role = ? WHERE id = ?",
            [username, email, role, userId]
        );

        res.json({ 
            success: true, 
            message: "User updated successfully" 
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ 
            error: "Failed to update user",
            details: error.message 
        });
    }
});

// Delete user
app.delete('/admin/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        // Check if user exists
        const userExists = await queryWithErrorHandling(
            "SELECT id FROM signup WHERE id = ?",
            [userId]
        );

        if (userExists.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        // Delete user
        await queryWithErrorHandling(
            "DELETE FROM signup WHERE id = ?",
            [userId]
        );

        res.json({ 
            success: true, 
            message: "User deleted successfully" 
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ 
            error: "Failed to delete user",
            details: error.message 
        });
    }
});

// Get all appointments
app.get('/admin/appointments', (req, res) => {
    db.query("SELECT * FROM appointments ORDER BY date, time", (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

// Update appointment status
app.patch('/admin/appointments/:id', (req, res) => {
    const { status } = req.body;
    const id = req.params.id;
    
    const sql = "UPDATE appointments SET status = ? WHERE id = ?";
    db.query(sql, [status, id], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        
        // After updating, get the appointment details to send notification
        const getAppointmentSql = `
            SELECT a.*, s.email 
            FROM appointments a
            LEFT JOIN signup s ON a.username = s.username
            WHERE a.id = ?
        `;
        
        db.query(getAppointmentSql, [id], (err, appointments) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Database error" });
            }
            
            if (appointments.length > 0) {
                const appointment = appointments[0];
                // You could implement email notifications here
                
                return res.json({
                    success: true,
                    message: `Appointment status updated to ${status}`,
                    appointment
                });
            }
            
            res.json({ success: true });
        });
    });
});

// Delete appointment
app.delete('/admin/appointments/:id', (req, res) => {
    const sql = "DELETE FROM appointments WHERE id = ?";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ success: true });
    });
});

app.get('/admin/analytics', async (req, res) => {
    try {
        // Get total users
        const [userCount] = await db.promise().query(
            "SELECT COUNT(*) as count FROM signup WHERE role = 'user'"
        );

        // Get total appointments and revenue
        const [appointmentStats] = await db.promise().query(
            "SELECT COUNT(*) as count, SUM(CASE " +
            "WHEN haircut = 'Clean Shave' THEN 300 " +
            "WHEN haircut = 'Trim' THEN 200 " +
            "WHEN haircut = 'Fade' THEN 400 " +
            "ELSE 0 END) as revenue " +
            "FROM appointments"
        );

        // Get appointments by status
        const [statusDistribution] = await db.promise().query(
            "SELECT status, COUNT(*) as value FROM appointments GROUP BY status"
        );

        // Get monthly revenue
        const [monthlyRevenue] = await db.promise().query(
            "SELECT DATE_FORMAT(date, '%Y-%m') as month, " +
            "SUM(CASE " +
            "WHEN haircut = 'Clean Shave' THEN 300 " +
            "WHEN haircut = 'Trim' THEN 200 " +
            "WHEN haircut = 'Fade' THEN 400 " +
            "ELSE 0 END) as revenue " +
            "FROM appointments " +
            "GROUP BY month " +
            "ORDER BY month DESC LIMIT 6"
        );

        // Get popular services
        const [popularServices] = await db.promise().query(
            "SELECT haircut as name, COUNT(*) as count " +
            "FROM appointments GROUP BY haircut ORDER BY count DESC"
        );

        res.json({
            totalUsers: userCount[0].count,
            totalAppointments: appointmentStats[0].count,
            revenue: appointmentStats[0].revenue || 0,
            appointmentsByStatus: statusDistribution,
            revenueByMonth: monthlyRevenue,
            popularServices: popularServices
        });
    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ error: "Error fetching analytics" });
    }
});



app.listen(8081, ()=> {
    console.log("listening");
})
