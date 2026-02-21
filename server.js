const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || process.env.SERVER_PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'jw-transport-secret-key-change-in-production-2026';
const JWT_EXPIRES = '7d';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ==================== DATABASE SETUP ====================

const fs = require('fs');
const RENDER_DATA_DIR = '/opt/render/project/src/data';
if (process.env.NODE_ENV === 'production' && !fs.existsSync(RENDER_DATA_DIR)) {
  try { fs.mkdirSync(RENDER_DATA_DIR, { recursive: true }); } catch(e) { console.error('Cannot create data dir:', e); }
}
const DB_DIR = process.env.NODE_ENV === 'production' && fs.existsSync(RENDER_DATA_DIR) ? RENDER_DATA_DIR : __dirname;
const DB_PATH = path.join(DB_DIR, 'database.db');
console.log(`[DB] Database path: ${DB_PATH}`);
const db = new sqlite3.Database(DB_PATH);

// Enable WAL mode and foreign keys
db.run("PRAGMA journal_mode=WAL");
db.run("PRAGMA foreign_keys=ON");

// Promise wrappers
const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) { err ? reject(err) : resolve(this); });
});
const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => { err ? reject(err) : resolve(row); });
});
const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => { err ? reject(err) : resolve(rows); });
});

// Default empty data structure (must match frontend def)
const DEFAULT_DATA = {
  chauffeurs: [], voyages: [], depenses: [], factures: [],
  clients: [], vehicules: [], entretiens: [],
  settings: {
    tauxChauffeur: 80, tauxHelper: 65, tare: 4560,
    tpsNum: "", tvqNum: "",
    entreprise: { nom: "J&W Transport", adresse: "", ville: "", telephone: "", courriel: "", neq: "" },
    payrollSchedule: { frequency: "weekly", payDelay: 2, payDay: 5 }
  }
};

// Initialize database tables
async function initDB() {
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL COLLATE NOCASE,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS user_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      data TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Seed admin user if not exists
  const admin = await dbGet("SELECT id FROM users WHERE username = 'admin'");
  if (!admin) {
    const hash = await bcrypt.hash('admin', 10);
    const result = await dbRun(
      "INSERT INTO users (username, display_name, password_hash) VALUES ('admin', 'admin', ?)",
      [hash]
    );
    // Load admin seed data if available
    let seedData = DEFAULT_DATA;
    try {
      const seedFile = path.join(__dirname, 'seed-admin-data.json');
      const fs = require('fs');
      if (fs.existsSync(seedFile)) {
        seedData = JSON.parse(fs.readFileSync(seedFile, 'utf8'));
      }
    } catch (e) {
      console.log('No seed data file found, using defaults for admin');
    }
    await dbRun(
      "INSERT INTO user_data (user_id, data) VALUES (?, ?)",
      [result.lastID, JSON.stringify(seedData)]
    );
    console.log('Admin user created (username: admin, password: admin)');
  }

  console.log('Database initialized');
}

// ==================== AUTH MIDDLEWARE ====================

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requis' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, displayName } = req.body;

    if (!username || !username.trim() || username.length < 3) {
      return res.status(400).json({ error: "Nom d'utilisateur: 3 caractères min." });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ error: "Mot de passe: 4 caractères min." });
    }

    // Check if username exists
    const existing = await dbGet("SELECT id FROM users WHERE username = ?", [username.toLowerCase()]);
    if (existing) {
      return res.status(409).json({ error: "Ce nom d'utilisateur est déjà pris." });
    }

    // Create user
    const hash = await bcrypt.hash(password, 10);
    const result = await dbRun(
      "INSERT INTO users (username, display_name, password_hash) VALUES (?, ?, ?)",
      [username.toLowerCase(), displayName || username, hash]
    );

    // Initialize empty data for new user
    await dbRun(
      "INSERT INTO user_data (user_id, data) VALUES (?, ?)",
      [result.lastID, JSON.stringify(DEFAULT_DATA)]
    );

    // Generate token
    const token = jwt.sign(
      { userId: result.lastID, username: username.toLowerCase() },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      token,
      user: { username: username.toLowerCase(), displayName: displayName || username }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Remplir tous les champs." });
    }

    const user = await dbGet("SELECT * FROM users WHERE username = ?", [username.toLowerCase()]);
    if (!user) {
      return res.status(401).json({ error: "Nom d'utilisateur ou mot de passe incorrect." });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Nom d'utilisateur ou mot de passe incorrect." });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      token,
      user: { username: user.username, displayName: user.display_name }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Verify session / get current user
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await dbGet("SELECT username, display_name FROM users WHERE id = ?", [req.userId]);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json({ user: { username: user.username, displayName: user.display_name } });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==================== DATA ROUTES ====================

// Get user data
app.get('/api/data', authMiddleware, async (req, res) => {
  try {
    const row = await dbGet("SELECT data FROM user_data WHERE user_id = ?", [req.userId]);
    if (row) {
      res.json(JSON.parse(row.data));
    } else {
      // Create default data if missing
      await dbRun(
        "INSERT INTO user_data (user_id, data) VALUES (?, ?)",
        [req.userId, JSON.stringify(DEFAULT_DATA)]
      );
      res.json(DEFAULT_DATA);
    }
  } catch (error) {
    console.error('Get data error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Save user data (full blob replace)
app.put('/api/data', authMiddleware, async (req, res) => {
  try {
    const data = req.body;

    // Basic validation: ensure it has expected top-level keys
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Données invalides' });
    }

    const jsonStr = JSON.stringify(data);

    const existing = await dbGet("SELECT id FROM user_data WHERE user_id = ?", [req.userId]);
    if (existing) {
      await dbRun(
        "UPDATE user_data SET data = ?, updated_at = datetime('now') WHERE user_id = ?",
        [jsonStr, req.userId]
      );
    } else {
      await dbRun(
        "INSERT INTO user_data (user_id, data) VALUES (?, ?)",
        [req.userId, jsonStr]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Save data error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'JW Transport API is running',
    timestamp: new Date().toISOString()
  });
});

// ==================== STATIC FILES (Production) ====================

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// ==================== START SERVER ====================

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`JW Transport API running on http://localhost:${PORT}`);
    console.log(`Database: ${DB_PATH}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

module.exports = app;
