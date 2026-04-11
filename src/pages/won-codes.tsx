import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

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
    <div className="rounded-[18px] sm:rounded-[20px] md:rounded-[24px] border border-green-900/50 bg-[radial-gradient(circle_at_top,#0d2210,#071107)] p-2.5 sm:p-3 md:p-4 shadow-[0_0_24px_rgba(0,255,120,0.08)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="inline-flex h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-xl sm:rounded-2xl border-2 border-green-500 text-base sm:text-lg md:text-xl font-black text-green-400">
          {index}
        </div>
        <div className="rounded-full bg-green-500 px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-black text-black">
          {code.status === 'refund' ? 'ðŸ“¥ Ø§Ø³ØªØ±Ø¯Ø§Ø¯' : 'âœ… Ø±Ø§Ø¨Ø­'}
        </div>
      </div>

      <div className="mb-3 rounded-xl sm:rounded-2xl border border-green-900/50 bg-black/40 px-2 py-3 text-center">
        <div className="text-[15px] sm:text-[18px] md:text-[22px] font-black tracking-[0.12em] sm:tracking-[0.14em] text-green-400 leading-none">
          {code.tip_code}
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-[16px] sm:text-[20px] md:text-[24px] font-black text-yellow-400">x{formatOdds(Number(code.odds || 0))}</div>
        <div className="text-[11px] sm:text-[12px] md:text-sm text-gray-300">Ù†Ø³Ø¨Ø© Ø±Ø¨Ø­ Ø§Ù„ÙƒÙˆØ¯</div>
      </div>

      {getImageUrl(code.code_image_url) && (
        <div className="mb-3 overflow-hidden rounded-[16px] sm:rounded-[18px] md:rounded-[22px] border border-green-900/40 bg-black/20 p-2.5 sm:p-3">
          <div className="mb-2 text-[11px] sm:text-[12px] md:text-sm font-black text-gray-300">ðŸ“¸ ØµÙˆØ±Ø© Ø§Ù„Ø±Ù‡Ø§Ù†</div>
          <img
            src={getImageUrl(code.code_image_url)!}
            alt="ØµÙˆØ±Ø© Ø§Ù„Ø±Ù‡Ø§Ù†"
            className="mx-auto block w-full rounded-xl sm:rounded-2xl object-contain"
          />
        </div>
      )}

      {getImageUrl(code.proof_image_url) && (
        <div className="overflow-hidden rounded-[16px] sm:rounded-[18px] md:rounded-[22px] border border-green-900/40 bg-black/20 p-2.5 sm:p-3">
          <div className="mb-2 text-[11px] sm:text-[12px] md:text-sm font-black text-gray-300">ðŸ“¸ ØµÙˆØ±Ø© Ø¥Ø«Ø¨Ø§Øª Ø§Ù„Ø±Ø¨Ø­</div>
          <img
            src={getImageUrl(code.proof_image_url)!}
            alt={code.status === 'refund' ? 'Ø¥Ø«Ø¨Ø§Øª Ø§Ù„Ø§Ø³ØªØ±Ø¯Ø§Ø¯' : 'Ø¥Ø«Ø¨Ø§Øª Ø§Ù„Ø±Ø¨Ø­'}
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
    <section className="rounded-[20px] sm:rounded-[24px] md:rounded-[28px] border border-green-900/50 bg-[radial-gradient(circle_at_top,#0d2210,#071107)] px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-7 text-center shadow-[0_0_32px_rgba(0,255,120,0.08)]">
      <div className="mb-2 text-[16px] sm:text-[20px] md:text-[24px] font-black text-green-400">{title}</div>
      {dayLabel && <div className="mb-3 text-[12px] sm:text-[14px] md:text-[18px] font-bold text-gray-400">{dayLabel}</div>}

      <p className="mx-auto max-w-3xl text-[16px] sm:text-[20px] md:text-[28px] font-black leading-[1.7] md:leading-relaxed text-white">
        Ù„Ùˆ ÙƒÙ†Øª Ø±Ù…ÙŠØª <span className="text-yellow-400">1000 Ø¬Ù†ÙŠÙ‡</span> Ø¨Ø³ Ø¹Ù„Ù‰ Ø£ÙƒÙˆØ§Ø¯Ù†Ø§ Ø§Ù„Ù…Ø¶Ù…ÙˆÙ†Ø© ÙƒØ§Ù†Øª Ù‡Ø§ØªÙƒÙˆÙ† Ø£Ø±Ø¨Ø§Ø­Ùƒ Ø¯Ù„ÙˆÙ‚ØªÙŠ
      </p>

      <div className="mt-5 flex items-end justify-center gap-2 sm:gap-3 md:gap-4">
        <span className="text-[26px] sm:text-[34px] md:text-6xl font-black text-green-400 leading-none">{formatMoney(bigAmount)}</span>
        <span className="text-[20px] sm:text-[24px] md:text-4xl font-black text-green-400 leading-none">Ø¬Ù†ÙŠÙ‡</span>
      </div>

      <p className="mt-2 text-[13px] sm:text-[15px] md:text-[18px] font-bold text-green-400">Ø¨Ø¯Ù„ Ø§Ù„Ù€ 1000 Ø¬Ù†ÙŠÙ‡!</p>

      <div className="mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-2.5 sm:gap-3 md:gap-4">
        <div className="rounded-[20px] sm:rounded-[22px] md:rounded-[26px] border border-green-900/40 bg-black/40 p-3 sm:p-4 md:p-5">
          <div className="text-[24px] sm:text-[30px] md:text-4xl font-black text-green-400">{totalCodes}</div>
          <div className="mt-2 sm:mt-3 md:mt-4 text-[12px] sm:text-[14px] md:text-[18px] text-gray-300">Ù…Ø¬Ù…ÙˆØ¹ Ø§Ù„Ø£ÙƒÙˆØ§Ø¯</div>
        </div>

        <div className="rounded-[20px] sm:rounded-[22px] md:rounded-[26px] border border-green-900/40 bg-black/40 p-3 sm:p-4 md:p-5">
          <div className="text-[24px] sm:text-[30px] md:text-4xl font-black text-green-400">{wonCodesCount}</div>
          <div className="mt-2 sm:mt-3 md:mt-4 text-[12px] sm:text-[14px] md:text-[18px] text-gray-300">Ø¹Ø¯Ø¯ Ø§Ù„Ø£ÙƒÙˆØ§Ø¯ Ø§Ù„Ø±Ø§Ø¨Ø­Ø©</div>
        </div>
      </div>

      <div className="mx-auto mt-3 sm:mt-4 md:mt-5 w-[70%] sm:w-[60%] max-w-sm rounded-[20px] sm:rounded-[22px] md:rounded-[26px] border border-yellow-900/30 bg-black/40 p-3 sm:p-4 md:p-5">
        <div className="text-[22px] sm:text-[28px] md:text-4xl font-black text-yellow-400">{formatOdds(totalOdds)}</div>
        <div className="mt-2 sm:mt-3 md:mt-4 text-[12px] sm:text-[14px] md:text-[18px] text-gray-300">Ù…Ø¬Ù…ÙˆØ¹ Ø£Ø±Ø¨Ø§Ø­ Ø§Ù„Ø£ÙƒÙˆØ§Ø¯</div>
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

        const today = new Date().toISOString().split('T')[0];
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
    <div className="space-y-6 sm:space-y-8" dir="rtl" style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}>
      <section className="relative overflow-hidden rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-[#050a05] via-[#061106] to-[#090f09] px-3 py-7 sm:px-4 sm:py-8 md:p-10 text-center">
        <div className="mb-4 sm:mb-5">
          <div className="inline-flex items-center justify-center rounded-full border border-yellow-500/30 bg-yellow-500/10 px-5 py-2.5 sm:px-6 sm:py-3 text-[16px] sm:text-[20px] md:text-xl font-black text-yellow-300">
            ðŸ† Ø§Ù„Ø£ÙƒÙˆØ§Ø¯ Ø§Ù„Ø±Ø§Ø¨Ø­Ø©
          </div>
        </div>

        <h1 className="text-[26px] sm:text-[34px] md:text-5xl font-black leading-[1.15] text-white">
          Ø³Ø¬Ù„ <span className="text-green-400 drop-shadow-[0_0_18px_rgba(34,197,94,0.8)]">Ø§Ù„Ø§Ù†ØªØµØ§Ø±Ø§Øª</span> ðŸŽ¯
        </h1>

        <div className="mt-4 sm:mt-5 flex items-center justify-center gap-2 sm:gap-3">
          <div className="h-px w-10 sm:w-14 md:w-24 bg-green-700/80" />
          <p className="text-[13px] sm:text-[16px] md:text-[18px] font-bold text-green-300">âš½ Ø§Ø­ØµØ§Ø¦ÙŠØ§Øª Ø§Ù„Ø£ÙƒÙˆØ§Ø¯ Ø§Ù„Ø±Ø§Ø¨Ø­Ø© âš½</p>
          <div className="h-px w-10 sm:w-14 md:w-24 bg-green-700/80" />
        </div>
      </section>

      {yesterdayCodes.length > 0 && previousWinningDay && (
        <StatsCard
          title="ðŸ“… Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª Ø£ÙƒÙˆØ§Ø¯ Ø§Ù…Ø¨Ø§Ø±Ø­"
          dayLabel={formatDateArabic(previousWinningDay)}
          bigAmount={yesterdayStats.profit1000}
          totalCodes={yesterdayStats.totalCodes}
          wonCodesCount={yesterdayStats.wonCodesCount}
          totalOdds={yesterdayStats.totalOdds}
        />
      )}

      <StatsCard
        title="ðŸ“Š Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª Ø¢Ø®Ø± 30 ÙŠÙˆÙ…"
        bigAmount={last30Stats.profit1000}
        totalCodes={last30Stats.totalCodes}
        wonCodesCount={last30Stats.wonCodesCount}
        totalOdds={last30Stats.totalOdds}
      />

      <section className="rounded-[20px] sm:rounded-[24px] md:rounded-[28px] border border-yellow-500/25 bg-gradient-to-br from-yellow-500/10 to-yellow-700/10 px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-7 text-center shadow-[0_0_32px_rgba(234,179,8,0.12)]">
        <h2 className="text-[18px] sm:text-[22px] md:text-[28px] font-black leading-[1.8] md:leading-relaxed text-white">
          ðŸ”¥ Ø§Ù†ØªÙ‡Ø² Ø§Ù„ÙØ±ØµØ© Ø§Ù„Ø¢Ù† ÙˆØ§Ø³ØªØ®Ø¯Ù… Ø£ÙƒÙˆØ§Ø¯Ù†Ø§ Ø§Ù„Ù…Ø¶Ù…ÙˆÙ†Ø©
        </h2>

        <p className="mx-auto mt-5 sm:mt-6 max-w-3xl text-[15px] sm:text-[18px] md:text-[22px] leading-[1.9] text-gray-200">
          Ø­ØªÙ‰ ØªÙƒÙˆÙ† Ø£Ø±Ø¨Ø§Ø­Ùƒ Ø§Ù„Ø´Ù‡Ø± Ø§Ù„Ù‚Ø§Ø¯Ù… Ù…Ø¶Ø§Ø¹ÙØ§Øª Ø±Ø£Ø³ Ù…Ø§Ù„Ùƒ ÙˆØ§Ù†Øª Ù…Ø·Ù…Ø¦Ù† ðŸ’ª
        </p>

        <div className="mx-auto mt-6 sm:mt-7 max-w-3xl rounded-[18px] sm:rounded-[20px] md:rounded-[24px] border border-green-900/40 bg-black/35 p-3 sm:p-4 md:p-5 text-right">
          <p className="text-[15px] sm:text-[17px] md:text-[20px] font-black leading-[1.9] text-white">ðŸŽ² Ø¹Ø´Ø§Ù† Ø§Ù„Ø£ÙƒÙˆØ§Ø¯ ØªØ´ØªØºÙ„ Ù…Ø¹Ø§Ùƒ Ù„Ø§Ø²Ù… ðŸ”¤</p>
          <p className="mt-3 sm:mt-4 text-[15px] sm:text-[17px] md:text-[20px] font-black leading-[2] text-white">
            1ï¸âƒ£ ØªØ³ØªØ®Ø¯Ù…Ù‡Ø§ ÙÙŠ ØªØ·Ø¨ÙŠÙ‚ <span className="text-gray-200">MELBET</span>
          </p>
          <p className="mt-2 sm:mt-3 text-[15px] sm:text-[17px] md:text-[20px] font-black leading-[2] text-white">
            2ï¸âƒ£ ÙˆØªÙƒÙˆÙ† Ù…Ø³Ø¬Ù„ Ø¨Ø¨Ø±ÙˆÙ…ÙˆÙƒÙˆØ¯ <span className="text-yellow-400">A1VIP</span>
          </p>

          <div className="my-4 sm:my-5 h-px bg-green-900/40" />

          <p className="text-[15px] sm:text-[17px] md:text-[20px] font-black leading-[1.9] text-white">ðŸ—“ ÙˆØ¯Ù‡ Ø´Ø±Ø­:</p>
          <p className="mt-3 sm:mt-4 text-[15px] sm:text-[17px] md:text-[20px] leading-[2] text-gray-300">ðŸ“Œ Ø·Ø±ÙŠÙ‚Ø© ØªÙ†Ø²ÙŠÙ„ ØªØ·Ø¨ÙŠÙ‚ MELBET</p>
          <p className="mt-1 sm:mt-2 text-[15px] sm:text-[17px] md:text-[20px] leading-[2] text-gray-300">
            ðŸ“Œ ÙˆØ§Ù„ØªØ³Ø¬ÙŠÙ„ Ø¨Ø¨Ø±ÙˆÙ…ÙˆÙƒÙˆØ¯ <span className="text-yellow-400 font-black">A1VIP</span> â¬‡ï¸
          </p>
        </div>

        <a
          href="https://t.me/WIN_20K/253"
          target="_blank"
          rel="noreferrer"
          className="mt-7 sm:mt-8 inline-flex w-full max-w-3xl items-center justify-center rounded-[18px] sm:rounded-[20px] md:rounded-[24px] bg-yellow-500 px-3 py-4 sm:px-4 sm:py-5 text-[15px] sm:text-[17px] md:text-[20px] font-black text-black shadow-[0_0_26px_rgba(234,179,8,0.45)] transition-all hover:bg-yellow-400"
        >
          â† Ø§Ø¶ØºØ· Ù‡Ù†Ø§ Ù„Ù„ØªØ­ÙˆÙŠÙ„ Ù„Ù„Ø´Ø±Ø­ Ø§Ø¶ØºØ· Ù‡Ù†Ø§
        </a>
      </section>

      <section className="space-y-6 sm:space-y-8">
        <div className="mx-auto w-full max-w-5xl rounded-[20px] sm:rounded-[24px] md:rounded-[28px] border border-yellow-400/55 bg-gradient-to-r from-yellow-500/18 via-yellow-400/16 to-yellow-500/18 px-4 py-5 sm:px-5 sm:py-7 text-center shadow-[0_0_34px_rgba(234,179,8,0.22)]">
          <h2 className="text-[18px] sm:text-[22px] md:text-[28px] font-black leading-[1.6] text-yellow-300">
            ðŸ’¸ Ø¥Ø«Ø¨Ø§Øª ÙƒÙ„ Ø§Ù„Ø§ÙƒÙˆØ§Ø¯ Ø§Ù„Ø±Ø§Ø¨Ø­Ø© ðŸ’¸
          </h2>
          <p className="mt-2 sm:mt-4 text-[16px] sm:text-[20px] md:text-[28px] font-black leading-[1.5] text-yellow-200">âš½ Ù„Ø¢Ø®Ø± 30 ÙŠÙˆÙ… âš½</p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-green-900/40 bg-black/30 p-10 text-center text-2xl text-gray-400">
            Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„...
          </div>
        ) : last30Codes.length === 0 ? (
          <div className="rounded-3xl border border-green-900/40 bg-black/30 p-10 text-center text-2xl text-gray-400">
            Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¥Ø«Ø¨Ø§ØªØ§Øª Ø­ØªÙ‰ Ø§Ù„Ø¢Ù†
          </div>
        ) : (
          Object.entries(groupedCodes).map(([day, items]) => (
            <div key={day} className="space-y-4 sm:space-y-6">
              <div className="text-center">
                <h3 className="text-[18px] sm:text-[22px] md:text-[28px] font-black text-white">{formatDateArabic(day)}</h3>
                <p className="mt-1.5 sm:mt-2 text-[13px] sm:text-[15px] md:text-[18px] text-gray-400">{items.length} ÙƒÙˆØ¯ Ø±Ø§Ø¨Ø­</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4">
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
