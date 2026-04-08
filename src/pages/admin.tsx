import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const ADMIN_PASSWORD = 'AbanoubSamirRANDAHANY907&ANGLIabanoub907@#$';
const STORAGE_KEY = 'admin_token_expires';

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [tipCode, setTipCode] = useState('');
  const [tipOutcome, setTipOutcome] = useState('WIN');
  const [odds, setOdds] = useState('1.75');
  const [status, setStatus] = useState('active');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && Number(saved) > Date.now()) {
      setAuthorized(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === ADMIN_PASSWORD) {
      const expiresAt = Date.now() + 12 * 60 * 60 * 1000;
      localStorage.setItem(STORAGE_KEY, String(expiresAt));
      setAuthorized(true);
      setMessage('');
    } else {
      setMessage('كلمة السر غير صحيحة');
    }
  };

  const handleAddCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase.from('tip_codes').insert([
      {
        tip_code: tipCode,
        tip_outcome: tipOutcome,
        odds: Number(odds),
        status,
        day_date: today,
      },
    ]);

    if (error) {
      setMessage('حصل خطأ أثناء إضافة الكود');
      return;
    }

    setTipCode('');
    setTipOutcome('WIN');
    setOdds('1.75');
    setStatus('active');
    setMessage('تمت إضافة الكود بنجاح');
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAuthorized(false);
    setPassword('');
    setMessage('');
  };

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050805] px-4" dir="rtl">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md bg-[#0b120b] border border-green-900/40 rounded-3xl p-6 space-y-5 shadow-[0_0_30px_rgba(34,197,94,0.12)]"
        >
          <h1 className="text-2xl font-black text-white text-center">دخول الأدمن</h1>

          <input
            type="password"
            placeholder="اكتب كلمة السر"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl bg-black/40 border border-green-900/50 px-4 py-3 text-white outline-none"
          />

          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-400 text-black font-black py-3 rounded-2xl transition-all"
          >
            دخول
          </button>

          {message && <p className="text-center text-red-400 font-bold">{message}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050805] px-4 py-10" dir="rtl">
      <div className="max-w-2xl mx-auto bg-[#0b120b] border border-green-900/40 rounded-3xl p-6 space-y-6 shadow-[0_0_30px_rgba(34,197,94,0.12)]">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-black text-white">لوحة الأدمن</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500/20 border border-red-500/40 text-red-400 px-4 py-2 rounded-xl font-bold"
          >
            تسجيل خروج
          </button>
        </div>

        <form onSubmit={handleAddCode} className="space-y-4">
          <input
            type="text"
            placeholder="الكود"
            value={tipCode}
            onChange={(e) => setTipCode(e.target.value)}
            className="w-full rounded-2xl bg-black/40 border border-green-900/50 px-4 py-3 text-white outline-none"
            required
          />

          <input
            type="text"
            placeholder="نوع الكود"
            value={tipOutcome}
            onChange={(e) => setTipOutcome(e.target.value)}
            className="w-full rounded-2xl bg-black/40 border border-green-900/50 px-4 py-3 text-white outline-none"
            required
          />

          <input
            type="number"
            step="0.01"
            placeholder="الأودز"
            value={odds}
            onChange={(e) => setOdds(e.target.value)}
            className="w-full rounded-2xl bg-black/40 border border-green-900/50 px-4 py-3 text-white outline-none"
            required
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-2xl bg-black/40 border border-green-900/50 px-4 py-3 text-white outline-none"
          >
            <option value="active">active</option>
            <option value="won">won</option>
          </select>

          <button
            type="submit"
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-3 rounded-2xl transition-all"
          >
            إضافة الكود
          </button>
        </form>

        {message && <p className="text-center text-green-400 font-bold">{message}</p>}
      </div>
    </div>
  );
}
