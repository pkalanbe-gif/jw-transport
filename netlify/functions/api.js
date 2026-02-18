const express = require('express');
const serverless = require('serverless-http');

// In-memory data store (same as original server.js)
let clients = [
  {
    id: 1,
    nom: 'Client Test',
    email: 'test@example.com',
    telephone: '50912345678',
    adresse: 'Port-au-Prince',
    created_at: new Date().toISOString()
  }
];
let factures = [
  {
    id: 1,
    client_id: 1,
    montant: 500.00,
    description: 'Transport local - semaine',
    date_emission: '2025-02-14',
    date_echeance: '2025-02-21',
    statut: 'impayee',
    created_at: new Date().toISOString()
  }
];
let clientIdCounter = 2;
let factureIdCounter = 2;

const app = express();

// Middleware
app.use(express.json());

// CORS headers for Netlify functions
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'JW Transport API is running on Netlify',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.get('/clients', async (req, res) => {
  try {
    console.log('GET /clients called');
    console.log('Clients found:', clients.length);
    res.json(clients);
  } catch (error) {
    console.error('GET /clients error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/clients', async (req, res) => {
  try {
    console.log('POST /clients called with:', req.body);
    const { nom, email, telephone, adresse } = req.body;
    
    if (!nom || !email) {
      return res.status(400).json({ error: 'Nom et email sont requis' });
    }
    
    const newClient = {
      id: clientIdCounter++,
      nom,
      email,
      telephone: telephone || '',
      adresse: adresse || '',
      created_at: new Date().toISOString()
    };
    
    clients.push(newClient);
    console.log('Client created with ID:', newClient.id);
    res.json(newClient);
  } catch (error) {
    console.error('POST /clients error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/factures', async (req, res) => {
  try {
    console.log('GET /factures called');
    
    // Join with client data
    const facturesWithClients = factures.map(facture => {
      const client = clients.find(c => c.id === facture.client_id);
      return {
        ...facture,
        client_nom: client ? client.nom : 'Client inconnu',
        client_email: client ? client.email : ''
      };
    });
    
    console.log('Factures found:', facturesWithClients.length);
    res.json(facturesWithClients);
  } catch (error) {
    console.error('GET /factures error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export for Netlify
module.exports.handler = serverless(app);
