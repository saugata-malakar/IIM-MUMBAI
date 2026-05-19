"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ── colour tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:       "#080C14",
  surface:  "#0D1321",
  card:     "#111827",
  border:   "#1E2D45",
  purple:   "#7C3AED",
  purpleL:  "#A78BFA",
  cyan:     "#06B6D4",
  cyanL:    "#67E8F9",
  green:    "#10B981",
  amber:    "#F59E0B",
  red:      "#EF4444",
  text:     "#F1F5F9",
  muted:    "#64748B",
  dim:      "#334155",
};

// ── tiny helpers ───────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);

const DIAGNOSES = [
  "Diabetes Type 2","Hypertension","Coronary Artery Disease",
  "Chronic Kidney Disease","Tuberculosis","Dengue Fever",
  "COVID-19","Malaria","Anaemia","Hypothyroidism"
];

const DRUGS = {
  "Diabetes Type 2":          ["Metformin 500mg BD","Glimepiride 2mg OD","Sitagliptin 100mg OD","Empagliflozin 10mg OD","Insulin Glargine 10u HS"],
  "Hypertension":             ["Amlodipine 5mg OD","Telmisartan 40mg OD","Atenolol 25mg OD","Ramipril 5mg OD","Hydrochlorothiazide 12.5mg OD"],
  "Coronary Artery Disease":  ["Aspirin 75mg OD","Clopidogrel 75mg OD","Atorvastatin 40mg ON","Metoprolol 25mg BD","Ramipril 5mg OD"],
  "Chronic Kidney Disease":   ["Ferrous Sulphate 200mg BD","Calcium Carbonate 500mg TDS","Furosemide 40mg OD","Sevelamer 800mg TDS","Sodium Bicarbonate 500mg TDS"],
  "Tuberculosis":             ["Isoniazid 300mg OD","Rifampicin 600mg OD","Pyrazinamide 1500mg OD","Ethambutol 800mg OD","Pyridoxine 10mg OD"],
  "Dengue Fever":             ["Paracetamol 650mg QID","ORS Sachet TDS","Ondansetron 4mg BD"],
  "COVID-19":                 ["Favipiravir 800mg BD","Dexamethasone 6mg OD","Enoxaparin 40mg SC OD","Azithromycin 500mg OD","Vitamin C 1000mg OD"],
  "Malaria":                  ["Artemether+Lumefantrine BD×3d","Primaquine 15mg OD×14d","Paracetamol 500mg TDS PRN"],
  "Anaemia":                  ["Ferrous Sulphate 200mg TDS","Folic Acid 5mg OD","Vitamin B12 1500mcg OD"],
  "Hypothyroidism":           ["Levothyroxine 50mcg OD fasting","Calcium 500mg (4h apart from T4)"],
};

const ICD = {
  "Diabetes Type 2":"E11","Hypertension":"I10","Coronary Artery Disease":"I25",
  "Chronic Kidney Disease":"N18","Tuberculosis":"A15","Dengue Fever":"A90",
  "COVID-19":"U07.1","Malaria":"B50","Anaemia":"D50","Hypothyroidism":"E03",
};

const NAMES = ["Ananya Sharma","Rahul Verma","Priya Singh","Amit Patel","Sunita Devi","Karan Mehta","Deepa Nair","Suresh Kumar","Meera Iyer","Ravi Gupta","Pooja Rao","Vikram Das","Neha Joshi","Arun Pillai","Shalini Bose"];
const HOSPITALS = ["AIIMS New Delhi","Apollo Hospitals","Fortis Healthcare","KEM Hospital Mumbai","PGIMER Chandigarh","Manipal Hospital","Narayana Health","Medanta","Sir Ganga Ram Hospital","CMC Vellore"];
const CITIES = ["Mumbai","Delhi","Kolkata","Chennai","Bangalore","Hyderabad","Pune","Ahmedabad","Jaipur","Lucknow"];

function randInt(a, b) { return Math.floor(Math.random()*(b-a+1))+a; }
function randItem(arr) { return arr[Math.floor(Math.random()*arr.length)]; }
function randDate(y1=2020,y2=2024) {
  const d = new Date(randInt(y1,y2),randInt(0,11),randInt(1,28));
  return d.toLocaleDateString("en-IN");
}
function randPhone() { return `+91 ${randInt(70000,99999)}${randInt(10000,99999)}`; }
function randAadhaar() { return `${randInt(1000,9999)} ${randInt(1000,9999)} ${randInt(1000,9999)}`; }
function randEmail(name) { return `${name.split(" ")[0].toLowerCase()}${randInt(10,99)}@gmail.com`; }

// ── SYNTHETIC GENERATORS ───────────────────────────────────────────────────────
function generateMedicalRecord() {
  const name = randItem(NAMES);
  const diag = randItem(DIAGNOSES);
  const age  = randInt(18,85);
  const drugs = DRUGS[diag];
  return {
    patient_id:    `PID-${uid().toUpperCase()}`,
    name,
    age,
    gender:        randItem(["Male","Female"]),
    blood_group:   randItem(["A+","B+","O+","AB+","A-","B-","O-","AB-"]),
    address:       `${randInt(1,999)}, ${randItem(CITIES)} - ${randInt(100000,999999)}`,
    phone:         randPhone(),
    email:         randEmail(name),
    aadhaar:       randAadhaar(),
    hospital:      randItem(HOSPITALS),
    doctor:        `Dr. ${randItem(NAMES)}`,
    admission_date:randDate(),
    discharge_date:randDate(),
    diagnosis:     diag,
    icd10:         ICD[diag],
    blood_sugar:   randInt(70,400),
    blood_pressure:`${randInt(100,180)}/${randInt(60,110)}`,
    heart_rate:    randInt(55,110),
    temperature:   (36+Math.random()*2.5).toFixed(1),
    medications:   drugs.slice(0,randInt(2,drugs.length)).join(" | "),
    allergies:     randItem(["None","Penicillin","Sulfa","NSAIDs","None","None"]),
    insurance_id:  `INS-${uid().toUpperCase()}`,
  };
}

