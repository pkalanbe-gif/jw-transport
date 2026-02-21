const https = require('https');
const fs = require('fs');

const API_HOST = 'jw-transport.onrender.com';

function apiCall(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const options = {
      hostname: API_HOST, port: 443,
      path: '/api' + path, method: method, headers: headers
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, data: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('Logging in...');
  const login = await apiCall('POST', '/auth/login', { username: 'admin', password: 'admin' });
  if (login.status !== 200) { console.log('Login failed:', login.data); return; }
  const token = login.data.token;
  console.log('OK');

  console.log('Getting current data...');
  const getData = await apiCall('GET', '/data', null, token);
  const currentData = getData.data;
  console.log('Current chauffeurs:', (currentData.chauffeurs || []).length);
  console.log('Current voyages:', (currentData.voyages || []).length);
  console.log('Current depenses:', (currentData.depenses || []).length);

  // Load new data
  const newData = JSON.parse(fs.readFileSync('./employees-2025-data.json', 'utf8'));
  console.log('\n2025 data to add:');
  console.log('  Voyages:', newData.voyages.length);
  console.log('  Depenses:', newData.depenses.length);
  console.log('  New chauffeurs:', newData.newChauffeurs.map(c => c.nom).join(', '));

  // Add new chauffeurs
  const existingIds = new Set((currentData.chauffeurs || []).map(c => c.id));
  newData.newChauffeurs.forEach(nc => {
    if (!existingIds.has(nc.id)) {
      currentData.chauffeurs.push(nc);
      console.log(`  Added chauffeur: ${nc.nom} (${nc.id})`);
    }
  });

  // Replace 2025 voyages, keep 2026
  const keep2026V = (currentData.voyages || []).filter(v => v.date >= "2026-01-01");
  currentData.voyages = [...newData.voyages, ...keep2026V];
  console.log(`\nMerged voyages: ${newData.voyages.length} (2025) + ${keep2026V.length} (2026) = ${currentData.voyages.length}`);

  // Replace 2025 depenses, keep 2026
  const keep2026D = (currentData.depenses || []).filter(d => d.date >= "2026-01-01");
  currentData.depenses = [...newData.depenses, ...keep2026D];
  console.log(`Merged depenses: ${newData.depenses.length} (2025) + ${keep2026D.length} (2026) = ${currentData.depenses.length}`);

  // Save
  console.log('\nSaving to Render...');
  const saveResp = await apiCall('PUT', '/data', currentData, token);
  console.log('Save status:', saveResp.status);

  if (saveResp.status === 200) {
    console.log('\nSUCCESS! Employee data for 2025 is now live.');
    console.log(`  ${currentData.chauffeurs.length} chauffeurs`);
    console.log(`  ${currentData.voyages.length} voyages`);
    console.log(`  ${currentData.depenses.length} depenses`);
    console.log(`  ${(currentData.factures || []).length} factures`);
  }
}

main().catch(err => console.error('Error:', err.message));
