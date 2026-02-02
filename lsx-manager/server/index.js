import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer Config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        // Sanitize filename to strict ASCII to avoid issues
        // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        // cb(null, uniqueSuffix + '-' + file.originalname)
        // Using simple timestamp prefix
        cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'));
    }
})

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(uploadDir));

// Database setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    data TEXT
  );
  
  CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    data TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// API Endpoints for Orders
app.get('/api/orders', (req, res) => {
    try {
        const rows = db.prepare('SELECT data FROM orders').all();
        const orders = rows.map(row => JSON.parse(row.data));
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/orders', (req, res) => {
    try {
        const order = req.body;
        if (!order.id) return res.status(400).json({ error: 'Order ID is required' });

        const stmt = db.prepare('INSERT OR REPLACE INTO orders (id, data) VALUES (?, ?)');
        stmt.run(order.id, JSON.stringify(order));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/orders/:id', (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM orders WHERE id = ?');
        stmt.run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API Endpoints for Activity Logs
app.get('/api/logs', (req, res) => {
    try {
        const rows = db.prepare('SELECT data FROM activity_logs ORDER BY rowid DESC LIMIT 10000').all();
        const logs = rows.map(row => JSON.parse(row.data));
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/logs', (req, res) => {
    try {
        const log = req.body;
        if (!log.id) return res.status(400).json({ error: 'Log ID is required' });

        const stmt = db.prepare('INSERT OR REPLACE INTO activity_logs (id, data) VALUES (?, ?)');
        stmt.run(log.id, JSON.stringify(log));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API Endpoints for Settings (Templates)
app.get('/api/settings/:key', (req, res) => {
    try {
        const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(req.params.key);
        res.json(row ? JSON.parse(row.value) : null);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/settings/:key', (req, res) => {
    try {
        const value = req.body;
        const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
        stmt.run(req.params.key, JSON.stringify(value));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// File Upload Endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Return the accessible URL relative to server root (which client will prepend with base URL)
        // Or return full URL if preferred. Let's return relative path /uploads/filename
        res.json({
            success: true,
            url: `/uploads/${req.file.filename}`,
            filename: req.file.filename,
            originalName: req.file.originalname
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
