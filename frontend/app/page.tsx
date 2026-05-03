'use client';

import Link from 'next/link';


export default function LandingPage() {
  return (
    <main className="min-h-screen bg-bg relative overflow-hidden">
      {/* ── Background Glow Orbs ─────────────────────── */}
      <div className="glow-orb glow-indigo w-[600px] h-[600px] -top-40 -left-40" />
      <div className="glow-orb glow-violet w-[500px] h-[500px] top-1/3 -right-40" />
      <div className="glow-orb glow-cyan w-[400px] h-[400px] bottom-20 left-1/4" />

      {/* ── Navigation ───────────────────────────────── */}
      <nav className="relative z-50 flex items-center justify-between px-8 lg:px-16 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20">
            🛡️
          </div>
          <span className="text-xl font-display font-bold tracking-tight">
            Med<span className="text-indigo-400">Shield</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#algorithms" className="hover:text-white transition-colors">Algorithms</a>
          <a href="#pipeline" className="hover:text-white transition-colors">Pipeline</a>
          <a href="#team" className="hover:text-white transition-colors">Team</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="btn-secondary text-sm !py-2.5 !px-5">Sign In</Link>
          <Link href="/sign-up" className="btn-primary text-sm !py-2.5 !px-5">Get Started</Link>
        </div>
      </nav>

      {/* ── Hero Section ─────────────────────────────── */}
      <section className="relative z-10 px-8 lg:px-16 pt-20 pb-32 text-center max-w-5xl mx-auto">
        <div className="animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            IIM Mumbai Research Project — DPDP Act 2023 Compliant
          </div>
        </div>

        <h1 className="animate-slide-up delay-100 text-5xl md:text-7xl font-display font-extrabold leading-tight tracking-tight mb-6" style={{opacity: 0, animationFillMode: 'forwards'}}>
          <span className="gradient-text">Anonymize Medical Data</span>
          <br />
          <span className="text-white">With Confidence</span>
        </h1>

        <p className="animate-slide-up delay-200 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed" style={{opacity: 0, animationFillMode: 'forwards'}}>
          India's first production-grade toolkit for multi-modal medical health data anonymization.
          7 algorithms. 5 standardized metrics. Full DPDP compliance. Built by researchers from
          <strong className="text-slate-200"> IIT Bombay, IIT Delhi, NIT Rourkela & IIT Kharagpur</strong>.
        </p>

        <div className="animate-slide-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16" style={{opacity: 0, animationFillMode: 'forwards'}}>
          <Link href="/sign-up" className="btn-primary text-base !py-3.5 !px-8 flex items-center gap-2">
            🚀 Start Anonymizing — Free
          </Link>
          <a href="#pipeline" className="btn-secondary text-base !py-3.5 !px-8 flex items-center gap-2">
            📖 See How It Works
          </a>
        </div>

        {/* Stats Bar */}
        <div className="animate-slide-up delay-400 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto" style={{opacity: 0, animationFillMode: 'forwards'}}>
          {[
            { value: '7', label: 'Algorithms', icon: '🔒' },
            { value: '5', label: 'Metrics', icon: '📊' },
            { value: '100%', label: 'DPDP Compliant', icon: '✅' },
            { value: '3+', label: 'Data Types', icon: '📁' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-display font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Section ─────────────────────────── */}
      <section id="features" className="relative z-10 px-8 lg:px-16 py-24 bg-surface/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-3xl md:text-4xl font-display font-bold mb-4">
            Why <span className="gradient-text">MedShield</span>?
          </h2>
          <p className="text-center text-slate-400 mb-16 max-w-xl mx-auto">
            A comprehensive toolkit that goes beyond simple anonymization — built for real-world healthcare compliance.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '🔐', title: '7 Algorithms',
                desc: 'k-Anonymity, ℓ-Diversity, t-Closeness, Differential Privacy, Chaos Perturbation, Pseudonymization, and PII Redaction — all in one toolkit.',
                color: 'from-indigo-500/20 to-violet-500/10',
              },
              {
                icon: '📊', title: 'Real-time Benchmarking',
                desc: 'Run all algorithms on the same dataset simultaneously. Compare privacy scores, utility scores, disclosure risk, and information loss side-by-side.',
                color: 'from-cyan-500/20 to-blue-500/10',
              },
              {
                icon: '🇮🇳', title: 'DPDP Act Compliance',
                desc: "Built specifically for India's Digital Personal Data Protection Act 2023. Automatic compliance checks, audit trails, and irreversibility verification.",
                color: 'from-emerald-500/20 to-green-500/10',
              },
              {
                icon: '🏥', title: 'Multi-Modal Medical Data',
                desc: 'Handles structured records (CSV/Excel), free-text clinical notes, e-prescriptions, and planned support for clinical images and X-rays.',
                color: 'from-amber-500/20 to-orange-500/10',
              },
              {
                icon: '🧬', title: 'Privacy-Utility Tradeoff',
                desc: 'Visualize the fundamental tradeoff between privacy protection and data utility. Find the optimal algorithm for your specific use case.',
                color: 'from-rose-500/20 to-pink-500/10',
              },
              {
                icon: '📋', title: 'PII Detection Engine',
                desc: 'Automatic detection of 10+ PII types: email, phone, Aadhar, PAN, SSN, dates, IP addresses, credit cards — powered by regex + NER patterns.',
                color: 'from-purple-500/20 to-fuchsia-500/10',
              },
            ].map((f, i) => (
              <div key={i} className="feature-card group">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Algorithms Section ───────────────────────── */}
      <section id="algorithms" className="relative z-10 px-8 lg:px-16 py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-3xl md:text-4xl font-display font-bold mb-4">
            <span className="gradient-text">7 Algorithms</span>, One Framework
          </h2>
          <p className="text-center text-slate-400 mb-16 max-w-xl mx-auto">
            From syntactic models to semantic privacy — compare them all on your data.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'k-Anonymity', type: 'Syntactic', param: 'k = 2–20', desc: 'Generalization & suppression', badge: '🟢' },
              { name: 'ℓ-Diversity', type: 'Syntactic', param: 'ℓ = 2–10', desc: '3 variants: distinct, entropy, recursive', badge: '🔵' },
              { name: 't-Closeness', type: 'Syntactic', param: 't = 0.1–1.0', desc: "Earth Mover's + KL divergence", badge: '🟣' },
              { name: 'Differential Privacy', type: 'Semantic', param: 'ε = 0.1–5.0', desc: 'Laplace + Gaussian mechanisms', badge: '🟠' },
              { name: 'Chaos Perturbation', type: 'Novel', param: 'λ = 3.99', desc: 'Logistic map chaotic function', badge: '🔴' },
              { name: 'Pseudonymization', type: 'Operational', param: 'SHA-256', desc: 'Salted hash-based replacement', badge: '🟡' },
              { name: 'PII Redaction', type: 'Operational', param: '10 patterns', desc: 'Regex-based pattern matching', badge: '⚪' },
            ].map((a, i) => (
              <div key={i} className="glass p-5 hover:bg-white/[0.06] transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <span>{a.badge}</span>
                  <span className="text-xs text-indigo-300 font-medium">{a.type}</span>
                </div>
                <h4 className="text-white font-semibold mb-1">{a.name}</h4>
                <p className="text-xs text-slate-500 mb-2">{a.desc}</p>
                <code className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">{a.param}</code>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pipeline Section ─────────────────────────── */}
      <section id="pipeline" className="relative z-10 px-8 lg:px-16 py-24 bg-surface/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-3xl md:text-4xl font-display font-bold mb-4">
            How <span className="gradient-text">MedShield</span> Works
          </h2>
          <p className="text-center text-slate-400 mb-16 max-w-xl mx-auto">
            A 5-stage pipeline from raw medical data to privacy-preserving output.
          </p>

          <div className="flex flex-col md:flex-row gap-2">
            {[
              { step: '01', icon: '📥', title: 'Input', desc: 'Upload CSV, paste text, or use synthetic data' },
              { step: '02', icon: '🔍', title: 'Detect PII', desc: 'Auto-scan for names, emails, Aadhar, phone' },
              { step: '03', icon: '⚙️', title: 'Classify', desc: 'Tag columns: Direct ID, Quasi-ID, Sensitive' },
              { step: '04', icon: '🔒', title: 'Anonymize', desc: 'Apply selected algorithm(s) with tuned params' },
              { step: '05', icon: '📊', title: 'Evaluate', desc: 'Privacy score, utility, DPDP compliance' },
            ].map((s, i) => (
              <div key={i} className="pipeline-step flex-1">
                <div className="glass-strong p-6 text-center h-full">
                  <div className="text-3xl mb-3">{s.icon}</div>
                  <div className="text-xs text-indigo-400 font-mono mb-1">STEP {s.step}</div>
                  <h4 className="text-white font-semibold mb-2">{s.title}</h4>
                  <p className="text-xs text-slate-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About the Project ────────────────────────── */}
      <section className="relative z-10 px-8 lg:px-16 py-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-3xl md:text-4xl font-display font-bold mb-4">
            About <span className="gradient-text">This Research</span>
          </h2>
          <div className="glass-strong p-8 md:p-12 mt-10">
            <h3 className="text-xl font-display font-bold text-white mb-4">
              Comparative Study of Anonymization Algorithms for Medical Data
            </h3>
            <p className="text-slate-400 leading-relaxed mb-6">
              This project addresses the critical challenge of anonymizing multi-modal medical health data (MHD) — 
              including text records, e-prescriptions, handwritten prescriptions, clinical images, and X-rays — 
              while maintaining data utility for research and clinical purposes. Our work is grounded in compliance 
              with India's <strong className="text-white">Digital Personal Data Protection (DPDP) Act, 2023</strong>.
            </p>
            <p className="text-slate-400 leading-relaxed mb-6">
              We have studied <strong className="text-white">30+ research papers</strong>, implemented 
              <strong className="text-white">7 anonymization algorithms</strong>, and tested them on 
              synthetic medical datasets with <strong className="text-white">5,000+ patient records</strong>. 
              Our evaluation framework enables direct comparison using standardized privacy-utility metrics.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="text-center">
                <div className="text-2xl font-display font-bold text-indigo-400">30+</div>
                <div className="text-xs text-slate-500 mt-1">Research Papers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-display font-bold text-violet-400">5,001</div>
                <div className="text-xs text-slate-500 mt-1">Patient Records</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-display font-bold text-cyan-400">297K</div>
                <div className="text-xs text-slate-500 mt-1">Audit Entries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-display font-bold text-emerald-400">6</div>
                <div className="text-xs text-slate-500 mt-1">DPDP Checks ✅</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Team Section ──────────────────────────────── */}
      <section id="team" className="relative z-10 px-8 lg:px-16 py-24 bg-surface/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-3xl md:text-4xl font-display font-bold mb-4">
            Built by <span className="gradient-text">Researchers</span>
          </h2>
          <p className="text-center text-slate-400 mb-16">IIM Mumbai Research Team</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { name: 'Nischal', inst: 'IIT Bombay', role: 'Healthcare & k-Anonymity', emoji: '🏥' },
              { name: 'Soham', inst: 'IIT Delhi', role: 'Architecture & Framework', emoji: '🏗️' },
              { name: 'Brajesh', inst: 'NIT Rourkela', role: 'Hybrid Algorithms', emoji: '🧬' },
              { name: 'Saugata', inst: 'IIT Kharagpur', role: 'Image & Datasets', emoji: '🖼️' },
            ].map((m, i) => (
              <div key={i} className="glass p-6 text-center hover:-translate-y-2 transition-transform duration-300">
                <div className="text-4xl mb-3">{m.emoji}</div>
                <h4 className="text-white font-semibold">{m.name}</h4>
                <div className="text-xs text-indigo-400 font-medium mt-1">{m.inst}</div>
                <div className="text-xs text-slate-500 mt-2">{m.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ──────────────────────────────── */}
      <section className="relative z-10 px-8 lg:px-16 py-24 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
            Ready to <span className="gradient-text">Protect Patient Data</span>?
          </h2>
          <p className="text-slate-400 mb-10">
            Start anonymizing medical data in minutes. No setup required.
          </p>
          <Link href="/sign-up" className="btn-primary text-lg !py-4 !px-10">
            🚀 Get Started Free
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="relative z-10 px-8 lg:px-16 py-8 border-t border-white/5 text-center">
        <div className="flex flex-col md:flex-row items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <span>🛡️</span>
            <span>MedShield v1.0.0 — IIM Mumbai Research</span>
          </div>
          <div className="flex gap-6 mt-3 md:mt-0">
            <a href="https://github.com/saugata-malakar/IIM-MUMBAI" target="_blank" rel="noopener" className="hover:text-white transition-colors">GitHub</a>
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
