'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊', desc: 'Overview' },
  { href: '/dashboard/clinical-ai', label: 'Clinical AI', icon: '🧠', desc: '8 AI-powered sections' },
  { href: '/dashboard/anonymize', label: 'Anonymize', icon: '🔒', desc: 'Run algorithms' },
  { href: '/dashboard/vision', label: 'Vision AI', icon: '👁️', desc: 'Image & OCR Redaction' },
  { href: '/dashboard/benchmark', label: 'Benchmark', icon: '📈', desc: 'Compare results' },
  { href: '/dashboard/datasets', label: 'Datasets', icon: '📁', desc: 'Manage data' },
  { href: '/dashboard/compliance', label: 'Compliance', icon: '✅', desc: 'DPDP checks' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙️', desc: 'Preferences' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState('Researcher');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(c => c.trim().startsWith('medshield_auth='));
    if (authCookie) {
      try {
        const encoded = authCookie.split('=')[1];
        const decoded = JSON.parse(atob(decodeURIComponent(encoded)));
        setUserName(decoded.name || decoded.email?.split('@')[0] || 'Researcher');
        setUserEmail(decoded.email || '');
      } catch {}
    }
  }, []);

  const handleLogout = async () => {
    await fetch('/auth/logout', { method: 'POST' });
    document.cookie = 'medshield_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/sign-in');
  };

  return (
    <div className="min-h-screen bg-[#0b0d14] flex">
      {/* ── Sidebar ───────────────────────────── */}
      <aside className="w-64 border-r border-white/10 bg-[#111827] flex flex-col fixed h-full z-40">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-lg shadow-md shadow-indigo-500/30">🛡️</div>
            <div>
              <span className="text-base font-display font-bold text-white">Med<span className="text-indigo-400">Shield</span></span>
              <div className="text-[10px] text-slate-400 leading-tight">IIM Mumbai</div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <div className="text-[10px] uppercase text-slate-500 font-semibold tracking-widest px-3 py-2">Platform</div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 text-white font-semibold border border-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}>
                <span className="text-base w-6 text-center">{item.icon}</span>
                <div>
                  <div className={isActive ? 'text-white' : ''}>{item.label}</div>
                  <div className={`text-[10px] leading-tight ${isActive ? 'text-indigo-300' : 'text-slate-500'}`}>{item.desc}</div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-white truncate">{userName}</div>
              <div className="text-[10px] text-slate-400 truncate">{userEmail}</div>
            </div>
            <button onClick={handleLogout} title="Sign Out"
              className="text-slate-400 hover:text-red-400 transition-colors p-1 rounded hover:bg-red-400/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────── */}
      <div className="flex-1 ml-64">
        <header className="sticky top-0 z-30 px-6 py-3 border-b border-white/10 bg-[#0b0d14]/95 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-display font-bold text-white">
                {navItems.find(n => n.href === pathname)?.label || 'Dashboard'}
              </h1>
              <p className="text-xs text-slate-400">{navItems.find(n => n.href === pathname)?.desc}</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-300 bg-emerald-500/15 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              DPDP Compliant
            </div>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
