import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-slate-900/80 backdrop-blur border-b border-slate-700 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Medical Anonymization
          </div>
          <div className="flex gap-6">
            <a href="#features" className="hover:text-blue-400 transition">Features</a>
            <a href="#api" className="hover:text-blue-400 transition">API Endpoints</a>
            <a href="#tech" className="hover:text-blue-400 transition">Technology</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Secure Medical Data Privacy
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Advanced anonymization and PII detection for healthcare data. Full-stack application with frontend and backend APIs.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition">
              Get Started
            </button>
            <button className="px-8 py-3 border border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 rounded-lg font-semibold transition">
              API Documentation
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg bg-slate-700/50 border border-slate-600 hover:border-blue-500 transition">
              <h3 className="text-xl font-bold mb-4 text-blue-400">PII Detection</h3>
              <p className="text-slate-300">Advanced algorithms detect emails, phones, SSN, medical records and more.</p>
            </div>
            <div className="p-6 rounded-lg bg-slate-700/50 border border-slate-600 hover:border-cyan-500 transition">
              <h3 className="text-xl font-bold mb-4 text-cyan-400">Data Anonymization</h3>
              <p className="text-slate-300">Secure anonymization of sensitive health data while maintaining utility.</p>
            </div>
            <div className="p-6 rounded-lg bg-slate-700/50 border border-slate-600 hover:border-blue-500 transition">
              <h3 className="text-xl font-bold mb-4 text-blue-400">REST API</h3>
              <p className="text-slate-300">Full REST API with endpoints for anonymization, detection logging, and querying.</p>
            </div>
          </div>
        </div>
      </section>

      {/* API Endpoints Section */}
      <section id="api" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Backend API Endpoints</h2>
          <div className="space-y-6">
            
            <div className="p-6 rounded-lg bg-slate-700/50 border border-blue-500 hover:bg-slate-700/70 transition">
              <h3 className="text-xl font-bold mb-2 text-blue-400">1. Anonymize PII</h3>
              <p className="text-slate-300 mb-3">POST /api/anonymize</p>
              <p className="text-sm text-slate-400">Detects and anonymizes PII in medical text. Returns detected types and anonymized version.</p>
              <code className="text-xs bg-slate-800 p-2 rounded block mt-2 text-green-400">
                POST /api/anonymize with text parameter
              </code>
            </div>

            <div className="p-6 rounded-lg bg-slate-700/50 border border-cyan-500 hover:bg-slate-700/70 transition">
              <h3 className="text-xl font-bold mb-2 text-cyan-400">2. Log Detection</h3>
              <p className="text-slate-300 mb-3">POST /api/detections/log</p>
              <p className="text-sm text-slate-400">Log detected PII events for audit trail and analysis.</p>
              <code className="text-xs bg-slate-800 p-2 rounded block mt-2 text-green-400">
                POST /api/detections/log with type and text
              </code>
            </div>

            <div className="p-6 rounded-lg bg-slate-700/50 border border-blue-500 hover:bg-slate-700/70 transition">
              <h3 className="text-xl font-bold mb-2 text-blue-400">3. Query Detections</h3>
              <p className="text-slate-300 mb-3">GET /api/detections/query</p>
              <p className="text-sm text-slate-400">Retrieve detected PII events with filtering and pagination.</p>
              <code className="text-xs bg-slate-800 p-2 rounded block mt-2 text-green-400">
                GET /api/detections/query?type=email&limit=10
              </code>
            </div>

            <div className="p-6 rounded-lg bg-slate-700/50 border border-cyan-500 hover:bg-slate-700/70 transition">
              <h3 className="text-xl font-bold mb-2 text-cyan-400">4. Health Status</h3>
              <p className="text-slate-300 mb-3">GET /api/health</p>
              <p className="text-sm text-slate-400">Check API health and available endpoints.</p>
              <code className="text-xs bg-slate-800 p-2 rounded block mt-2 text-green-400">
                GET /api/health
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section id="tech" className="py-20 px-6 bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Full Technology Stack</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="p-4 text-center border border-slate-700 rounded-lg hover:border-blue-500 transition">
              <p className="font-bold text-blue-400">Frontend</p>
              <p className="text-slate-300 text-sm">Next.js 16, React 18, TypeScript</p>
            </div>
            <div className="p-4 text-center border border-slate-700 rounded-lg hover:border-cyan-500 transition">
              <p className="font-bold text-cyan-400">Backend API</p>
              <p className="text-slate-300 text-sm">Next.js API Routes (Serverless)</p>
            </div>
            <div className="p-4 text-center border border-slate-700 rounded-lg hover:border-blue-500 transition">
              <p className="font-bold text-blue-400">Database</p>
              <p className="text-slate-300 text-sm">Supabase PostgreSQL</p>
            </div>
            <div className="p-4 text-center border border-slate-700 rounded-lg hover:border-cyan-500 transition">
              <p className="font-bold text-cyan-400">AI Engine</p>
              <p className="text-slate-300 text-sm">Google Gemini API</p>
            </div>
          </div>
          <div className="mt-8 p-6 rounded-lg bg-slate-700/30 border border-slate-600">
            <p className="text-slate-300"><span className="font-bold text-green-400">Frontend:</span> React components with Tailwind CSS, Aceternity UI, Radix UI, Framer Motion</p>
            <p className="text-slate-300 mt-2"><span className="font-bold text-green-400">Backend:</span> RESTful API routes handling PII detection, anonymization, logging, and querying</p>
            <p className="text-slate-300 mt-2"><span className="font-bold text-green-400">Hosting:</span> Vercel (both frontend and backend serverless functions)</p>
            <p className="text-slate-300 mt-2"><span className="font-bold text-green-400">Database:</span> Supabase PostgreSQL with real-time capabilities</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-8 px-6 text-center text-slate-400">
        <p>Medical Anonymization Platform - Full-Stack Application</p>
        <p className="text-sm mt-2">Frontend + Backend API + Database + AI Engine</p>
      </footer>
    </div>
  );
}
