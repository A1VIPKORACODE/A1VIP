import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

function normalizeStoragePath(path?: string | null) {
  if (!path) return null;
  let clean = String(path).trim();
  clean = clean.replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/public\/codes\//, '');
  clean = clean.replace(/^\/+/, '');
  clean = clean.replace(/^codes\//, '');
  return clean || null;
}

function getImageUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith('http')) return path;

  const clean = normalizeStoragePath(path);
  if (!clean) return null;

  const { data } = supabase.storage.from('codes').getPublicUrl(clean);
  return data.publicUrl;
}

function formatDateArabic(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatMoney(num: number) {
  return Math.round(num).toLocaleString('en-US');
}

function formatOdds(value: number) {
  return Number(value || 0).toFixed(2);
}

function date30DaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
}

type CodeRow = {
  id: string;
  description: string | null;
  tip_outcome: string | null;
  tip_code: string | null;
  odds: number | null;
  status: 'won' | 'refund';
  code_image_url: string | null;
  proof_image_url: string | null;
  proof_type: string | null;
  created_at: string | null;
  won_at: string | null;
  day_date: string;
};

function ProofCard({ code, index }: { code: CodeRow; index: number }) {
  return (
    <div className="rounded-[32px] border border-green-900/50 bg-[radial-gradient(circle_at_top,#0d2210,#071107)] p-5 shadow-[0_0_40px_rgba(0,255,120,0.08)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-green-500 text-2xl font-black text-green-400">
          {index}
        </div>
        <div className="rounded-full bg-green-500 px-4 py-2 text-sm font-black text-black">
          {code.status === 'refund' ? '📥 استرداد' : '✅ رابح'}
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-green-900/50 bg-black/40 px-4 py-4 text-center">
        <div className="text-3xl font-black tracking-[0.18em] text-green-400">{code.tip_code}</div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-3xl font-black text-yellow-400">x{formatOdds(Number(code.odds || 0))}</div>
        <div className="text-lg text-gray-300">نسبة ربح الكود</div>
      </div>

      {getImageUrl(code.proof_image_url) && (
        <div className="overflow-hidden rounded-[24px] border border-green-900/40 bg-black/20 p-3">
          <div className="mb-2 text-lg font-black text-gray-300">
            📸 {code.status === 'refund' ? 'إثبات الاسترداد' : 'إثبات الربح'}
          </div>
          <img
            src={getImageUrl(code.proof_image_url)!}
            alt={code.status === 'refund' ? 'إثبات الاسترداد' : 'إثبات الربح'}
            className="mx-auto block w-full rounded-2xl object-contain"
          />
        </div>
      )}
    </div>
  );
}

