import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const ADMIN_PASSWORD = 'AbanoubSamirRANDAHANY907&ANGLIabanoub907@#$';
const STORAGE_KEY = 'admin_token_expires';
const BUCKET = 'codes';

type CodeItem = {
  id: string;
  description: string | null;
  tip_outcome: string | null;
  tip_code: string;
  odds: number;
  status: 'active' | 'won' | 'refund';
  code_image_url: string | null;
  proof_image_url: string | null;
  proof_type: string | null;
  created_at: string | null;
  won_at: string | null;
  day_date: string;
};

type DailyStat = {
  id: string;
  stat_date: string;
  total_codes: number;
  won_codes_count: number;
  combined_odds: number;
  is_finalized: boolean;
};

function formatOdds(value: number) {
  return Number(value || 0).toFixed(2);
}

function getPublicUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const clean = path.replace(/^\/+/, '').replace(/^codes\//, '');
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(clean);
  return data.publicUrl;
}

function fileName(prefix: string, file: File) {
  const ext = file.name.split('.').pop() || 'jpg';
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}/${Date.now()}-${rand}.${ext}`;
}

async function uploadImage(file: File, prefix: string) {
  const path = fileName(prefix, file);
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  return path;
}

async function removeImage(path?: string | null) {
  if (!path) return;
  const clean = path.replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/public\/codes\//, '').replace(/^\/+/, '').replace(/^codes\//, '');
  if (!clean) return;
  await supabase.storage.from(BUCKET).remove([clean]);
}

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [codes, setCodes] = useState<CodeItem[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStat | null>(null);
  const [currentDay, setCurrentDay] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [description, setDescription] = useState('');
  const [tipOutcome, setTipOutcome] = useState('');
  const [tipCode, setTipCode] = useState('');
  const [odds, setOdds] = useState('');
  const [betImage, setBetImage] = useState<File | null>(null);
  const [savingCode, setSavingCode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && Number(saved) > Date.now()) {
      setAuthorized(true);
    }
  }, []);

  useEffect(() => {
    if (authorized) {
      loadAll();
    }
  }, [authorized]);

  async function ensureCurrentDay() {
    const { data, error } = await supabase.from('app_state').select('*').eq('key', 'current_day').maybeSingle();
    if (error) throw error;

    if (data?.value) {
      return data.value as string;
    }

    const today = new Date().toISOString().split('T')[0];
    const { error: insertError } = await supabase.from('app_state').insert([{ key: 'current_day', value: today }]);
    if (insertError) throw insertError;
    return today;
  }

  async function ensureDailyStats(day: string) {
    const { data, error } = await supabase.from('daily_stats').select('*').eq('stat_date', day).maybeSingle();
    if (error) throw error;

    if (data) return data as DailyStat;

    const { data: inserted, error: insertError } = await supabase
      .from('daily_stats')
      .insert([
        {
          stat_date: day,
          total_codes: 0,
          won_codes_count: 0,
          combined_odds: 0,
          is_finalized: false,
        },
      ])
      .select()
      .single();

    if (insertError) throw insertError;
    return inserted as DailyStat;
  }

  async function recalcDayStats(day: string) {
    const { data, error } = await supabase.from('codes').select('*').eq('day_date', day);
    if (error) throw error;

    const rows = (data || []) as CodeItem[];
    const totalCodes = rows.length;
    const wonCodes = rows.filter((c) => c.status === 'won' || c.status === 'refund').length;
    const combinedOdds = rows.reduce((sum, c) => sum + Number(c.odds || 0), 0);

    const { error: upError } = await supabase
      .from('daily_stats')
      .upsert(
        [
          {
            stat_date: day,
            total_codes: totalCodes,
            won_codes_count: wonCodes,
            combined_odds: Number(combinedOdds.toFixed(2)),
            is_finalized: false,
          },
        ],
        { onConflict: 'stat_date' },
      );

    if (upError) throw upError;
  }

  async function loadAll() {
    try {
      setLoading(true);
      setMessage('');

      const day = await ensureCurrentDay();
      setCurrentDay(day);

      await ensureDailyStats(day);
      await recalcDayStats(day);

      const { data: codesData, error: codesError } = await supabase
        .from('codes')
        .select('*')
        .eq('day_date', day)
        .order('created_at', { ascending: false });

      if (codesError) throw codesError;

      const { data: statsData, error: statsError } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('stat_date', day)
        .maybeSingle();

      if (statsError) throw statsError;

      setCodes((codesData || []) as CodeItem[]);
      setDailyStats((statsData as DailyStat) || null);
    } catch (err) {
      setMessage('حصل خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
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

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAuthorized(false);
    setPassword('');
    setMessage('');
  };

  const resetForm = () => {
    setDescription('');
    setTipOutcome('');
    setTipCode('');
    setOdds('');
    setBetImage(null);
    setShowAddForm(false);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setBetImage(file);
  };

  const handleAddCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tipCode.trim() || !odds.trim() || !betImage) {
      setMessage('اكتب الكود ونسبة الربح وارفع صورة الرهان');
      return;
    }

    try {
      setSavingCode(true);
      setMessage('');

      const uploadedPath = await uploadImage(betImage, 'bet-images');

      const { error } = await supabase.from('codes').insert([
        {
          description: description.trim() || null,
          tip_outcome: tipOutcome.trim() || null,
          tip_code: tipCode.trim(),
          odds: Number(odds),
          status: 'active',
          code_image_url: uploadedPath,
          proof_image_url: null,
          proof_type: null,
          day_date: currentDay,
        },
      ]);

      if (error) throw error;

      await recalcDayStats(currentDay);
      await loadAll();
      resetForm();
      setMessage('تمت إضافة الكود بنجاح');
    } catch (err) {
      setMessage('حصل خطأ أثناء إضافة الكود');
    } finally {
      setSavingCode(false);
    }
  };

  const handleWinOrRefund = async (code: CodeItem, nextStatus: 'won' | 'refund') => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    fileInput.onchange = async () => {
      const file = fileInput.files?.[0];
      if (!file) return;

      try {
        setMessage('');

        const uploadedPath = await uploadImage(file, nextStatus === 'won' ? 'proof-win' : 'proof-refund');

        const payload: Partial<CodeItem> & { proof_type: string; won_at: string } = {
          status: nextStatus,
          proof_image_url: uploadedPath,
          proof_type: nextStatus,
          won_at: new Date().toISOString(),
        };

        if (nextStatus === 'refund') {
          payload.odds = 1;
        }

        const { error } = await supabase.from('codes').update(payload).eq('id', code.id);
        if (error) throw error;

        await recalcDayStats(currentDay);
        await loadAll();
        setMessage(nextStatus === 'won' ? 'تم تعليم الكود كرابح' : 'تم تعليم الكود كمسترد');
      } catch (err) {
        setMessage(nextStatus === 'won' ? 'حصل خطأ أثناء رفع إثبات الكسب' : 'حصل خطأ أثناء رفع إثبات الاسترداد');
      }
    };

    fileInput.click();
  };

  const handleDelete = async (code: CodeItem) => {
    const ok = window.confirm('هل أنت متأكد من حذف الكود نهائيًا؟');
    if (!ok) return;

    try {
      setMessage('');

      await removeImage(code.code_image_url);
      await removeImage(code.proof_image_url);

      const { error } = await supabase.from('codes').delete().eq('id', code.id);
      if (error) throw error;

      await recalcDayStats(currentDay);
      await loadAll();
      setMessage('تم حذف الكود نهائيًا');
    } catch (err) {
      setMessage('حصل خطأ أثناء حذف الكود');
    }
  };

  const handleEndDay = async () => {
    const ok = window.confirm('هل تريد إنهاء اليوم الحالي وبدء يوم جديد؟');
    if (!ok) return;

    try {
      setMessage('');

      await recalcDayStats(currentDay);

      const { error: finalizeError } = await supabase
        .from('daily_stats')
        .update({ is_finalized: true })
        .eq('stat_date', currentDay);

      if (finalizeError) throw finalizeError;

      const newDay = `manual-${Date.now()}`;

      const { error: appStateError } = await supabase
        .from('app_state')
        .update({ value: newDay })
        .eq('key', 'current_day');

      if (appStateError) throw appStateError;

      const { error: newStatsError } = await supabase.from('daily_stats').insert([
        {
          stat_date: newDay,
          total_codes: 0,
          won_codes_count: 0,
          combined_odds: 0,
          is_finalized: false,
        },
      ]);

      if (newStatsError) throw newStatsError;

      setCurrentDay(newDay);
      setCodes([]);
      setDailyStats({
        id: '',
        stat_date: newDay,
        total_codes: 0,
        won_codes_count: 0,
        combined_odds: 0,
        is_finalized: false,
      });

      setMessage('تم إنهاء اليوم وفتح يوم جديد');
    } catch (err) {
      setMessage('حصل خطأ أثناء إنهاء اليوم');
    }
  };

  const stats = useMemo(() => {
    return {
      totalCodes: dailyStats?.total_codes ?? 0,
      wonCodes: dailyStats?.won_codes_count ?? 0,
      combinedOdds: dailyStats?.combined_odds ?? 0,
    };
  }, [dailyStats]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#040a04] px-4" dir="rtl">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md rounded-[32px] border border-green-900/40 bg-[#081008] p-6 shadow-[0_0_40px_rgba(0,255,120,0.08)]"
        >
          <h1 className="mb-6 text-center text-3xl font-black text-white">دخول لوحة الإدارة</h1>

          <input
            type="password"
            placeholder="اكتب كلمة السر"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 w-full rounded-2xl border border-green-900/50 bg-black/40 px-4 py-3 text-white outline-none"
          />

          <button className="w-full rounded-2xl bg-green-500 py-3 text-xl font-black text-black">
            دخول
          </button>

          {message && <p className="mt-4 text-center font-bold text-red-400">{message}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030903] px-4 py-8 text-white" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-4xl font-black">⚙️ لوحة الإدارة</h1>
            <p className="mt-2 text-xl text-gray-400">إضافة وإدارة أكواد التوقعات اليومية</p>
          </div>

          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="rounded-2xl bg-green-500 px-8 py-4 text-2xl font-black text-black shadow-[0_0_25px_rgba(0,255,120,0.25)]"
            >
              + إضافة كود
            </button>
          ) : (
            <button
              onClick={() => setShowAddForm(false)}
              className="rounded-2xl bg-green-500 px-8 py-4 text-2xl font-black text-black shadow-[0_0_25px_rgba(0,255,120,0.25)]"
            >
              ✕ إغلاق
            </button>
          )}
        </div>

        {showAddForm && (
          <div className="rounded-[32px] border border-green-900/50 bg-[radial-gradient(circle_at_top,#0d2210,#071107)] p-6 shadow-[0_0_40px_rgba(0,255,120,0.08)]">
            <h2 className="mb-6 text-4xl font-black">+ إضافة كود جديد</h2>

            <form onSubmit={handleAddCode} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xl text-gray-300">نوع التوقع (اختياري)</label>
                  <input
                    value={tipOutcome}
                    onChange={(e) => setTipOutcome(e.target.value)}
                    placeholder="مثال: 1 أو X2 أو أقل من 7.5"
                    className="w-full rounded-2xl border border-green-900/50 bg-black/40 px-4 py-4 text-xl text-white outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xl text-gray-300">نسبة ربح الكود</label>
                  <input
                    value={odds}
                    onChange={(e) => setOdds(e.target.value)}
                    placeholder="مثال: 1.75"
                    className="w-full rounded-2xl border border-green-900/50 bg-black/40 px-4 py-4 text-xl text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xl text-gray-300">وصف الكود (اختياري)</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب وصف الرهان"
                  className="w-full rounded-2xl border border-green-900/50 bg-black/40 px-4 py-4 text-xl text-white outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-xl text-gray-300">الكود</label>
                <input
                  value={tipCode}
                  onChange={(e) => setTipCode(e.target.value)}
                  placeholder="مثال: MC-ARS-2024"
                  className="w-full rounded-2xl border border-green-900/50 bg-black/40 px-4 py-4 text-center text-3xl tracking-[0.2em] text-white outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-xl text-gray-300">صورة الكود (إجباري)</label>
                <label className="flex cursor-pointer items-center justify-center rounded-3xl border-2 border-dashed border-green-700/60 bg-[#071107] px-4 py-10 text-2xl text-gray-300">
                  📸 رفع صورة للكود
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
                {betImage && <p className="mt-3 text-green-400">{betImage.name}</p>}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <button
                  type="submit"
                  disabled={savingCode}
                  className="rounded-2xl bg-green-500 px-6 py-4 text-3xl font-black text-black shadow-[0_0_25px_rgba(0,255,120,0.25)] disabled:opacity-60"
                >
                  {savingCode ? 'جاري الإضافة...' : '✅ إضافة الكود'}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-green-900/50 bg-black/30 px-6 py-4 text-3xl font-black text-white"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="rounded-[32px] border border-green-900/50 bg-[radial-gradient(circle_at_top,#0d2210,#071107)] p-6 shadow-[0_0_40px_rgba(0,255,120,0.08)]">
          <h2 className="mb-8 text-4xl font-black">📊 إحصائيات اليوم</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-3xl border border-green-900/40 bg-black/40 px-6 py-6">
              <span className="text-3xl text-gray-300">إجمالي الأكواد</span>
              <span className="text-5xl font-black text-white">{stats.totalCodes}</span>
            </div>

            <div className="flex items-center justify-between rounded-3xl border border-green-900/40 bg-black/40 px-6 py-6">
              <span className="text-3xl text-gray-300">الأكواد الرابحة</span>
              <span className="text-5xl font-black text-green-400">{stats.wonCodes}</span>
            </div>

            <div className="flex items-center justify-between rounded-3xl border border-yellow-900/20 bg-black/40 px-6 py-6">
              <span className="text-3xl text-gray-300">مجموع ربح الأكواد</span>
              <span className="text-5xl font-black text-yellow-400">{formatOdds(stats.combinedOdds)}</span>
            </div>

            <button
              onClick={handleEndDay}
              className="mt-6 w-full rounded-3xl bg-[#a88405] px-6 py-5 text-3xl font-black text-black shadow-[0_0_25px_rgba(234,179,8,0.18)]"
            >
              نهاية اليوم - أحسب الإحصائيات
            </button>
          </div>
        </div>

        <div>
          <h2 className="mb-6 text-4xl font-black">📋 أكواد اليوم النشطة ({codes.length})</h2>

          {loading ? (
            <div className="rounded-3xl border border-green-900/40 bg-black/30 p-10 text-center text-2xl text-gray-400">
              جاري التحميل...
            </div>
          ) : codes.length === 0 ? (
            <div className="rounded-3xl border border-green-900/40 bg-black/30 p-10 text-center text-2xl text-gray-400">
              لا توجد أكواد اليوم
            </div>
          ) : (
            <div className="space-y-6">
              {codes.map((code) => (
                <div
                  key={code.id}
                  className="rounded-[32px] border border-green-900/50 bg-[radial-gradient(circle_at_top,#0d2210,#071107)] p-6 shadow-[0_0_40px_rgba(0,255,120,0.08)]"
                >
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="rounded-2xl border border-green-500/40 bg-green-500/10 px-5 py-3 text-3xl font-black text-green-400">
                      {code.tip_outcome || 'بدون نوع'}
                    </div>

                    <div className="text-center">
                      <div className="text-5xl font-black tracking-[0.18em]">{code.tip_code}</div>
                    </div>

                    <div className="text-4xl font-black text-yellow-400">x{formatOdds(code.odds)}</div>
                  </div>

                  {code.description && (
                    <div className="mb-5 rounded-2xl border border-green-900/40 bg-black/30 px-5 py-4 text-2xl text-gray-300">
                      {code.description}
                    </div>
                  )}

                  {getPublicUrl(code.code_image_url) && (
                    <div className="mb-6 overflow-hidden rounded-[28px] border border-green-900/40 bg-black/20 p-4">
                      <img
                        src={getPublicUrl(code.code_image_url)!}
                        alt="صورة الرهان"
                        className="mx-auto block max-h-[600px] w-full rounded-2xl object-contain"
                      />
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-3">
                    <button
                      onClick={() => handleWinOrRefund(code, 'won')}
                      className="rounded-2xl bg-green-600 px-6 py-4 text-3xl font-black text-white"
                    >
                      ✅ كسب
                    </button>

                    <button
                      onClick={() => handleWinOrRefund(code, 'refund')}
                      className="rounded-2xl bg-blue-700 px-6 py-4 text-3xl font-black text-white"
                    >
                      📥 استرداد
                    </button>

                    <button
                      onClick={() => handleDelete(code)}
                      className="rounded-2xl bg-red-900 px-6 py-4 text-3xl font-black text-white"
                    >
                      🗑️ حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleLogout}
            className="rounded-2xl border border-red-500/40 bg-red-500/10 px-6 py-3 text-2xl font-black text-red-400"
          >
            تسجيل خروج
          </button>
        </div>

        {message && (
          <div className="rounded-2xl border border-green-700/40 bg-green-500/10 px-5 py-4 text-center text-xl font-black text-green-400">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
