const https = require('https');
const fs = require('fs');

const API_HOST = 'jw-transport.onrender.com';

function apiCall(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const options = {
      hostname: API_HOST,
      port: 443,
      path: '/api' + path,
      method: method,
      headers: headers
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
  // Step 1: Login
  console.log('Logging in to Render API...');
  const login = await apiCall('POST', '/auth/login', { username: 'admin', password: 'admin' });
  console.log('Login status:', login.status);
  if (login.status !== 200) {
    console.log('Login failed:', JSON.stringify(login.data));
    return;
  }
  const token = login.data.token;
  console.log('Got token OK');

  // Step 2: Get current data
  console.log('Getting current data...');
  const getData = await apiCall('GET', '/data', null, token);
  console.log('Data status:', getData.status);
  console.log('Current factures:', (getData.data.factures || []).length);
  console.log('Current voyages:', (getData.data.voyages || []).length);

  // Step 3: Read 2025 factures
  const factures2025 = JSON.parse(fs.readFileSync('./factures-2025-only.json', 'utf8'));
  console.log('2025 factures to add:', factures2025.length);

  // Step 4: Merge - REPLACE existing 2025 factures with updated ones (with totals)
  const currentData = getData.data;
  const newNums = new Set(factures2025.map(f => f.numero));
  // Remove old 2025 factures (will be replaced by new ones with totals)
  const nonReplaced = (currentData.factures || []).filter(f => !newNums.has(f.numero));
  console.log('Existing factures to keep (non-2025):', nonReplaced.length);
  console.log('Replacing with updated 2025 factures:', factures2025.length);

  currentData.factures = [...factures2025, ...nonReplaced];
  console.log('Total factures after merge:', currentData.factures.length);

  // Step 5: Save
  console.log('Saving data to Render...');
  const saveResp = await apiCall('PUT', '/data', currentData, token);
  console.log('Save status:', saveResp.status);
  console.log('Save response:', JSON.stringify(saveResp.data));

  if (saveResp.status === 200) {
    console.log('\nSUCCESS! 2025 factures are now live on the app.');
  }
}

main().catch(err => console.error('Error:', err.message));
