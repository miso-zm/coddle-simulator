import Link from "next/link";
import { getAllBlogPosts } from "@/lib/blog-posts";
import { Heart, ArrowLeft, Clock } from "lucide-react";

export default function BlogListPage() {
  const posts = getAllBlogPosts();

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
        </div>
      </div>

      {/* 文章列表 */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {posts.map((post, index) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block animate-fade-slide-up"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="bg-white rounded-2xl p-5 shadow-card hover:shadow-deep hover:-translate-y-1 transition-all duration-300 border border-pink-100/50 group">
              <div className="flex gap-4">
                {/* 左侧大图标 */}
                <div className="shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                  {post.coverEmoji}
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
                    <span>{post.readTime} 分钟阅读</span>
                    <span className="text-pink-200">·</span>
                    <span className="text-pink-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                      阅读全文
                      <svg
                        className="w-3 h-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
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
    </div>
  );
}