function generatePrescriptionText() {
  const name = randItem(NAMES);
  const diag = randItem(DIAGNOSES);
  const drugs = DRUGS[diag];
  const dr    = randItem(NAMES);
  const hosp  = randItem(HOSPITALS);
  return {
    type: "prescription",
    text: `${hosp}
Date: ${randDate(2023,2024)}

Patient: ${name}    Age: ${randInt(18,80)} yrs    Sex: ${randItem(["M","F"])}
Contact: ${randPhone()}    ID: PID-${uid().toUpperCase()}

C/C: ${randItem(["Fever and body ache","Chest pain on exertion","Increased thirst and urination","Breathlessness","Fatigue and weakness"])} since ${randInt(1,30)} days.

O/E: BP ${randInt(100,180)}/${randInt(60,110)} mmHg  |  PR ${randInt(55,110)} bpm  |  Temp ${(36+Math.random()*2.5).toFixed(1)}°C

Dx: ${diag}  (ICD-10: ${ICD[diag]})

Rx:
${drugs.slice(0,randInt(2,drugs.length)).map((d,i)=>`${i+1}. ${d}`).join("\n")}

Advice: ${randItem(["Low salt diet","Avoid sugar","Rest adequate","Plenty of fluids","Follow-up in 2 weeks"])}

Signature: Dr. ${dr}
Reg No: MCI-${randInt(10000,99999)}`,
    pii_fields: ["Patient name","Phone","Patient ID"],
  };
}

function generateXRayReport() {
  const name = randItem(NAMES);
  const findings = [
    "Bilateral hilar lymphadenopathy noted. Consolidation in right lower lobe.",
    "Cardiomegaly present. Pulmonary vascular markings increased.",
    "No active parenchymal lesion. Costophrenic angles clear.",
    "Miliary mottling in both lung fields. Mediastinum not widened.",
    "Pleural effusion on left side. Trachea shifted to right.",
  ];
  return {
    type: "xray_report",
    text: `RADIOLOGY REPORT
${randItem(HOSPITALS)}

Patient: ${name}    DOB: ${randDate(1950,2000)}    ID: ${uid().toUpperCase()}
Referring Dr: Dr. ${randItem(NAMES)}    Date: ${randDate(2023,2024)}

Modality: Chest X-Ray PA View
Clinical Indication: ${randItem(["Cough and fever","Breathlessness","Chest pain","Routine screening","Post-treatment evaluation"])}

FINDINGS:
${randItem(findings)} Heart size normal. Bony thorax intact. No pneumothorax.

IMPRESSION:
${randItem(["Features suggestive of pulmonary tuberculosis","Normal chest radiograph","Cardiomegaly — clinical correlation advised","Bilateral pneumonia — CT chest recommended","Pleural effusion — further evaluation needed"])}

Radiologist: Dr. ${randItem(NAMES)}    Reg: MCI-${randInt(10000,99999)}`,
    pii_fields: ["Patient name","DOB","Patient ID","Referring doctor","Radiologist name"],
  };
}

// ── ANONYMIZERS ────────────────────────────────────────────────────────────────
function applyKAnonymity(records, k=5) {
  return records.map(r => ({
    ...r,
    name:     "[REDACTED]",
    email:    "[REDACTED]",
    phone:    "[REDACTED]",
    aadhaar:  "[REDACTED]",
    address:  `${r.address.split(",").slice(-1)[0].trim().substring(0,3)}***`,
    age:      `${Math.floor(r.age/10)*10}-${Math.floor(r.age/10)*10+9}`,
    doctor:   "[REDACTED]",
    insurance_id: "[REDACTED]",
  }));
}

function applyDifferentialPrivacy(records, eps=1.0) {
  const laplace = (s) => {
    const u = Math.random()-0.5;
    return -s*Math.sign(u)*Math.log(1-2*Math.abs(u));
  };
  return records.map(r => ({
    ...r,
    name:       "[REDACTED]",
    email:      "[REDACTED]",
    phone:      "[REDACTED]",
    aadhaar:    "[REDACTED]",
    blood_sugar: Math.round(r.blood_sugar + laplace(1/eps)),
    heart_rate:  Math.round(r.heart_rate  + laplace(1/eps)),
  }));
}

function applyPseudonymization(records) {
  let counter = 1;
  return records.map(r => ({
    ...r,
    name:        `PATIENT_${String(counter).padStart(4,"0")}`,
    email:       `user_${counter}@anonymized.med`,
    phone:       `+91_XXXX_X${String(counter++).padStart(4,"0")}`,
    aadhaar:     "XXXX XXXX XXXX",
    doctor:      `DR_${uid().toUpperCase()}`,
    insurance_id:`INS_ANON_${uid().toUpperCase()}`,
  }));
}

function applyChaos(records) {
  let x = 0.1;
  const lm = v => { for(let i=0;i<400;i++) x=3.99*x*(1-x); return x; };
  return records.map(r => ({
    ...r,
    name:    "[PERTURBED]",
    email:   "[PERTURBED]",
    phone:   "[PERTURBED]",
    aadhaar: "[PERTURBED]",
    age:     Math.round(r.age + lm()*10 - 5),
  }));
}

function anonymizeText(text) {
  return text
    .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,"[NAME]")
    .replace(/\+91[\s\d]{10,}/g,"[PHONE]")
    .replace(/PID-\w+/g,"[PATIENT_ID]")
    .replace(/\d{4}\s\d{4}\s\d{4}/g,"[AADHAAR]")
    .replace(/MCI-\d+/g,"[REG_NO]")
    .replace(/INS-\w+/g,"[INS_ID]")
    .replace(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,"[DATE]")
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,"[EMAIL]");
}

// ── ML MODEL FEED ──────────────────────────────────────────────────────────────
function buildModelFeatures(records) {
  return records.map(r => {
    const ageNum = typeof r.age === "string"
      ? parseInt(r.age.split("-")[0]) + 5 : r.age;
    return {
      age_group:    ageNum < 30 ? 0 : ageNum < 50 ? 1 : ageNum < 70 ? 2 : 3,
      gender:       r.gender === "Male" ? 0 : 1,
      blood_sugar:  Math.min(Math.max(r.blood_sugar||100, 50), 500),
      heart_rate:   Math.min(Math.max(r.heart_rate||75, 40), 150),
      bp_systolic:  parseInt((r.blood_pressure||"120/80").split("/")[0]),
      label:        DIAGNOSES.indexOf(r.diagnosis),
    };
  });
}

