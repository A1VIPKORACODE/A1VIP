import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const ADMIN_PASSWORD = 'AbanoubSamirRANDAHANY907&ANGLIabanoub907@#$';
const STORAGE_KEY = 'admin_token_expires';
const BUCKET = 'codes';

type CodeStatus = 'active' | 'won' | 'refund';

type CodeItem = {
  id: string;
  description: string | null;
  tip_outcome: string | null;
  tip_code: string;
  odds: number;
  status: CodeStatus;
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

function addOneDay(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCDate(utcDate.getUTCDate() + 1);
  return utcDate.toISOString().slice(0, 10);
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
  const clean = path
    .replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/public\/codes\//, '')
    .replace(/^\/+/, '')
    .replace(/^codes\//, '');
  if (!clean) return;
  await supabase.storage.from(BUCKET).remove([clean]);
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[22px] sm:rounded-[26px] md:rounded-[30px] border border-emerald-500/20 bg-[linear-gradient(180deg,rgba(16,40,24,0.96),rgba(7,18,10,0.98))] p-3.5 sm:p-4 md:p-5 shadow-[0_0_30px_rgba(16,185,129,0.08)]">
      {children}
    </div>
  );
}

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [codes, setCodes] = useState<CodeItem[]>([]);
  const [wonCodes, setWonCodes] = useState<CodeItem[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStat | null>(null);
  const [currentDay, setCurrentDay] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [description, setDescription] = useState('');
  const [tipOutcome, setTipOutcome] = useState('');
  const [tipCode, setTipCode] = useState('');
  const [odds, setOdds] = useState('');
  const [betImage, setBetImage] = useState<File | null>(null);
  const [betImagePreview, setBetImagePreview] = useState<string | null>(null);
  const [savingCode, setSavingCode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && Number(saved) > Date.now()) {
      setAuthorized(true);
    }
  }, []);

  useEffect(() => {
    if (authorized) loadAll();
  }, [authorized]);

  useEffect(() => {
    return () => {
      if (betImagePreview) URL.revokeObjectURL(betImagePreview);
    };
  }, [betImagePreview]);

  async function ensureCurrentDay() {
    const { data, error } = await supabase.from('app_state').select('*').eq('key', 'current_day').maybeSingle();
    if (error) throw error;

    if (data?.value && /^\d{4}-\d{2}-\d{2}$/.test(data.value)) {
      return data.value as string;
    }

    const today = new Date().toISOString().split('T')[0];

    if (data?.key === 'current_day') {
      const { error: updateError } = await supabase.from('app_state').update({ value: today }).eq('key', 'current_day');
      if (updateError) throw updateError;
      return today;
    }

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
    const wonCount = rows.filter((c) => c.status === 'won' || c.status === 'refund').length;
    const combinedOdds = rows.reduce((sum, c) => sum + Number(c.odds || 0), 0);

    const { error: upError } = await supabase
      .from('daily_stats')
      .upsert(
        [
          {
            stat_date: day,
            total_codes: totalCodes,
            won_codes_count: wonCount,
            combined_odds: Number(combinedOdds.toFixed(2)),
            is_finalized: false,
          },
        ],
        { onConflict: 'stat_date' },
      );

    if (upError) throw upError;
  }

  async function cleanupOldWonCodes() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toISOString();

    const { data, error } = await supabase
      .from('codes')
      .select('*')
      .in('status', ['won', 'refund'])
      .lt('won_at', cutoffStr);

    if (error) return;

    for (const row of data || []) {
      await removeImage(row.code_image_url);
      await removeImage(row.proof_image_url);
      await supabase.from('codes').delete().eq('id', row.id);
    }
  }

  async function loadAll() {
    try {
      setLoading(true);
      setMessage('');

      await cleanupOldWonCodes();

      const day = await ensureCurrentDay();
      setCurrentDay(day);

      await ensureDailyStats(day);
      await recalcDayStats(day);

      const [
        { data: activeData, error: activeError },
        { data: wonData, error: wonError },
        { data: statsData, error: statsError },
      ] = await Promise.all([
        supabase.from('codes').select('*').eq('day_date', day).eq('status', 'active').order('created_at', { ascending: false }),
        supabase.from('codes').select('*').eq('day_date', day).in('status', ['won', 'refund']).order('won_at', { ascending: false }),
        supabase.from('daily_stats').select('*').eq('stat_date', day).maybeSingle(),
      ]);

      if (activeError) throw activeError;
      if (wonError) throw wonError;
      if (statsError) throw statsError;

      setCodes((activeData || []) as CodeItem[]);
      setWonCodes((wonData || []) as CodeItem[]);
      setDailyStats((statsData as DailyStat) || null);
    } catch (err: any) {
      setMessage(`حصل خطأ أثناء تحميل البيانات: ${err?.message || 'unknown error'}`);
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
    if (betImagePreview) URL.revokeObjectURL(betImagePreview);
    setBetImagePreview(null);
    setShowAddForm(false);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setBetImage(file);

    if (betImagePreview) URL.revokeObjectURL(betImagePreview);
    setBetImagePreview(file ? URL.createObjectURL(file) : null);
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
    } catch (err: any) {
      setMessage(`حصل خطأ أثناء إضافة الكود: ${err?.message || 'unknown error'}`);
    } finally {
      setSavingCode(false);
    }
  };

  const moveCodeLocally = (codeId: string, nextStatus: 'won' | 'refund', proofPath: string) => {
    setCodes((prev) => {
      const found = prev.find((c) => c.id === codeId);
      if (!found) return prev;
      const updated = {
        ...found,
        status: nextStatus,
        proof_image_url: proofPath,
        proof_type: nextStatus,
        won_at: new Date().toISOString(),
        odds: nextStatus === 'refund' ? 1 : found.odds,
      };
      setWonCodes((prevWon) => [updated, ...prevWon]);
      return prev.filter((c) => c.id !== codeId);
    });
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

        moveCodeLocally(code.id, nextStatus, uploadedPath);
        await recalcDayStats(currentDay);
        await loadAll();
        setMessage(nextStatus === 'won' ? 'تم تعليم الكود كرابح' : 'تم تعليم الكود كمسترد');
      } catch (err: any) {
        setMessage(
          nextStatus === 'won'
            ? `حصل خطأ أثناء رفع إثبات الكسب: ${err?.message || 'unknown error'}`
            : `حصل خطأ أثناء رفع إثبات الاسترداد: ${err?.message || 'unknown error'}`
        );
      }
    };

    fileInput.click();
  };

  const handleEditWonOdds = async (code: CodeItem) => {
    const value = window.prompt('اكتب نسبة الربح الجديدة', String(code.odds ?? 1));
    if (!value) return;

    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed <= 0) {
      setMessage('اكتب رقم صحيح أكبر من 0');
      return;
    }

    try {
      setMessage('');
      const { error } = await supabase.from('codes').update({ odds: parsed }).eq('id', code.id);
      if (error) throw error;

      setWonCodes((prev) => prev.map((item) => (item.id === code.id ? { ...item, odds: parsed } : item)));
      await recalcDayStats(currentDay);
      await loadAll();
      setMessage('تم تعديل نسبة الربح');
    } catch (err: any) {
      setMessage(`حصل خطأ أثناء تعديل النسبة: ${err?.message || 'unknown error'}`);
    }
  };

  const handleChangeWonProofImage = async (code: CodeItem) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    fileInput.onchange = async () => {
      const file = fileInput.files?.[0];
      if (!file) return;

      try {
        setMessage('');

        const uploadedPath = await uploadImage(file, code.status === 'refund' ? 'proof-refund' : 'proof-win');
        const oldPath = code.proof_image_url;

        const { error } = await supabase.from('codes').update({ proof_image_url: uploadedPath }).eq('id', code.id);
        if (error) throw error;

        if (oldPath) await removeImage(oldPath);

        setWonCodes((prev) => prev.map((item) => (item.id === code.id ? { ...item, proof_image_url: uploadedPath } : item)));
        await loadAll();
        setMessage('تم تغيير الصورة بنجاح');
      } catch (err: any) {
        setMessage(`حصل خطأ أثناء تغيير الصورة: ${err?.message || 'unknown error'}`);
      }
    };

    fileInput.click();
  };

  const handleToggleWonStatus = async (code: CodeItem) => {
    const nextStatus: CodeStatus = code.status === 'won' ? 'refund' : 'won';
    const payload: Partial<CodeItem> & { proof_type: string } = {
      status: nextStatus,
      proof_type: nextStatus,
      odds: nextStatus === 'refund' ? 1 : code.odds,
    };

    try {
      setMessage('');
      const { error } = await supabase.from('codes').update(payload).eq('id', code.id);
      if (error) throw error;

      setWonCodes((prev) =>
        prev.map((item) =>
          item.id === code.id
            ? {
                ...item,
                status: nextStatus,
                proof_type: nextStatus,
                odds: nextStatus === 'refund' ? 1 : item.odds,
              }
            : item,
        ),
      );

      await recalcDayStats(currentDay);
      await loadAll();
      setMessage(nextStatus === 'refund' ? 'تم تحويل الحالة إلى استرداد' : 'تم تحويل الحالة إلى كسب');
    } catch (err: any) {
      setMessage(`حصل خطأ أثناء تغيير الحالة: ${err?.message || 'unknown error'}`);
    }
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

      setCodes((prev) => prev.filter((c) => c.id !== code.id));
      setWonCodes((prev) => prev.filter((c) => c.id !== code.id));

      await recalcDayStats(currentDay);
      await loadAll();
      setMessage('تم حذف الكود نهائيًا');
    } catch (err: any) {
      setMessage(`حصل خطأ أثناء حذف الكود: ${err?.message || 'unknown error'}`);
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

      const newDay = addOneDay(currentDay);

      const { error: upsertStateError } = await supabase
        .from('app_state')
        .upsert([{ key: 'current_day', value: newDay }], { onConflict: 'key' });

      if (upsertStateError) throw upsertStateError;

      await ensureDailyStats(newDay);

      const { data: verifyState, error: verifyError } = await supabase
        .from('app_state')
        .select('value')
        .eq('key', 'current_day')
        .single();

      if (verifyError) throw verifyError;
      if (verifyState?.value !== newDay) {
        throw new Error(`فشل حفظ اليوم الجديد. القيمة الحالية: ${verifyState?.value || 'فارغة'}`);
      }

      setCurrentDay(newDay);
      setCodes([]);
      setWonCodes([]);
      setDailyStats({
        id: '',
        stat_date: newDay,
        total_codes: 0,
        won_codes_count: 0,
        combined_odds: 0,
        is_finalized: false,
      });

      setMessage(`تم إنهاء اليوم بنجاح. اليوم الجديد هو: ${newDay}`);
    } catch (err: any) {
      setMessage(`حصل خطأ أثناء إنهاء اليوم: ${err?.message || 'unknown error'}`);
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
      <div className="min-h-screen flex items-center justify-center bg-[#040a04] px-3 sm:px-4" dir="rtl">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md rounded-[24px] sm:rounded-[28px] md:rounded-[32px] border border-emerald-500/20 bg-[linear-gradient(180deg,rgba(16,40,24,0.96),rgba(7,18,10,0.98))] p-4 sm:p-5 md:p-6 shadow-[0_0_40px_rgba(16,185,129,0.08)]"
        >
          <h1 className="mb-5 sm:mb-6 text-center text-[24px] sm:text-[28px] md:text-3xl font-black text-white">دخول لوحة الإدارة</h1>

          <input
            type="password"
            placeholder="اكتب كلمة السر"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 w-full rounded-2xl border border-emerald-500/20 bg-black/35 px-4 py-3 text-[16px] sm:text-[17px] md:text-base text-white outline-none"
          />

          <button className="w-full rounded-2xl bg-emerald-500 py-3 text-[18px] sm:text-[19px] md:text-xl font-black text-black">
            دخول
          </button>

          {message && <p className="mt-4 text-center text-[14px] sm:text-[15px] md:text-base font-bold text-red-400">{message}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030903] px-3 sm:px-4 py-5 sm:py-6 md:py-8 text-white" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
        <div className="flex flex-col items-start justify-between gap-3 sm:gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-[26px] sm:text-[32px] md:text-4xl font-black text-white">⚙️ لوحة الإدارة</h1>
            <p className="mt-1.5 sm:mt-2 text-[14px] sm:text-[16px] md:text-lg text-emerald-200/70">إضافة وإدارة الأكواد بشكل سريع ومريح</p>
          </div>

          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full md:w-auto rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-5 sm:px-6 md:px-8 py-3 sm:py-3.5 text-[17px] sm:text-[18px] md:text-xl font-black text-black shadow-[0_0_20px_rgba(16,185,129,0.22)]"
            >
              + إضافة كود
            </button>
          ) : (
            <button
              onClick={() => setShowAddForm(false)}
              className="w-full md:w-auto rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-5 sm:px-6 md:px-8 py-3 sm:py-3.5 text-[17px] sm:text-[18px] md:text-xl font-black text-black shadow-[0_0_20px_rgba(16,185,129,0.22)]"
            >
              ✕ إغلاق
            </button>
          )}
        </div>

        {showAddForm && (
          <SectionCard>
            <h2 className="mb-5 sm:mb-6 text-[24px] sm:text-[28px] md:text-3xl font-black text-white">+ إضافة كود جديد</h2>

            <form onSubmit={handleAddCode} className="space-y-4 sm:space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[14px] sm:text-[16px] md:text-lg text-emerald-100/80">نوع التوقع (اختياري)</label>
                  <input
                    value={tipOutcome}
                    onChange={(e) => setTipOutcome(e.target.value)}
                    placeholder="مثال: 1 أو X2 أو أقل من 7.5"
                    className="w-full rounded-2xl border border-emerald-500/20 bg-black/35 px-4 py-3 text-[15px] sm:text-[16px] md:text-lg text-white outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[14px] sm:text-[16px] md:text-lg text-emerald-100/80">نسبة ربح الكود</label>
                  <input
                    value={odds}
                    onChange={(e) => setOdds(e.target.value)}
                    placeholder="مثال: 1.75"
                    className="w-full rounded-2xl border border-emerald-500/20 bg-black/35 px-4 py-3 text-[15px] sm:text-[16px] md:text-lg text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[14px] sm:text-[16px] md:text-lg text-emerald-100/80">وصف الكود (اختياري)</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب وصف الرهان"
                  className="w-full rounded-2xl border border-emerald-500/20 bg-black/35 px-4 py-3 text-[15px] sm:text-[16px] md:text-lg text-white outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-[14px] sm:text-[16px] md:text-lg text-emerald-100/80">الكود</label>
                <input
                  value={tipCode}
                  onChange={(e) => setTipCode(e.target.value)}
                  placeholder="مثال: MC-ARS-2024"
                  className="w-full rounded-2xl border border-emerald-500/20 bg-black/35 px-3 sm:px-4 py-3 text-center text-[20px] sm:text-[24px] md:text-2xl tracking-[0.12em] sm:tracking-[0.14em] text-white outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-[14px] sm:text-[16px] md:text-lg text-emerald-100/80">صورة الكود (إجباري)</label>
                <label className="flex cursor-pointer items-center justify-center rounded-3xl border-2 border-dashed border-emerald-500/25 bg-black/20 px-4 py-7 sm:py-8 text-[16px] sm:text-[18px] md:text-xl text-emerald-100/70">
                  📸 رفع صورة للكود
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>

                {betImage && <p className="mt-3 text-[13px] sm:text-[14px] md:text-base text-emerald-400 break-all">{betImage.name}</p>}

                {betImagePreview && (
                  <div className="mt-4 overflow-hidden rounded-[22px] sm:rounded-[24px] border border-emerald-500/15 bg-black/25 p-3 sm:p-4">
                    <p className="mb-3 text-[14px] sm:text-[16px] md:text-lg font-bold text-emerald-100/80">معاينة الصورة قبل الإضافة</p>
                    <img src={betImagePreview} alt="معاينة صورة الكود" className="mx-auto block max-h-[380px] md:max-h-[500px] w-full rounded-2xl object-contain" />
                  </div>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="submit"
                  disabled={savingCode}
                  className="rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-5 py-3.5 text-[20px] sm:text-[22px] md:text-2xl font-black text-black shadow-[0_0_20px_rgba(16,185,129,0.22)] disabled:opacity-60"
                >
                  {savingCode ? 'جاري الإضافة...' : '✅ إضافة الكود'}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-emerald-500/20 bg-black/25 px-5 py-3.5 text-[20px] sm:text-[22px] md:text-2xl font-black text-white"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </SectionCard>
        )}

        <SectionCard>
          <h2 className="mb-4 sm:mb-5 text-[24px] sm:text-[28px] md:text-3xl font-black text-white">📊 إحصائيات اليوم</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-[20px] border border-emerald-500/15 bg-black/25 px-4 py-4 gap-3">
              <span className="text-[15px] sm:text-[18px] md:text-2xl text-emerald-100/80">إجمالي الأكواد</span>
              <span className="text-[28px] sm:text-[34px] md:text-4xl font-black text-white">{stats.totalCodes}</span>
            </div>

            <div className="flex items-center justify-between rounded-[20px] border border-emerald-500/15 bg-black/25 px-4 py-4 gap-3">
              <span className="text-[15px] sm:text-[18px] md:text-2xl text-emerald-100/80">الأكواد الرابحة</span>
              <span className="text-[28px] sm:text-[34px] md:text-4xl font-black text-emerald-400">{stats.wonCodes}</span>
            </div>

            <div className="flex items-center justify-between rounded-[20px] border border-yellow-500/15 bg-black/25 px-4 py-4 gap-3">
              <span className="text-[15px] sm:text-[18px] md:text-2xl text-yellow-100/80">مجموع ربح الأكواد</span>
              <span className="text-[24px] sm:text-[30px] md:text-4xl font-black text-yellow-400">{formatOdds(stats.combinedOdds)}</span>
            </div>

            <button
              onClick={handleEndDay}
              className="mt-3 w-full rounded-[20px] bg-yellow-500 hover:bg-yellow-400 px-5 py-4 text-[18px] sm:text-[20px] md:text-2xl font-black text-black shadow-[0_0_20px_rgba(234,179,8,0.18)]"
            >
              نهاية اليوم - أحسب الإحصائيات
            </button>
          </div>
        </SectionCard>

        <div>
          <h2 className="mb-4 text-[24px] sm:text-[28px] md:text-3xl font-black text-white">📋 أكواد اليوم النشطة ({codes.length})</h2>

          {loading ? (
            <SectionCard>
              <div className="text-center text-[17px] sm:text-[19px] md:text-xl text-gray-400">جاري التحميل...</div>
            </SectionCard>
          ) : codes.length === 0 ? (
            <SectionCard>
              <div className="text-center text-[17px] sm:text-[19px] md:text-xl text-gray-400">لا توجد أكواد اليوم</div>
            </SectionCard>
          ) : (
            <div className="space-y-4">
              {codes.map((code) => (
                <SectionCard key={code.id}>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-[16px] sm:text-[18px] md:text-2xl font-black text-emerald-400">
                      {code.tip_outcome || 'بدون نوع'}
                    </div>

                    <div className="text-center w-full md:w-auto order-last md:order-none">
                      <div className="text-[22px] sm:text-[28px] md:text-4xl font-black tracking-[0.12em] sm:tracking-[0.14em] md:tracking-[0.16em] break-all text-white">
                        {code.tip_code}
                      </div>
                    </div>

                    <div className="text-[22px] sm:text-[26px] md:text-3xl font-black text-yellow-400">x{formatOdds(code.odds)}</div>
                  </div>

                  {code.description && (
                    <div className="mb-4 rounded-2xl border border-emerald-500/15 bg-black/25 px-4 py-3 text-[15px] sm:text-[16px] md:text-xl text-gray-300">
                      {code.description}
                    </div>
                  )}

                  {getPublicUrl(code.code_image_url) && (
                    <div className="mb-4 overflow-hidden rounded-[20px] border border-emerald-500/15 bg-black/20 p-3">
                      <img
                        src={getPublicUrl(code.code_image_url)!}
                        alt="صورة الرهان"
                        className="mx-auto block max-h-[380px] md:max-h-[520px] w-full rounded-2xl object-contain"
                      />
                    </div>
                  )}

                  <div className="grid gap-3 md:grid-cols-3">
                    <button
                      onClick={() => handleWinOrRefund(code, 'won')}
                      className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-4 py-3 text-[18px] sm:text-[20px] md:text-2xl font-black text-white"
                    >
                      ✅ كسب
                    </button>

                    <button
                      onClick={() => handleWinOrRefund(code, 'refund')}
                      className="rounded-2xl bg-sky-700 hover:bg-sky-600 px-4 py-3 text-[18px] sm:text-[20px] md:text-2xl font-black text-white"
                    >
                      📥 استرداد
                    </button>

                    <button
                      onClick={() => handleDelete(code)}
                      className="rounded-2xl bg-red-900 hover:bg-red-800 px-4 py-3 text-[18px] sm:text-[20px] md:text-2xl font-black text-white"
                    >
                      🗑️ حذف
                    </button>
                  </div>
                </SectionCard>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-4 text-[24px] sm:text-[28px] md:text-3xl font-black text-white">🏆 أكواد اليوم الرابحة ({wonCodes.length})</h2>

          {loading ? (
            <SectionCard>
              <div className="text-center text-[17px] sm:text-[19px] md:text-xl text-gray-400">جاري التحميل...</div>
            </SectionCard>
          ) : wonCodes.length === 0 ? (
            <SectionCard>
              <div className="text-center text-[17px] sm:text-[19px] md:text-xl text-gray-400">لا توجد أكواد رابحة اليوم</div>
            </SectionCard>
          ) : (
            <div className="space-y-4">
              {wonCodes.map((code) => (
                <SectionCard key={code.id}>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-[16px] sm:text-[18px] md:text-2xl font-black text-emerald-400">
                      {code.tip_outcome || 'بدون نوع'}
                    </div>

                    <div className="text-center w-full md:w-auto order-last md:order-none">
                      <div className="text-[22px] sm:text-[28px] md:text-4xl font-black tracking-[0.12em] sm:tracking-[0.14em] md:tracking-[0.16em] break-all text-white">
                        {code.tip_code}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-emerald-500 px-4 py-2 text-[16px] sm:text-[18px] md:text-xl font-black text-black">
                      {code.status === 'refund' ? '📥 استرداد' : '✅ كسب'}
                    </div>
                  </div>

                  <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-yellow-500/15 bg-black/25 px-4 py-3">
                    <span className="text-[14px] sm:text-[15px] md:text-lg text-yellow-100/80">نسبة الربح الحالية</span>
                    <span className="text-[22px] sm:text-[24px] md:text-3xl font-black text-yellow-400">x{formatOdds(code.odds)}</span>
                  </div>

                  {code.description && (
                    <div className="mb-4 rounded-2xl border border-emerald-500/15 bg-black/25 px-4 py-3 text-[15px] sm:text-[16px] md:text-xl text-gray-300">
                      {code.description}
                    </div>
                  )}

                  {getPublicUrl(code.code_image_url) && (
                    <div className="mb-4 overflow-hidden rounded-[20px] border border-emerald-500/15 bg-black/20 p-3">
                      <p className="mb-2 text-[14px] sm:text-[15px] md:text-lg font-bold text-emerald-100/80">صورة الرهان</p>
                      <img
                        src={getPublicUrl(code.code_image_url)!}
                        alt="صورة الرهان"
                        className="mx-auto block max-h-[380px] md:max-h-[520px] w-full rounded-2xl object-contain"
                      />
                    </div>
                  )}

                  {getPublicUrl(code.proof_image_url) && (
                    <div className="mb-4 overflow-hidden rounded-[20px] border border-emerald-500/15 bg-black/20 p-3">
                      <p className="mb-2 text-[14px] sm:text-[15px] md:text-lg font-bold text-emerald-100/80">
                        {code.status === 'refund' ? 'إثبات الاسترداد' : 'إثبات الربح'}
                      </p>
                      <img
                        src={getPublicUrl(code.proof_image_url)!}
                        alt={code.status === 'refund' ? 'إثبات الاسترداد' : 'إثبات الربح'}
                        className="mx-auto block max-h-[380px] md:max-h-[520px] w-full rounded-2xl object-contain"
                      />
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <button
                      onClick={() => handleEditWonOdds(code)}
                      className="rounded-2xl bg-yellow-500 hover:bg-yellow-400 px-4 py-3 text-[16px] sm:text-[18px] md:text-xl font-black text-black"
                    >
                      ✏️ تعديل النسبة
                    </button>

                    <button
                      onClick={() => handleChangeWonProofImage(code)}
                      className="rounded-2xl bg-violet-600 hover:bg-violet-500 px-4 py-3 text-[16px] sm:text-[18px] md:text-xl font-black text-white"
                    >
                      🖼️ تغيير الصورة
                    </button>

                    <button
                      onClick={() => handleToggleWonStatus(code)}
                      className="rounded-2xl bg-sky-700 hover:bg-sky-600 px-4 py-3 text-[16px] sm:text-[18px] md:text-xl font-black text-white"
                    >
                      {code.status === 'won' ? '📥 تحويل لاسترداد' : '✅ تحويل لكسب'}
                    </button>

                    <button
                      onClick={() => handleDelete(code)}
                      className="rounded-2xl bg-red-900 hover:bg-red-800 px-4 py-3 text-[16px] sm:text-[18px] md:text-xl font-black text-white"
                    >
                      🗑️ حذف نهائي
                    </button>
                  </div>
                </SectionCard>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-3 text-[17px] sm:text-[18px] md:text-xl font-black text-red-400"
          >
            تسجيل خروج
          </button>
        </div>

        {message && (
          <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/10 px-4 py-4 text-center text-[14px] sm:text-[16px] md:text-lg font-black text-emerald-300 break-words">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
