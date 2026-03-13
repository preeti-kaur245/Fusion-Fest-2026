/**
 * RIMT University – Fusion Fest 2026 | Certificate Portal
 * script.js – Main application logic
 */

'use strict';

// ─── State ────────────────────────────────────────────────────────────────────
const state = {
  participants: [],       // { name, rollNumber, email, phone, department, event }
  certificates: {},       // { "Student Name": Uint8Array }
  totalCertificates: 0,
  certMap: {},            // { "Participant Name": "cert filename key" } — loaded from cert_map.json
  staticCertBase: '',     // base URL for static certificate files (set if using folder mode)
};

// ─── DOM Ready ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initCanvas();
  createParticles();
  updateStats();

  // Auto-load participants.json if present (for GitHub Pages / local server)
  fetch('participants.json')
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (data) {
        loadParticipants(data);
        showToast(`✅ Loaded ${state.participants.length} participants from participants.json`);
      }
    })
    .catch(() => {}); // silently ignore – admin can upload manually

  // Auto-load cert_map.json for name aliases
  fetch('cert_map.json')
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (data && typeof data === 'object') {
        state.certMap = data;
        console.log(`[CertMap] Loaded ${Object.keys(data).length} name aliases.`);
      }
    })
    .catch(() => {});
});

// ─── Admin Auth ───────────────────────────────────────────────────────────────
const ADMIN_CREDENTIALS = {
  username: 'manpreet@24680',
  password: 'ma7347364522',
};
let adminAuthenticated = false;

function handleAdminTabClick() {
  if (adminAuthenticated) {
    switchTab('admin');
  } else {
    openAdminModal();
  }
}

function openAdminModal() {
  const overlay = document.getElementById('adminLoginOverlay');
  overlay.style.display = 'flex';
  document.getElementById('adminUsername').value = '';
  document.getElementById('adminPassword').value = '';
  document.getElementById('loginError').style.display = 'none';
  setTimeout(() => document.getElementById('adminUsername').focus(), 100);
}

function closeAdminModal() {
  document.getElementById('adminLoginOverlay').style.display = 'none';
  if (!adminAuthenticated) switchTab('student');
}

function handleOverlayClick(event) {
  if (event.target === document.getElementById('adminLoginOverlay')) {
    closeAdminModal();
  }
}

function handleAdminLogin(event) {
  event.preventDefault();
  const btn      = document.getElementById('loginBtn');
  const errorBox = document.getElementById('loginError');
  const username = document.getElementById('adminUsername').value.trim();
  const password = document.getElementById('adminPassword').value;

  btn.querySelector('.btn-text').style.display   = 'none';
  btn.querySelector('.btn-loader').style.display = 'flex';
  btn.disabled = true;
  errorBox.style.display = 'none';

  setTimeout(() => {
    btn.querySelector('.btn-text').style.display   = 'flex';
    btn.querySelector('.btn-loader').style.display = 'none';
    btn.disabled = false;

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      adminAuthenticated = true;
      document.getElementById('adminLoginOverlay').style.display = 'none';
      switchTab('admin');
      updateLockIcon(true);
      showToast('🔓 Admin access granted. Welcome!');
    } else {
      errorBox.style.display = 'flex';
      const card = document.getElementById('adminModalCard');
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      document.getElementById('adminPassword').value = '';
      document.getElementById('adminPassword').focus();
    }
  }, 700);
}

function togglePasswordVisibility() {
  const input = document.getElementById('adminPassword');
  const icon  = document.getElementById('eyeIcon');
  if (input.type === 'password') {
    input.type = 'text';
    icon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>`;
  } else {
    input.type = 'password';
    icon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
  }
}

function updateLockIcon(unlocked) {
  const lockEl = document.getElementById('adminLockIcon');
  if (unlocked) {
    lockEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
    </svg>`;
    lockEl.title = 'Admin logged in';
  }
}

