const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const https = require('https');

const JWT_SECRET = process.env.JWT_SECRET || 'jw-transport-2026-netlify-fallback';
const JWT_EXPIRES = '7d';

// JSONBlob.com — permanent cloud storage (no API key needed, survives deploys)
const USERS_BLOB = '019c878a-30b7-738c-af6d-57ddbc887dd0';
const DATA_BLOB = '019c878a-31be-7177-9215-3bd514cbd96a';

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

// ==================== JSONBlob helpers ====================

function jsonblobGet(blobId) {
  return new Promise((resolve, reject) => {
    const opts = { method: 'GET', hostname: 'jsonblob.com', path: '/api/jsonBlob/' + blobId, headers: { 'Accept': 'application/json' } };
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch(e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

function jsonblobPut(blobId, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const opts = {
      method: 'PUT', hostname: 'jsonblob.com', path: '/api/jsonBlob/' + blobId,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(res.statusCode === 200));
    });
    req.on('error', () => resolve(false));
    req.write(body);
    req.end();
  });
}

// ==================== Store wrappers (same interface as before) ====================

async function getUser(username) {
  const all = await jsonblobGet(USERS_BLOB);
  return all && all[username] ? all[username] : null;
}

async function setUser(username, userData) {
  const all = await jsonblobGet(USERS_BLOB) || {};
  all[username] = userData;
  return jsonblobPut(USERS_BLOB, all);
}

async function getUserData(username) {
  const all = await jsonblobGet(DATA_BLOB);
  return all && all[username] ? all[username] : null;
}

async function setUserData(username, data) {
  const all = await jsonblobGet(DATA_BLOB) || {};
  all[username] = data;
  return jsonblobPut(DATA_BLOB, all);
}

// ==================== Helpers ====================

function res(statusCode, body) {
  return { statusCode, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

function parseBody(event) {
  if (!event.body) return {};
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

function verifyAuth(event) {
  const h = (event.headers || {}).authorization || (event.headers || {}).Authorization || '';
  if (!h.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(h.split(' ')[1], JWT_SECRET);
  } catch (e) {
    return null;
  }
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

    const uKey = username.toLowerCase();
    const existing = await getUser(uKey);
    if (existing) {
      return res(409, { error: "Ce nom d'utilisateur est déjà pris." });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = { username: uKey, displayName: displayName || username, passwordHash: hash, createdAt: new Date().toISOString() };
    await setUser(uKey, user);
    await setUserData(uKey, DEFAULT_DATA);

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

    const uKey = username.toLowerCase();
    let user = await getUser(uKey);

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
    const user = await getUser(decoded.username);
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
    const data = await getUserData(decoded.username);
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
    await setUserData(decoded.username, body);
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

  // Parse path
  let path = event.path || '';
  path = path.replace('/.netlify/functions/api', '');
  path = path.replace(/^\/api/, '');
  if (!path.startsWith('/')) path = '/' + path;

  const body = parseBody(event);

  // Health check
  if (method === 'GET' && path === '/health') {
    return res(200, { status: 'OK', message: 'JW Transport API (JSONBlob)', timestamp: new Date().toISOString() });
  }

  // Auth routes
  if (method === 'POST' && path === '/auth/login') {
    return handleLogin(body);
  }
  if (method === 'POST' && path === '/auth/register') {
    return handleRegister(body);
  }

  // Protected routes
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
