import { getSupabaseClient } from './supabase-client';

export interface BlogPost {
  id: number;
  title: string;
  summary: string;
  content: string;
  emoji: string;
  read_time: number;
  slug: string;
  created_at: string;
}

export interface NewBlogPost {
  title: string;
  summary: string;
  content: string;
  emoji?: string;
  read_time?: number;
  slug: string;
}

/**
 * 获取所有文章（按创建时间倒序）
 */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`获取文章列表失败: ${error.message}`);
  return data as BlogPost[];
}

/**
 * 根据 id 获取文章详情
 */
export async function getBlogPostById(id: number): Promise<BlogPost | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // 未找到
    throw new Error(`获取文章详情失败: ${error.message}`);
  }
  return data as BlogPost;
}

/**
 * 根据 slug 获取文章详情
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // 未找到
    throw new Error(`获取文章详情失败: ${error.message}`);
  }
  return data as BlogPost;
}

/**
 * 新增一篇文章
 */
export async function createBlogPost(post: NewBlogPost): Promise<BlogPost> {
  const client = getSupabaseClient();
  const insertData: Record<string, unknown> = {
    title: post.title,
    summary: post.summary,
    content: post.content,
    slug: post.slug,
  };
  if (post.emoji !== undefined) insertData.emoji = post.emoji;
  if (post.read_time !== undefined) insertData.read_time = post.read_time;

  const { data, error } = await client
    .from('blog_posts')
    .insert(insertData)
    .select()
    .single();

  if (error) throw new Error(`创建文章失败: ${error.message}`);
  return data as BlogPost;
}

/**
 * 获取文章总数
 */
export async function getBlogPostCount(): Promise<number> {
  const client = getSupabaseClient();
  const { count, error } = await client
    .from('blog_posts')
    .select('*', { count: 'exact', head: true });

  if (error) throw new Error(`获取文章数量失败: ${error.message}`);
  return count ?? 0;
}
