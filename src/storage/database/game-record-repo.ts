import { getSupabaseClient } from './supabase-client';

export interface GameRecord {
  id: number;
  userId: number;
  scenario: string;
  finalScore: number;
  result: string;
  playedAt: string;
}

export interface NewGameRecord {
  userId: number;
  scenario: string;
  finalScore: number;
  result: string;
}

const TABLE = "game_records";

/** 创建一条游戏记录 */
export async function createGameRecord(
  data: NewGameRecord
): Promise<GameRecord> {
  const supabase = getSupabaseClient();
  const { data: record, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: data.userId,
      scenario: data.scenario,
      final_score: data.finalScore,
      result: data.result,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`创建游戏记录失败: ${error.message}`);
  }

  return {
    id: record.id,
    userId: record.user_id,
    scenario: record.scenario,
    finalScore: record.final_score,
    result: record.result,
    playedAt: record.played_at,
  };
}

/** 查询某个用户的游戏记录（按时间倒序） */
export async function getRecordsByUserId(
  userId: number,
  limit = 50
): Promise<GameRecord[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select()
    .eq("user_id", userId)
    .order("played_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`查询游戏记录失败: ${error.message}`);
  }

  return (data || []).map((r) => ({
    id: r.id,
    userId: r.user_id,
    scenario: r.scenario,
    finalScore: r.final_score,
    result: r.result,
    playedAt: r.played_at,
  }));
}
