import React, { useState, useRef } from "react";
import { AdminGate } from "../components/admin-gate";
import {
  useListActiveCodes,
  useCreateCode,
  useMarkCodeWon,
  useDeleteCode,
  useGetTodayStats,
  useFinalizeDay,
  useStartNewDay,
  getListActiveCodesQueryKey,
  getGetTodayStatsQueryKey,
  getGetYesterdayStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

function getImageUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  let clean = path;
  if (clean.startsWith("/objects/")) clean = clean.slice("/objects/".length);
  else if (clean.startsWith("objects/")) clean = clean.slice("objects/".length);
  return `${BASE_URL}/api/storage/objects/${clean}`;
}

async function uploadProofImage(file: File): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/storage/uploads/request-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
  });
  if (!res.ok) throw new Error("Failed to get upload URL");
  const { uploadURL, objectPath } = await res.json();

  const uploadRes = await fetch(uploadURL, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!uploadRes.ok) throw new Error("Failed to upload file");
  return objectPath;
}

function WinDialog({
  codeId,
  codeDesc,
  onClose,
  onWin,
}: {
  codeId: number;
  codeDesc: string;
  onClose: () => void;
  onWin: (id: number, imageUrl: string | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [objectPath, setObjectPath] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const path = await uploadProofImage(file);
      setObjectPath(path);
    } catch {
      alert("فشل رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-[#0f1a0f] border border-green-700/50 rounded-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-white">✅ تأكيد الكسب</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>

        <div className="bg-black/30 rounded-xl p-3 border border-green-900/40">
          <p className="text-gray-400 text-sm">{codeDesc}</p>
        </div>

        <div>
          <p className="text-sm font-bold text-gray-400 mb-3">📸 ارفع صورة إثبات الربح (اختياري)</p>
          {preview && (
            <img src={preview} alt="preview" className="w-full rounded-xl mb-3 h-auto border border-green-700/30" />
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full border border-dashed border-green-700/40 text-green-400 font-bold py-3 rounded-xl hover:bg-green-500/10 transition-all text-sm"
          >
            {uploading ? "⏳ جاري الرفع..." : preview ? "🔄 تغيير الصورة" : "📂 اختر صورة"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-700 text-gray-400 font-bold py-3 rounded-xl hover:bg-gray-800 transition-all"
          >
            إلغاء
          </button>
          <button
            onClick={() => onWin(codeId, objectPath)}
            disabled={uploading}
            className="flex-1 bg-green-500 hover:bg-green-400 text-black font-black py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)]"
          >
            ✅ تأكيد الكسب
          </button>
        </div>
      </div>
    </div>
  );
}

function CashOutDialog({
  codeId,
  codeDesc,
  onClose,
  onCashOut,
}: {
  codeId: number;
  codeDesc: string;
  onClose: () => void;
  onCashOut: (id: number, imageUrl: string | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [objectPath, setObjectPath] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const path = await uploadProofImage(file);
      setObjectPath(path);
    } catch {
      alert("فشل رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-[#0f1a0f] border border-blue-700/50 rounded-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-white">📥 تأكيد الاستيراد</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>

        <div className="bg-black/30 rounded-xl p-3 border border-blue-900/40">
          <p className="text-blue-300 text-sm font-bold">⚠️ سيتم تحويل نسبة ربح الكود إلى 1 تلقائياً</p>
          <p className="text-gray-400 text-sm mt-1">{codeDesc}</p>
        </div>

        <div>
          <p className="text-sm font-bold text-gray-400 mb-3">📸 ارفع صورة إثبات استيراد القسيمة</p>
          {preview && (
            <img src={preview} alt="preview" className="w-full rounded-xl mb-3 h-auto border border-blue-700/30" />
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full border border-dashed border-blue-700/40 text-blue-400 font-bold py-3 rounded-xl hover:bg-blue-500/10 transition-all text-sm"
          >
            {uploading ? "⏳ جاري الرفع..." : preview ? "🔄 تغيير الصورة" : "📂 اختر صورة إثبات"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-700 text-gray-400 font-bold py-3 rounded-xl hover:bg-gray-800 transition-all"
          >
            إلغاء
          </button>
          <button
            onClick={() => onCashOut(codeId, objectPath)}
            disabled={uploading}
            className="flex-1 bg-blue-500 hover:bg-blue-400 text-black font-black py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
          >
            📥 تأكيد الاستيراد
          </button>
        </div>
      </div>
    </div>
  );
}

function DayStats({ stats, codes, onFinalize, onNewDay, finalizing, startingNew }: {
  stats: any;
  codes: any[];
  onFinalize: () => void;
  onNewDay: () => void;
  finalizing: boolean;
  startingNew: boolean;
}) {
  const totalCodes = parseFloat(stats?.totalCodes || "0");
  const wonCount = parseFloat(stats?.wonCodesCount || "0");
  const combinedOdds = parseFloat(stats?.combinedOdds || "1");
  const profit1000 = Math.round(1000 * combinedOdds);
  const sumOdds = codes.reduce((acc, c) => acc + parseFloat(c.odds || "0"), 0);

  return (
    <div className="bg-gradient-to-br from-[#0f1a0f] to-[#0a120a] border border-green-900/40 rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-lg text-white">📊 إحصائيات اليوم</h3>
        {stats?.isFinalized && (
          <span className="bg-green-500/20 border border-green-500/40 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">مكتمل</span>
        )}
      </div>

      <div className="flex flex-col gap-3" dir="rtl">
        <div className="flex items-center justify-between bg-black/30 rounded-xl px-5 py-3 border border-green-900/30">
          <div className="text-sm text-gray-400 font-bold">إجمالي الأكواد</div>
          <div className="text-2xl font-black text-white">{totalCodes}</div>
        </div>
        <div className="flex items-center justify-between bg-black/30 rounded-xl px-5 py-3 border border-green-900/30">
          <div className="text-sm text-gray-400 font-bold">الأكواد الرابحة</div>
          <div className="text-2xl font-black text-green-400">{wonCount}</div>
        </div>
        <div className="flex items-center justify-between bg-black/30 rounded-xl px-5 py-3 border border-yellow-900/30">
          <div className="text-sm text-gray-400 font-bold">مجموع ربح الأكواد</div>
          <div className="text-2xl font-black text-yellow-400">{sumOdds.toFixed(2)}</div>
        </div>
      </div>

      {totalCodes > 0 && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center" dir="rtl">
          <p className="text-sm text-gray-400 mb-1">مثال الربح — لو راميت 1000 جنيه على أكواد النهاردة</p>
          <p className="text-2xl font-black text-green-400">{Math.round(1000 * sumOdds).toLocaleString("en-US")} جنيه</p>
          <p className="text-xs text-gray-600">= 1000 × {sumOdds.toFixed(4)}</p>
        </div>
      )}

      <div className="flex gap-3 flex-col sm:flex-row">
        {!stats?.isFinalized ? (
          <button
            onClick={onFinalize}
            disabled={finalizing || totalCodes === 0}
            className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black py-3 rounded-xl transition-all text-sm shadow-[0_0_15px_rgba(234,179,8,0.2)]"
          >
            {finalizing ? "⏳ جاري الحساب..." : "🌙 نهاية اليوم - احسب الإحصائيات"}
          </button>
        ) : (
          <button
            onClick={onNewDay}
            disabled={startingNew}
            className="flex-1 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-black py-3 rounded-xl transition-all text-sm shadow-[0_0_15px_rgba(34,197,94,0.2)]"
          >
            {startingNew ? "⏳ جاري البدء..." : "🌅 بداية يوم جديد"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: codes, isLoading } = useListActiveCodes();
  const { data: todayStats } = useGetTodayStats();

  const createCode = useCreateCode();
  const markWon = useMarkCodeWon();
  const deleteCode = useDeleteCode();
  const finalizeDay = useFinalizeDay();
  const startNewDay = useStartNewDay();

  const [showForm, setShowForm] = useState(false);
  const [winDialog, setWinDialog] = useState<{ id: number; desc: string } | null>(null);
  const [cashOutDialog, setCashOutDialog] = useState<{ id: number; desc: string } | null>(null);

  const [form, setForm] = useState({
    tipOutcome: "",
    tipCode: "",
    odds: "",
  });
  const [codeImageFile, setCodeImageFile] = useState<File | null>(null);
  const [codeImagePreview, setCodeImagePreview] = useState<string | null>(null);
  const [codeImageUploading, setCodeImageUploading] = useState(false);
  const [codeImagePath, setCodeImagePath] = useState<string | null>(null);
  const codeImageRef = useRef<HTMLInputElement>(null);

  const handleCodeImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCodeImageFile(file);
    setCodeImagePreview(URL.createObjectURL(file));
    setCodeImageUploading(true);
    try {
      const path = await uploadProofImage(file);
      setCodeImagePath(path);
    } catch {
      toast({ title: "خطأ", description: "فشل رفع الصورة", variant: "destructive" });
    } finally {
      setCodeImageUploading(false);
    }
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListActiveCodesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetTodayStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetYesterdayStatsQueryKey() });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tipCode || !form.odds) {
      toast({ title: "خطأ", description: "يرجى ملء الكود ونسبة ربح الكود", variant: "destructive" });
      return;
    }
    createCode.mutate(
      { data: { ...form, description: "", odds: parseFloat(form.odds), codeImageUrl: codeImagePath || undefined } },
      {
        onSuccess: () => {
          toast({ title: "✅ تم الإضافة", description: "تم إضافة الكود بنجاح" });
          setForm({ tipOutcome: "", tipCode: "", odds: "" });
          setCodeImageFile(null);
          setCodeImagePreview(null);
          setCodeImagePath(null);
          setShowForm(false);
          invalidate();
        },
        onError: () => toast({ title: "خطأ", description: "فشل إضافة الكود", variant: "destructive" }),
      }
    );
  };

  const handleWin = (id: number, imageUrl: string | null) => {
    markWon.mutate(
      { id, data: { proofImageUrl: imageUrl } },
      {
        onSuccess: () => {
          toast({ title: "🏆 رابح!", description: "تم تحديد الكود كرابح" });
          setWinDialog(null);
          invalidate();
        },
        onError: () => toast({ title: "خطأ", description: "فشل تحديث الكود", variant: "destructive" }),
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الكود؟")) return;
    deleteCode.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "🗑️ تم الحذف", description: "تم حذف الكود نهائياً" });
          invalidate();
        },
        onError: () => toast({ title: "خطأ", description: "فشل حذف الكود", variant: "destructive" }),
      }
    );
  };

  const handleCashOut = async (id: number, imageUrl: string | null) => {
    try {
      const res = await fetch(`${BASE_URL}/api/codes/${id}/cash-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofImageUrl: imageUrl }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "📥 تم الاستيراد", description: "تم تحويل الكود واستيراد القسيمة بنسبة ربح 1" });
      setCashOutDialog(null);
      invalidate();
    } catch {
      toast({ title: "خطأ", description: "فشل الاستيراد", variant: "destructive" });
    }
  };

  const handleFinalize = () => {
    finalizeDay.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "🌙 نهاية اليوم", description: "تم حساب إحصائيات اليوم بنجاح" });
        invalidate();
      },
      onError: () => toast({ title: "خطأ", description: "فشل حساب الإحصائيات", variant: "destructive" }),
    });
  };

  const handleNewDay = () => {
    startNewDay.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "🌅 يوم جديد", description: "تم أرشفة إحصائيات الأمس وبدأ يوم جديد" });
        invalidate();
      },
      onError: () => toast({ title: "خطأ", description: "فشل بدء اليوم الجديد", variant: "destructive" }),
    });
  };


  return (
    <AdminGate>
    <div className="space-y-8 max-w-4xl mx-auto" dir="rtl">
      {winDialog && (
        <WinDialog
          codeId={winDialog.id}
          codeDesc={winDialog.desc}
          onClose={() => setWinDialog(null)}
          onWin={handleWin}
        />
      )}
      {cashOutDialog && (
        <CashOutDialog
          codeId={cashOutDialog.id}
          codeDesc={cashOutDialog.desc}
          onClose={() => setCashOutDialog(null)}
          onCashOut={handleCashOut}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">⚙️ لوحة الإدارة</h1>
          <p className="text-gray-500 text-sm mt-1">إضافة وإدارة أكواد التوقعات اليومية</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-black px-4 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] text-sm"
        >
          {showForm ? "✕ إغلاق" : "➕ إضافة كود"}
        </button>
      </div>

      {showForm && (
        <div className="bg-gradient-to-br from-[#0f1a0f] to-[#0a120a] border border-green-700/50 rounded-2xl p-6">
          <h3 className="font-black text-lg text-white mb-5">➕ إضافة كود جديد</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">نوع التوقع <span className="text-gray-600 normal-case">(اختياري)</span></label>
                <input
                  value={form.tipOutcome}
                  onChange={(e) => setForm({ ...form, tipOutcome: e.target.value })}
                  placeholder="مثال: 1 أو X2 أو فوز الضيف"
                  className="w-full bg-black/50 border border-green-900/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/60 placeholder-gray-700"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">نسبة ربح الكود</label>
                <input
                  value={form.odds}
                  onChange={(e) => setForm({ ...form, odds: e.target.value })}
                  placeholder="مثال: 1.75"
                  type="number"
                  step="0.001"
                  min="1"
                  className="w-full bg-black/50 border border-green-900/50 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/60"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">الكود</label>
              <input
                value={form.tipCode}
                onChange={(e) => setForm({ ...form, tipCode: e.target.value })}
                placeholder="مثال: MC-ARS-2024"
                className="w-full bg-black/50 border border-green-900/50 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/60 font-mono text-lg tracking-widest"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">صورة الكود (اختياري)</label>
              <input
                ref={codeImageRef}
                type="file"
                accept="image/*"
                onChange={handleCodeImageChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => codeImageRef.current?.click()}
                disabled={codeImageUploading}
                className="w-full border-2 border-dashed border-green-900/50 hover:border-green-500/50 rounded-xl p-4 text-center transition-all text-gray-500 hover:text-green-400"
              >
                {codeImageUploading ? "⏳ جاري الرفع..." : codeImagePreview ? "🔄 تغيير الصورة" : "📸 رفع صورة للكود"}
              </button>
              {codeImagePreview && (
                <div className="mt-3 relative">
                  <img src={codeImagePreview} alt="preview" className="w-full rounded-xl h-auto" />
                  <button
                    type="button"
                    onClick={() => { setCodeImagePreview(null); setCodeImagePath(null); setCodeImageFile(null); }}
                    className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg"
                  >
                    ✕ إزالة
                  </button>
                  {codeImagePath && <div className="mt-1 text-xs text-green-400 text-center">✅ تم الرفع بنجاح</div>}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-700 text-gray-400 font-bold py-3 rounded-xl hover:bg-gray-800 transition-all"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={createCode.isPending}
                className="flex-1 bg-green-500 hover:bg-green-400 disabled:opacity-60 text-black font-black py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)]"
              >
                {createCode.isPending ? "⏳ جاري الإضافة..." : "✅ إضافة الكود"}
              </button>
            </div>
          </form>
        </div>
      )}

      <DayStats
        stats={todayStats}
        codes={codes || []}
        onFinalize={handleFinalize}
        onNewDay={handleNewDay}
        finalizing={finalizeDay.isPending}
        startingNew={startNewDay.isPending}
      />

      <div>
        <h2 className="text-xl font-black text-white mb-4">📋 أكواد اليوم النشطة ({codes?.length || 0})</h2>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#0f1a0f] border border-green-900/30 rounded-xl h-20 animate-pulse" />
            ))}
          </div>
        ) : codes && codes.length > 0 ? (
          <div className="space-y-3">
            {codes.map((code: any) => (
              <div
                key={code.id}
                className="bg-gradient-to-br from-[#0f1a0f] to-[#0a120a] border border-green-900/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    {code.tipOutcome && (
                      <span className="bg-green-500/20 border border-green-500/40 text-green-400 font-black text-sm px-2 py-0.5 rounded">
                        {code.tipOutcome}
                      </span>
                    )}
                    <span className="font-black text-white font-mono text-lg tracking-widest">{code.tipCode}</span>
                    <span className="text-yellow-400 font-bold text-sm">x{parseFloat(code.odds).toFixed(2)}</span>
                  </div>

                  {getImageUrl(code.codeImageUrl) && (
                    <img
                      src={getImageUrl(code.codeImageUrl)!}
                      alt="صورة الكود"
                      className="w-full h-auto rounded-xl mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ border: "1px solid rgba(34,197,94,0.2)", maxHeight: "200px", objectFit: "contain" }}
                      onClick={() => window.open(getImageUrl(code.codeImageUrl)!, "_blank")}
                    />
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setWinDialog({ id: code.id, desc: code.description })}
                      className="flex items-center gap-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 font-bold text-xs px-3 py-2 rounded-lg transition-all"
                    >
                      ✅ كسب
                    </button>
                    <button
                      onClick={() => setCashOutDialog({ id: code.id, desc: code.tipCode })}
                      className="flex items-center gap-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-400 font-bold text-xs px-3 py-2 rounded-lg transition-all"
                    >
                      📥 استيراد
                    </button>
                    <button
                      onClick={() => handleDelete(code.id)}
                      className="flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs px-3 py-2 rounded-lg transition-all"
                    >
                      🗑️ حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-[#0f1a0f]/50 border border-dashed border-green-900/30 rounded-2xl">
            <p className="text-gray-500">لا توجد أكواد نشطة. أضف أكواداً جديدة!</p>
          </div>
        )}
      </div>
    </div>
    </AdminGate>
  );
}