export default function WonCodesPage() {
  const [currentDay, setCurrentDay] = useState('');
  const [wonCodes, setWonCodes] = useState<CodeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);

        const { data: appState } = await supabase.from('app_state').select('value').eq('key', 'current_day').maybeSingle();
        const current = appState?.value || new Date().toISOString().split('T')[0];
        const last30Start = date30DaysAgo();

        const { data, error } = await supabase
          .from('codes')
          .select('*')
          .in('status', ['won', 'refund'])
          .gte('day_date', last30Start)
          .order('day_date', { ascending: false })
          .order('won_at', { ascending: false });

        if (error) throw error;
        if (!mounted) return;

        setCurrentDay(current);
        setWonCodes((data || []) as CodeRow[]);
      } catch (err) {
        console.error('WON PAGE ERROR:', err);
        if (!mounted) return;
        setWonCodes([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const yesterday = useMemo(() => {
    if (!currentDay || !/^\d{4}-\d{2}-\d{2}$/.test(currentDay)) return null;
    const d = new Date(`${currentDay}T00:00:00`);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, [currentDay]);

  const yesterdayCodes = useMemo(() => {
    if (!yesterday) return [];
    return wonCodes.filter((c) => c.day_date === yesterday);
  }, [wonCodes, yesterday]);

  const last30Codes = wonCodes;

  const groupedCodes = useMemo(() => {
    const grouped: Record<string, CodeRow[]> = {};
    for (const code of last30Codes) {
      if (!grouped[code.day_date]) grouped[code.day_date] = [];
      grouped[code.day_date].push(code);
    }
    return grouped;
  }, [last30Codes]);

  const yesterdayStats = useMemo(() => {
    const totalCodes = yesterdayCodes.length;
    const wonCodesCount = yesterdayCodes.length;
    const totalOdds = yesterdayCodes.reduce((sum, c) => sum + Number(c.odds || 0), 0);
    const profit1000 = totalOdds * 1000;
    return { totalCodes, wonCodesCount, totalOdds, profit1000 };
  }, [yesterdayCodes]);

  const last30Stats = useMemo(() => {
    const totalCodes = last30Codes.length;
    const wonCodesCount = last30Codes.length;
    const totalOdds = last30Codes.reduce((sum, c) => sum + Number(c.odds || 0), 0);
    const profit1000 = totalOdds * 1000;
    return { totalCodes, wonCodesCount, totalOdds, profit1000 };
  }, [last30Codes]);

  return (
    <div className="space-y-10" dir="rtl">
      <section className="relative overflow-hidden rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-[#050a05] via-[#061106] to-[#090f09] p-6 md:p-10 text-center">
        <div className="mb-4">
          <div className="inline-flex items-center justify-center rounded-full border border-yellow-500/30 bg-yellow-500/10 px-6 py-3 text-xl font-black text-yellow-300">
            🏆 الأكواد الرابحة
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-black leading-tight">
          سجل <span className="text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,0.8)]">الانتصارات</span> 🎯
        </h1>

        <p className="mt-4 text-2xl font-bold text-green-300">⚽ احصائيات الأكواد الرابحة ⚽</p>
      </section>

      {yesterdayCodes.length > 0 && (
        <section className="rounded-[38px] border border-green-900/50 bg-[radial-gradient(circle_at_top,#0d2210,#071107)] p-6 md:p-10 text-center shadow-[0_0_45px_rgba(0,255,120,0.08)]">
          <div className="mb-4 text-2xl md:text-3xl font-black text-green-400">📅 إحصائيات أكواد امبارح</div>

          <p className="mx-auto max-w-4xl text-3xl md:text-5xl font-black leading-relaxed text-white">
            لو كنت رميت <span className="text-yellow-400">1000 جنيه</span> بس على أكوادنا المضمونة كانت هاتكون أرباحك دلوقتي
          </p>

          <div className="mt-6 text-5xl md:text-8xl font-black text-green-400">
            {formatMoney(yesterdayStats.profit1000)} <span className="text-green-400">جنيه</span>
          </div>

          <p className="mt-3 text-xl md:text-2xl font-bold text-green-400">بدل الـ 1000 جنيه!</p>

          <div className="mx-auto mt-8 grid max-w-4xl gap-5 md:grid-cols-2">
            <div className="rounded-[28px] border border-green-900/40 bg-black/40 p-8">
              <div className="text-5xl font-black text-green-400">{yesterdayStats.totalCodes}</div>
              <div className="mt-4 text-2xl text-gray-300">مجموع الأكواد</div>
            </div>

            <div className="rounded-[28px] border border-green-900/40 bg-black/40 p-8">
              <div className="text-5xl font-black text-green-400">{yesterdayStats.wonCodesCount}</div>
              <div className="mt-4 text-2xl text-gray-300">عدد الأكواد الرابحة</div>
            </div>
          </div>

          <div className="mx-auto mt-5 max-w-xl rounded-[28px] border border-yellow-900/30 bg-black/40 p-8">
            <div className="text-5xl font-black text-yellow-400">{formatOdds(yesterdayStats.totalOdds)}</div>
            <div className="mt-4 text-2xl text-gray-300">مجموع أرباح الأكواد</div>
          </div>
        </section>
      )}

      <section className="rounded-[38px] border border-green-900/50 bg-[radial-gradient(circle_at_top,#0d2210,#071107)] p-6 md:p-10 text-center shadow-[0_0_45px_rgba(0,255,120,0.08)]">
        <div className="mb-4 text-2xl md:text-3xl font-black text-green-400">📊 إحصائيات آخر 30 يوم</div>

        <p className="mx-auto max-w-4xl text-3xl md:text-5xl font-black leading-relaxed text-white">
          لو كنت رميت <span className="text-yellow-400">1000 جنيه</span> بس على أكوادنا المضمونة كانت هاتكون أرباحك دلوقتي
        </p>

        <div className="mt-6 text-5xl md:text-8xl font-black text-green-400">
          {formatMoney(last30Stats.profit1000)} <span className="text-green-400">جنيه</span>
        </div>

        <p className="mt-3 text-xl md:text-2xl font-bold text-green-400">بدل الـ 1000 جنيه!</p>

        <div className="mx-auto mt-8 grid max-w-4xl gap-5 md:grid-cols-2">
          <div className="rounded-[28px] border border-green-900/40 bg-black/40 p-8">
            <div className="text-5xl font-black text-green-400">{last30Stats.totalCodes}</div>
            <div className="mt-4 text-2xl text-gray-300">مجموع الأكواد</div>
          </div>

          <div className="rounded-[28px] border border-green-900/40 bg-black/40 p-8">
            <div className="text-5xl font-black text-green-400">{last30Stats.wonCodesCount}</div>
            <div className="mt-4 text-2xl text-gray-300">عدد الأكواد الرابحة</div>
          </div>
        </div>

        <div className="mx-auto mt-5 max-w-xl rounded-[28px] border border-yellow-900/30 bg-black/40 p-8">
          <div className="text-5xl font-black text-yellow-400">{formatOdds(last30Stats.totalOdds)}</div>
          <div className="mt-4 text-2xl text-gray-300">مجموع أرباح الأكواد</div>
        </div>
      </section>

      <section className="rounded-[38px] border border-yellow-500/25 bg-gradient-to-br from-yellow-500/10 to-yellow-700/10 p-6 md:p-10 text-center shadow-[0_0_45px_rgba(234,179,8,0.12)]">
        <h2 className="text-3xl md:text-5xl font-black leading-relaxed text-white">
          🔥 انتهز الفرصة الآن واستخدم أكوادنا المضمونة
        </h2>

        <p className="mx-auto mt-8 max-w-4xl text-2xl md:text-4xl leading-relaxed text-gray-200">
          حتى تكون أرباحك الشهر القادم مضاعفات رأس مالك وانت مطمئن 💪
        </p>

        <div className="mx-auto mt-8 max-w-4xl rounded-[28px] border border-green-900/40 bg-black/35 p-6 md:p-8 text-right">
          <p className="text-2xl md:text-4xl font-black leading-relaxed text-white">🎲 عشان الأكواد تشتغل معاك لازم 🔤</p>
          <p className="mt-5 text-2xl md:text-4xl font-black leading-relaxed text-white">
            1️⃣ تستخدمها في تطبيق <span className="text-gray-200">MELBET</span>
          </p>
          <p className="mt-4 text-2xl md:text-4xl font-black leading-relaxed text-white">
            2️⃣ وتكون مسجل ببروموكود <span className="text-yellow-400">A1VIP</span>
          </p>

          <div className="my-6 h-px bg-green-900/40" />

          <p className="text-2xl md:text-4xl font-black leading-relaxed text-white">🗓 وده شرح:</p>
          <p className="mt-4 text-2xl md:text-4xl leading-relaxed text-gray-300">📌 طريقة تنزيل تطبيق MELBET</p>
          <p className="mt-3 text-2xl md:text-4xl leading-relaxed text-gray-300">
            📌 والتسجيل ببروموكود <span className="text-yellow-400 font-black">A1VIP</span> ⬇️
          </p>
        </div>

        <a
          href="https://t.me/WIN_20K/253"
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex w-full max-w-4xl items-center justify-center rounded-2xl bg-yellow-500 px-6 py-5 text-2xl md:text-4xl font-black text-black shadow-[0_0_30px_rgba(234,179,8,0.4)] transition-all hover:bg-yellow-400"
        >
          ← اضغط هنا للتحويل للشرح اضغط هنا
        </a>
      </section>

      <section className="space-y-8">
        <div className="mx-auto w-fit rounded-[28px] border border-yellow-400/50 bg-gradient-to-r from-yellow-500/20 via-yellow-400/15 to-yellow-500/20 px-8 py-5 text-center shadow-[0_0_35px_rgba(234,179,8,0.18)]">
          <h2 className="text-3xl md:text-5xl font-black text-yellow-300">💸 إثبات كل الاكواد الرابحة 💸</h2>
          <p className="mt-3 text-2xl md:text-3xl font-black text-yellow-200">⚽ لآخر 30 يوم ⚽</p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-green-900/40 bg-black/30 p-10 text-center text-2xl text-gray-400">
            جاري التحميل...
          </div>
        ) : last30Codes.length === 0 ? (
          <div className="rounded-3xl border border-green-900/40 bg-black/30 p-10 text-center text-2xl text-gray-400">
            لا توجد إثباتات حتى الآن
          </div>
        ) : (
          Object.entries(groupedCodes).map(([day, items]) => (
            <div key={day} className="space-y-6">
              <div className="text-center">
                <h3 className="text-3xl md:text-5xl font-black text-white">{formatDateArabic(day)}</h3>
                <p className="mt-2 text-xl md:text-2xl text-gray-400">{items.length} كود رابح</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {items.map((code, idx) => (
                  <ProofCard key={code.id} code={code} index={idx + 1} />
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
