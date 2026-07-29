import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseClient();

  // 先取所有记录，按分数降序
  const { data: records, error: recordsError } = await supabase
    .from("game_records")
    .select("id, user_id, final_score, scenario, result, played_at")
    .order("final_score", { ascending: false })
    .limit(200);

  if (recordsError) {
    return NextResponse.json(
      { error: "获取排行榜失败" },
      { status: 500 }
    );
  }

  if (!records || records.length === 0) {
    return NextResponse.json({ success: true, data: [] });
  }

  // 每个用户只保留最高分
  const userBestMap = new Map<
    number,
    {
      id: number;
      user_id: number;
      final_score: number;
      scenario: string;
      result: string;
      played_at: string;
    }
  >();

  for (const record of records as Array<{
    id: number;
    user_id: number;
    final_score: number;
    scenario: string;
    result: string;
    played_at: string;
  }>) {
    const existing = userBestMap.get(record.user_id);
    if (existing && existing.final_score >= record.final_score) continue;
    userBestMap.set(record.user_id, record);
  }

  // 取前20名
  const topRecords = Array.from(userBestMap.values())
    .sort((a, b) => b.final_score - a.final_score)
    .slice(0, 20);

  // 批量查用户名
  const userIds = topRecords.map((r) => r.user_id);
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, username")
    .in("id", userIds);

  if (usersError) {
    return NextResponse.json(
      { error: "获取用户信息失败" },
      { status: 500 }
    );
  }

  const usernameMap = new Map<number, string>();
  if (users) {
    for (const u of users as Array<{ id: number; username: string }>) {
      usernameMap.set(u.id, u.username);
    }
  }

  const leaderboard = topRecords.map((record, index) => ({
    rank: index + 1,
    userId: record.user_id,
    username: usernameMap.get(record.user_id) ?? "匿名用户",
    finalScore: record.final_score,
    scenario: record.scenario,
    result: record.result,
    playedAt: record.played_at,
  }));

  return NextResponse.json({
    success: true,
    data: leaderboard,
  });
}
