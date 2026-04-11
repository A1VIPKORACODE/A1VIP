import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase, getLocalDateString } from './supabase';

export type Code = {
  id: string;
  description: string | null;
  tipOutcome: string;
  tipCode: string;
  odds: string;
  status: 'active' | 'won' | 'refund';
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
    id: String(row.id),
    description: row.description ?? null,
    tipOutcome: row.tip_outcome || '',
    tipCode: row.tip_code || '',
    odds: String(row.odds ?? '1'),
    status: row.status,
    codeImageUrl: row.code_image_url ?? null,
    proofImageUrl: row.proof_image_url ?? null,
    createdAt: row.created_at || new Date().toISOString(),
    wonAt: row.won_at ?? null,
    dayDate: row.day_date,
  };
}

async function ensureCurrentDay(): Promise<string> {
  const { data, error } = await supabase.from('app_state').select('value').eq('key', 'current_day').maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  if (data?.value && /^\d{4}-\d{2}-\d{2}$/.test(data.value)) return data.value;
  return getLocalDateString();
}

async function computeDayStats(dayDate: string): Promise<DayStats> {
  const { data, error } = await supabase.from('codes').select('*').eq('day_date', dayDate);
  if (error) throw error;

  const codes = (data || []).map(mapCode);
  const totalCodes = codes.length;
  const wonCodes = codes.filter((c) => c.status === 'won' || c.status === 'refund');
  const combinedOdds = wonCodes.reduce((acc, c) => acc + parseFloat(c.odds || '0'), 0);

  return {
    statDate: dayDate,
    totalCodes: String(totalCodes),
    wonCodesCount: String(wonCodes.length),
    combinedOdds: combinedOdds.toFixed(2),
    isFinalized: false,
  };
}

export async function listActiveCodes(): Promise<Code[]> {
  const currentDay = await ensureCurrentDay();
  const { data, error } = await supabase
    .from('codes')
    .select('*')
    .eq('day_date', currentDay)
    .eq('status', 'active')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapCode);
}

export async function listWonCodes(): Promise<Code[]> {
  const currentDay = await ensureCurrentDay();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = getLocalDateString(cutoff);

  const { data, error } = await supabase
    .from('codes')
    .select('*')
    .in('status', ['won', 'refund'])
    .gte('day_date', cutoffStr)
    .lte('day_date', currentDay)
    .order('day_date', { ascending: false })
    .order('won_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapCode);
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
  const currentDay = await ensureCurrentDay();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = getLocalDateString(cutoff);
  const { data, error } = await supabase
    .from('codes')
    .select('*')
    .in('status', ['won', 'refund'])
    .gte('day_date', cutoffStr)
    .lte('day_date', currentDay);
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
  const { data, error } = await supabase
    .from('codes')
    .insert({
      description: '',
      tip_outcome: input.tipOutcome || '',
      tip_code: input.tipCode,
      odds: input.odds,
      status: 'active',
      code_image_url: input.codeImageUrl || null,
      day_date: dayDate,
    })
    .select()
    .single();
  if (error) throw error;
  return mapCode(data);
}

export async function markCodeWon(id: string, proofImageUrl?: string | null) {
  const { data, error } = await supabase
    .from('codes')
    .update({
      status: 'won',
      proof_image_url: proofImageUrl || null,
      proof_type: 'won',
      won_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapCode(data);
}

export async function markCodeCashOut(id: string, proofImageUrl?: string | null) {
  const { data, error } = await supabase
    .from('codes')
    .update({
      status: 'refund',
      odds: 1,
      proof_image_url: proofImageUrl || null,
      proof_type: 'refund',
      won_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapCode(data);
}

export async function deleteCode(id: string) {
  const { data, error } = await supabase.from('codes').delete().eq('id', id).select().single();
  if (error) throw error;
  return mapCode(data);
}

export async function finalizeDay() {
  const currentDay = await ensureCurrentDay();
  const computed = await computeDayStats(currentDay);
  const payload = {
    stat_date: currentDay,
    total_codes: Number(computed.totalCodes),
    won_codes_count: Number(computed.wonCodesCount),
    combined_odds: Number(computed.combinedOdds),
    is_finalized: true,
  };
  const { error } = await supabase.from('daily_stats').upsert(payload, { onConflict: 'stat_date' });
  if (error) throw error;
  return payload;
}

function addDays(dateStr: string, days: number) {
  const dt = new Date(`${dateStr}T00:00:00`);
  dt.setDate(dt.getDate() + days);
  return getLocalDateString(dt);
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
  const { error } = await supabase.storage.from('codes').upload(filePath, file, { upsert: false, cacheControl: '3600' });
  if (error) throw error;
  return filePath;
}

export const keys = {
  active: ['active-codes'] as const,
  won: ['won-codes'] as const,
  todayStats: ['today-stats'] as const,
  yesterdayStats: ['yesterday-stats'] as const,
  stats30: ['stats30'] as const,
};

export function useListActiveCodes() {
  return useQuery({ queryKey: keys.active, queryFn: listActiveCodes, staleTime: 30_000 });
}

export function useListWonCodes() {
  return useQuery({ queryKey: keys.won, queryFn: listWonCodes, staleTime: 30_000 });
}

export function useGetTodayStats() {
  return useQuery({ queryKey: keys.todayStats, queryFn: getTodayStats, staleTime: 30_000 });
}

export function useGetYesterdayStats() {
  return useQuery({ queryKey: keys.yesterdayStats, queryFn: getYesterdayStats, staleTime: 30_000 });
}

export function useGet30DayStats() {
  return useQuery({ queryKey: keys.stats30, queryFn: get30DayStats, staleTime: 30_000 });
}

export function useCreateCode() {
  return useMutation({ mutationFn: createCode });
}

export function useMarkCodeWon() {
  return useMutation({ mutationFn: ({ id, proofImageUrl }: { id: string; proofImageUrl?: string | null }) => markCodeWon(id, proofImageUrl) });
}

export function useDeleteCode() {
  return useMutation({ mutationFn: ({ id }: { id: string }) => deleteCode(id) });
}

export function useFinalizeDay() {
  return useMutation({ mutationFn: finalizeDay });
}

export function useStartNewDay() {
  return useMutation({ mutationFn: startNewDay });
}
