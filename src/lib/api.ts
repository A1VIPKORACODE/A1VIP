import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';

export type Code = {
  id: number;
  description: string | null;
  tipOutcome: string;
  tipCode: string;
  odds: string;
  status: string;
  codeImageUrl: string | null;
  proofImageUrl: string | null;
  createdAt: string;
  wonAt: string | null;
  dayDate: string;
};

export type DayStats = {
  statDate: string;
  totalCodes: string;
  wonCodesCount: string;
  combinedOdds: string;
  isFinalized: boolean;
};

function mapCode(row: any): Code {
  return {
    id: row.id,
    description: row.description,
    tipOutcome: row.tip_outcome || '',
    tipCode: row.tip_code,
    odds: String(row.odds ?? '1'),
    status: row.status,
    codeImageUrl: row.code_image_url,
    proofImageUrl: row.proof_image_url,
    createdAt: row.created_at,
    wonAt: row.won_at,
    dayDate: row.day_date,
  };
}

async function ensureCurrentDay(): Promise<string> {
  const { data, error } = await supabase.from('app_state').select('value').eq('key', 'current_day').maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  if (data?.value) return data.value;
  const today = new Date().toISOString().split('T')[0];
  await supabase.from('app_state').upsert({ key: 'current_day', value: today });
  return today;
}

export async function listActiveCodes(): Promise<Code[]> {
  const { data, error } = await supabase.from('tip_codes').select('*').eq('status', 'active').order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapCode);
}

