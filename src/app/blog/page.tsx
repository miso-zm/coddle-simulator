import Link from "next/link";
import { getAllBlogPosts } from "@/storage/database/blog-repo";
import { Heart, ArrowLeft, BookOpen, Clock, Sparkles } from "lucide-react";
import { GeneratePostButton } from "./generate-button";

export const dynamic = 'force-dynamic';

export default async function BlogListPage() {
  let posts: Awaited<ReturnType<typeof getAllBlogPosts>> = [];

  try {
    posts = await getAllBlogPosts();
  } catch (error) {
    console.error("[blog] 文章列表暂时不可用", error);
  }

  const hasPosts = posts.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-orange-50">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-pink-100/50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="p-2 -ml-2 rounded-full hover:bg-pink-100/60 transition-all text-gray-600 hover:text-pink-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
              恋爱攻略
            </h1>
            <p className="text-xs text-gray-500">学点小技巧，谈场甜甜的恋爱</p>
          </div>
          {hasPosts && <GeneratePostButton />}
        </div>
      </div>

      {/* 文章列表 */}
      {hasPosts ? (
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {posts.map((post, index) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="block animate-fade-slide-up"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="bg-white rounded-2xl p-5 shadow-card hover:shadow-deep hover:-translate-y-1 transition-all duration-300 border border-pink-100/50 group">
                <div className="flex gap-4">
                  {/* 左侧大图标 */}
                  <div className="shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                    {post.emoji}
                  </div>
                  {/* 右侧内容 */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-bold text-gray-800 mb-1.5 group-hover:text-pink-500 transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-3">
                      {post.summary}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{post.read_time} 分钟阅读</span>
                      <span className="text-pink-200">·</span>
                      <span className="text-pink-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                        阅读全文
                        <ArrowLeft className="h-3 w-3 rotate-180" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* 底部提示 */}
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">更多内容持续更新中…</p>
            <p className="text-xs text-gray-300 mt-1">💝 愿每段感情都被温柔对待</p>
          </div>
        </div>
      ) : (
        <main className="mx-auto flex min-h-[calc(100dvh-73px)] max-w-lg items-center px-5 py-12">
          <section className="w-full rounded-3xl border border-pink-100 bg-white/80 px-6 py-10 text-center shadow-[0_20px_60px_rgba(255,107,157,0.12)] backdrop-blur-sm animate-fade-slide-up">
            <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-pink-100 to-orange-100 text-pink-500">
              <BookOpen className="h-11 w-11" strokeWidth={1.7} />
              <span className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-orange-400 shadow-sm">
                <Sparkles className="h-4 w-4" />
              </span>
            </div>

            <h2 className="text-2xl font-bold text-gray-800">正在抓紧开发中</h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-500">
              恋爱攻略正在认真整理，稍后会带着实用的沟通技巧回来。
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-200/60 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Heart className="h-4 w-4 fill-white" />
              先去练习哄人
            </Link>
          </section>
        </main>
      )}
    </div>
  );
}
