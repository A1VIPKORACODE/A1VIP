import React from 'react';
import { useGet30DayStats, useGetTodayStats, useGetYesterdayStats, useListWonCodes } from '../lib/api';
import { MELBET_TUTORIAL_URL } from '../lib/supabase';

function groupByDate(codes: any[]) {
  const groups: Record<string, any[]> = {};
  codes.forEach((c) => { const d = c.dayDate; if (!groups[d]) groups[d] = []; groups[d].push(c); });
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

function StatsBox({ label, wonCount, totalCount, sumOdds }: { label: string; wonCount: number; totalCount: number; sumOdds: number }) {
  const profit = Math.round(1000 * sumOdds);
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-900/30 via-[#0a120a] to-yellow-900/20 border border-green-500/30 p-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(34,197,94,0.12),transparent_60%)]" />
      <div className="relative space-y-4 text-center">
        <div className="text-green-400 font-black text-sm tracking-widest">{label}</div>
        <p className="text-white font-black text-xl leading-relaxed">لو كنت رميت <span className="text-yellow-400">1000 جنيه</span> بس على أكوادنا المضمونة كانت هاتكون أرباحك دلوقتي</p>
        <div className="text-4xl font-black text-green-400">{profit.toLocaleString('en-US')} جنيه</div>
        <div className="text-xs text-green-600 font-bold">بدل الـ 1000 جنيه!</div>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <div className="bg-black/50 border border-green-900/50 rounded-2xl px-5 py-3 text-center"><div className="text-2xl font-black text-green-400">{totalCount}</div><div className="text-xs text-gray-500 mt-1">مجموع الأكواد</div></div>
          <div className="bg-black/50 border border-green-900/50 rounded-2xl px-5 py-3 text-center"><div className="text-2xl font-black text-green-400">{wonCount}</div><div className="text-xs text-gray-500 mt-1">عدد الأكواد الرابحة</div></div>
          <div className="bg-black/50 border border-yellow-900/50 rounded-2xl px-5 py-3 text-center"><div className="text-2xl font-black text-yellow-400">{sumOdds.toFixed(2)}</div><div className="text-xs text-gray-500 mt-1">مجموع أرباح الأكواد</div></div>
        </div>
      </div>
    </section>
  );
}

export default function WonCodesPage() {
  const { data: codes, isLoading } = useListWonCodes();
  const { data: yesterdayStats } = useGetYesterdayStats();
  const { data: stats30 } = useGet30DayStats();
  const { data: todayStats } = useGetTodayStats();
  const grouped = codes ? groupByDate(codes) : [];
  const sumOddsForDay = (dayDate: string) => (codes || []).filter((c: any) => c.dayDate === dayDate).reduce((acc: number, c: any) => acc + parseFloat(c.odds || '0'), 0);
  const sum30 = (codes || []).reduce((acc: number, c: any) => acc + parseFloat(c.odds || '0'), 0);
  const hasYesterday = !!(yesterdayStats && parseFloat(yesterdayStats.totalCodes || '0') > 0);
  const hasTodayFinalized = !!(todayStats?.isFinalized && parseFloat(todayStats.totalCodes || '0') > 0);

  return (
    <div className="space-y-8" dir="rtl">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-sm font-bold px-4 py-2 rounded-full">🏆 الأكواد الرابحة</div>
        <div className="relative inline-block"><h1 className="text-4xl md:text-6xl font-black text-white">سجل <span className="text-green-400" style={{ textShadow: '0 0 20px rgba(74,222,128,1),0 0 40px rgba(74,222,128,0.8)' }}>الانتصارات</span> 🎯</h1><div className="absolute -inset-4 bg-green-500/5 rounded-3xl blur-2xl -z-10" /></div>
        <div className="flex items-center justify-center gap-3 text-green-400 font-black text-sm tracking-widest"><span className="h-px flex-1 bg-gradient-to-r from-transparent to-green-500/50" />⚽ احصائيات الأكواد الرابحة ⚽<span className="h-px flex-1 bg-gradient-to-l from-transparent to-green-500/50" /></div>
      </div>
      {hasTodayFinalized && <StatsBox label="📊 إحصائيات أكواد امبارح" wonCount={parseFloat(todayStats!.wonCodesCount)} totalCount={parseFloat(todayStats!.totalCodes)} sumOdds={sumOddsForDay(todayStats!.statDate)} />}
      {hasYesterday && !hasTodayFinalized && <StatsBox label="📊 إحصائيات أكواد امبارح" wonCount={parseFloat(yesterdayStats!.wonCodesCount)} totalCount={parseFloat(yesterdayStats!.totalCodes)} sumOdds={sumOddsForDay(yesterdayStats!.statDate)} />}
      {stats30 && stats30.wonCodesCount > 0 && <StatsBox label="📊 إحصائيات آخر 30 يوم" wonCount={stats30.wonCodesCount} totalCount={stats30.wonCodesCount} sumOdds={sum30} />}
      {stats30 && stats30.wonCodesCount > 0 && <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-5 space-y-4 text-right"><p className="text-white font-black text-lg leading-relaxed text-center">🔥 انتهز الفرصة الآن واستخدم أكوادنا المضمونة</p><p className="text-gray-300 font-bold leading-relaxed text-center">حتي تكون أرباحك الشهر القادم مضاعفات رأس مالك وانت مطمئن 💪</p><div className="bg-black/30 border border-green-900/40 rounded-xl p-4 space-y-2"><p className="text-white font-black">🎲 عشان الأكواد تشتغل معاك لازم 🔤</p><p className="text-gray-300 font-bold">1️⃣ تستخدمها في تطبيق MELBET</p><p className="text-gray-300 font-bold">2️⃣ وتكون مسجل ببروموكود <span className="text-yellow-400 font-black">A1VIP</span></p><div className="pt-2 border-t border-green-900/30 space-y-1"><p className="text-white font-bold">🗓 وده شرح :</p><p className="text-gray-400">📌 طريقة تنزيل تطبيق MELBET</p><p className="text-gray-400">📌 والتسجيل ببروموكود <span className="text-yellow-400 font-black">A1VIP</span> ⬇️</p></div></div><a href={MELBET_TUTORIAL_URL} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black px-6 py-3 rounded-xl">اضغط هنا للتحويل للشرح اضغط هنا ←</a></div>}
      <div className="flex justify-center"><div className="rounded-2xl px-8 py-5 text-center" style={{ background: '#1a1800', border: '2px solid #a37c00', boxShadow: '0 0 18px rgba(163,124,0,0.4), inset 0 0 30px rgba(0,0,0,0.4)' }}><div className="space-y-1 text-center"><div className="flex items-center justify-center gap-2 flex-wrap"><h2 className="text-2xl md:text-4xl font-black" style={{ background: 'linear-gradient(90deg, #facc15, #fde68a, #facc15)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>إثبات كل الاكواد الرابحة</h2><span className="text-2xl md:text-3xl">💸</span></div><div className="flex items-center justify-center gap-2"><span className="text-lg md:text-2xl font-black" style={{ background: 'linear-gradient(90deg, #facc15, #fde68a, #facc15)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>لآخر 30 يوم</span><span className="text-xl md:text-2xl">⚽</span></div></div></div></div>
      {isLoading ? <div className="space-y-8">{[...Array(3)].map((_, i) => <div key={i} className="bg-[#0f1a0f] border border-green-900/30 rounded-2xl h-40 animate-pulse" />)}</div> : grouped.length > 0 ? <div className="space-y-10">{grouped.map(([date, dayCodes]) => { const dateObj = new Date(date); return <div key={date}><div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-green-900/30"><div><h2 className="text-xl font-black text-white">{dateObj.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2><p className="text-gray-500 text-sm">{dayCodes.length} كود رابح</p></div></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{dayCodes.map((code: any, idx: number) => <div key={code.id} className="bg-[#0a120a] border border-green-800/50 rounded-2xl overflow-hidden" style={{ boxShadow: '0 0 20px rgba(34,197,94,0.08)' }}><div className="p-4 pb-0"><div className="inline-flex items-center justify-center w-8 h-8 bg-transparent border-2 border-green-500 rounded-lg text-green-400 font-black text-base">{idx + 1}</div></div><div className="px-4 pt-3"><div className="bg-[#111] border border-green-900/60 rounded-xl px-4 py-3 text-center"><span className="font-black text-2xl tracking-[0.2em] text-green-400 font-mono">{code.tipCode}</span></div></div><div className="px-4 pt-3 flex items-center justify-between"><span className="text-gray-400 text-sm">نسبة ربح الكود</span><span className="text-yellow-400 font-black text-lg">x{parseFloat(code.odds).toFixed(2)}</span></div>{code.proofImageUrl && <div className="px-4 pt-3 pb-4"><div className="text-xs text-gray-500 mb-2 font-bold">📸 إثبات الربح</div><img src={code.proofImageUrl} alt="إثبات الربح" className="w-full h-auto rounded-xl block cursor-pointer hover:opacity-90" /></div>}{code.wonAt && <div className="px-4 pb-3 text-xs text-gray-600 text-right">ربح في: {new Date(code.wonAt).toLocaleTimeString('ar-EG')}</div>}</div>)}</div></div>;})}</div> : <div className="text-center py-20 space-y-4 bg-[#0f1a0f]/50 border border-green-900/30 rounded-3xl"><div className="text-6xl">🏆</div><h3 className="text-xl font-black text-gray-400">لا توجد أكواد رابحة بعد</h3><p className="text-gray-600">ترقّب! الأكواد الرابحة ستظهر هنا</p></div>}
    </div>
  );
}
