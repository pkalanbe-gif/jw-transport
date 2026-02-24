const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');

const JWT_SECRET = process.env.JWT_SECRET || 'jw-transport-2026-netlify-fallback';
const JWT_EXPIRES = '7d';

// ==================== Firebase Firestore (permanent storage) ====================

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

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

// ==================== Firestore Store wrappers ====================

async function getUser(username) {
  const doc = await db.collection('users').doc(username).get();
  return doc.exists ? doc.data() : null;
}

async function setUser(username, userData) {
  await db.collection('users').doc(username).set(userData);
  return true;
}

async function getUserData(username) {
  const doc = await db.collection('user_data').doc(username).get();
  return doc.exists ? doc.data() : null;
}

async function setUserData(username, data) {
  await db.collection('user_data').doc(username).set(data);
  return true;
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
    return res(200, { status: 'OK', message: 'JW Transport API (Firebase Firestore)', timestamp: new Date().toISOString() });
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
