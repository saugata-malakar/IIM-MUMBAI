'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [institution, setInstitution] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, institution }),
    });
    if (res.ok) {
      router.push('/dashboard');
    } else {
      setError('Sign up failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center relative overflow-hidden">
      <div className="glow-orb glow-violet w-[500px] h-[500px] -top-40 right-0" />
      <div className="glow-orb glow-cyan w-[400px] h-[400px] bottom-10 -left-40" />
      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/20">🛡️</div>
            <span className="text-2xl font-display font-bold">Med<span className="text-indigo-400">Shield</span></span>
          </Link>
          <h2 className="text-xl font-display font-bold text-white mb-2">Create Your Account</h2>
          <p className="text-slate-400 text-sm">Join MedShield and start protecting patient data</p>
        </div>
        <div className="glass-strong p-8">
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-5">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Full Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Dr. Researcher Name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="researcher@iimmumbai.edu" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Institution</label>
              <select value={institution} onChange={e => setInstitution(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors">
                <option value="" className="bg-gray-900">Select Institution</option>
                <option value="iim-mumbai" className="bg-gray-900">IIM Mumbai</option>
                <option value="iit-bombay" className="bg-gray-900">IIT Bombay</option>
                <option value="iit-delhi" className="bg-gray-900">IIT Delhi</option>
                <option value="nit-rourkela" className="bg-gray-900">NIT Rourkela</option>
                <option value="iit-kharagpur" className="bg-gray-900">IIT Kharagpur</option>
                <option value="other" className="bg-gray-900">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password *</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Min 6 characters" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5 text-base mt-2">
              {loading ? 'Creating account...' : '🚀 Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">Sign In</Link>
          </p>
        </div>
        <div className="glass p-4 mt-5 text-center">
          <p className="text-xs text-slate-400">🔒 Your data is encrypted and never shared. DPDP compliant.</p>
        </div>
      </div>
    </main>
  );
}
