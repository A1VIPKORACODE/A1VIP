import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://ewmivzvznfkmmpuobdyc.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_NN9kjIyuK4dZMvzeIo0Fcw_iAp-FJsi';
export const STORAGE_BUCKET = 'codes';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-client-info': 'a1vip-web',
    },
  },
});

export const GIFT_URL = 'https://refpa3665.com/L?tag=d_2867569m_66335c_A1VIP&site=2867569&ad=66335';
export const MELBET_TUTORIAL_URL = 'https://t.me/WIN_20K/253';
export const CODE_USAGE_URL = 'https://t.me/A1VIP_KORA/59';
export const TELEGRAM_CHANNEL_URL = 'https://t.me/+41dt_ow6bGY4YWNk';

export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeStoragePath(path?: string | null) {
  if (!path) return null;

  let clean = String(path).trim();
  clean = clean.replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/public\/codes\//, '');
  clean = clean.replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/sign\/codes\//, '');
  clean = clean.replace(/^\/+/, '');
  clean = clean.replace(/^codes\//, '');

  return clean || null;
}

export function getStoragePublicUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith('http')) return path;

  const clean = normalizeStoragePath(path);
  if (!clean) return null;

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(clean);
  return data.publicUrl;
}

export function isAdminUser(user: any) {
  if (!user) return false;
  const role = user.app_metadata?.role;
  return role === 'admin';
}