// ─── Tab Switching ────────────────────────────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.id === `tab-${tab}`);
    b.setAttribute('aria-selected', b.id === `tab-${tab}`);
  });
  document.querySelectorAll('.panel').forEach(p => {
    p.classList.toggle('active', p.id === `panel-${tab}`);
  });
}

// ─── Participants Loader ──────────────────────────────────────────────────────
function loadParticipants(data) {
  if (!Array.isArray(data)) {
    showToast('❌ Invalid JSON format. Expected an array.');
    return;
  }
  state.participants = data.map(p => ({
    name:       (p.name       || p.Name       || '').trim(),
    rollNumber: (p.rollNumber || p.roll_number || p.RollNumber || p['Roll Number'] || '').toString().trim(),
    email:      (p.email      || '').trim(),
    phone:      (p.phone      || '').toString().trim(),
    department: (p.department || '').trim(),
    event:      (p.event      || '').trim(),
  })).filter(p => p.name);

  updateStats();
}

// ─── Student Search ───────────────────────────────────────────────────────────
function searchCertificate(event) {
  event.preventDefault();

  const nameInput = document.getElementById('studentName').value.trim();
  const rollInput = document.getElementById('rollNumber').value.trim().toUpperCase();
  const resultArea = document.getElementById('resultArea');
  const searchBtn  = document.getElementById('searchBtn');

  if (!nameInput || !rollInput) {
    showToast('⚠️ Please fill in both fields.');
    return;
  }

  searchBtn.querySelector('.btn-text').style.display   = 'none';
  searchBtn.querySelector('.btn-loader').style.display = 'flex';
  searchBtn.disabled = true;
  resultArea.style.display = 'none';

  setTimeout(() => {
    const result = verifyAndMatch(nameInput, rollInput);
    renderResult(result, resultArea);
    searchBtn.querySelector('.btn-text').style.display   = 'flex';
    searchBtn.querySelector('.btn-loader').style.display = 'none';
    searchBtn.disabled = false;
    resultArea.style.display = 'block';
  }, 600);
}

// ─── Download History (localStorage) ─────────────────────────────────────────
const DL_KEY = 'ff2026_downloads';

function getDownloadHistory() {
  try { return JSON.parse(localStorage.getItem(DL_KEY) || '{}'); } catch { return {}; }
}

function recordDownload(rollNumber, name) {
  const history = getDownloadHistory();
  const key = normalize(rollNumber);
  history[key] = { name, rollNumber, downloadedAt: new Date().toISOString(), count: (history[key]?.count || 0) + 1 };
  try { localStorage.setItem(DL_KEY, JSON.stringify(history)); } catch { }
}

function hasDownloaded(rollNumber) {
  const history = getDownloadHistory();
  return history[normalize(rollNumber)] || null;
}

function verifyAndMatch(nameInput, rollInput) {
  if (state.participants.length === 0) {
    return { found: false, errorType: 'no_participants' };
  }

  const participant = state.participants.find(p =>
    normalize(p.name) === normalize(nameInput) &&
    normalize(p.rollNumber) === normalize(rollInput)
  );

  if (!participant) {
    const nameOnly = state.participants.find(p => normalize(p.name) === normalize(nameInput));
    if (nameOnly) return { found: false, errorType: 'wrong_roll', participant: nameOnly };
    return { found: false, errorType: 'not_found' };
  }

  // Check if this student has downloaded before
  const dlRecord = hasDownloaded(participant.rollNumber);

  // Try to find via ZIP-loaded certs or static file fallback
  const certKey = findCertKey(participant.name);

  if (state.totalCertificates === 0 && !certKey) {
    return { found: false, participant, errorType: 'no_certs' };
  }

  if (!certKey) return { found: false, participant, errorType: 'cert_missing' };

  // If cert is in loaded ZIP memory
  if (state.certificates[certKey]) {
    return { found: true, participant, certKey, cert: state.certificates[certKey], alreadyDownloaded: dlRecord };
  }

  // Static file fallback — build a URL and let browser download it
  return { found: true, participant, certKey, cert: null, staticKey: certKey, alreadyDownloaded: dlRecord };
}

