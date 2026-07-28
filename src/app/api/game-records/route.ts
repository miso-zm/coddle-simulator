import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/storage/database/auth";
import { createGameRecord } from "@/storage/database/game-record-repo";

const SaveRecordSchema = z.object({
  scenario: z.string().min(1).max(100),
  finalScore: z.number().int().min(-50).max(100),
  result: z.enum(["win", "lose"]),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = SaveRecordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "参数格式错误" },
        { status: 400 }
      );
    }

    const { scenario, finalScore, result } = parsed.data;

    const record = await createGameRecord({
      userId: user.id,
      scenario,
      finalScore,
      result,
    });

    return NextResponse.json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error("保存游戏记录失败:", error);
    return NextResponse.json(
      { error: "保存失败" },
      { status: 500 }
    );
  }
}