export async function listWonCodes(): Promise<Code[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('tip_codes')
    .select('*')
    .eq('status', 'won')
    .gte('day_date', cutoffStr)
    .order('day_date', { ascending: false })
    .order('won_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapCode);
}

async function computeDayStats(dayDate: string): Promise<DayStats> {
  const { data, error } = await supabase.from('tip_codes').select('*').eq('day_date', dayDate);
  if (error) throw error;
  const codes = (data || []).map(mapCode);
  const activeCodes = codes.filter((c) => c.status !== 'lost');
  const wonCodes = codes.filter((c) => c.status === 'won');
  const combinedOdds = activeCodes.reduce((acc, c) => acc * parseFloat(c.odds || '1'), 1);
  return {
    statDate: dayDate,
    totalCodes: String(activeCodes.length),
    wonCodesCount: String(wonCodes.length),
    combinedOdds: combinedOdds.toFixed(4),
    isFinalized: false,
  };
}

export async function getTodayStats(): Promise<DayStats> {
  const currentDay = await ensureCurrentDay();
  const { data, error } = await supabase.from('daily_stats').select('*').eq('stat_date', currentDay).maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  if (data) {
    return {
      statDate: data.stat_date,
      totalCodes: String(data.total_codes),
      wonCodesCount: String(data.won_codes_count),
      combinedOdds: String(data.combined_odds),
      isFinalized: !!data.is_finalized,
    };
  }
  return computeDayStats(currentDay);
}

export async function getYesterdayStats(): Promise<DayStats | null> {
  const currentDay = await ensureCurrentDay();
  const { data, error } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('is_finalized', true)
    .lt('stat_date', currentDay)
    .order('stat_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;
  return {
    statDate: data.stat_date,
    totalCodes: String(data.total_codes),
    wonCodesCount: String(data.won_codes_count),
    combinedOdds: String(data.combined_odds),
    isFinalized: !!data.is_finalized,
  };
}

export async function get30DayStats() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  const { data, error } = await supabase.from('tip_codes').select('*').eq('status', 'won').gte('day_date', cutoffStr);
  if (error) throw error;
  const codes = (data || []).map(mapCode);
  const sumOdds = codes.reduce((acc, c) => acc + parseFloat(c.odds || '0'), 0);
  return {
    wonCodesCount: codes.length,
    combinedOdds: sumOdds.toFixed(2),
    profit1000: Math.round(sumOdds * 1000),
  };
}

export async function createCode(input: { tipOutcome?: string; tipCode: string; odds: number; codeImageUrl?: string | null }) {
  const dayDate = await ensureCurrentDay();
  const { data, error } = await supabase.from('tip_codes').insert({
    description: '',
    tip_outcome: input.tipOutcome || '',
    tip_code: input.tipCode,
    odds: String(input.odds),
    status: 'active',
    code_image_url: input.codeImageUrl || null,
    day_date: dayDate,
  }).select().single();
  if (error) throw error;
  return mapCode(data);
}

export async function markCodeWon(id: number, proofImageUrl?: string | null) {
  const { data, error } = await supabase.from('tip_codes').update({
    status: 'won',
    proof_image_url: proofImageUrl || null,
    won_at: new Date().toISOString(),
  }).eq('id', id).select().single();
  if (error) throw error;
  return mapCode(data);
}

export async function markCodeCashOut(id: number, proofImageUrl?: string | null) {
  const { data, error } = await supabase.from('tip_codes').update({
    status: 'won',
    odds: '1',
    proof_image_url: proofImageUrl || null,
    won_at: new Date().toISOString(),
  }).eq('id', id).select().single();
  if (error) throw error;
  return mapCode(data);
}

export async function deleteCode(id: number) {
  const { data, error } = await supabase.from('tip_codes').update({ status: 'lost' }).eq('id', id).select().single();
  if (error) throw error;
  return mapCode(data);
}

export async function finalizeDay() {
  const currentDay = await ensureCurrentDay();
  const computed = await computeDayStats(currentDay);
  const payload = {
    stat_date: currentDay,
    total_codes: computed.totalCodes,
    won_codes_count: computed.wonCodesCount,
    combined_odds: computed.combinedOdds,
    is_finalized: true,
  };
  const { error } = await supabase.from('daily_stats').upsert(payload, { onConflict: 'stat_date' });
  if (error) throw error;
  return payload;
}

function addDays(dateStr: string, days: number) {
  const dt = new Date(dateStr + 'T00:00:00');
  dt.setDate(dt.getDate() + days);
  return dt.toISOString().split('T')[0];
}

export async function startNewDay() {
  const currentDay = await ensureCurrentDay();
  await finalizeDay();
  const nextDay = addDays(currentDay, 1);
  const { error } = await supabase.from('app_state').upsert({ key: 'current_day', value: nextDay });
  if (error) throw error;
  return nextDay;
}

export async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `codes/${fileName}`;
  const { error } = await supabase.storage.from('codes').upload(filePath, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('codes').getPublicUrl(filePath);
  return data.publicUrl;
}

export const keys = {
  active: ['active-codes'] as const,
  won: ['won-codes'] as const,
  todayStats: ['today-stats'] as const,
  yesterdayStats: ['yesterday-stats'] as const,
  stats30: ['stats30'] as const,
};

export function useListActiveCodes() { return useQuery({ queryKey: keys.active, queryFn: listActiveCodes }); }
export function useListWonCodes() { return useQuery({ queryKey: keys.won, queryFn: listWonCodes }); }
export function useGetTodayStats() { return useQuery({ queryKey: keys.todayStats, queryFn: getTodayStats }); }
export function useGetYesterdayStats() { return useQuery({ queryKey: keys.yesterdayStats, queryFn: getYesterdayStats }); }
export function useGet30DayStats() { return useQuery({ queryKey: keys.stats30, queryFn: get30DayStats }); }
export function useCreateCode() { return useMutation({ mutationFn: createCode }); }
export function useMarkCodeWon() { return useMutation({ mutationFn: ({ id, proofImageUrl }: {id:number; proofImageUrl?: string | null}) => markCodeWon(id, proofImageUrl) }); }
export function useDeleteCode() { return useMutation({ mutationFn: ({ id }: {id:number}) => deleteCode(id) }); }
export function useFinalizeDay() { return useMutation({ mutationFn: finalizeDay }); }
export function useStartNewDay() { return useMutation({ mutationFn: startNewDay }); }