function findCertKey(name) {
  const normName = normalize(name);

  // 1. Check cert_map.json alias first (exact participant name match)
  for (const [participantName, mappedKey] of Object.entries(state.certMap)) {
    if (normalize(participantName) === normName) {
      // Return the mapped key if it exists in loaded certificates
      for (const key of Object.keys(state.certificates)) {
        if (normalize(key) === normalize(mappedKey)) return key;
      }
      // If no ZIP loaded yet, return the mapped key directly for static file lookup
      return mappedKey || null;
    }
  }

  // 2. Exact match in loaded certificates
  for (const key of Object.keys(state.certificates)) {
    if (normalize(key) === normName) return key;
  }

  // 3. First-name-only match (e.g. 'Anshul shukla' matches 'Anshul')
  const firstName = normName.split(' ')[0];
  for (const key of Object.keys(state.certificates)) {
    if (normalize(key) === firstName) return key;
    const keyFirst = normalize(key).split(' ')[0];
    if (keyFirst === firstName && normalize(key).length < normName.length + 5) return key;
  }

  // 4. Substring / partial match
  for (const key of Object.keys(state.certificates)) {
    if (normalize(key).includes(normName) || normName.includes(normalize(key))) return key;
  }

  return null;
}

function normalize(str) {
  return str.toLowerCase().replace(/\s+/g, ' ').trim();
}

function buildStaticCertUrl(certKey) {
  // Check both Certificate subfolders + root fallbacks
  return [
    `Certificate/Blind Code Certificate/${certKey}.pdf`,
    `Certificate/Cultural/${certKey}.pdf`,
    `certificates/${certKey}.pdf`,
    `${certKey}.pdf`,
  ];
}

/**
 * Tries each candidate URL with a HEAD request and returns the first that exists.
 * Falls back to the first URL if none respond (e.g., file:// protocol).
 */
async function resolveStaticCertUrl(certKey) {
  const candidates = buildStaticCertUrl(certKey);
  for (const url of candidates) {
    try {
      const resp = await fetch(url, { method: 'HEAD' });
      if (resp.ok) return url;
    } catch (_) {
      // fetch fails on file:// – skip silently
    }
  }
  // Last resort: return all so UI can show all options
  return null;
}

