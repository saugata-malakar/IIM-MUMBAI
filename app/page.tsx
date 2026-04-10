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
            Advanced anonymization and PII detection for healthcare data. Built with Next.js, Supabase, and Google Gemini AI.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition">
              Get Started
            </button>
            <button className="px-8 py-3 border border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 rounded-lg font-semibold transition">
              Learn More
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
              <p className="text-slate-300">Advanced algorithms detect and identify personally identifiable information in medical records.</p>
            </div>
            <div className="p-6 rounded-lg bg-slate-700/50 border border-slate-600 hover:border-cyan-500 transition">
              <h3 className="text-xl font-bold mb-4 text-cyan-400">Data Anonymization</h3>
              <p className="text-slate-300">Secure anonymization of sensitive health data while maintaining data utility for analysis.</p>
            </div>
            <div className="p-6 rounded-lg bg-slate-700/50 border border-slate-600 hover:border-blue-500 transition">
              <h3 className="text-xl font-bold mb-4 text-blue-400">AI-Powered</h3>
              <p className="text-slate-300">Powered by Google Gemini API for intelligent medical data processing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section id="tech" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Technology Stack</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="p-4 text-center">
              <p className="font-bold text-cyan-400">Frontend</p>
              <p className="text-slate-300 text-sm">Next.js 16, React 18, TypeScript</p>
            </div>
            <div className="p-4 text-center">
              <p className="font-bold text-blue-400">Styling</p>
              <p className="text-slate-300 text-sm">Tailwind CSS, Aceternity UI, Radix UI</p>
            </div>
            <div className="p-4 text-center">
              <p className="font-bold text-cyan-400">Backend</p>
              <p className="text-slate-300 text-sm">Supabase, PostgreSQL</p>
            </div>
            <div className="p-4 text-center">
              <p className="font-bold text-blue-400">AI</p>
              <p className="text-slate-300 text-sm">Google Gemini API</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-8 px-6 text-center text-slate-400">
        <p>Medical Anonymization Platform - Powered by Next.js & Supabase</p>
      </footer>
    </div>
  );
}
