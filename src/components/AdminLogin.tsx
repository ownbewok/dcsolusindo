/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Lock, User, AlertCircle, Sparkles, Key } from 'lucide-react';
import { AdminUser } from '../types';

interface AdminLoginProps {
  onLoginSuccess: (user: AdminUser) => void;
  adminUsers: AdminUser[];
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, adminUsers }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Simulate network authentication delay
    setTimeout(() => {
      const match = adminUsers.find(
        (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
      );
      if (match) {
        onLoginSuccess(match);
      } else {
        setError('Kredensial salah! Silakan periksa kembali username dan password Anda.');
        setLoading(false);
      }
    }, 800);
  };

  const handleDemoFill = () => {
    if (adminUsers && adminUsers.length > 0) {
      setUsername(adminUsers[0].username);
      setPassword(adminUsers[0].password || '');
    } else {
      setUsername('admin');
      setPassword('admin123');
    }
    setError(null);
  };

  const defaultAdmin = adminUsers && adminUsers.length > 0 ? adminUsers[0] : { username: 'admin', password: 'admin123' };

  return (
    <div className="max-w-md mx-auto my-12" id="admin-login-portal">
      <div className="bg-white border border-slate-150 rounded-3xl shadow-xl overflow-hidden">
        {/* Portal Header Accent */}
        <div className="bg-slate-900 text-white p-6 text-center space-y-2 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-sky-950/40 via-slate-900 to-slate-950 opacity-90" />
          
          <div className="relative z-10">
            <div className="w-12 h-12 bg-sky-500/10 border border-sky-400/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6 text-sky-400" />
            </div>
            <h2 className="text-base font-black uppercase tracking-wider">Portal Akses Admin</h2>
            <p className="text-[11px] text-slate-400">Verifikasi kredensial untuk masuk ke Pusat Kontrol Marketplace</p>
          </div>
        </div>

        {/* Portal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl flex items-start gap-2.5 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold">Gagal Masuk:</span> {error}
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" /> Username
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Masukkan username admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-4 py-3 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 transition-all font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" /> Password
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-4 py-3 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 transition-all font-mono"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-slate-900 hover:bg-sky-600 disabled:bg-slate-300 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm uppercase tracking-wider mt-2"
          >
            {loading ? (
              <>
                <div className="w-4.5 h-4.5 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                Memverifikasi...
              </>
            ) : (
              <>
                <Key className="w-4 h-4" /> Autentikasi Masuk
              </>
            )}
          </button>

          {/* Helper Sandbox Credentials Box is hidden as requested */}
        </form>
      </div>
    </div>
  );
};