function renderResult(result, container) {
  if (result.found) {
    const { participant, cert, certKey, staticKey, alreadyDownloaded } = result;
    const filename = `${participant.name} - Fusion Fest 2026 Certificate.pdf`;

    // Already-downloaded warning banner
    let warningBanner = '';
    if (alreadyDownloaded) {
      const when = new Date(alreadyDownloaded.downloadedAt).toLocaleString();
      const times = alreadyDownloaded.count;
      warningBanner = `
        <div class="dl-warning">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <div>
            <strong>Already Downloaded</strong>
            You downloaded this certificate ${times === 1 ? 'once' : `${times} times`} — last on ${when}.
            Click <em>Download Again</em> only if you need another copy.
          </div>
        </div>`;
    }

    let downloadSection = '';
    let staticUrls = null; // filled when using static file mode
    const btnLabel = alreadyDownloaded ? 'Download Again' : 'Download Certificate';

    if (cert) {
      // ZIP-uploaded cert in memory — direct blob URL, always works
      const blob = new Blob([cert], { type: 'application/pdf' });
      const url  = URL.createObjectURL(blob);
      downloadSection = `
        <a class="btn-download${alreadyDownloaded ? ' btn-download-again' : ''}" href="${url}" download="${escapeHTML(filename)}" id="downloadLink">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          ${btnLabel}
        </a>`;
    } else {
      // Static file fallback — build candidate URLs; attach click handler AFTER innerHTML
      staticUrls = buildStaticCertUrl(staticKey || certKey);
      downloadSection = `
        <button class="btn-download" id="downloadLink" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download Certificate
        </button>
        <p class="result-hint">Certificate is stored in the portal. Click Download to save it.</p>`;
    }

    container.innerHTML = `
      <div class="result-success">
        <div class="result-title ok">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          Certificate Found!
        </div>
        ${warningBanner}
        <div class="result-detail">
          <strong>${escapeHTML(participant.name)}</strong> (Roll: ${escapeHTML(participant.rollNumber)})<br/>
          ${participant.department ? `Department: ${escapeHTML(participant.department)}<br/>` : ''}
          ${participant.event ? `Event: ${escapeHTML(participant.event)}<br/>` : ''}
          Your Fusion Fest 2026 certificate is ready. Click Download to save it.
        </div>
        ${downloadSection}
      </div>`;

    // Wire up blob-download anchor to record on click
    if (cert) {
      const dlLink = document.getElementById('downloadLink');
      if (dlLink) {
        dlLink.addEventListener('click', () => recordDownload(participant.rollNumber, participant.name));
      }
    }

    // If using static file mode, wire up click handler NOW (after innerHTML is set)
    // so the button has proper JS closure access to urls/filename — no broken onclick attr
    if (staticUrls) {
      const dlBtn = document.getElementById('downloadLink');
      if (dlBtn) {
        const _urls = staticUrls;
        const _filename = filename;
        const _roll = participant.rollNumber;
        const _name = participant.name;
        dlBtn.addEventListener('click', function() {
          smartDownload(dlBtn, _urls, _filename, _roll, _name);
        });
      }
    }

    showToast(alreadyDownloaded ? '⚠️ You already downloaded this. Click Download Again to get another copy.' : '🎉 Certificate found! Click Download.');
  } else {
    const messages = {
      no_participants: {
        title: 'No Participants Data',
        body:  'The admin has not uploaded the participants list yet. Please ask the admin to upload <code>participants.json</code>.',
      },
      no_certs: {
        title: 'Certificates Not Uploaded',
        body:  `Your registration was verified (${escapeHTML(result.participant?.name || '')}), but the admin has not uploaded the certificates ZIP yet.`,
      },
      wrong_roll: {
        title: 'Roll Number Mismatch',
        body:  'Your name was found in our records, but the Roll Number does not match. Please double-check your roll number.',
      },
      not_found: {
        title: 'Participant Not Found',
        body:  'No record found with the provided Name and Roll Number. Please check your details or contact the event organiser.',
      },
      cert_missing: {
        title: 'Certificate Not Found',
        body:  `Your registration is verified (${escapeHTML(result.participant?.name || '')}), but your certificate PDF was not found. Please contact the organiser.`,
      },
    };

    const msg = messages[result.errorType] || messages.not_found;
    container.innerHTML = `
      <div class="result-error">
        <div class="result-title err">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          ${escapeHTML(msg.title)}
        </div>
        <div class="result-detail">${msg.body}</div>
      </div>`;
  }
}

/**
 * Smart download: tries each candidate URL via fetch HEAD, downloads the first
 * that works. Falls back to showing instructions if all fail (local file:// mode).
 * Records the download in localStorage on success.
 */
