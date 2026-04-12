require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const BASE = process.env.N8N_BASE_URL;
const KEY = process.env.N8N_API_KEY;
const OLD_WF_ID = 'Xh_LvTyNuz9OxZoXE-x74';
const WF_FILE = 'n8n/BerlinAOL_Membership_Sync.json';

async function api(method, path, body) {
  const res = await fetch(`${BASE}/api/v1${path}`, {
    method,
    headers: {
      'X-N8N-API-KEY': KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text.slice(0, 400)}`);
  return json;
}

async function main() {
  console.log('1. Loading workflow JSON...');
  const wf = JSON.parse(fs.readFileSync(WF_FILE, 'utf8'));
  // API accepts: name, nodes, connections, settings. Strip read-only fields.
  const payload = {
    name: wf.name,
    nodes: wf.nodes,
    connections: wf.connections,
    settings: wf.settings || {},
  };

  console.log('2. Checking if workflow with this name already exists...');
  const list = await api('GET', '/workflows?limit=250');
  const existing = list.data.find((w) => w.name === wf.name);
  let workflowId;
  if (existing) {
    console.log(`   Found existing id=${existing.id}, updating...`);
    await api('PUT', `/workflows/${existing.id}`, payload);
    workflowId = existing.id;
  } else {
    console.log('   Not found, creating...');
    const created = await api('POST', '/workflows', payload);
    workflowId = created.id;
    console.log(`   Created id=${workflowId}`);
  }

  console.log('3. Deactivating OLD workflow (PaymentMailing)...');
  try {
    await api('POST', `/workflows/${OLD_WF_ID}/deactivate`);
    console.log('   Old workflow deactivated.');
  } catch (e) {
    console.log('   (skip):', e.message.slice(0, 200));
  }

  console.log('4. Activating NEW workflow...');
  await api('POST', `/workflows/${workflowId}/activate`);
  console.log('   Activated.');

  console.log('\nDone. New workflow ID:', workflowId);
  console.log('URL:', `${BASE}/workflow/${workflowId}`);
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
