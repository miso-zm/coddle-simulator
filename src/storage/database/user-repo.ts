import { getSupabaseClient } from './supabase-client';

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

/**
 * 根据 id 获取用户
 */
export async function getUserById(id: number): Promise<PublicUser | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('users')
    .select('id, username, created_at')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`获取用户失败: ${error.message}`);
  }
  return data as PublicUser;
}

/**
 * 根据用户名获取用户（含密码哈希，用于登录验证）
 */
export async function getUserByUsernameWithPassword(username: string): Promise<User | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`获取用户失败: ${error.message}`);
  }
  return data as User;
}

/**
 * 根据用户名获取公开信息
 */
export async function getUserByUsername(username: string): Promise<PublicUser | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('users')
    .select('id, username, created_at')
    .eq('username', username)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`获取用户失败: ${error.message}`);
  }
  return data as PublicUser;
}

/**
 * 创建用户
 */
export async function createUser(params: {
  username: string;
  passwordHash: string;
}): Promise<PublicUser> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('users')
    .insert({
      username: params.username,
      password_hash: params.passwordHash,
    })
    .select('id, username, created_at')
    .single();

  if (error) throw new Error(`创建用户失败: ${error.message}`);
  return data as PublicUser;
}