async function smartDownload(btn, urls, filename, rollNumber, name) {
  btn.disabled = true;
  const origHTML = btn.innerHTML;
  btn.innerHTML = `<span style="display:flex;align-items:center;gap:8px">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"/></svg>
    Locating file…</span>`;

  // Try HEAD requests to find which URL resolves
  for (const url of urls) {
    try {
      const resp = await fetch(url, { method: 'HEAD' });
      if (resp.ok) {
        // Found it — trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        btn.innerHTML = origHTML;
        btn.disabled = false;
        if (rollNumber) recordDownload(rollNumber, name);
        showToast('⬇️ Download started!');
        return;
      }
    } catch (_) {
      // HEAD failed (file:// or CORS) – try direct fetch to check existence
      try {
        const resp = await fetch(url);
        if (resp.ok) {
          const blob = await resp.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
          btn.innerHTML = origHTML;
          btn.disabled = false;
          if (rollNumber) recordDownload(rollNumber, name);
          showToast('⬇️ Download started!');
          return;
        }
      } catch (_2) { /* continue */ }
    }
  }

  // All URLs failed — show helpful error
  btn.innerHTML = origHTML;
  btn.disabled = false;
  showToast('❌ Could not download. Please ask admin to upload the ZIP.');
  const hint = btn.parentElement?.querySelector('.result-hint');
  if (hint) {
    hint.style.color = '#ef4444';
    hint.textContent = '⚠️ Download failed. This portal must be hosted on a web server (GitHub Pages) for static file downloads to work. Ask admin to upload the certificates ZIP instead.';
  }
}

// Kept for backwards-compat with any inline onclick references
function handleStaticDownload(event, url, filename) {
  // no-op: superseded by smartDownload
}

// ─── Admin: ZIP Upload ────────────────────────────────────────────────────────
function handleZipUpload(event) {
  const file = event.target.files[0];
  if (file) processZip(file);
}

function handleZipDrop(event) {
  event.preventDefault();
  document.getElementById('zipDropZone').classList.remove('drag-over');
  const file = event.dataTransfer.files[0];
  if (file && file.name.endsWith('.zip')) {
    processZip(file);
  } else {
    showToast('❌ Please drop a valid .zip file.');
  }
}

async function processZip(file) {
  const progress = document.getElementById('zipProgress');
  const fill     = document.getElementById('zipProgressFill');
  const pText    = document.getElementById('zipProgressText');
  const pPct     = document.getElementById('zipProgressPercent');
  const result   = document.getElementById('zipResult');

  progress.style.display = 'block';
  result.style.display   = 'none';
  fill.style.width       = '0%';
  fill.style.background  = '';
  pText.textContent      = 'Reading ZIP…';
  pPct.textContent       = '0%';

  try {
    if (typeof JSZip === 'undefined') throw new Error('JSZip library not loaded. Check your internet connection.');

    const zip      = await JSZip.loadAsync(file, { checkCRC32: true });
    const pdfFiles = [];
    zip.forEach((relativePath, entry) => {
      if (!entry.dir && relativePath.toLowerCase().endsWith('.pdf')) {
        pdfFiles.push({ path: relativePath, entry });
      }
    });

    if (pdfFiles.length === 0) throw new Error('No PDF files found inside the ZIP archive.');

    let loaded = 0;
    state.certificates = {};

    for (const { path, entry } of pdfFiles) {
      const data     = await entry.async('uint8array');
      const basename = path.split('/').pop().replace(/\.pdf$/i, '');
      state.certificates[basename] = data;
      loaded++;
      const pct = Math.round((loaded / pdfFiles.length) * 100);
      fill.style.width  = `${pct}%`;
      pPct.textContent  = `${pct}%`;
      pText.textContent = `Extracting… (${loaded}/${pdfFiles.length})`;
    }

    state.totalCertificates = Object.keys(state.certificates).length;
    updateStats();
    renderCertList();

    result.className = 'upload-result upload-ok';
    result.innerHTML = `✅ Successfully extracted <strong>${state.totalCertificates}</strong> certificates from <strong>${escapeHTML(file.name)}</strong>.`;
    result.style.display = 'block';
    showToast(`📦 ${state.totalCertificates} certificates loaded!`);
    pText.textContent = 'Complete!';
  } catch (err) {
    fill.style.width      = '100%';
    fill.style.background = 'linear-gradient(90deg,#ef4444,#dc2626)';
    pText.textContent     = 'Failed';
    result.className      = 'upload-result upload-err';
    result.innerHTML      = `❌ Error: ${escapeHTML(err.message)}`;
    result.style.display  = 'block';
    showToast(`❌ ${err.message}`);
  }
}

