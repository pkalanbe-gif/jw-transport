const express = require('express');
const serverless = require('serverless-http');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getStore } = require('@netlify/blobs');

const app = express();
app.use(express.json({ limit: '10mb' }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const JWT_SECRET = process.env.JWT_SECRET || 'jw-transport-2026-netlify-fallback';
const JWT_EXPIRES = '7d';

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

// Seed data for admin (embedded to avoid filesystem issues)
let SEED_DATA = null;
try {
  SEED_DATA = require('../../seed-admin-data.json');
  // Add payrollSchedule if missing in seed
  if (SEED_DATA && SEED_DATA.settings && !SEED_DATA.settings.payrollSchedule) {
    SEED_DATA.settings.payrollSchedule = { frequency: "weekly", payDelay: 2, payDay: 5 };
  }
} catch (e) {
  SEED_DATA = DEFAULT_DATA;
}

// Helper: get Blobs stores
function usersStore() {
  return getStore({ name: 'users', consistency: 'strong' });
}
function dataStore() {
  return getStore({ name: 'user_data', consistency: 'strong' });
}

// Auth middleware
function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requis' });
  }
  try {
    const decoded = jwt.verify(h.split(' ')[1], JWT_SECRET);
    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

// ==================== API ROUTER ====================
// All routes use /api/ prefix since Netlify passes full URL path to Express

const router = express.Router();

// Register
router.post('/auth/register', async (req, res) => {
  try {
    const { username, password, displayName } = req.body;
    if (!username || !username.trim() || username.length < 3) {
      return res.status(400).json({ error: "Nom d'utilisateur: 3 caractères min." });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ error: "Mot de passe: 4 caractères min." });
    }

    const store = usersStore();
    const uKey = username.toLowerCase();
    const existing = await store.get(uKey, { type: 'json' }).catch(() => null);
    if (existing) {
      return res.status(409).json({ error: "Ce nom d'utilisateur est déjà pris." });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = { username: uKey, displayName: displayName || username, passwordHash: hash, createdAt: new Date().toISOString() };
    await store.setJSON(uKey, user);

    // Init empty data
    const ds = dataStore();
    await ds.setJSON(uKey, DEFAULT_DATA);

    const token = jwt.sign({ userId: uKey, username: uKey }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({ token, user: { username: uKey, displayName: user.displayName } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Login (auto-seeds admin on first login)
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Remplir tous les champs." });
    }

    const store = usersStore();
    const uKey = username.toLowerCase();
    let user = await store.get(uKey, { type: 'json' }).catch(() => null);

    // Auto-seed admin on first login attempt
    if (!user && uKey === 'admin') {
      const hash = await bcrypt.hash('admin', 10);
      user = { username: 'admin', displayName: 'admin', passwordHash: hash, createdAt: new Date().toISOString() };
      await store.setJSON('admin', user);
      const ds = dataStore();
      await ds.setJSON('admin', SEED_DATA || DEFAULT_DATA);
      console.log('Admin user auto-seeded');
    }

    if (!user) {
      return res.status(401).json({ error: "Nom d'utilisateur ou mot de passe incorrect." });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Nom d'utilisateur ou mot de passe incorrect." });
    }

    const token = jwt.sign({ userId: uKey, username: uKey }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({ token, user: { username: user.username, displayName: user.displayName } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get current user
router.get('/auth/me', auth, async (req, res) => {
  try {
    const store = usersStore();
    const user = await store.get(req.username, { type: 'json' }).catch(() => null);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json({ user: { username: user.username, displayName: user.displayName } });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get user data
router.get('/data', auth, async (req, res) => {
  try {
    const ds = dataStore();
    const data = await ds.get(req.username, { type: 'json' }).catch(() => null);
    res.json(data || DEFAULT_DATA);
  } catch (error) {
    console.error('Get data error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Save user data
router.put('/data', auth, async (req, res) => {
  try {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Données invalides' });
    }
    const ds = dataStore();
    await ds.setJSON(req.username, data);
    res.json({ success: true });
  } catch (error) {
    console.error('Save data error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'JW Transport API on Netlify', timestamp: new Date().toISOString() });
});

// Mount router at /api (Netlify passes full URL path to Express)
app.use('/api', router);

// Also mount at root for direct function calls
app.use('/', router);

// Export
module.exports.handler = serverless(app);
