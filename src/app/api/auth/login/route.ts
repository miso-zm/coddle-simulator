import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserByUsernameWithPassword } from "@/storage/database/user-repo";
import { verifyPassword, generateToken, setAuthCookie } from "@/storage/database/auth";

const loginSchema = z.object({
  username: z.string().min(1, "请输入用户名"),
  password: z.string().min(1, "请输入密码"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "请输入用户名和密码" },
        { status: 400 },
      );
    }

    const { username, password } = parsed.data;

    // 查找用户
    const user = await getUserByUsernameWithPassword(username);
    if (!user) {
      return NextResponse.json(
        { error: "用户名或密码错误" },
        { status: 401 },
      );
    }

    // 验证密码
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "用户名或密码错误" },
        { status: 401 },
      );
    }

    // 生成 token 并设置 cookie
    const token = generateToken(user.id);
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      data: { id: user.id, username: user.username },
    });
  } catch (error) {
    console.error("[auth/login] 登录失败", error);
    return NextResponse.json(
      { error: "登录失败，请稍后重试" },
      { status: 500 },
    );
  }
}
