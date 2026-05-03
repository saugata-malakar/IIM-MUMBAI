'use client';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [name, setName] = useState('Researcher');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(c => c.trim().startsWith('medshield_auth='));
    if (authCookie) {
      try {
        const encoded = authCookie.split('=')[1];
        const decoded = JSON.parse(atob(decodeURIComponent(encoded)));
        setName(decoded.name || '');
        setEmail(decoded.email || '');
      } catch {}
    }
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-display font-bold text-white">Settings</h2>
        <p className="text-sm text-slate-400">Manage your profile and platform preferences</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Profile */}
        <div>
          <h3 className="text-white font-semibold mb-4">Account Profile</h3>
          <div className="glass-strong p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input type="email" value={email} readOnly
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-400 cursor-not-allowed" />
            </div>
            <button className="btn-primary w-full">Save Profile</button>
          </div>
        </div>

        {/* Preferences */}
        <div>
          <h3 className="text-white font-semibold mb-4">Anonymization Preferences</h3>
          <div className="glass p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Default Algorithm</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500">
                <option className="bg-gray-900">k-Anonymity</option>
                <option className="bg-gray-900">Differential Privacy</option>
                <option className="bg-gray-900">ℓ-Diversity</option>
                <option className="bg-gray-900">Pseudonymization</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Default DP Epsilon (ε)</label>
              <input type="range" min="0.1" max="5.0" step="0.1" defaultValue="1.0"
                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer" />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0.1 (High Privacy)</span><span>1.0</span><span>5.0 (High Utility)</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Export Format</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="export" defaultChecked /><span className="text-sm text-slate-400">CSV</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="export" /><span className="text-sm text-slate-400">JSON</span></label>
              </div>
            </div>
            <button className="btn-primary w-full">Save Preferences</button>
          </div>
        </div>
      </div>
    </div>
  );
}
