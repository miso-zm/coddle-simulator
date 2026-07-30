import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { getUserById, type PublicUser } from "./user-repo";

const JWT_SECRET = process.env.JWT_SECRET || "coze-honghong-dev-secret-change-in-prod";
const JWT_EXPIRES_IN = "7d";
const COOKIE_NAME = "honghong_token";
const SALT_ROUNDS = 10;

/**
 * 哈希密码
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 验证密码
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * 生成 JWT token
 */
export function generateToken(userId: number): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * 解析 JWT token
 */
export function verifyToken(token: string): { sub: number } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as { sub: number };
    return decoded;
  } catch {
    return null;
  }
}

/**
 * 设置登录 Cookie
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  const isProd = process.env.COZE_PROJECT_ENV === "PROD";
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 天
  });
}

/**
 * 清除登录 Cookie
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  const isProd = process.env.COZE_PROJECT_ENV === "PROD";
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * 从请求中获取当前登录用户（服务端使用）
 */
export async function getCurrentUser(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  return getUserById(decoded.sub);
}

export { COOKIE_NAME };
