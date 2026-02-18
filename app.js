const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Database simulation
let clients = [
    {id: 1, nom: "Jean Dupont", email: "jean@example.com", telephone: "514-123-4567", adresse: "Montréal, QC"},
    {id: 2, nom: "Marie Tremblay", email: "marie@example.com", telephone: "514-987-6543", adresse: "Laval, QC"}
];

let voyages = [
    {id: 1, date: "2025-02-14", chauffeur: "Pierre Jean", client: "Jean Dupont", zone: "Montréal (06)", poids: 2450, revenu: 220.50},
    {id: 2, date: "2025-02-14", chauffeur: "Paul Joseph", client: "Marie Tremblay", zone: "Laval (13)", poids: 1800, revenu: 126.00}
];

let factures = [
    {id: 1, numero: "FAC-001", client: "Jean Dupont", date: "2025-02-14", montant: 220.50, statut: "En attente"},
    {id: 2, numero: "FAC-002", client: "Marie Tremblay", date: "2025-02-14", montant: 126.00, statut: "Payée"}
];

let chauffeurs = [
    {id: 1, nom: "Pierre Jean", role: "Chauffeur", aktif: true},
    {id: 2, nom: "Paul Joseph", role: "Chauffeur", aktif: true},
    {id: 3, nom: "Marie Claire", role: "Helper", aktif: true},
    {id: 4, nom: "Rose Anne", role: "Helper", aktif: true}
];

let clientIdCounter = 3;
let voyageIdCounter = 3;
let factureIdCounter = 3;

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'JW Transport API is running' });
});

app.get('/api/clients', (req, res) => {
    res.json(clients);
});

app.post('/api/clients', (req, res) => {
    const { nom, email, telephone, adresse } = req.body;
    if (!nom || !email) {
        return res.status(400).json({ error: 'Nom et email sont requis' });
    }
    const newClient = {
        id: clientIdCounter++,
        nom,
        email,
        telephone: telephone || '',
        adresse: adresse || ''
    };
    clients.push(newClient);
    res.json(newClient);
});

app.get('/api/voyages', (req, res) => {
    res.json(voyages);
});

app.post('/api/voyages', (req, res) => {
    const { date, chauffeur, client, zone, poids, nombre } = req.body;
    const newVoyage = {
        id: voyageIdCounter++,
        date,
        chauffeur,
        client,
        zone,
        poids: parseFloat(poids),
        revenu: parseFloat(poids) * 0.09 * (parseInt(nombre) || 1),
        nombre: parseInt(nombre) || 1
    };
    voyages.push(newVoyage);
    res.json(newVoyage);
});

app.get('/api/factures', (req, res) => {
    res.json(factures);
});

app.post('/api/factures', (req, res) => {
    const { client, montant } = req.body;
    const newFacture = {
        id: factureIdCounter++,
        numero: `FAC-${String(factureIdCounter).padStart(3, '0')}`,
        client,
        date: new Date().toISOString().split('T')[0],
        montant: parseFloat(montant),
        statut: "En attente"
    };
    factures.push(newFacture);
    res.json(newFacture);
});

app.get('/api/chauffeurs', (req, res) => {
    res.json(chauffeurs);
});

app.get('/api/stats', (req, res) => {
    const stats = {
        clients: clients.length,
        voyages: voyages.length,
        factures: factures.length,
        revenus: voyages.reduce((sum, v) => sum + v.revenu, 0),
        employes: chauffeurs.filter(c => c.aktif).length
    };
    res.json(stats);
});

// Agent IA endpoint
app.post('/api/agent/generate', (req, res) => {
    // Simuler génération automatique
    setTimeout(() => {
        res.json({ 
            message: 'Agent IA exécuté avec succès',
            facturesGenerees: 2,
            talonsGenerees: 4
        });
    }, 2000);
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Export for Vercel
module.exports = app;

// Local development
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`JW Transport server running on port ${PORT}`);
        console.log(`Access: http://localhost:${PORT}`);
    });
}
