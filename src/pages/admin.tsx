import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const ADMIN_PASSWORD = 'AbanoubSamirRANDAHANY907&ANGLIabanoub907@#$';
const STORAGE_KEY = 'admin_token_expires';

type CodeRow = {
  id: string;
  tip_code: string | null;
  tip_outcome: string | null;
  odds: number | null;
  status: string | null;
  code_image_url: string | null;
  proof_image_url: string | null;
  created_at: string | null;
  day_date: string | null;
};

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [tipCode, setTipCode] = useState('');
  const [tipOutcome, setTipOutcome] = useState('WIN');
  const [odds, setOdds] = useState('1.75');
  const [status, setStatus] = useState('active');
  const [message, setMessage] = useState('');
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && Number(saved) > Date.now()) {
      setAuthorized(true);
    }
  }, []);

  useEffect(() => {
    if (authorized) {
      loadCodes();
    }
  }, [authorized]);

  async function loadCodes() {
    setLoadingCodes(true);
    setMessage('');

    const { data, error } = await supabase
      .from('codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setMessage('حصل خطأ أثناء تحميل الأكواد');
      setLoadingCodes(false);
      return;
    }

    setCodes((data as CodeRow[]) || []);
    setLoadingCodes(false);
  }

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
    setSaving(true);

    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase.from('codes').insert([
      {
        tip_code: tipCode,
        tip_outcome: tipOutcome,
        odds: Number(odds),
        status,
        day_date: today,
      },
    ]);

    setSaving(false);

    if (error) {
      setMessage('حصل خطأ أثناء إضافة الكود');
      return;
    }

    setTipCode('');
    setTipOutcome('WIN');
    setOdds('1.75');
    setStatus('active');
    setMessage('تمت إضافة الكود بنجاح');
    loadCodes();
  };

  const handleMarkWon = async (id: string) => {
    setMessage('');

    const { error } = await supabase
      .from('codes')
      .update({ status: 'won' })
      .eq('id', id);

    if (error) {
      setMessage('حصل خطأ أثناء تحديث الكود');
      return;
    }

    setMessage('تم تحويل الكود إلى رابح');
    loadCodes();
  };

  const handleMarkActive = async (id: string) => {
    setMessage('');

    const { error } = await supabase
      .from('codes')
      .update({ status: 'active' })
      .eq('id', id);

    if (error) {
      setMessage('حصل خطأ أثناء تحديث الكود');
      return;
    }

    setMessage('تم تحويل الكود إلى متاح');
    loadCodes();
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm('هل أنت متأكد من حذف هذا الكود؟');
    if (!ok) return;

    setMessage('');

    const { error } = await supabase.from('codes').delete().eq('id', id);

    if (error) {
      setMessage('حصل خطأ أثناء حذف الكود');
      return;
    }

    setMessage('تم حذف الكود بنجاح');
    loadCodes();
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
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-[#0b120b] border border-green-900/40 rounded-3xl p-6 space-y-6 shadow-[0_0_30px_rgba(34,197,94,0.12)]">
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
              disabled={saving}
              className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-60 text-black font-black py-3 rounded-2xl transition-all"
            >
              {saving ? 'جاري الإضافة...' : 'إضافة الكود'}
            </button>
          </form>

          {message && <p className="text-center text-green-400 font-bold">{message}</p>}
        </div>

        <div className="bg-[#0b120b] border border-green-900/40 rounded-3xl p-6 shadow-[0_0_30px_rgba(34,197,94,0.12)]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black text-white">الأكواد الحالية</h2>
            <button
              onClick={loadCodes}
              className="bg-green-500/20 border border-green-500/40 text-green-400 px-4 py-2 rounded-xl font-bold"
            >
              تحديث
            </button>
          </div>

          {loadingCodes ? (
            <div className="text-center text-gray-400 py-10">جاري تحميل الأكواد...</div>
          ) : codes.length === 0 ? (
            <div className="text-center text-gray-500 py-10">لا توجد أكواد حالياً</div>
          ) : (
            <div className="space-y-3">
              {codes.map((code) => (
                <div
                  key={code.id}
                  className="bg-black/30 border border-green-900/30 rounded-2xl p-4 flex flex-col gap-3"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-white font-black">{code.tip_code}</span>
                    <span className="text-green-400 font-bold">{code.tip_outcome}</span>
                    <span className="text-yellow-400 font-bold">x{Number(code.odds || 1).toFixed(2)}</span>
                    <span className="text-xs text-gray-400">{code.day_date || '-'}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-300">
                      {code.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleMarkWon(code.id)}
                      className="bg-green-500 hover:bg-green-400 text-black font-black px-4 py-2 rounded-xl"
                    >
                      تعليم كرابح
                    </button>

                    <button
                      onClick={() => handleMarkActive(code.id)}
                      className="bg-blue-500 hover:bg-blue-400 text-black font-black px-4 py-2 rounded-xl"
                    >
                      إرجاعه متاح
                    </button>

                    <button
                      onClick={() => handleDelete(code.id)}
                      className="bg-red-500 hover:bg-red-400 text-black font-black px-4 py-2 rounded-xl"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
