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
  tip_code: string | null;
  odds: number | null;
  status: 'won' | 'refund';
  code_image_url: string | null;
  proof_image_url: string | null;
  day_date: string;
};

function ProofCard({ code, index }: { code: CodeRow; index: number }) {
  return (
    <div className="rounded-[22px] border border-green-900/50 bg-black/40 p-3">

      <div className="flex justify-between mb-2">
        <div className="text-green-400 font-bold">{index}</div>
        <div className="text-xs bg-green-500 text-black px-2 py-1 rounded">
          {code.status === 'refund' ? 'استرداد' : 'رابح'}
        </div>
      </div>

      <div className="text-center text-green-400 font-bold text-lg mb-2">
        {code.tip_code}
      </div>

      <div className="flex justify-between text-sm mb-2">
        <span className="text-yellow-400">
          x{formatOdds(Number(code.odds || 0))}
        </span>
        <span className="text-gray-400">نسبة الربح</span>
      </div>

      {getImageUrl(code.code_image_url) && (
        <>
          <div className="text-xs text-gray-300 mb-1">📸 صورة الرهان</div>
          <img
            loading="lazy"
            src={getImageUrl(code.code_image_url)!}
            className="w-full rounded mb-2"
          />
        </>
      )}

      {getImageUrl(code.proof_image_url) && (
        <>
          <div className="text-xs text-gray-300 mb-1">📸 صورة إثبات الربح</div>
          <img
            loading="lazy"
            src={getImageUrl(code.proof_image_url)!}
            className="w-full rounded"
          />
        </>
      )}

    </div>
  );
}

export default function WonCodesPage() {
  const [wonCodes, setWonCodes] = useState<CodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const last30Start = date30DaysAgo();

      const { data } = await supabase
        .from('codes')
        .select('*')
        .in('status', ['won', 'refund'])
        .gte('day_date', last30Start)
        .order('day_date', { ascending: false });

      setWonCodes(data || []);
      setLoading(false);
    }

    loadData();
  }, []);

  const visibleCodes = useMemo(
    () => wonCodes.slice(0, visibleCount),
    [wonCodes, visibleCount]
  );

  const groupedCodes = useMemo(() => {
    const grouped: Record<string, CodeRow[]> = {};
    for (const code of visibleCodes) {
      if (!grouped[code.day_date]) grouped[code.day_date] = [];
      grouped[code.day_date].push(code);
    }
    return grouped;
  }, [visibleCodes]);

  return (
    <div className="space-y-6" dir="rtl">

      {loading ? (
        <div className="text-center text-gray-400">جاري التحميل...</div>
      ) : (
        <>
          {Object.entries(groupedCodes).map(([day, items]) => (
            <div key={day}>

              <h3 className="text-center text-xl font-bold text-white mb-2">
                {formatDateArabic(day)}
              </h3>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((code, idx) => (
                  <ProofCard key={code.id} code={code} index={idx + 1} />
                ))}
              </div>

            </div>
          ))}

          {visibleCount < wonCodes.length && (
            <div className="text-center">
              <button
                onClick={() => setVisibleCount(prev => prev + 15)}
                className="bg-yellow-500 px-6 py-2 rounded text-black font-bold"
              >
                عرض المزيد
              </button>
            </div>
          )}
        </>
      )}

    </div>
  );
}
