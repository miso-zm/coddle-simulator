import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createUser, getUserByUsername } from "@/storage/database/user-repo";
import { hashPassword, generateToken, setAuthCookie } from "@/storage/database/auth";

const registerSchema = z.object({
  username: z
    .string()
    .min(2, "用户名至少 2 个字符")
    .max(20, "用户名最多 20 个字符")
    .regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, "用户名只能包含字母、数字、下划线或中文"),
  password: z
    .string()
    .min(6, "密码至少 6 个字符")
    .max(50, "密码最多 50 个字符"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { username, password } = parsed.data;

    // 检查用户名是否已存在
    const existing = await getUserByUsername(username);
    if (existing) {
      return NextResponse.json(
        { error: "该用户名已被注册" },
        { status: 409 },
      );
    }

    // 哈希密码
    const passwordHash = await hashPassword(password);

    // 创建用户
    const user = await createUser({ username, passwordHash });

    // 生成 token 并设置 cookie
    const token = generateToken(user.id);
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      data: { id: user.id, username: user.username },
    });
  } catch (error) {
    console.error("[auth/register] 注册失败", error);
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 },
    );
  }
}
