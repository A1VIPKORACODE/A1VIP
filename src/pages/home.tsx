import React, { useState } from "react";
import { Link } from "wouter";
import { useListActiveCodes, useListWonCodes, useGetTodayStats } from "@workspace/api-client-react";

const GIFT_URL = "https://refpa3665.com/L?tag=d_2867569m_66335c_A1VIP&site=2867569&ad=66335";
const MELBET_TUTORIAL_URL = "https://t.me/WIN_20K/253";
const CODE_USAGE_URL = "https://t.me/A1VIP_KORA/59";
const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

function getImageUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  // path from server is like "/objects/uploads/uuid" - strip the "/objects/" prefix
  // because the serving route already prepends /objects/ internally
  let clean = path;
  if (clean.startsWith("/objects/")) clean = clean.slice("/objects/".length);
  else if (clean.startsWith("objects/")) clean = clean.slice("objects/".length);
  return `${BASE_URL}/api/storage/objects/${clean}`;
}

function CodeCard({ code }: { code: any }) {
  const [copied, setCopied] = useState(false);
  const oddsNum = parseFloat(code.odds || "1");
  const imageUrl = getImageUrl(code.codeImageUrl);

  const copy = () => {
    navigator.clipboard.writeText(code.tipCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative bg-gradient-to-br from-[#0f1a0f] to-[#0a120a] border border-green-900/40 rounded-2xl overflow-hidden hover:border-green-500/60 transition-all hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]">
      <div className="h-1 bg-gradient-to-r from-green-600 via-green-400 to-green-600" />

      {/* Code image — full width, full height, no cropping */}
      {imageUrl && (
        <img src={imageUrl} alt="code" className="w-full h-auto block" />
      )}

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-gray-500 text-xs">
            {new Date(code.createdAt).toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <div className="shrink-0 bg-green-500/20 border border-green-500/40 text-green-400 font-black text-xl px-3 py-1 rounded-lg">
            {code.tipOutcome}
          </div>
        </div>

        {/* Message note — shown FIRST, code is NOT inside it */}
        <div className="bg-black/40 border border-green-900/30 rounded-2xl p-4 space-y-3 text-sm text-right" dir="rtl">
          <p className="text-white font-bold leading-relaxed">
            ✅ الكود هايشتغل علي MELBET مع الناس الي مسجلة حسابها ب بروموكود A1VIP فقط 🏆
          </p>
          <p className="text-gray-400 font-bold">⚽️ نراكم بعد الفوز ↗️</p>

          <div className="space-y-2 pt-1 border-t border-green-900/30">
            <p className="text-white font-bold leading-relaxed">
              🏆 ده شرح طريقة تنزيل تطبيق MELBET والتسجيل في ب بروموكود A1VIP عشان الاكواد تشتغل معاك⬇️
            </p>
            <a
              href={MELBET_TUTORIAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/40 text-yellow-400 font-black py-2.5 rounded-xl transition-all text-sm"
            >
              اضغط هنا للوصول للشرح اضغط هنا ←
            </a>
          </div>

          <div className="space-y-2">
            <p className="text-white font-bold leading-relaxed">
              🟢 شرح طريقة إستخدام الكود ⬇️
            </p>
            <a
              href={CODE_USAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-green-500/15 hover:bg-green-500/25 border border-green-500/40 text-green-400 font-black py-2.5 rounded-xl transition-all text-sm"
            >
              اضغط هنا للوصول للشرح اضغط هنا ←
            </a>
          </div>
        </div>

        {/* Code + odds — shown BELOW the note */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-black/50 border border-green-900/60 rounded-xl px-4 py-3 font-black text-2xl tracking-[0.25em] text-green-400 text-center font-mono">
            {code.tipCode}
          </div>
          <div className="shrink-0 text-center">
            <div className="text-xs text-gray-500 mb-1">نسبة ربح الكود</div>
            <div className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 font-black text-lg px-3 py-1 rounded-lg">
              x{oddsNum.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Copy button — below the code */}
        <button
          onClick={copy}
          className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-black font-black py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] text-sm"
        >
          {copied ? "✅ تم النسخ!" : "📋 انسخ الكود"}
        </button>

        <a
          href={GIFT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 font-bold py-2 rounded-xl transition-all text-sm"
        >
          🎰 العب الآن على Melbet
        </a>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { data: codes, isLoading } = useListActiveCodes();
  const { data: allWonCodes } = useListWonCodes();
  const { data: todayStats } = useGetTodayStats();

  const activeDayStr = (todayStats as any)?.statDate ?? new Date().toISOString().split("T")[0];
  const todayWonCodes = allWonCodes ? allWonCodes.filter((c: any) => c.dayDate === activeDayStr) : [];

  return (
    <div className="space-y-10" dir="rtl">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 via-[#0a0f0a] to-yellow-900/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(34,197,94,0.2),transparent_60%)]" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_40px,rgba(34,197,94,0.02)_40px,rgba(34,197,94,0.02)_41px)]" />
        <div className="relative px-6 py-14 md:py-20 text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/40 text-green-400 text-sm font-bold px-4 py-2 rounded-full">
            ⚡ توقعات يومية مضمونة بنسبة 100%
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight">
            سجّل الآن في{" "}
            <span className="text-yellow-400 drop-shadow-[0_0_20px_rgba(234,179,8,0.6)]">MELBET</span>
          </h1>
          <h2 className="text-3xl md:text-5xl font-black leading-tight">
            ببروموكود{" "}
            <span className="bg-yellow-500 text-black px-4 py-1 rounded-xl inline-block shadow-[0_0_30px_rgba(234,179,8,0.6)]">
              A1VIP
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 font-bold">واحصل على مكافأة ترحيبية 🎁</p>
          <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
            عند التسجيل للحصول على المكافأة استخدم بروموكود{" "}
            <strong className="text-yellow-400">A1VIP</strong> واحصل على مكافأة حصرية وابدأ الرهان على توقعاتنا المضمونة بنسبة 100%
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href={GIFT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-lg px-8 py-4 rounded-2xl transition-all shadow-[0_0_30px_rgba(234,179,8,0.4)] hover:shadow-[0_0_50px_rgba(234,179,8,0.7)] w-full sm:w-auto justify-center"
            >
              🎁 احصل على الهدية الآن
            </a>
            <a
              href="#codes"
              className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 font-black text-lg px-8 py-4 rounded-2xl transition-all w-full sm:w-auto justify-center"
            >
              ⚽ شاهد الأكواد
            </a>
          </div>
        </div>
      </section>

      {/* Active codes */}
      <section id="codes">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-black text-white">⚽ أكواد اليوم المتاحة</h2>
          <p className="text-gray-500 text-sm mt-1">انسخ الكود واستخدمه مباشرة في تطبيق Melbet</p>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#0f1a0f] border border-green-900/30 rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : codes && codes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {codes.map((code: any) => <CodeCard key={code.id} code={code} />)}
          </div>
        ) : (
          <div className="text-center py-20 space-y-5 bg-[#0f1a0f]/50 border border-green-900/30 rounded-3xl">
            <div className="text-6xl">⏳</div>
            <h3 className="text-xl font-black text-gray-400">لا توجد أكواد اليوم حتى الآن</h3>
            <p className="text-gray-600">ترقّب! سيتم نشر أكواد اليوم قريباً</p>
            <Link href="/won">
              <button className="mt-2 inline-flex items-center gap-2 bg-green-400 hover:bg-green-300 text-black font-black text-lg px-8 py-4 rounded-2xl transition-all shadow-[0_0_30px_rgba(74,222,128,0.7)] hover:shadow-[0_0_50px_rgba(74,222,128,1)] animate-pulse">
                🏆 شوف الأكواد الرابحة ←
              </button>
            </Link>
          </div>
        )}
      </section>

      {/* Today's won codes */}
      {todayWonCodes.length > 0 && (
        <section>
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-black text-white">
              🏆 <span className="text-green-400" style={{ textShadow: "0 0 15px rgba(74,222,128,0.7)" }}>أكواد اليوم الرابحة</span>
            </h2>
            <p className="text-gray-500 text-sm mt-1">الأكواد اللي ربحت النهاردة ✅</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {todayWonCodes.map((code: any, idx: number) => {
              const proofUrl = getImageUrl(code.proofImageUrl);
              return (
                <div
                  key={code.id}
                  className="bg-[#0a120a] border border-green-700/50 rounded-2xl overflow-hidden"
                  style={{ boxShadow: "0 0 20px rgba(34,197,94,0.1)" }}
                >
                  <div className="h-1 bg-gradient-to-r from-green-600 via-green-400 to-green-600" />
                  <div className="p-4 pb-0 flex items-center justify-between">
                    <div className="inline-flex items-center justify-center w-8 h-8 border-2 border-green-500 rounded-lg text-green-400 font-black text-base">
                      {idx + 1}
                    </div>
                    <div className="bg-green-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                      ✅ رابح
                    </div>
                  </div>
                  <div className="px-4 pt-3">
                    <div className="bg-[#111] border border-green-900/60 rounded-xl px-4 py-3 text-center">
                      <span className="font-black text-2xl tracking-[0.2em] text-green-400 font-mono">{code.tipCode}</span>
                    </div>
                  </div>
                  <div className="px-4 pt-3 flex items-center justify-between" dir="rtl">
                    <span className="text-gray-400 text-sm">نسبة ربح الكود</span>
                    <span className="text-yellow-400 font-black text-lg">x{parseFloat(code.odds).toFixed(2)}</span>
                  </div>
                  {proofUrl && (
                    <div className="px-4 pt-3 pb-4">
                      <div className="text-xs text-gray-500 mb-2 font-bold" dir="rtl">📸 إثبات الربح</div>
                      <img
                        src={proofUrl}
                        alt="إثبات الربح"
                        className="w-full h-auto rounded-xl block cursor-pointer hover:opacity-90 transition-opacity"
                        style={{ border: "1px solid rgba(34,197,94,0.2)" }}
                        onClick={() => window.open(proofUrl, "_blank")}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Melbet CTA */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-yellow-600/20 to-yellow-500/10 border border-yellow-500/30 p-8 text-center space-y-5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(234,179,8,0.1),transparent_70%)]" />
        <div className="relative">
          <div className="text-5xl mb-4">🎰</div>
          <h3 className="text-2xl md:text-3xl font-black mb-3">
            لم تسجّل في <span className="text-yellow-400">Melbet</span> بعد؟
          </h3>
          <p className="text-gray-400 mb-6 text-lg">
            سجّل الآن واحصل على مكافأة مالية كبيرة عند التسجيل!<br />
            للحصول على المكافأة استخدم بروموكود{" "}
            <span className="bg-yellow-500 text-black font-black px-2 py-0.5 rounded text-sm">A1VIP</span> واحصل على مكافأة حصرية وابدأ الرهان على توقعاتنا المضمونة بنسبة 100%
          </p>
          <a
            href={GIFT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xl px-10 py-5 rounded-2xl transition-all shadow-[0_0_40px_rgba(234,179,8,0.5)] hover:shadow-[0_0_60px_rgba(234,179,8,0.7)]"
          >
            🎁 ابدأ الآن واحصل على الهدية
          </a>
        </div>
      </section>
    </div>
  );
}
