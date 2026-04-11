import React, { useEffect, useState } from 'react'; import { Link } from 'wouter'; import { supabase } from '../lib/supabase';
export default function HomePage() { const [codes, setCodes] = useState<any[]>([]); const [loading, setLoading] = useState(true);
async function loadData() { setLoading(true);
const today = new Date().toISOString().split('T')[0]; const { data: appState } = await supabase .from('app_state') .select('value') .eq('key', 'current_day') .maybeSingle(); const currentDay = appState?.value || today; const { data } = await supabase .from('codes') .select('*') .eq('day_date', currentDay) .eq('status', 'active') .order('created_at', { ascending: false }); setCodes(data || []); setLoading(false); 
}
useEffect(() => { loadData(); }, []);
return ( 
<h1 className="text-2xl font-bold">أكواد اليوم</h1> {loading ? ( <div className="grid grid-cols-2 gap-3"> {[...Array(6)].map((_, i) => ( <div key={i} className="h-32 bg-gray-800 animate-pulse rounded-xl"></div> ))} </div> ) : codes.length > 0 ? ( <div className="grid grid-cols-2 gap-3"> {codes.map((code) => ( <div key={code.id} className="bg-black/40 p-3 rounded-xl"> <div className="text-lg font-bold">{code.tip_code}</div> <div className="text-green-400">x{code.odds}</div> </div> ))} </div> ) : ( <div className="text-center text-gray-400"> لا توجد أكواد اليوم </div> )} <Link href="/won"> <button className="w-full bg-green-500 text-black py-3 rounded-xl font-bold"> عرض الأكواد الرابحة </button> </Link> </div> 
); }