// ─── Admin: JSON Upload ───────────────────────────────────────────────────────
function handleJsonUpload(event) {
  const file = event.target.files[0];
  if (file) processJson(file);
}

function handleJsonDrop(event) {
  event.preventDefault();
  document.getElementById('jsonDropZone').classList.remove('drag-over');
  const file = event.dataTransfer.files[0];
  if (file && file.name.endsWith('.json')) {
    processJson(file);
  } else {
    showToast('❌ Please drop a valid .json file.');
  }
}

function processJson(file) {
  const result = document.getElementById('jsonResult');
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      loadParticipants(data);
      result.className = 'upload-result upload-ok';
      result.innerHTML = `✅ Loaded <strong>${state.participants.length}</strong> participants from <strong>${escapeHTML(file.name)}</strong>.`;
      result.style.display = 'block';
      showToast(`👥 ${state.participants.length} participants loaded!`);
    } catch (err) {
      result.className = 'upload-result upload-err';
      result.innerHTML = `❌ Invalid JSON: ${escapeHTML(err.message)}`;
      result.style.display = 'block';
      showToast('❌ Could not parse the JSON file.');
    }
  };

  reader.onerror = () => {
    result.className = 'upload-result upload-err';
    result.innerHTML = '❌ Failed to read file.';
    result.style.display = 'block';
  };

  reader.readAsText(file);
}

// ─── Drag & Drop Helpers ──────────────────────────────────────────────────────
function handleDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add('drag-over');
}

function handleDragLeave(event) {
  event.currentTarget.classList.remove('drag-over');
}

// ─── Certificate List ─────────────────────────────────────────────────────────
function renderCertList() {
  const card = document.getElementById('certListCard');
  const list = document.getElementById('certList');
  const keys = Object.keys(state.certificates).sort();

  if (keys.length === 0) { card.style.display = 'none'; return; }

  card.style.display = 'block';
  list.innerHTML = keys.map(name => `
    <div class="cert-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      ${escapeHTML(name)}
    </div>`).join('');
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function updateStats() {
  document.getElementById('statTotal').textContent = state.participants.length;
  document.getElementById('statCerts').textContent = state.totalCertificates;
  const status = (state.participants.length > 0 && state.totalCertificates > 0) ? 'Ready'
               : (state.participants.length > 0 ? 'Partial' : 'Waiting');
  document.getElementById('statStatus').textContent = status;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3800);
}

// ─── Security ─────────────────────────────────────────────────────────────────
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ─── Animated Canvas Background ───────────────────────────────────────────────
function initCanvas() {
  const canvas = document.getElementById('bgCanvas');
  const ctx    = canvas.getContext('2d');
  let W, H, nodes;
  const COLORS = ['#6366f1','#818cf8','#22d3ee','#a855f7','#f59e0b'];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    build();
  }

  function build() {
    const count = Math.floor((W * H) / 10000);
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 0.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
    }
    const maxDist = 140;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          ctx.strokeStyle = nodes[i].color + Math.floor((1 - dist / maxDist) * 80).toString(16).padStart(2,'0');
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }
    for (const n of nodes) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = n.color + 'cc';
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
}

// ─── Floating Particles ───────────────────────────────────────────────────────
function createParticles() {
  const container = document.getElementById('particles');
  const colors = ['#6366f1','#818cf8','#22d3ee','#a855f7','#f59e0b','#10b981'];
  for (let i = 0; i < 35; i++) {
    const p    = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 6 + 2;
    p.style.cssText = `
      width:${size}px;height:${size}px;
      left:${Math.random()*100}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      animation-duration:${Math.random()*20+12}s;
      animation-delay:${Math.random()*15}s;
      filter:blur(${Math.random()>0.5?'1px':'0px'});
    `;
    container.appendChild(p);
  }
}
