import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import {
  supabase,
  GIFT_URL,
  MELBET_TUTORIAL_URL,
  CODE_USAGE_URL,
  getLocalDateString,
  getStoragePublicUrl,
} from '../lib/supabase';

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

function mapCode(row: any) {
  return {
    id: row.id,
    description: row.description ?? '',
    tipOutcome: row.tip_outcome ?? '',
    tipCode: row.tip_code ?? '',
    odds: String(row.odds ?? '1'),
    status: row.status ?? 'active',
    codeImageUrl: getStoragePublicUrl(row.code_image_url),
    proofImageUrl: getStoragePublicUrl(row.proof_image_url),
    proofType: row.proof_type ?? null,
    createdAt: row.created_at ?? new Date().toISOString(),
    wonAt: row.won_at ?? null,
    dayDate: row.day_date ?? null,
  };
}

function CodeCard({ code }: { code: any }) {
  const [copied, setCopied] = useState(false);
  const oddsNum = parseFloat(code.odds || '1');
  const imageUrl = code.codeImageUrl;

  const copy = () => {
    navigator.clipboard.writeText(code.tipCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative bg-gradient-to-br from-[#0f1a0f] to-[#0a120a] border border-green-900/40 rounded-2xl overflow-hidden hover:border-green-500/60 transition-all hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]">
      <div className="h-1 bg-gradient-to-r from-green-600 via-green-400 to-green-600" />

      {imageUrl && <img src={imageUrl} alt="code" className="w-full h-auto block" loading="lazy" decoding="async" />}

      <div className="p-3.5 sm:p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-gray-500 text-xs">
            {new Date(code.createdAt).toLocaleDateString(AR_LATN_LOCALE, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <div className="shrink-0 bg-green-500/20 border border-green-500/40 text-green-400 font-black text-xl px-3 py-1 rounded-lg">
            {code.tipOutcome}
          </div>
        </div>

        <div className="bg-black/40 border border-green-900/30 rounded-2xl p-4 space-y-3 text-[13px] sm:text-sm text-right" dir="rtl">
          <p className="text-white font-bold leading-relaxed">
            ✅ الكود هايشتغل علي MELBET مع الناس الي مسجلة حسابها ب بروموكود A1VIP فقط 🏆
          </p>
          <p className="text-gray-400 font-bold">⚽️ نراكم بعد الفوز ↗️</p>

          <div className="space-y-2 pt-1 border-t border-green-900/30">
            <p className="text-white font-bold leading-relaxed">
              🏆 ده شرح طريقة تنزيل تطبيق MELBET والتسجيل ببروموكود A1VIP عشان الاكواد تشتغل معاك⬇️
            </p>
            <a
              href={MELBET_TUTORIAL_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/40 text-yellow-400 font-black py-2.5 rounded-xl transition-all text-[13px] sm:text-sm"
            >
              اضغط هنا للوصول للشرح اضغط هنا ←
            </a>
          </div>

          <div className="space-y-2">
            <p className="text-white font-bold leading-relaxed">🟢 شرح طريقة إستخدام الكود ⬇️</p>
            <a
              href={CODE_USAGE_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-green-500/15 hover:bg-green-500/25 border border-green-500/40 text-green-400 font-black py-2.5 rounded-xl transition-all text-[13px] sm:text-sm"
            >
              اضغط هنا للوصول للشرح اضغط هنا ←
            </a>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 bg-black/50 border border-green-900/60 rounded-xl px-4 py-3 font-black text-[18px] sm:text-[20px] tracking-[0.18em] text-green-400 text-center font-mono">
            {code.tipCode}
          </div>
          <div className="shrink-0 text-center">
            <div className="text-xs text-gray-500 mb-1">نسبة ربح الكود</div>
            <div className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 font-black text-[15px] sm:text-[16px] px-2.5 py-1 rounded-lg">
              x{oddsNum.toFixed(2)}
            </div>
          </div>
        </div>

        <button
          onClick={copy}
          className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-black font-black py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] text-[13px] sm:text-sm"
        >
          {copied ? '✅ تم النسخ!' : '📋 انسخ الكود'}
        </button>

        <a
          href={GIFT_URL}
          target="_blank"
          rel="noreferrer"
          className="block w-full text-center bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 font-bold py-2 rounded-xl transition-all text-[13px] sm:text-sm"
        >
          🎰 العب الآن على Melbet
        </a>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [codes, setCodes] = useState<any[]>([]);
  const [allWonCodes, setAllWonCodes] = useState<any[]>([]);
  const [activeDayStr, setActiveDayStr] = useState(getLocalDateString());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    ensureArabicFont();
    let mounted = true;

    async function getCurrentDay() {
      const today = getLocalDateString();

      const { data, error } = await supabase
        .from('app_state')
        .select('value')
        .eq('key', 'current_day')
        .maybeSingle();

      if (error) {
        console.error('APP STATE READ ERROR:', error);
        return today;
      }

      if (data?.value && /^\d{4}-\d{2}-\d{2}$/.test(data.value)) {
        return data.value as string;
      }

      return today;
    }

    async function loadData() {
      try {
        setIsLoading(true);

        const currentDay = await getCurrentDay();

        const [{ data: activeRows, error: activeError }, { data: wonRows, error: wonError }] = await Promise.all([
          supabase
            .from('codes')
            .select('*')
            .eq('day_date', currentDay)
            .eq('status', 'active')
            .order('created_at', { ascending: true }),
          supabase
            .from('codes')
            .select('*')
            .eq('day_date', currentDay)
            .in('status', ['won', 'refund'])
            .order('won_at', { ascending: false }),
        ]);

        if (activeError) throw activeError;
        if (wonError) throw wonError;

        if (!mounted) return;

        setActiveDayStr(currentDay);
        setCodes((activeRows || []).map(mapCode));
        setAllWonCodes((wonRows || []).map(mapCode));
      } catch (err) {
        console.error('HOME LOAD ERROR:', err);
        if (!mounted) return;
        setCodes([]);
        setAllWonCodes([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const todayWonCodes = allWonCodes;

  return (
    <div className="space-y-8 sm:space-y-10" dir="rtl" style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}>
      <section className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 via-[#0a0f0a] to-yellow-900/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(34,197,94,0.2),transparent_60%)]" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_40px,rgba(34,197,94,0.02)_40px,rgba(34,197,94,0.02)_41px)]" />

        <div className="relative px-4 py-10 sm:px-5 sm:py-12 md:px-8 md:py-14 text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 text-sm text-green-300 font-bold">
            🔥 أكواد اليوم
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight">أكواد اليوم الحصرية</h1>
            <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              كل الأكواد المعروضة هنا تخص يوم{' '}
              <span className="text-green-400 font-black">{activeDayStr}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/won" className="bg-yellow-500 hover:bg-yellow-400 text-black font-black px-5 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.25)]">
              عرض الأكواد الرابحة
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">الأكواد المتاحة الآن</h2>
            <p className="text-gray-400 text-sm mt-1">يتم تحديثها حسب اليوم النشط في لوحة الإدارة</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2 text-green-300 font-black text-sm">
            {codes.length} كود
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-green-900/30 bg-black/20 p-8 text-center text-gray-400">جاري تحميل الأكواد...</div>
        ) : codes.length === 0 ? (
          <div className="rounded-3xl border border-green-900/30 bg-black/20 p-8 text-center text-gray-400">لا توجد أكواد متاحة لهذا اليوم حاليًا</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {codes.map((code) => (
              <CodeCard key={code.id} code={code} />
            ))}
          </div>
        )}
      </section>

      {todayWonCodes.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">أكواد تم حسمها اليوم</h2>
              <p className="text-gray-400 text-sm mt-1">الرابح والمسترد من نفس اليوم الحالي</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-2 text-yellow-300 font-black text-sm">
              {todayWonCodes.length} كود
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {todayWonCodes.map((code) => (
              <CodeCard key={`won-${code.id}`} code={code} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
