import React, { useEffect, useState } from 'react';
import { ADMIN_PASSWORD } from '../lib/supabase';

const STORAGE_KEY = 'admin_token_expires';

function isSessionValid() {
  const expires = localStorage.getItem(STORAGE_KEY);
  if (!expires) return false;
  return Date.now() < parseInt(expires, 10);
}

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isSessionValid()) setAuthed(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 300));
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, String(Date.now() + 1000 * 60 * 60 * 12));
      setAuthed(true);
    } else {
      setError('كلمة المرور غير صحيحة');
    }
    setLoading(false);
  };

  if (authed) return <>{children}</>;

  return (
    <div className="min-h-[70vh] flex items-center justify-center" dir="rtl">
      <div className="w-full max-w-md">
        <div className="bg-gradient-to-br from-[#0f1a0f] to-[#0a120a] border border-green-900/50 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(34,197,94,0.1)]">
          <div className="h-1.5 bg-gradient-to-r from-green-600 via-green-400 to-yellow-500" />
          <div className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="text-5xl mb-4">🔐</div>
              <h2 className="text-2xl font-black text-white">لوحة الإدارة</h2>
              <p className="text-gray-500 text-sm">أدخل كلمة المرور للدخول</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="كلمة المرور"
                  autoFocus
                  className="w-full bg-black/50 border border-green-900/50 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/60 text-center text-lg tracking-widest pr-12"
                />
                <button type="button" onClick={() => setShow(!show)} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-sm">
                  {show ? 'إخفاء' : 'إظهار'}
                </button>
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold rounded-xl px-4 py-3 text-center">❌ {error}</div>}
              <button type="submit" disabled={loading || !password} className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-black py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] text-lg">
                {loading ? '⏳ جاري التحقق...' : '🔓 دخول'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
