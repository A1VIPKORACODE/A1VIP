import React, { useEffect, useState } from 'react';
import { supabase, isAdminUser } from '../lib/supabase';

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setAllowed(isAdminUser(data.user));
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAllowed(isAdminUser(session?.user));
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-white" dir="rtl">
        جاري التحقق...
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center" dir="rtl">
        <div className="w-full max-w-md">
          <div className="bg-gradient-to-br from-[#0f1a0f] to-[#0a120a] border border-green-900/50 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(34,197,94,0.1)]">
            <div className="h-1.5 bg-gradient-to-r from-green-600 via-green-400 to-yellow-500" />
            <div className="p-8 space-y-4 text-center">
              <div className="text-5xl">🔐</div>
              <h2 className="text-2xl font-black text-white">صلاحية غير كافية</h2>
              <p className="text-gray-400 text-sm">يجب تسجيل الدخول بحساب يملك role = admin داخل Supabase Auth.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
