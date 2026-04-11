import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const AR_LATN_LOCALE = 'ar-EG-u-nu-latn';

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
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(AR_LATN_LOCALE, {
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
    <div className="rounded-[22px] sm:rounded-[24px] md:rounded-[28px] border border-green-900/50 bg-[radial-gradient(circle_at_top,#0d2210,#071107)] p-3 sm:p-4 md:p-5 shadow-[0_0_24px_rgba(0,255,120,0.08)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="inline-flex h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-xl sm:rounded-2xl border-2 border-green-500 text-base sm:text-lg md:text-xl font-black text-green-400">
          {index}
        </div>
        <div className="rounded-full bg-green-500 px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-black text-black">
          {code.status === 'refund' ? '📥 استرداد' : '✅ رابح'}
        </div>
      </div>

      <div className="mb-3 rounded-xl sm:rounded-2xl border border-green-900/50 bg-black/40 px-2 py-3 text-center">
        <div className="text-[18px] sm:text-[22px] md:text-[26px] font-black tracking-[0.12em] sm:tracking-[0.14em] text-green-400 leading-none">
          {code.tip_code}
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-[20px] sm:text-2xl md:text-3xl font-black text-yellow-400">
          x{formatOdds(Number(code.odds || 0))}
        </div>
        <div className="text-[12px] sm:text-sm md:text-base text-gray-300">نسبة ربح الكود</div>
      </div>

      {getImageUrl(code.code_image_url) && (
        <div className="mb-3 overflow-hidden rounded-[16px] sm:rounded-[18px] md:rounded-[22px] border border-green-900/40 bg-black/20 p-2.5 sm:p-3">
          <div className="mb-2 text-[12px] sm:text-sm md:text-base font-black text-gray-300">
            📸 صورة الرهان
          </div>
          <img
            loading="lazy"
            src={getImageUrl(code.code_image_url)!}
            alt="صورة الرهان"
            className="mx-auto block w-full rounded-xl sm:rounded-2xl object-contain"
          />
        </div>
      )}

      {getImageUrl(code.proof_image_url) && (
        <div className="overflow-hidden rounded-[16px] sm:rounded-[18px] md:rounded-[22px] border border-green-900/40 bg-black/20 p-2.5 sm:p-3">
          <div className="mb-2 text-[12px] sm:text-sm md:text-base font-black text-gray-300">
            📸 صورة إثبات الربح
          </div>
          <img
            loading="lazy"
            src={getImageUrl(code.proof_image_url)!}
            alt={code.status === 'refund' ? 'إثبات الاسترداد' : 'إثبات الربح'}
            className="mx-auto block w-full rounded-xl sm:rounded-2xl object-contain"
          />
        </div>
      )}
    </div>
  );
}

