const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getStore } = require('@netlify/blobs');

const JWT_SECRET = process.env.JWT_SECRET || 'jw-transport-2026-netlify-fallback';
const JWT_EXPIRES = '7d';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
};

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

// Seed data for admin
let SEED_DATA = null;
try {
  SEED_DATA = require('./seed-admin-data.json');
  if (SEED_DATA && SEED_DATA.settings && !SEED_DATA.settings.payrollSchedule) {
    SEED_DATA.settings.payrollSchedule = { frequency: "weekly", payDelay: 2, payDay: 5 };
  }
} catch (e) {
  SEED_DATA = DEFAULT_DATA;
}

// Helper: response
function res(statusCode, body) {
  return { statusCode, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

// Helper: parse body from Netlify event
function parseBody(event) {
  if (!event.body) return {};
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

// Helper: verify JWT token from Authorization header
function verifyAuth(event) {
  const h = (event.headers || {}).authorization || (event.headers || {}).Authorization || '';
  if (!h.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(h.split(' ')[1], JWT_SECRET);
  } catch (e) {
    return null;
  }
}

// Helper: get Blobs stores (no consistency option — not available on free plan)
function usersStore() {
  return getStore('users');
}
function dataStore() {
  return getStore('user_data');
}

// ==================== ROUTE HANDLERS ====================

async function handleRegister(body) {
  try {
    const { username, password, displayName } = body;
    if (!username || !username.trim() || username.length < 3) {
      return res(400, { error: "Nom d'utilisateur: 3 caractères min." });
    }
    if (!password || password.length < 4) {
      return res(400, { error: "Mot de passe: 4 caractères min." });
    }

    const store = usersStore();
    const uKey = username.toLowerCase();
    const existing = await store.get(uKey, { type: 'json' }).catch(() => null);
    if (existing) {
      return res(409, { error: "Ce nom d'utilisateur est déjà pris." });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = { username: uKey, displayName: displayName || username, passwordHash: hash, createdAt: new Date().toISOString() };
    await store.setJSON(uKey, user);

    const ds = dataStore();
    await ds.setJSON(uKey, DEFAULT_DATA);

    const token = jwt.sign({ userId: uKey, username: uKey }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    return res(200, { token, user: { username: uKey, displayName: user.displayName } });
  } catch (error) {
    console.error('Register error:', error);
    return res(500, { error: 'Erreur serveur' });
  }
}

async function handleLogin(body) {
  try {
    const { username, password } = body;
    if (!username || !password) {
      return res(400, { error: "Remplir tous les champs." });
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
      return res(401, { error: "Nom d'utilisateur ou mot de passe incorrect." });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res(401, { error: "Nom d'utilisateur ou mot de passe incorrect." });
    }

    const token = jwt.sign({ userId: uKey, username: uKey }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    return res(200, { token, user: { username: user.username, displayName: user.displayName } });
  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    return res(500, { error: 'Erreur serveur', debug: error.message });
  }
}

async function handleMe(decoded) {
  try {
    const store = usersStore();
    const user = await store.get(decoded.username, { type: 'json' }).catch(() => null);
    if (!user) {
      return res(404, { error: 'Utilisateur non trouvé' });
    }
    return res(200, { user: { username: user.username, displayName: user.displayName } });
  } catch (error) {
    return res(500, { error: 'Erreur serveur' });
  }
}

async function handleGetData(decoded) {
  try {
    const ds = dataStore();
    const data = await ds.get(decoded.username, { type: 'json' }).catch(() => null);
    return res(200, data || DEFAULT_DATA);
  } catch (error) {
    console.error('Get data error:', error);
    return res(500, { error: 'Erreur serveur' });
  }
}

async function handleSaveData(decoded, body) {
  try {
    if (!body || typeof body !== 'object') {
      return res(400, { error: 'Données invalides' });
    }
    const ds = dataStore();
    await ds.setJSON(decoded.username, body);
    return res(200, { success: true });
  } catch (error) {
    console.error('Save data error:', error);
    return res(500, { error: 'Erreur serveur' });
  }
}

// ==================== MAIN HANDLER ====================

exports.handler = async (event, context) => {
  const method = event.httpMethod;

  // CORS preflight
  if (method === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  // Parse path: strip function prefix and /api prefix
  let path = event.path || '';
  path = path.replace('/.netlify/functions/api', '');
  path = path.replace(/^\/api/, '');
  if (!path.startsWith('/')) path = '/' + path;

  // Parse body for POST/PUT
  const body = parseBody(event);

  // Health check (no auth needed)
  if (method === 'GET' && path === '/health') {
    return res(200, { status: 'OK', message: 'JW Transport API on Netlify', timestamp: new Date().toISOString() });
  }

  // Auth routes (no token needed)
  if (method === 'POST' && path === '/auth/login') {
    return handleLogin(body);
  }
  if (method === 'POST' && path === '/auth/register') {
    return handleRegister(body);
  }

  // Protected routes (token required)
  const decoded = verifyAuth(event);
  if (!decoded) {
    return res(401, { error: 'Token requis' });
  }

  if (method === 'GET' && path === '/auth/me') {
    return handleMe(decoded);
  }
  if (method === 'GET' && path === '/data') {
    return handleGetData(decoded);
  }
  if (method === 'PUT' && path === '/data') {
    return handleSaveData(decoded, body);
  }

  return res(404, { error: 'Route non trouvée' });
};
