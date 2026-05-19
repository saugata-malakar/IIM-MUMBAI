# MedShield — 8 New Sections Integration Guide

## What you just received

| File | Drop it here |
|------|-------------|
| `sections_8_router.py` | `c:\Users\trina\Downloads\PROJECTS\IIM MUMBAI\` |
| `useMedShield.js` | `src/hooks/useMedShield.js` |
| `DiagnosticAI.jsx` | `src/components/sections/DiagnosticAI.jsx` |
| `Sections2to8.jsx` | `src/components/sections/Sections2to8.jsx` |
| `NewSections.jsx` | `src/pages/NewSections.jsx` |
| `sections.css` | `src/styles/sections.css` |

---

## Step 1 — Wire the backend router (2 minutes)

Open `backend_api.py` and add **3 lines**:

```python
# At the top — add this import
from sections_8_router import router as sections_router

# After app = FastAPI(...) — add this
app.include_router(sections_router, prefix="/api/sections")
```

That's it. Restart the server:

```bash
cd "c:\Users\trina\Downloads\PROJECTS\IIM MUMBAI"
.venv\Scripts\Activate.ps1
python backend_api.py
```

Verify all 8 new endpoints are live:
- http://localhost:8003/docs → scroll down and you'll see the "8 Sections" group

---

## Step 2 — Create the components folder (1 minute)

```bash
mkdir src\components\sections
```

Copy the files:
```
DiagnosticAI.jsx  → src/components/sections/DiagnosticAI.jsx
Sections2to8.jsx  → src/components/sections/Sections2to8.jsx
```

---

## Step 3 — Add the styles (30 seconds)

Copy `sections.css` to `src/styles/sections.css`.

If you don't have a `styles/` folder:
```bash
mkdir src\styles
```

---

## Step 4 — Add the page and route (2 minutes)

Copy `NewSections.jsx` to `src/pages/NewSections.jsx`.

Open your router file (usually `src/App.jsx` or `src/router.jsx`) and add:

```jsx
import NewSections from "./pages/NewSections";

// Inside your Routes block:
<Route path="/sections" element={<NewSections />} />
```

Then add a link to your navbar wherever you want it:
```jsx
<Link to="/sections">Advanced Analytics</Link>
```

---

## Step 5 — Add the API base URL (30 seconds)

In your `.env` file (create one in the project root if missing):

```
REACT_APP_API_URL=http://localhost:8003/api/sections
```

For production on Render, change this to your deployed backend URL.

---

## Step 6 — Start and verify

```bash
# Terminal 1 — Backend
cd "c:\Users\trina\Downloads\PROJECTS\IIM MUMBAI"
.venv\Scripts\Activate.ps1
python backend_api.py

# Terminal 2 — Frontend
cd "c:\Users\trina\Downloads\PROJECTS\IIM MUMBAI"
npm start
```

Go to: http://localhost:3000/sections

You should see all 8 tabs working.

---

## Quick test — verify each endpoint directly

Open http://localhost:8003/docs and test these:

```
POST /api/sections/diagnostic/predict
Body: {"age":45,"blood_sugar":240,"systolic_bp":135,"heart_rate":82,"gender":1}
Expected: predicted_diagnosis = "Diabetes Type 2"

GET /api/sections/drug-intel/search?q=Metformin
Expected: results with type=drug

POST /api/sections/reid/simulate
Body: {"adversary":"prosecutor","age_group":"31-50","gender":"M","blood_group":"all","diagnosis":"all"}
Expected: matched_records >= 5, protected = true

GET /api/sections/ocr/synthetic?idx=0
Expected: original_text and redacted_text

GET /api/sections/population/analytics
Expected: disease_prevalence array with 10 items

POST /api/sections/llm-export/generate
Body: {"task_type":"drug","export_format":"hf","record_count":100}
Expected: total_pairs=100, sample_pairs array

GET /api/sections/explainability/kanon?k=5
Expected: records array, all k_safe=true

POST /api/sections/dpdp/audit
Expected: compliance_score=83, checks_passed=5, checks_total=6
```

---

## Fix the one DPDP failure

The audit returns 83% because `schema_purpose.json` is missing.
Fix it in 30 seconds — create this file in your project root:

```json
{
  "data_purpose": "Medical data anonymization research under DPDP Act 2023",
  "processing_basis": "Research and academic study",
  "data_principal": "Anonymized synthetic patient records — no real individuals",
  "data_fiduciary": "MedShield Research Platform",
  "retention_period": "Duration of research project",
  "dpdp_section": "Section 6(2)"
}
```

After adding this file, the auditor will return 100% compliance.

---

## Folder structure after integration

```
IIM MUMBAI/
├── backend_api.py              ← +3 lines added
├── sections_8_router.py        ← NEW — drop here
├── schema_purpose.json         ← NEW — create for 100% DPDP
└── src/
    ├── hooks/
    │   └── useMedShield.js     ← NEW
    ├── components/
    │   └── sections/
    │       ├── DiagnosticAI.jsx    ← NEW
    │       └── Sections2to8.jsx   ← NEW
    ├── pages/
    │   └── NewSections.jsx     ← NEW
    └── styles/
        └── sections.css        ← NEW
```

---

## Dark mode

If your site uses a dark theme toggled with `data-theme="dark"` on `<html>`, 
the CSS already has dark mode overrides built in. No extra work needed.

If you use a different dark mode approach (CSS class `.dark`, Tailwind dark:, etc.),
find the `[data-theme="dark"]` block at the bottom of `sections.css` and change the selector.

---

## Common errors

**CORS error in browser console**
Add this to `backend_api.py` if not already there:
```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_methods=["*"], allow_headers=["*"])
```

**ModuleNotFoundError: sections_8_router**
Make sure `sections_8_router.py` is in the same folder as `backend_api.py`,
not inside a subfolder.

**import error in Sections2to8.jsx**
Each component is a named export. Import like this:
```jsx
import { DrugIntel, ReIDSimulator, OCRLab } from "../components/sections/Sections2to8";
```
Not as a default import.

**Blank page on /sections**
Check browser console. Most likely cause: missing CSS file or wrong import path.
Make sure `import "../styles/sections.css"` path matches where you placed sections.css.