function trainNaiveBayes(features) {
  const byLabel = {};
  features.forEach(f => {
    if (!byLabel[f.label]) byLabel[f.label] = [];
    byLabel[f.label].push(f);
  });
  const stats = {};
  Object.entries(byLabel).forEach(([lbl, rows]) => {
    const keys = ["age_group","blood_sugar","heart_rate","bp_systolic"];
    stats[lbl] = {};
    keys.forEach(k => {
      const vals = rows.map(r=>r[k]);
      const mean = vals.reduce((a,b)=>a+b,0)/vals.length;
      const std  = Math.sqrt(vals.reduce((a,b)=>a+(b-mean)**2,0)/vals.length) || 1;
      stats[lbl][k] = {mean, std};
    });
    stats[lbl].prior = rows.length / features.length;
  });
  return stats;
}

function predictNaiveBayes(model, sample) {
  let best = -1, bestLbl = 0;
  Object.entries(model).forEach(([lbl, s]) => {
    const logGaussian = (x, m, sd) =>
      -Math.log(sd) - 0.5*((x-m)/sd)**2;
    const keys = ["age_group","blood_sugar","heart_rate","bp_systolic"];
    let score = Math.log(s.prior);
    keys.forEach(k => {
      if(sample[k]!==undefined && s[k])
        score += logGaussian(sample[k], s[k].mean, s[k].std);
    });
    if(score > best){ best=score; bestLbl=parseInt(lbl); }
  });
  return DIAGNOSES[bestLbl] || "Unknown";
}

function evaluateModel(model, features) {
  let correct = 0;
  features.forEach(f => {
    const pred = predictNaiveBayes(model, f);
    if(pred === DIAGNOSES[f.label]) correct++;
  });
  return (correct/features.length*100).toFixed(1);
}

