import React, { useEffect, useMemo, useState } from 'react';
import { supabase, getLocalDateString, getStoragePublicUrl } from '../lib/supabase';

const AR_LATN_LOCALE = 'ar-EG-u-nu-latn';

function ensureArabicFont() {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById('arabic-font-cairo');
  if (existing) return;
  const preconnect1 = document.createElement('link');
  preconnect1.rel = 'preconnect';
  preconnect1.href = 'https://fonts.googleapis.com';
  document.head.appendChild(preconnect1);

  const preconnect2 = document.createElement('link');
  preconnect2.rel = 'preconnect';
  preconnect2.href = 'https://fonts.gstatic.com';
  preconnect2.crossOrigin = 'anonymous';
  document.head.appendChild(preconnect2);

  const link = document.createElement('link');
  link.id = 'arabic-font-cairo';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap';
  document.head.appendChild(link);
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
  return getLocalDateString(d);
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
  const betImageUrl = getStoragePublicUrl(code.code_image_url);
  const proofImageUrl = getStoragePublicUrl(code.proof_image_url);

  return (
    <div className="rounded-[18px] sm:rounded-[20px] md:rounded-[24px] border border-green-900/50 bg-[radial-gradient(circle_at_top,#0d2210,#071107)] p-2.5 sm:p-3 md:p-4 shadow-[0_0_24px_rgba(0,255,120,0.08)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="inline-flex h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-xl sm:rounded-2xl border-2 border-green-500 text-base sm:text-lg md:text-xl font-black text-green-400">
          {index}
        </div>
        <div className="rounded-full bg-green-500 px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-black text-black">
          {code.status === 'refund' ? '📥 استرداد' : '✅ رابح'}
        </div>
      </div>

      <div className="mb-3 rounded-xl sm:rounded-2xl border border-green-900/50 bg-black/40 px-2 py-3 text-center">
        <div className="text-[15px] sm:text-[18px] md:text-[22px] font-black tracking-[0.12em] sm:tracking-[0.14em] text-green-400 leading-none">
          {code.tip_code}
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-[16px] sm:text-[20px] md:text-[24px] font-black text-yellow-400">x{formatOdds(Number(code.odds || 0))}</div>
        <div className="text-[11px] sm:text-[12px] md:text-sm text-gray-300">نسبة ربح الكود</div>
      </div>

      {betImageUrl && (
        <div className="mb-3 overflow-hidden rounded-[16px] sm:rounded-[18px] md:rounded-[22px] border border-green-900/40 bg-black/20 p-2.5 sm:p-3">
          <div className="mb-2 text-[11px] sm:text-[12px] md:text-sm font-black text-gray-300">📸 صورة الرهان</div>
          <img src={betImageUrl} alt="صورة الرهان" className="mx-auto block w-full rounded-xl sm:rounded-2xl object-contain" loading="lazy" decoding="async" />
        </div>
      )}

      {proofImageUrl && (
        <div className="overflow-hidden rounded-[16px] sm:rounded-[18px] md:rounded-[22px] border border-green-900/40 bg-black/20 p-2.5 sm:p-3">
          <div className="mb-2 text-[11px] sm:text-[12px] md:text-sm font-black text-gray-300">📸 صورة إثبات الربح</div>
          <img
            src={proofImageUrl}
            alt={code.status === 'refund' ? 'إثبات الاسترداد' : 'إثبات الربح'}
            className="mx-auto block w-full rounded-xl sm:rounded-2xl object-contain"
            loading="lazy"
            decoding="async"
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
    <section className="rounded-[20px] sm:rounded-[24px] md:rounded-[28px] border border-green-900/50 bg-[radial-gradient(circle_at_top,#0d2210,#071107)] px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-7 text-center shadow-[0_0_32px_rgba(0,255,120,0.08)]">
      <div className="mb-2 text-[16px] sm:text-[20px] md:text-[24px] font-black text-green-400">{title}</div>
      {dayLabel && <div className="mb-3 text-[12px] sm:text-[14px] md:text-[18px] font-bold text-gray-400">{dayLabel}</div>}

      <p className="mx-auto max-w-3xl text-[16px] sm:text-[20px] md:text-[28px] font-black leading-[1.7] md:leading-relaxed text-white">
        لو كنت رميت <span className="text-yellow-400">1000 جنيه</span> بس على أكوادنا المضمونة كانت هاتكون أرباحك دلوقتي
      </p>

      <div className="mt-5 flex items-end justify-center gap-2 sm:gap-3 md:gap-4">
        <span className="text-[26px] sm:text-[34px] md:text-6xl font-black text-green-400 leading-none">{formatMoney(bigAmount)}</span>
        <span className="text-[20px] sm:text-[24px] md:text-4xl font-black text-green-400 leading-none">جنيه</span>
      </div>

      <p className="mt-2 text-[13px] sm:text-[15px] md:text-[18px] font-bold text-green-400">بدل الـ 1000 جنيه!</p>

      <div className="mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-2.5 sm:gap-3 md:gap-4">
        <div className="rounded-[20px] sm:rounded-[22px] md:rounded-[26px] border border-green-900/40 bg-black/40 p-3 sm:p-4 md:p-5">
          <div className="text-[24px] sm:text-[30px] md:text-4xl font-black text-green-400">{totalCodes}</div>
          <div className="mt-2 sm:mt-3 md:mt-4 text-[12px] sm:text-[14px] md:text-[18px] text-gray-300">مجموع الأكواد</div>
        </div>

        <div className="rounded-[20px] sm:rounded-[22px] md:rounded-[26px] border border-green-900/40 bg-black/40 p-3 sm:p-4 md:p-5">
          <div className="text-[24px] sm:text-[30px] md:text-4xl font-black text-green-400">{wonCodesCount}</div>
          <div className="mt-2 sm:mt-3 md:mt-4 text-[12px] sm:text-[14px] md:text-[18px] text-gray-300">عدد الأكواد الرابحة</div>
        </div>
      </div>

      <div className="mx-auto mt-3 sm:mt-4 md:mt-5 w-[70%] sm:w-[60%] max-w-sm rounded-[20px] sm:rounded-[22px] md:rounded-[26px] border border-yellow-900/30 bg-black/40 p-3 sm:p-4 md:p-5">
        <div className="text-[22px] sm:text-[28px] md:text-4xl font-black text-yellow-400">{formatOdds(totalOdds)}</div>
        <div className="mt-2 sm:mt-3 md:mt-4 text-[12px] sm:text-[14px] md:text-[18px] text-gray-300">مجموع أرباح الأكواد</div>
      </div>
    </section>
  );
}

export default function WonCodesPage() {
  const [currentDay, setCurrentDay] = useState('');
  const [wonCodes, setWonCodes] = useState<CodeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ensureArabicFont();
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);

        const today = getLocalDateString();
        const { data: appState, error: appStateError } = await supabase
          .from('app_state')
          .select('value')
          .eq('key', 'current_day')
          .maybeSingle();

        if (appStateError) {
          console.error('APP STATE READ ERROR:', appStateError);
        }

        const current =
          appState?.value && /^\d{4}-\d{2}-\d{2}$/.test(appState.value)
            ? appState.value
            : today;
        const last30Start = date30DaysAgo();

        const { data, error } = await supabase
          .from('codes')
          .select('*')
          .in('status', ['won', 'refund'])
          .gte('day_date', last30Start)
          .lte('day_date', current)
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

  const previousWinningDay = useMemo(() => {
    if (!wonCodes.length) return null;
    const uniqueDays = Array.from(new Set(wonCodes.map((c) => c.day_date))).sort((a, b) => b.localeCompare(a));
    if (!currentDay || !/^\d{4}-\d{2}-\d{2}$/.test(currentDay)) return uniqueDays[0] || null;
    return uniqueDays.find((day) => day < currentDay) || null;
  }, [wonCodes, currentDay]);

  const yesterdayCodes = useMemo(() => {
    if (!previousWinningDay) return [];
    return wonCodes.filter((c) => c.day_date === previousWinningDay);
  }, [wonCodes, previousWinningDay]);

  const last30Stats = useMemo(() => {
    const totalCodes = wonCodes.length;
    const wonCodesCount = wonCodes.length;
    const totalOdds = wonCodes.reduce((sum, code) => sum + Number(code.odds || 0), 0);
    return {
      totalCodes,
      wonCodesCount,
      totalOdds,
      bigAmount: Math.round(totalOdds * 1000),
    };
  }, [wonCodes]);

  const previousDayStats = useMemo(() => {
    const totalCodes = yesterdayCodes.length;
    const wonCodesCount = yesterdayCodes.length;
    const totalOdds = yesterdayCodes.reduce((sum, code) => sum + Number(code.odds || 0), 0);
    return {
      totalCodes,
      wonCodesCount,
      totalOdds,
      bigAmount: Math.round(totalOdds * 1000),
    };
  }, [yesterdayCodes]);

  return (
    <div className="space-y-5 sm:space-y-6 md:space-y-8" dir="rtl" style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}>
      <StatsCard
        title="إحصائيات آخر 30 يوم"
        bigAmount={last30Stats.bigAmount}
        totalCodes={last30Stats.totalCodes}
        wonCodesCount={last30Stats.wonCodesCount}
        totalOdds={last30Stats.totalOdds}
      />

      {previousWinningDay && (
        <StatsCard
          title="إحصائيات آخر يوم مغلق"
          dayLabel={formatDateArabic(previousWinningDay)}
          bigAmount={previousDayStats.bigAmount}
          totalCodes={previousDayStats.totalCodes}
          wonCodesCount={previousDayStats.wonCodesCount}
          totalOdds={previousDayStats.totalOdds}
        />
      )}

      <section className="rounded-[20px] sm:rounded-[24px] md:rounded-[28px] border border-green-900/50 bg-[radial-gradient(circle_at_top,#0d2210,#071107)] px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-7 shadow-[0_0_32px_rgba(0,255,120,0.08)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[18px] sm:text-[22px] md:text-[26px] font-black text-white">آخر الأكواد الرابحة</h2>
            <p className="mt-1 text-[11px] sm:text-[12px] md:text-sm text-gray-400">حتى اليوم الحالي فقط وبدون أيام مستقبلية</p>
          </div>
          <div className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[11px] sm:text-[12px] md:text-sm font-black text-green-400">
            {loading ? '...' : `${wonCodes.length} كود`}
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-green-900/30 bg-black/20 p-8 text-center text-gray-400">جاري تحميل الأكواد...</div>
        ) : wonCodes.length === 0 ? (
          <div className="rounded-2xl border border-green-900/30 bg-black/20 p-8 text-center text-gray-400">لا توجد أكواد رابحة خلال آخر 30 يوم حتى اليوم الحالي</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
            {wonCodes.map((code, index) => (
              <ProofCard key={code.id} code={code} index={index + 1} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
