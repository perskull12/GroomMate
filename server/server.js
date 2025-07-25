const express = require("express");
const mysql = require('mysql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: "localHost",
    user: "root",
    password:"",
    database: "groommate"
})

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
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM signup WHERE email = ? AND password = ?";
    db.query(sql, [email, password], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        if (results.length > 0) {
            // Login successful - return user with role information
            const user = results[0];
            return res.json({ 
                success: true, 
                user: user,
                role: user.role // Include role for frontend routing
            });
        } else {
            // Invalid credentials
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }
    });
});

app.post('/appointments', (req, res) => {
    const { date, time, haircut, style, mpesa, username } = req.body;
    // Check for existing pending appointment for this user
    db.query(
        "SELECT * FROM appointments WHERE username = ? AND status = 'pending'",
        [username],
        (err, results) => {
            if (err) return res.status(500).json({ error: "Database error" });
            if (results.length > 0) {
                return res.status(400).json({ error: "You already have a pending appointment." });
            }
            // If not, insert new appointment
            const sql = "INSERT INTO appointments (`date`, `time`, `haircut`, `style`, `mpesa`, `username`, `status`) VALUES (?, ?, ?, ?, ?, ?, 'pending')";
            db.query(sql, [date, time, haircut, style, mpesa, username], (err, data) => {
                if (err) return res.status(500).json({ error: "Database error" });
                return res.json({ success: true, data });
            });
        }
    );
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

app.listen(8081, ()=> {
    console.log("listening");
})