function StatsCard({
  title,
  dayLabel,
  bigAmount,
  totalCodes,
  wonCodesCount,
  totalOdds,
}: {
  title: string;
  dayLabel?: string;
  bigAmount: number;
  totalCodes: number;
  wonCodesCount: number;
  totalOdds: number;
}) {
  return (
    <section className="rounded-[24px] sm:rounded-[28px] md:rounded-[34px] border border-green-900/50 bg-[radial-gradient(circle_at_top,#0d2210,#071107)] px-3 py-5 sm:px-4 sm:py-6 md:p-10 text-center shadow-[0_0_32px_rgba(0,255,120,0.08)]">
      <div className="mb-2 text-[20px] sm:text-[24px] md:text-3xl font-black text-green-400">
        {title}
      </div>
      {dayLabel && (
        <div className="mb-3 text-[14px] sm:text-[16px] md:text-2xl font-bold text-gray-400">
          {dayLabel}
        </div>
      )}

      <p className="mx-auto max-w-4xl text-[20px] sm:text-[28px] md:text-5xl font-black leading-[1.7] md:leading-relaxed text-white">
        لو كنت رميت <span className="text-yellow-400">1000 جنيه</span> بس على أكوادنا المضمونة كانت
        هاتكون أرباحك دلوقتي
      </p>

      <div className="mt-5 flex items-end justify-center gap-2 sm:gap-3 md:gap-4">
        <span className="text-[34px] sm:text-[46px] md:text-8xl font-black text-green-400 leading-none">
          {formatMoney(bigAmount)}
        </span>
        <span className="text-[28px] sm:text-[36px] md:text-7xl font-black text-green-400 leading-none">
          جنيه
        </span>
      </div>

      <p className="mt-2 text-[16px] sm:text-[20px] md:text-2xl font-bold text-green-400">
        بدل الـ 1000 جنيه!
      </p>

      <div className="mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-3 sm:gap-4 md:gap-5">
        <div className="rounded-[20px] sm:rounded-[22px] md:rounded-[26px] border border-green-900/40 bg-black/40 p-4 sm:p-5 md:p-8">
          <div className="text-[34px] sm:text-[42px] md:text-5xl font-black text-green-400">
            {totalCodes}
          </div>
          <div className="mt-2 sm:mt-3 md:mt-4 text-[14px] sm:text-[18px] md:text-2xl text-gray-300">
            مجموع الأكواد
          </div>
        </div>

        <div className="rounded-[20px] sm:rounded-[22px] md:rounded-[26px] border border-green-900/40 bg-black/40 p-4 sm:p-5 md:p-8">
          <div className="text-[34px] sm:text-[42px] md:text-5xl font-black text-green-400">
            {wonCodesCount}
          </div>
          <div className="mt-2 sm:mt-3 md:mt-4 text-[14px] sm:text-[18px] md:text-2xl text-gray-300">
            عدد الأكواد الرابحة
          </div>
        </div>
      </div>

      <div className="mx-auto mt-3 sm:mt-4 md:mt-5 w-[76%] sm:w-[70%] max-w-md rounded-[20px] sm:rounded-[22px] md:rounded-[26px] border border-yellow-900/30 bg-black/40 p-4 sm:p-5 md:p-8">
        <div className="text-[32px] sm:text-[40px] md:text-5xl font-black text-yellow-400">
          {formatOdds(totalOdds)}
        </div>
        <div className="mt-2 sm:mt-3 md:mt-4 text-[14px] sm:text-[18px] md:text-2xl text-gray-300">
          مجموع أرباح الأكواد
        </div>
      </div>
    </section>
  );
}

