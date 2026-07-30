import { getPostgresPool } from "./postgres-client";

export interface User {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface PublicUser {
  id: number;
  username: string;
  created_at: string;
}

interface PublicUserRow {
  id: number;
  username: string;
  created_at: Date | string;
}

interface UserRow extends PublicUserRow {
  password_hash: string;
}

function normalizeCreatedAt(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function toPublicUser(row: PublicUserRow): PublicUser {
  return {
    id: row.id,
    username: row.username,
    created_at: normalizeCreatedAt(row.created_at),
  };
}

function toUser(row: UserRow): User {
  return {
    ...toPublicUser(row),
    password_hash: row.password_hash,
  };
}

/**
 * 根据 id 获取用户
 */
export async function getUserById(id: number): Promise<PublicUser | null> {
  const result = await getPostgresPool().query<PublicUserRow>(
    "SELECT id, username, created_at FROM users WHERE id = $1 LIMIT 1",
    [id],
  );
  return result.rows[0] ? toPublicUser(result.rows[0]) : null;
}

/**
 * 根据用户名获取用户（含密码哈希，用于登录验证）
 */
export async function getUserByUsernameWithPassword(username: string): Promise<User | null> {
  const result = await getPostgresPool().query<UserRow>(
    "SELECT id, username, password_hash, created_at FROM users WHERE username = $1 LIMIT 1",
    [username],
  );
  return result.rows[0] ? toUser(result.rows[0]) : null;
}

/**
 * 根据用户名获取公开信息
 */
export async function getUserByUsername(username: string): Promise<PublicUser | null> {
  const result = await getPostgresPool().query<PublicUserRow>(
    "SELECT id, username, created_at FROM users WHERE username = $1 LIMIT 1",
    [username],
  );
  return result.rows[0] ? toPublicUser(result.rows[0]) : null;
}

/**
 * 创建用户
 */
export async function createUser(params: {
  username: string;
  passwordHash: string;
}): Promise<PublicUser> {
  const result = await getPostgresPool().query<PublicUserRow>(
    `INSERT INTO users (username, password_hash)
     VALUES ($1, $2)
     RETURNING id, username, created_at`,
    [params.username, params.passwordHash],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error("创建用户失败: 数据库未返回新用户记录");
  }
  return toPublicUser(row);
}
