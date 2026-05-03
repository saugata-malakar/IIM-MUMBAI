'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    // Simple local auth: any non-empty email/password works for demo
    if (!email || !password) {
      setError('Please enter your email and password.');
      setLoading(false);
      return;
    }
    // Set auth cookie via API route
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      router.push('/dashboard');
    } else {
      setError('Invalid credentials. Please try again.');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center relative overflow-hidden">
      <div className="glow-orb glow-indigo w-[500px] h-[500px] -top-40 -left-40" />
      <div className="glow-orb glow-violet w-[400px] h-[400px] bottom-20 right-20" />
      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/20">🛡️</div>
            <span className="text-2xl font-display font-bold">Med<span className="text-indigo-400">Shield</span></span>
          </Link>
          <h2 className="text-xl font-display font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-slate-400 text-sm">Sign in to your anonymization dashboard</p>
        </div>
        <div className="glass-strong p-8">
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-5">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="researcher@iimmumbai.edu" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5 text-base">
              {loading ? 'Signing in...' : '→ Sign In'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link href="/sign-up" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">Sign Up</Link>
          </p>
        </div>
        <p className="text-center text-xs text-slate-600 mt-6">IIM Mumbai Research • DPDP Act 2023 Compliant</p>
      </div>
    </main>
  );
}