export default function WonCodesPage() {
  const [currentDay, setCurrentDay] = useState('');
  const [wonCodes, setWonCodes] = useState<CodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(15);

  const CACHE_KEY = 'won_codes_cache_v1';
  const CACHE_TTL = 1000 * 60 * 3;

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);

        const cachedRaw = localStorage.getItem(CACHE_KEY);
        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw);
            if (cached?.timestamp && Date.now() - cached.timestamp < CACHE_TTL) {
              if (mounted) {
                setCurrentDay(cached.currentDay || '');
                setWonCodes(Array.isArray(cached.wonCodes) ? cached.wonCodes : []);
                setLoading(false);
              }
            }
          } catch (_) {}
        }

        const { data: appState } = await supabase
          .from('app_state')
          .select('value')
          .eq('key', 'current_day')
          .maybeSingle();

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

        const finalCodes = (data || []) as CodeRow[];
        setCurrentDay(current);
        setWonCodes(finalCodes);

        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            timestamp: Date.now(),
            currentDay: current,
            wonCodes: finalCodes,
          })
        );
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

  const previousWinningDay = useMemo(() => {
    if (!wonCodes.length) return null;
    const uniqueDays = Array.from(new Set(wonCodes.map((c) => c.day_date))).sort((a, b) =>
      b.localeCompare(a)
    );
    if (!currentDay || !/^\d{4}-\d{2}-\d{2}$/.test(currentDay)) return uniqueDays[0] || null;
    return uniqueDays.find((day) => day < currentDay) || null;
  }, [wonCodes, currentDay]);

  const yesterdayCodes = useMemo(() => {
    if (!previousWinningDay) return [];
    return wonCodes.filter((c) => c.day_date === previousWinningDay);
  }, [wonCodes, previousWinningDay]);

  const last30Codes = wonCodes;
  const visibleCodes = useMemo(
    () => last30Codes.slice(0, visibleCount),
    [last30Codes, visibleCount]
  );

  const groupedCodes = useMemo(() => {
    const grouped: Record<string, CodeRow[]> = {};
    for (const code of visibleCodes) {
      if (!grouped[code.day_date]) grouped[code.day_date] = [];
      grouped[code.day_date].push(code);
    }
    return grouped;
  }, [visibleCodes]);

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
    <div className="space-y-8 sm:space-y-10" dir="rtl">
      <section className="relative overflow-hidden rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-[#050a05] via-[#061106] to-[#090f09] px-3 py-7 sm:px-4 sm:py-8 md:p-10 text-center">
        <div className="mb-4 sm:mb-5">
          <div className="inline-flex items-center justify-center rounded-full border border-yellow-500/30 bg-yellow-500/10 px-5 py-2.5 sm:px-6 sm:py-3 text-[16px] sm:text-[20px] md:text-xl font-black text-yellow-300">
            🏆 الأكواد الرابحة
          </div>
        </div>

        <h1 className="text-[34px] sm:text-[48px] md:text-7xl font-black leading-[1.15] text-white">
          سجل{' '}
          <span className="text-green-400 drop-shadow-[0_0_18px_rgba(34,197,94,0.8)]">
            الانتصارات
          </span>{' '}
          🎯
        </h1>

        <div className="mt-4 sm:mt-5 flex items-center justify-center gap-2 sm:gap-3">
          <div className="h-px w-10 sm:w-14 md:w-24 bg-green-700/80" />
          <p className="text-[15px] sm:text-[20px] md:text-2xl font-bold text-green-300">
            ⚽ احصائيات الأكواد الرابحة ⚽
          </p>
          <div className="h-px w-10 sm:w-14 md:w-24 bg-green-700/80" />
        </div>
      </section>

      {yesterdayCodes.length > 0 && previousWinningDay && (
        <StatsCard
          title="📅 إحصائيات أكواد امبارح"
          dayLabel={formatDateArabic(previousWinningDay)}
          bigAmount={yesterdayStats.profit1000}
          totalCodes={yesterdayStats.totalCodes}
          wonCodesCount={yesterdayStats.wonCodesCount}
          totalOdds={yesterdayStats.totalOdds}
        />
      )}

      <StatsCard
        title="📊 إحصائيات آخر 30 يوم"
        bigAmount={last30Stats.profit1000}
        totalCodes={last30Stats.totalCodes}
        wonCodesCount={last30Stats.wonCodesCount}
        totalOdds={last30Stats.totalOdds}
      />

      <section className="rounded-[24px] sm:rounded-[28px] md:rounded-[34px] border border-yellow-500/25 bg-gradient-to-br from-yellow-500/10 to-yellow-700/10 px-3 py-5 sm:px-4 sm:py-6 md:p-10 text-center shadow-[0_0_32px_rgba(234,179,8,0.12)]">
        <h2 className="text-[22px] sm:text-[30px] md:text-5xl font-black leading-[1.8] md:leading-relaxed text-white">
          🔥 انتهز الفرصة الآن واستخدم أكوادنا المضمونة
        </h2>

        <p className="mx-auto mt-5 sm:mt-6 max-w-4xl text-[18px] sm:text-[24px] md:text-4xl leading-[1.9] text-gray-200">
          حتى تكون أرباحك الشهر القادم مضاعفات رأس مالك وانت مطمئن 💪
        </p>

        <div className="mx-auto mt-6 sm:mt-7 max-w-4xl rounded-[22px] sm:rounded-[24px] md:rounded-[28px] border border-green-900/40 bg-black/35 p-4 sm:p-5 md:p-8 text-right">
          <p className="text-[18px] sm:text-[22px] md:text-4xl font-black leading-[1.9] text-white">
            🎲 عشان الأكواد تشتغل معاك لازم 🔤
          </p>
          <p className="mt-3 sm:mt-4 text-[18px] sm:text-[22px] md:text-4xl font-black leading-[2] text-white">
            1️⃣ تستخدمها في تطبيق <span className="text-gray-200">MELBET</span>
          </p>
          <p className="mt-2 sm:mt-3 text-[18px] sm:text-[22px] md:text-4xl font-black leading-[2] text-white">
            2️⃣ وتكون مسجل ببروموكود <span className="text-yellow-400">A1VIP</span>
          </p>

          <div className="my-4 sm:my-5 h-px bg-green-900/40" />

          <p className="text-[18px] sm:text-[22px] md:text-4xl font-black leading-[1.9] text-white">
            🗓 وده شرح:
          </p>
          <p className="mt-3 sm:mt-4 text-[18px] sm:text-[22px] md:text-4xl leading-[2] text-gray-300">
            📌 طريقة تنزيل تطبيق MELBET
          </p>
          <p className="mt-1 sm:mt-2 text-[18px] sm:text-[22px] md:text-4xl leading-[2] text-gray-300">
            📌 والتسجيل ببروموكود <span className="text-yellow-400 font-black">A1VIP</span> ⬇️
          </p>
        </div>

        <a
          href="https://t.me/WIN_20K/253"
          target="_blank"
          rel="noreferrer"
          className="mt-7 sm:mt-8 inline-flex w-full max-w-4xl items-center justify-center rounded-[18px] sm:rounded-[20px] md:rounded-[24px] bg-yellow-500 px-3 py-4 sm:px-4 sm:py-5 text-[18px] sm:text-[22px] md:text-4xl font-black text-black shadow-[0_0_26px_rgba(234,179,8,0.45)] transition-all hover:bg-yellow-400"
        >
          ← اضغط هنا للتحويل للشرح اضغط هنا
        </a>
      </section>

      <section className="space-y-6 sm:space-y-8">
        <div className="mx-auto w-full max-w-5xl rounded-[24px] sm:rounded-[28px] md:rounded-[34px] border border-yellow-400/55 bg-gradient-to-r from-yellow-500/18 via-yellow-400/16 to-yellow-500/18 px-4 py-5 sm:px-5 sm:py-7 text-center shadow-[0_0_34px_rgba(234,179,8,0.22)]">
          <h2 className="text-[24px] sm:text-[34px] md:text-6xl font-black leading-[1.6] text-yellow-300">
            💸 إثبات كل الاكواد الرابحة 💸
          </h2>
          <p className="mt-2 sm:mt-4 text-[20px] sm:text-[28px] md:text-5xl font-black leading-[1.5] text-yellow-200">
            ⚽ لآخر 30 يوم ⚽
          </p>
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
          <>
            {Object.entries(groupedCodes).map(([day, items]) => (
              <div key={day} className="space-y-4 sm:space-y-6">
                <div className="text-center">
                  <h3 className="text-[24px] sm:text-[30px] md:text-5xl font-black text-white">
                    {formatDateArabic(day)}
                  </h3>
                  <p className="mt-1.5 sm:mt-2 text-[16px] sm:text-[20px] md:text-2xl text-gray-400">
                    {items.length} كود رابح
                  </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                  {items.map((code, idx) => (
                    <ProofCard key={code.id} code={code} index={idx + 1} />
                  ))}
                </div>
              </div>
            ))}

            {visibleCount < last30Codes.length && (
              <div className="flex justify-center pt-2 sm:pt-4">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 15)}
                  className="rounded-[18px] sm:rounded-[20px] border border-yellow-400/60 bg-yellow-500/10 px-6 sm:px-8 py-3 sm:py-4 text-[18px] sm:text-[22px] md:text-2xl font-black text-yellow-300 shadow-[0_0_22px_rgba(234,179,8,0.18)]"
                >
                  عرض المزيد
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
