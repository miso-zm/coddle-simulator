import { NextResponse } from "next/server";
import { getCurrentUser } from "@/storage/database/auth";
import { getRecordsByUserId } from "@/storage/database/game-record-repo";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const records = await getRecordsByUserId(user.id);

    return NextResponse.json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error("获取游戏记录失败:", error);
    return NextResponse.json(
      { error: "获取失败" },
      { status: 500 }
    );
  }
}