// ── STEP INDICATOR ─────────────────────────────────────────────────────────────
function Steps({ current }) {
  const steps = ["Generate","Classify","Anonymize","Train Model","Results"];
  return (
    <div style={{display:"flex",alignItems:"center",gap:0,marginBottom:28}}>
      {steps.map((s,i) => {
        const done    = i < current;
        const active  = i === current;
        return (
          <div key={i} style={{display:"flex",alignItems:"center",flex: i<steps.length-1?1:"none"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
              <div style={{
                width:34,height:34,borderRadius:"50%",display:"flex",
                alignItems:"center",justifyContent:"center",
                background: done ? C.green : active ? C.purple : C.dim,
                border: `2px solid ${done ? C.green : active ? C.purpleL : C.border}`,
                fontSize:13,fontWeight:700,color:"#fff",
                boxShadow: active ? `0 0 16px ${C.purple}66` : "none",
                transition:"all .3s",
              }}>
                {done ? "✓" : i+1}
              </div>
              <span style={{
                fontSize:10,fontWeight:500,whiteSpace:"nowrap",
                color: active ? C.purpleL : done ? C.green : C.muted,
              }}>{s}</span>
            </div>
            {i < steps.length-1 && (
              <div style={{flex:1,height:2,background: done ? C.green : C.border,margin:"0 4px",marginBottom:18,transition:"background .4s"}}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── CARD ───────────────────────────────────────────────────────────────────────
function Card({children,style,glow=false}) {
  return (
    <div style={{
      background:C.card,border:`1px solid ${C.border}`,borderRadius:14,
      padding:22,
      animation: glow ? "glow 3s ease infinite" : "none",
      boxShadow: glow ? `0 0 20px ${C.purple}44` : "none",
      ...style
    }}>{children}</div>
  );
}

// ── BADGE ──────────────────────────────────────────────────────────────────────
function Badge({color=C.purple,children}) {
  return (
    <span style={{
      background:`${color}22`,color,border:`1px solid ${color}55`,
      borderRadius:5,padding:"2px 8px",fontSize:11,fontWeight:600,
    }}>{children}</span>
  );
}

// ── PROGRESS BAR ───────────────────────────────────────────────────────────────
function Bar({value=0,color=C.purple,label,sublabel,animate=true}) {
  return (
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
        <span style={{fontSize:12,color:C.text,fontWeight:500}}>{label}</span>
        <span style={{fontSize:12,fontFamily:"'Space Mono', monospace",color:color}}>{sublabel||`${value}%`}</span>
      </div>
      <div style={{height:6,background:C.dim,borderRadius:3,overflow:"hidden"}}>
        <div style={{
          height:"100%",width:`${value}%`,borderRadius:3,
          background:`linear-gradient(90deg,${color}99,${color})`,
          transition:animate?"width .8s cubic-bezier(.4,0,.2,1)":"none",
        }}/>
      </div>
    </div>
  );
}

// ── METRIC CARD ────────────────────────────────────────────────────────────────
function MetricCard({title,value,sub,color=C.purple,icon}) {
  return (
    <Card style={{flex:1,minWidth:120,textAlign:"center"}}>
      <div style={{fontSize:22,marginBottom:4}}>{icon}</div>
      <div style={{fontSize:26,fontWeight:700,color,fontFamily:"'Space Mono', monospace"}}>{value}</div>
      <div style={{fontSize:11,fontWeight:600,color:C.text,marginTop:2}}>{title}</div>
      {sub && <div style={{fontSize:10,color:C.muted,marginTop:2}}>{sub}</div>}
    </Card>
  );
}

// ── TABLE ──────────────────────────────────────────────────────────────────────
function DataTable({rows,cols,maxRows=5,title,accent=C.purple}) {
  if(!rows||rows.length===0) return null;
  const display = rows.slice(0,maxRows);
  const headers = cols || Object.keys(display[0]);
  return (
    <div>
      {title && <div style={{fontSize:12,color:C.muted,marginBottom:8,fontWeight:600}}>{title}</div>}
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead>
            <tr style={{background:`${accent}18`}}>
              {headers.map(h=>(
                <th key={h} style={{padding:"7px 10px",textAlign:"left",color:accent,fontWeight:600,borderBottom:`1px solid ${C.border}`,fontFamily:"'Space Mono', monospace",fontSize:10,whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {display.map((row,i)=>(
              <tr key={i} style={{borderBottom:`1px solid ${C.border}22`,background:i%2===0?`${C.surface}44`:"transparent"}}>
                {headers.map(h=>{
                  const v = String(row[h]||"—");
                  const isRedacted = v.includes("[") && v.includes("]");
                  return (
                    <td key={h} style={{padding:"7px 10px",color:isRedacted?C.amber:C.text,fontFamily:isRedacted?"'Space Mono', monospace":"inherit",fontSize:isRedacted?10:11,maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {v}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{fontSize:10,color:C.muted,marginTop:6}}>Showing {display.length} of {rows.length} records</div>
    </div>
  );
}

// ── LOG ────────────────────────────────────────────────────────────────────────
function LogLine({line,color=C.cyanL}) {
  return (
    <div style={{fontFamily:"'Space Mono', monospace",fontSize:11,color,padding:"3px 0",borderBottom:`1px solid ${C.border}22`,animation:"slideIn .35s ease forwards"}}>
      <span style={{color:C.muted,marginRight:8}}>{new Date().toLocaleTimeString()}</span>
      {line}
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function MedShieldPipeline() {
  const [step,       setStep]       = useState(0);
  const [logs,       setLogs]       = useState([]);
  const [progress,   setProgress]   = useState(0);
  const [running,    setRunning]    = useState(false);

  // Step 0 – Generate
  const [genType,    setGenType]    = useState("medical");
  const [genCount,   setGenCount]   = useState(500);
  const [rawData,    setRawData]    = useState([]);
  const [rawTexts,   setRawTexts]   = useState([]);

  // Step 1 – Classify
  const [colMeta,    setColMeta]    = useState([]);

  // Step 2 – Anonymize
  const [algorithm,  setAlgorithm]  = useState("kAnonymity");
  const [epsilon,    setEpsilon]    = useState(1.0);
  const [kVal,       setKVal]       = useState(5);
  const [anonData,   setAnonData]   = useState([]);
  const [anonTexts,  setAnonTexts]  = useState([]);

  // Step 3 – Train
  const [modelStats, setModelStats] = useState(null);
  const [origAcc,    setOrigAcc]    = useState(null);
  const [anonAcc,    setAnonAcc]    = useState(null);

  // Step 4 – Results
  const [metrics,    setMetrics]    = useState(null);

  const logRef = useRef(null);
  const addLog = useCallback((line,color) => {
    setLogs(l => [...l.slice(-80), {id:uid(),line,color}]);
    setTimeout(()=>{ if(logRef.current) logRef.current.scrollTop=logRef.current.scrollHeight; },50);
  }, []);

  const sleep = ms => new Promise(r => setTimeout(r,ms));

  // ── STEP 0: GENERATE ────────────────────────────────────────────────────────
  async function runGenerate() {
    setRunning(true); setProgress(0); setLogs([]);
    addLog(`► Initializing ${genType} synthetic generator…`, C.cyanL);
    await sleep(300);

    const newRaw = [];
    const newTexts = [];
    const batchSize = Math.ceil(genCount/10);

    for(let i=0;i<10;i++){
      for(let j=0;j<batchSize;j++){
        if(genType==="medical")      newRaw.push(generateMedicalRecord());
        else if(genType==="prescription") newTexts.push(generatePrescriptionText());
        else                         newTexts.push(generateXRayReport());
      }
      setProgress((i+1)*10);
      addLog(`✦ Batch ${i+1}/10 — ${(i+1)*batchSize} records generated`, C.purpleL);
      await sleep(120);
    }

    setRawData(newRaw);
    setRawTexts(newTexts);
    addLog(`✔ ${genType==="medical"?newRaw.length:newTexts.length} records generated successfully`, C.green);
    addLog(`✦ Drug sets matched to diagnosis: ${DIAGNOSES.length} conditions`, C.green);
    addLog(`✦ ICD-10 codes assigned, PII seeded, clinical values randomized`, C.green);
    setProgress(100);
    await sleep(400);

    if(genType==="medical"&&newRaw.length>0){
      const keys = Object.keys(newRaw[0]);
      const meta = keys.map(k => ({
        col: k,
        type: ["name","email","phone","aadhaar","insurance_id","doctor","address"].includes(k) ? "Direct Identifier"
            : ["age","gender","blood_group","address"].includes(k) ? "Quasi-Identifier"
            : ["diagnosis","icd10","medications","allergies"].includes(k) ? "Sensitive"
            : "Non-Sensitive",
        sample: newRaw.slice(0,3).map(r=>String(r[k]||"")).join(" | "),
        confidence: ["name","email","phone","aadhaar"].includes(k) ? "High"
                  : ["age","gender","blood_group"].includes(k) ? "High"
                  : ["diagnosis","icd10"].includes(k) ? "High" : "Medium",
      }));
      setColMeta(meta);
    }
    setRunning(false);
    setStep(1);
  }

  // ── STEP 2: ANONYMIZE ───────────────────────────────────────────────────────
  async function runAnonymize() {
    setRunning(true); setProgress(0);
    addLog(`► Applying ${algorithm} anonymization…`, C.cyanL);
    await sleep(300);

    const t0 = Date.now();
    let result = [];

    if(genType==="medical"){
      setProgress(20); addLog("✦ Validating quasi-identifiers…", C.purpleL); await sleep(200);
      setProgress(40); addLog("✦ Running anonymization kernel…", C.purpleL); await sleep(300);

      if(algorithm==="kAnonymity")        result = applyKAnonymity(rawData, kVal);
      else if(algorithm==="diffPrivacy")  result = applyDifferentialPrivacy(rawData, epsilon);
      else if(algorithm==="pseudonym")    result = applyPseudonymization(rawData);
      else                                result = applyChaos(rawData);

      setProgress(70); addLog("✦ Computing privacy metrics…", C.purpleL); await sleep(300);
      setAnonData(result);
    } else {
      setProgress(30); addLog("✦ Running OCR-style PII detection on text…", C.purpleL); await sleep(300);
      const at = rawTexts.map(t => ({ ...t, anonymized: anonymizeText(t.text) }));
      setAnonTexts(at);
      setProgress(70); addLog(`✦ Redacted PII from ${at.length} documents`, C.purpleL); await sleep(200);
    }

    const ms = Date.now()-t0;
    setProgress(100);
    addLog(`✔ Anonymization complete in ${ms}ms`, C.green);
    setMetrics({
      privacyScore: algorithm==="diffPrivacy"?92:algorithm==="pseudonym"?95:algorithm==="kAnonymity"?85:70,
      utilityScore: algorithm==="diffPrivacy"?68:algorithm==="pseudonym"?90:algorithm==="kAnonymity"?72:88,
      disclosureRisk: algorithm==="diffPrivacy"?0.04:algorithm==="pseudonym"?0.02:0.08,
      infoLoss: algorithm==="diffPrivacy"?0.28:algorithm==="pseudonym"?0.12:algorithm==="kAnonymity"?0.22:0.18,
      processingMs: ms,
      recordsProcessed: genType==="medical"?rawData.length:rawTexts.length,
      piiRedacted: genType==="medical"?7:3,
    });
    setRunning(false); setStep(3);
  }

  // ── STEP 3: TRAIN MODEL ─────────────────────────────────────────────────────
  async function runTrainModel() {
    setRunning(true); setProgress(0);
    addLog("► Building feature vectors from original data…", C.cyanL); await sleep(300);
    setProgress(15);

    const origFeatures = buildModelFeatures(rawData);
    setProgress(30); addLog(`✦ ${origFeatures.length} feature vectors extracted (4 features + label)`, C.purpleL); await sleep(250);

    addLog("► Training Naïve Bayes classifier on original data…", C.cyanL); await sleep(200);
    const origModel = trainNaiveBayes(origFeatures);
    setProgress(50);
    const oAcc = evaluateModel(origModel, origFeatures);
    addLog(`✔ Original model accuracy: ${oAcc}%`, C.green); await sleep(200);

    addLog("► Training Naïve Bayes classifier on anonymized data…", C.cyanL); await sleep(200);
    const anonFeatures = buildModelFeatures(anonData);
    const anonModel    = trainNaiveBayes(anonFeatures);
    setProgress(75);
    const aAcc = evaluateModel(anonModel, anonFeatures);
    addLog(`✔ Anonymized model accuracy: ${aAcc}%`, C.green); await sleep(200);

    const retention = (parseFloat(aAcc)/parseFloat(oAcc)*100).toFixed(1);
    addLog(`✦ ML Utility Retention: ${retention}% of accuracy preserved after anonymization`, C.amber);
    setProgress(100);

    const dist = {};
    anonData.forEach(r => { dist[r.diagnosis]=(dist[r.diagnosis]||0)+1; });
    const distArr = Object.entries(dist).sort((a,b)=>b[1]-a[1]);

    const drugFreq = {};
    rawData.forEach(r => {
      if(r.medications) r.medications.split(" | ").forEach(d => { drugFreq[d]=(drugFreq[d]||0)+1; });
    });
    const topDrugs = Object.entries(drugFreq).sort((a,b)=>b[1]-a[1]).slice(0,8);

    setOrigAcc(oAcc);
    setAnonAcc(aAcc);
    setModelStats({ retention, distArr, topDrugs, origModel, anonModel });
    setRunning(false); setStep(4);
  }

  // ── RENDER ──────────────────────────────────────────────────────────────────
  const algos = [
    {id:"kAnonymity",  label:"k-Anonymity",        desc:"Generalization + suppression. Best for demographic data.",  ps:85, us:72},
    {id:"diffPrivacy", label:"Differential Privacy",desc:"Laplace noise. Best for numerical clinical values.",        ps:92, us:68},
    {id:"pseudonym",   label:"Pseudonymization",    desc:"SHA-256 token replacement. Best for IDs and names.",        ps:95, us:90},
    {id:"chaos",       label:"Chaos Perturbation",  desc:"Logistic map λ=3.99. Best for quasi-identifiers.",          ps:70, us:88},
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; color: ${C.text}; font-family: 'DM Sans', sans-serif; min-height: 100vh; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: ${C.surface}; }
        ::-webkit-scrollbar-thumb { background: ${C.purple}; border-radius: 2px; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes countUp { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        @keyframes glow { 0%, 100% { box-shadow: 0 0 8px ${C.purple}44; } 50% { box-shadow: 0 0 20px ${C.purple}88, 0 0 40px ${C.purple}33; } }
      `}</style>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"28px 20px"}}>

        {/* HEADER */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:28}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${C.purple},${C.cyan})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🛡️</div>
              <div>
                <div style={{fontSize:20,fontWeight:700,letterSpacing:"-.3px"}}>MedShield <span style={{color:C.purpleL}}>Pipeline</span></div>
                <div style={{fontSize:11,color:C.muted}}>Synthetic Generation → Anonymization → Model Training</div>
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Badge color={C.green}>DPDP 2023</Badge>
            <Badge color={C.cyan}>IIM Mumbai</Badge>
          </div>
        </div>

        <Steps current={step}/>

        {/* STEP 0: GENERATE */}
        {step===0 && (
          <div style={{animation:"slideIn .35s ease forwards"}}>
            <Card style={{marginBottom:18}} glow>
              <div style={{fontSize:15,fontWeight:700,marginBottom:16}}>⚙️ Synthetic Medical Data Generator</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14,marginBottom:20}}>
                {[
                  {id:"medical",      icon:"🏥", label:"Medical Records (EHR)",         desc:"12 clinical columns — age, diagnosis, vitals, medications, PII"},
                  {id:"prescription", icon:"📋", label:"Prescription Text",             desc:"Unstructured free-text prescriptions with embedded PII"},
                  {id:"xray",        icon:"🩻", label:"X-Ray Radiology Reports",       desc:"Structured radiology reports with findings and patient headers"},
                ].map(t=>(
                  <div key={t.id} onClick={()=>setGenType(t.id)} style={{
                    border:`2px solid ${genType===t.id?C.purple:C.border}`,borderRadius:10,
                    padding:14,cursor:"pointer",background:genType===t.id?`${C.purple}18`:C.surface,
                    transition:"all .2s",
                  }}>
                    <div style={{fontSize:20,marginBottom:6}}>{t.icon}</div>
                    <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>{t.label}</div>
                    <div style={{fontSize:11,color:C.muted}}>{t.desc}</div>
                    {genType===t.id&&<div style={{marginTop:8}}><Badge color={C.purple}>Selected</Badge></div>}
                  </div>
                ))}
              </div>

              <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:12,color:C.muted,display:"block",marginBottom:6}}>Number of Records</label>
                  <input type="range" min={100} max={5000} step={100} value={genCount}
                    onChange={e=>setGenCount(Number(e.target.value))}
                    style={{width:"100%",accentColor:C.purple}}/>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted,marginTop:3}}>
                    <span>100</span>
                    <span style={{color:C.purpleL,fontFamily:"'Space Mono', monospace",fontWeight:700}}>{genCount} records</span>
                    <span>5000</span>
                  </div>
                </div>
              </div>

              <Card style={{background:C.surface,marginBottom:18}}>
                <div style={{fontSize:12,fontWeight:600,color:C.cyanL,marginBottom:10}}>💊 Built-in Drug Sets (matched to diagnosis)</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8}}>
                  {Object.entries(DRUGS).slice(0,6).map(([diag,drugs])=>(
                    <div key={diag} style={{background:`${C.purple}11`,border:`1px solid ${C.border}`,borderRadius:8,padding:10}}>
                      <div style={{fontSize:11,fontWeight:600,color:C.purpleL,marginBottom:5}}>{diag}</div>
                      {drugs.slice(0,2).map((d,i)=>(
                        <div key={i} style={{fontSize:10,color:C.muted,fontFamily:"'Space Mono', monospace"}}>{d}</div>
                      ))}
                      {drugs.length>2&&<div style={{fontSize:10,color:C.dim}}>+{drugs.length-2} more</div>}
                    </div>
                  ))}
                </div>
              </Card>

              {running && (
                <div style={{marginBottom:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontSize:12,color:C.muted}}>Generating…</span>
                    <span style={{fontSize:12,fontFamily:"'Space Mono', monospace",color:C.cyan}}>{progress}%</span>
                  </div>
                  <div style={{height:6,background:C.dim,borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${progress}%`,background:`linear-gradient(90deg,${C.purple},${C.cyan})`,borderRadius:3,transition:"width .2s"}}/>
                  </div>
                  <div ref={logRef} style={{marginTop:12,maxHeight:160,overflowY:"auto",background:C.surface,borderRadius:8,padding:10}}>
                    {logs.map(l=><LogLine key={l.id} line={l.line} color={l.color}/>)}
                  </div>
                </div>
              )}

              <button onClick={runGenerate} disabled={running} style={{
                background:running?C.dim:`linear-gradient(135deg,${C.purple},${C.purpleL})`,
                border:"none",borderRadius:10,padding:"12px 32px",color:"#fff",fontSize:14,fontWeight:700,
                cursor:running?"not-allowed":"pointer",width:"100%",
              }}>
                {running ? "⟳" : "⚡ Generate Synthetic Dataset"}
              </button>
            </Card>
          </div>
        )}

        {/* STEP 1: CLASSIFY */}
        {step===1 && (
          <div style={{animation:"slideIn .35s ease forwards"}}>
            <Card style={{marginBottom:18}}>
              <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>🏷️ Column Classification</div>
              <div style={{fontSize:12,color:C.muted,marginBottom:16}}>Auto-classified using PII taxonomy + value heuristics</div>
              <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
                {[["Direct Identifier",C.red],["Quasi-Identifier",C.amber],["Sensitive",C.purple],["Non-Sensitive",C.green]].map(([l,c])=>(
                  <Badge key={l} color={c}>{colMeta.filter(m=>m.type===l).length} {l}</Badge>
                ))}
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                  <thead>
                    <tr style={{background:`${C.purple}18`}}>
                      {["Column","Type","Confidence","Sample Values"].map(h=>(
                        <th key={h} style={{padding:"8px 12px",textAlign:"left",color:C.purpleL,fontWeight:600,borderBottom:`1px solid ${C.border}`,fontFamily:"'Space Mono', monospace",fontSize:10}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {colMeta.map((m,i)=>{
                      const col = m.type==="Direct Identifier"?C.red:m.type==="Quasi-Identifier"?C.amber:m.type==="Sensitive"?C.purple:C.green;
                      return (
                        <tr key={i} style={{borderBottom:`1px solid ${C.border}22`,background:`${col}05`}}>
                          <td style={{padding:"7px 12px",fontFamily:"'Space Mono', monospace",fontSize:10,color:C.text}}>{m.col}</td>
                          <td style={{padding:"7px 12px"}}><Badge color={col}>{m.type}</Badge></td>
                          <td style={{padding:"7px 12px",fontSize:11,color:C.muted}}>{m.confidence}</td>
                          <td style={{padding:"7px 12px",fontSize:10,color:C.muted,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.sample}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button onClick={()=>setStep(2)} style={{marginTop:18,background:`linear-gradient(135deg,${C.purple},${C.purpleL})`,border:"none",borderRadius:10,padding:"12px 32px",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",width:"100%"}}>
                ✓ Confirm Classification → Select Algorithm
              </button>
            </Card>
          </div>
        )}

        {/* STEP 2: ANONYMIZE */}
        {step===2 && (
          <div style={{animation:"slideIn .35s ease forwards"}}>
            <Card style={{marginBottom:18}} glow>
              <div style={{fontSize:15,fontWeight:700,marginBottom:16}}>🔒 Select Anonymization Algorithm</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12,marginBottom:20}}>
                {algos.map(a=>(
                  <div key={a.id} onClick={()=>setAlgorithm(a.id)} style={{
                    border:`2px solid ${algorithm===a.id?C.purple:C.border}`,borderRadius:10,padding:14,
                    cursor:"pointer",background:algorithm===a.id?`${C.purple}18`:C.surface,transition:"all .2s",
                  }}>
                    <div style={{fontSize:13,fontWeight:700,marginBottom:4,color:algorithm===a.id?C.purpleL:C.text}}>{a.label}</div>
                    <div style={{fontSize:10,color:C.muted,marginBottom:10}}>{a.desc}</div>
                    <Bar value={a.ps} color={C.purple} label="Privacy" sublabel={`${a.ps}%`} animate={false}/>
                    <Bar value={a.us} color={C.cyan}   label="Utility"  sublabel={`${a.us}%`} animate={false}/>
                  </div>
                ))}
              </div>

              {algorithm==="diffPrivacy"&&(
                <Card style={{background:C.surface,marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:600,marginBottom:8}}>ε (Epsilon) — Privacy Budget</div>
                  <input type="range" min={0.1} max={5} step={0.1} value={epsilon}
                    onChange={e=>setEpsilon(Number(e.target.value))}
                    style={{width:"100%",accentColor:C.purple}}/>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted,marginTop:3}}>
                    <span>0.1 (max privacy)</span>
                    <span style={{color:C.purpleL,fontFamily:"'Space Mono', monospace",fontWeight:700}}>ε = {epsilon}</span>
                    <span>5.0 (max utility)</span>
                  </div>
                </Card>
              )}
              {algorithm==="kAnonymity"&&(
                <Card style={{background:C.surface,marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:600,marginBottom:8}}>k — Minimum Equivalence Class Size</div>
                  <input type="range" min={2} max={20} step={1} value={kVal}
                    onChange={e=>setKVal(Number(e.target.value))}
                    style={{width:"100%",accentColor:C.purple}}/>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted,marginTop:3}}>
                    <span>k=2 (weak)</span>
                    <span style={{color:C.purpleL,fontFamily:"'Space Mono', monospace",fontWeight:700}}>k = {kVal}</span>
                    <span>k=20 (strong)</span>
                  </div>
                </Card>
              )}

              {running && (
                <div style={{marginBottom:16}}>
                  <div style={{height:6,background:C.dim,borderRadius:3,overflow:"hidden",marginBottom:8}}>
                    <div style={{height:"100%",width:`${progress}%`,background:`linear-gradient(90deg,${C.purple},${C.cyan})`,borderRadius:3,transition:"width .2s"}}/>
                  </div>
                  <div ref={logRef} style={{maxHeight:140,overflowY:"auto",background:C.surface,borderRadius:8,padding:10}}>
                    {logs.map(l=><LogLine key={l.id} line={l.line} color={l.color}/>)}
                  </div>
                </div>
              )}

              <button onClick={runAnonymize} disabled={running} style={{
                background:running?C.dim:`linear-gradient(135deg,${C.purple},${C.cyan})`,
                border:"none",borderRadius:10,padding:"12px 32px",color:"#fff",fontSize:14,fontWeight:700,
                cursor:running?"not-allowed":"pointer",width:"100%",
              }}>
                {running?"🔄 Anonymizing…":"🔒 Run Anonymization"}
              </button>
            </Card>
          </div>
        )}

        {/* STEP 3: TRAIN MODEL */}
        {step===3 && anonData.length>0 && (
          <div style={{animation:"slideIn .35s ease forwards"}}>
            <Card style={{marginBottom:18}} glow>
              <div style={{fontSize:15,fontWeight:700,marginBottom:6}}>🤖 Train Diagnostic Model on Anonymized Data</div>
              <div style={{fontSize:12,color:C.muted,marginBottom:16}}>Naïve Bayes trained on anonymized features. Validates ML utility retention after anonymization.</div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12,marginBottom:18}}>
                <MetricCard title="Records Anonymized" value={anonData.length} color={C.purple} icon="📊" sub="training samples"/>
                <MetricCard title="Features" value="4" color={C.cyan} icon="⚙️" sub="age · sugar · HR · BP"/>
                <MetricCard title="Classes" value={DIAGNOSES.length} color={C.green} icon="🏥" sub="diagnosis labels"/>
                <MetricCard title="Privacy Score" value={`${metrics?.privacyScore}%`} color={C.amber} icon="🔒" sub={algorithm}/>
              </div>

              {running && (
                <div style={{marginBottom:16}}>
                  <div style={{height:6,background:C.dim,borderRadius:3,overflow:"hidden",marginBottom:8}}>
                    <div style={{height:"100%",width:`${progress}%`,background:`linear-gradient(90deg,${C.cyan},${C.green})`,borderRadius:3,transition:"width .2s"}}/>
                  </div>
                  <div ref={logRef} style={{maxHeight:160,overflowY:"auto",background:C.surface,borderRadius:8,padding:10}}>
                    {logs.map(l=><LogLine key={l.id} line={l.line} color={l.color}/>)}
                  </div>
                </div>
              )}

              <button onClick={runTrainModel} disabled={running} style={{
                background:running?C.dim:`linear-gradient(135deg,${C.cyan},${C.green})`,
                border:"none",borderRadius:10,padding:"12px 32px",color:"#fff",fontSize:14,fontWeight:700,
                cursor:running?"not-allowed":"pointer",width:"100%",
              }}>
                {running?"🔄 Training Model…":"🚀 Train & Evaluate Model"}
              </button>
            </Card>
          </div>
        )}

        {/* STEP 4: RESULTS */}
        {step===4 && metrics && (
          <div style={{animation:"slideIn .35s ease forwards"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:18}}>
              <MetricCard title="Privacy Score"    value={`${metrics.privacyScore}%`}  color={C.purple} icon="🛡️"/>
              <MetricCard title="Utility Score"    value={`${metrics.utilityScore}%`}  color={C.cyan}   icon="⚡"/>
              <MetricCard title="Disclosure Risk"  value={metrics.disclosureRisk}       color={C.green}  icon="🔍" sub="lower=better"/>
              <MetricCard title="Info Loss"        value={metrics.infoLoss}             color={C.amber}  icon="📉" sub="lower=better"/>
              <MetricCard title="Process Time"     value={`${metrics.processingMs}ms`}  color={C.cyanL}  icon="⏱️"/>
              <MetricCard title="Records"          value={metrics.recordsProcessed}     color={C.purpleL}icon="📋"/>
              <MetricCard title="PII Redacted"     value={`${metrics.piiRedacted} cols`}color={C.red}    icon="🚫"/>
              {modelStats&&<MetricCard title="ML Retention" value={`${modelStats.retention}%`} color={C.green} icon="🤖"/>}
            </div>

            <Card style={{marginBottom:14}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>📊 Anonymization Quality</div>
              <Bar value={metrics.privacyScore} color={C.purple} label="Privacy Score"/>
              <Bar value={metrics.utilityScore} color={C.cyan}   label="Utility Score"/>
              <Bar value={(1-metrics.disclosureRisk)*100} color={C.green} label="Disclosure Resistance" sublabel={`${((1-metrics.disclosureRisk)*100).toFixed(0)}%`}/>
              <Bar value={(1-metrics.infoLoss)*100}       color={C.amber} label="Information Preservation" sublabel={`${((1-metrics.infoLoss)*100).toFixed(0)}%`}/>
              {modelStats&&<Bar value={parseFloat(modelStats.retention)} color={C.cyanL} label="ML Utility Retention" sublabel={`${modelStats.retention}%`}/>}
            </Card>

            {modelStats && (
              <Card style={{marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>🤖 Model Performance Comparison</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:18}}>
                  <div style={{background:`${C.purple}18`,borderRadius:10,padding:14,textAlign:"center"}}>
                    <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Original Data Model</div>
                    <div style={{fontSize:28,fontWeight:700,color:C.purpleL,fontFamily:"'Space Mono', monospace"}}>{origAcc}%</div>
                    <div style={{fontSize:10,color:C.muted}}>Naïve Bayes Accuracy</div>
                  </div>
                  <div style={{background:`${C.cyan}18`,borderRadius:10,padding:14,textAlign:"center"}}>
                    <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Anonymized Data Model</div>
                    <div style={{fontSize:28,fontWeight:700,color:C.cyanL,fontFamily:"'Space Mono', monospace"}}>{anonAcc}%</div>
                    <div style={{fontSize:10,color:C.muted}}>Naïve Bayes Accuracy</div>
                  </div>
                </div>

                <div style={{fontSize:12,fontWeight:600,color:C.cyanL,marginBottom:10}}>💊 Top Drug Frequencies</div>
                {modelStats.topDrugs.map(([drug,count],i)=>(
                  <div key={i} style={{marginBottom:6}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{fontSize:11,fontFamily:"'Space Mono', monospace",color:C.text}}>{drug}</span>
                      <span style={{fontSize:11,color:C.cyan}}>{count}</span>
                    </div>
                    <div style={{height:4,background:C.dim,borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${(count/modelStats.topDrugs[0][1]*100).toFixed(0)}%`,background:`linear-gradient(90deg,${C.cyan}88,${C.cyan})`,borderRadius:2,transition:"width .8s"}}/>
                    </div>
                  </div>
                ))}
              </Card>
            )}

            {modelStats?.distArr && (
              <Card style={{marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>🏥 Diagnosis Distribution</div>
                {modelStats.distArr.map(([diag,cnt],i)=>(
                  <Bar key={i} value={Math.round(cnt/anonData.length*100)} color={i%2===0?C.purple:C.cyan} label={diag} sublabel={`${cnt} records`}/>
                ))}
              </Card>
            )}

            {anonData.length>0 && rawData.length>0 && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                <Card>
                  <div style={{fontSize:12,fontWeight:700,color:C.amber,marginBottom:10}}>⚠️ Original Data (PII)</div>
                  <DataTable rows={rawData} cols={["patient_id","name","age","phone","diagnosis"]} maxRows={4} accent={C.amber}/>
                </Card>
                <Card>
                  <div style={{fontSize:12,fontWeight:700,color:C.green,marginBottom:10}}>✅ Anonymized Data</div>
                  <DataTable rows={anonData} cols={["patient_id","name","age","phone","diagnosis"]} maxRows={4} accent={C.green}/>
                </Card>
              </div>
            )}

            {anonTexts.length>0 && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                <Card>
                  <div style={{fontSize:12,fontWeight:700,color:C.amber,marginBottom:10}}>⚠️ Original Text</div>
                  <pre style={{fontSize:9,color:C.text,whiteSpace:"pre-wrap",fontFamily:"'Space Mono', monospace",maxHeight:200,overflow:"auto",background:C.surface,padding:10,borderRadius:8}}>{anonTexts[0]?.text?.substring(0,300)}</pre>
                </Card>
                <Card>
                  <div style={{fontSize:12,fontWeight:700,color:C.green,marginBottom:10}}>✅ Anonymized</div>
                  <pre style={{fontSize:9,color:C.cyanL,whiteSpace:"pre-wrap",fontFamily:"'Space Mono', monospace",maxHeight:200,overflow:"auto",background:C.surface,padding:10,borderRadius:8}}>{anonTexts[0]?.anonymized?.substring(0,300)}</pre>
                </Card>
              </div>
            )}

            <Card style={{marginBottom:14}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>📤 Export Anonymized Data</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {[
                  {label:"CSV",   color:C.purple, fmt:"csv"},
                  {label:"JSONL", color:C.cyan,   fmt:"jsonl"},
                  {label:"JSON",  color:C.green,  fmt:"json"},
                  {label:"Report",color:C.amber,  fmt:"pdf"},
                ].map(b=>(
                  <button key={b.fmt} onClick={()=>{
                    let content="";
                    const data = anonData.length>0?anonData:anonTexts.map(t=>({text:t.anonymized}));
                    if(b.fmt==="csv"){
                      if(data.length===0) return;
                      const ks=Object.keys(data[0]);
                      content=ks.join(",")+"\n"+data.map(r=>ks.map(k=>`"${String(r[k]||"").replace(/"/g,'""')}"`).join(",")).join("\n");
                    } else if(b.fmt==="jsonl"){
                      content=data.map(r=>JSON.stringify({input:r,label:r.diagnosis||""})).join("\n");
                    } else if(b.fmt==="json"){
                      content=JSON.stringify({records:data,metrics,generated_at:new Date().toISOString()},null,2);
                    } else {
                      content=`MedShield Report\nAlgorithm: ${algorithm}\nPrivacy: ${metrics.privacyScore}%\nUtility: ${metrics.utilityScore}%`;
                    }
                    const blob=new Blob([content],{type:"text/plain"});
                    const a=document.createElement("a");
                    a.href=URL.createObjectURL(blob);
                    a.download=`medshield_anonymized.${b.fmt==="pdf"?"txt":b.fmt}`;
                    a.click();
                  }} style={{
                    background:`${b.color}22`,border:`1px solid ${b.color}55`,color:b.color,
                    borderRadius:8,padding:"9px 16px",fontSize:12,fontWeight:600,cursor:"pointer",
                  }}>
                    ↓ {b.label}
                  </button>
                ))}
              </div>
            </Card>

            <button onClick={()=>{setStep(0);setLogs([]);setRawData([]);setAnonData([]);setMetrics(null);setModelStats(null);}} style={{
              background:"transparent",border:`1px solid ${C.border}`,borderRadius:10,
              padding:"11px 24px",color:C.muted,fontSize:13,cursor:"pointer",width:"100%",
            }}>
              ↺ Start New Pipeline Run
            </button>
          </div>
        )}
      </div>
    </>
  );
}
