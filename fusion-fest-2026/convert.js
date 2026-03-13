/**
 * convert.js
 * Converts "Fusion Fest 2026 (Responses).json" → participants.json
 * Run with:  node convert.js
 */

const fs   = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'Fusion Fest 2026 (Responses).json');
const raw     = JSON.parse(fs.readFileSync(srcPath, 'utf8'));

const mainData = raw['Main Data'] || [];

if (!mainData.length) {
  console.error('❌  "Main Data" array is empty or not found.');
  process.exit(1);
}

const seen = new Set();
const participants = [];

for (const row of mainData) {
  const name       = (row['Full Name']           || '').trim().replace(/\s+/g, ' ');
  const rollNumber = (row['University Roll No.'] || '').trim().toUpperCase().replace(/\s+/g, '');
  const email      = (row['Email address']       || '').trim().toLowerCase();
  const phone      = String(row['Phone Number']  || '').trim();
  const department = (row['Department Name']     || '').trim();
  const event      = (row['Event Category']      || '').trim();
  const timestamp  = (row['Timestamp']           || '').trim();

  if (!name || !rollNumber) continue;

  const key = `${name.toLowerCase()}::${rollNumber}`;
  if (seen.has(key)) continue;
  seen.add(key);

  participants.push({ name, rollNumber, email, phone, department, event, timestamp });
}

participants.sort((a, b) => a.name.localeCompare(b.name));

const outPath = path.join(__dirname, 'participants.json');
fs.writeFileSync(outPath, JSON.stringify(participants, null, 2), 'utf8');

console.log(`✅  Done! Exported ${participants.length} unique participants to participants.json`);
console.log(`📋  Source rows: ${mainData.length}  |  Duplicates removed: ${mainData.length - participants.length}`);
