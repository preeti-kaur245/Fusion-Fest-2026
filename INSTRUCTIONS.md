# 📋 RIMT University – Fusion Fest 2026 | Certificate Portal Instructions

---

## 📁 Project Structure

```
fusion-fest-2026/
├── index.html                        ← Main portal page
├── style.css                         ← All styles
├── script.js                         ← All logic (JSZip, matching, download)
├── participants.json                  ← Generated participant list (112 students)
├── convert.js                        ← Script to regenerate participants.json
├── Fusion Fest 2026 (Responses).json ← Raw Google Form responses
└── INSTRUCTIONS.md                   ← This file
```

---

## 🔐 Admin Credentials

| Field    | Value             |
|----------|-------------------|
| Username | `manpreet@24680`  |
| Password | `ma7347364522`    |

---

## 🔄 Regenerate participants.json from Responses

If you get new form responses, run:

```bash
node convert.js
```

This reads **Fusion Fest 2026 (Responses).json** → outputs a fresh **participants.json** (deduped, sorted A-Z).

---

## 📦 Prepare Certificates ZIP

1. Put all PDF certificates in one folder
2. **Each PDF filename = participant's name exactly**, e.g.:
   - `Mohd Anas.pdf`
   - `Manpreet kaur.pdf`
   - `Harjinder kaur.pdf`
3. Select all PDFs → right-click → **Send to → Compressed (ZIP)**
4. Upload this ZIP via the **Admin Panel**

> ✅ Matching is **case-insensitive** — `manpreet kaur.pdf` will match `Manpreet kaur`

---

## 🖥️ Run Locally

### Option A — Python (Recommended)

```bash
python -m http.server 3000
```
Open: **http://localhost:3000**

### Option B — VS Code Live Server

Right-click `index.html` → **Open with Live Server**

> ⚠️ Never open `index.html` directly via `file://` — the JSON auto-load won't work.

---

## 🌐 Host on GitHub Pages

1. Create a new **public** GitHub repository named `fusion-fest-2026`
2. Upload these files:
   - `index.html`
   - `style.css`
   - `script.js`
   - `participants.json`
3. Go to **Settings → Pages → Source: main branch / root**
4. Your site will be live at: `https://YOUR_USERNAME.github.io/fusion-fest-2026/`

---

## 📖 How to Use

### Admin Steps (one-time setup per session):
1. Click **Admin Panel** tab
2. Enter username + password
3. Upload **Certificates ZIP** (drag-drop or click)
4. Upload **participants.json** if not auto-loaded
5. Done — the system is ready for students

### Student Steps:
1. Open the website
2. Enter **Full Name** (exactly as registered)
3. Enter **Roll Number**
4. Click **Search Certificate**
5. Download PDF

---

## ❓ Troubleshooting

| Issue | Fix |
|-------|-----|
| "Participant Not Found" | Check spelling of name & roll number |
| "Certificate Not Found" | PDF filename must match the name in participants.json |
| ZIP not loading | Must be `.zip` (not `.rar` or `.7z`) |
| Stat shows 0 participants | Reload page or re-upload participants.json |
| Admin login fails | Use exact credentials above (case-sensitive) |

---

> Portal built for **RIMT University – Fusion Fest 2026** 🎉
