import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { GIFT_URL, TELEGRAM_CHANNEL_URL } from '../lib/supabase';

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = [
    { href: '/', label: 'الرئيسية', icon: '⚽' },
    { href: '/won', label: 'الأكواد الرابحة', icon: '🏆' },
  ];
  return (
    <div className="min-h-screen bg-[#080c08] text-white" dir="rtl">
      <div className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 text-black py-2 px-4 text-center text-sm font-black tracking-wide relative overflow-hidden">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.05)_10px,rgba(0,0,0,0.05)_20px)]" />
        <div className="relative flex items-center justify-center gap-4 flex-wrap">
          <span>🎁 سجّل الآن في <strong>MELBET</strong> واحصل على مكافأة ترحيبية حصرية!</span>
          <div className="flex items-center gap-2">
            <span className="bg-black text-yellow-400 font-black px-2 py-0.5 rounded text-xs tracking-widest">A1VIP</span>
            <a href={GIFT_URL} target="_blank" rel="noreferrer" className="bg-black text-yellow-400 font-black text-xs px-3 py-1 rounded hover:bg-gray-900">احصل على الهدية ←</a>
          </div>
        </div>
      </div>
      <header className="border-b border-green-900/40 bg-[#080c08]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.5)]"><img src="/favicon.png" className="w-full h-full object-cover" /></div>
              <div>
                <div className="font-black text-lg leading-none text-white tracking-tight">A1VIP <span className="text-green-400">KORA</span></div>
                <div className="text-[10px] text-yellow-400 font-bold tracking-widest leading-none">CODE</div>
              </div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${location === link.href ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  <span>{link.icon}</span>{link.label}
                </div>
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <a href={GIFT_URL} target="_blank" rel="noreferrer" className="hidden md:flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-sm px-4 py-2 rounded-lg shadow-[0_0_15px_rgba(234,179,8,0.3)]">🎁 سجّل في Melbet</a>
            <button className="md:hidden text-gray-400 hover:text-white p-2 text-xl" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? '✕' : '☰'}</button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-green-900/40 bg-[#0a0f0a] py-3 px-4 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}><div className={`flex items-center gap-2 px-4 py-3 rounded-lg font-bold text-sm cursor-pointer ${location === link.href ? 'bg-green-500/20 text-green-400' : 'text-gray-400'}`} onClick={() => setMenuOpen(false)}><span>{link.icon}</span>{link.label}</div></Link>
            ))}
            <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#229ED9] text-white font-black text-sm px-4 py-3 rounded-lg mt-2">📣 قناة التليجرام</a>
          </div>
        )}
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
      <footer className="border-t border-green-900/30 bg-[#050805] mt-16 py-8 px-4 text-center">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="font-black text-xl">A1VIP <span className="text-green-400">KORA</span> <span className="text-yellow-400">CODE</span></div>
          <p className="text-gray-500 text-sm">جميع الحقوق محفوظة ل A1VIP KORA CODE 2026</p>
          <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-[#229ED9] hover:bg-[#3ab0ea] text-white font-black px-6 py-2 rounded-full transition-all mt-4">📣 قناة التليجرام</a>
        </div>
      </footer>
    </div>
  );
}
