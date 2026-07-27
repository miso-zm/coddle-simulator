"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, Heart, Home, Share2 } from "lucide-react";
import { getAllBlogPosts, getBlogPost } from "@/lib/blog-posts";

export default function BlogDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const post = getBlogPost(params.slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">文章不存在</p>
          <Link
            href="/blog"
            className="text-pink-500 hover:text-pink-600 font-medium"
          >
            返回列表
          </Link>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, text: post.summary });
      } catch {
        // 用户取消分享
      }
    } else {
      // 复制链接
      await navigator.clipboard.writeText(window.location.href);
      alert("链接已复制到剪贴板~");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-orange-50">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-pink-100/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/blog"
            className="p-2 -ml-2 rounded-full hover:bg-pink-100/60 transition-all text-gray-600 hover:text-pink-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-gray-700 truncate">
              {post.title}
            </h1>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.readTime} 分钟阅读
            </p>
          </div>
          <button
            className="p-2 rounded-full hover:bg-pink-100/60 transition-all text-gray-500 hover:text-pink-500"
            onClick={handleShare}
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 文章内容 */}
      <article className="max-w-2xl mx-auto px-5 py-8 animate-fade-slide-up">
        {/* 头部 */}
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100/60 text-pink-600 text-xs font-medium mb-4">
            <Heart className="w-3 h-3 fill-pink-500" />
            恋爱攻略
          </div>
          <h1 className="text-2xl font-bold text-gray-800 leading-tight mb-3">
            {post.title}
          </h1>
          <p className="text-gray-500 leading-relaxed">{post.summary}</p>
        </header>

        {/* 封面 emoji */}
        <div className="w-full h-40 rounded-2xl bg-gradient-to-br from-pink-100 via-orange-50 to-pink-100 flex items-center justify-center mb-8 shadow-soft">
          <span className="text-6xl animate-float">{post.coverEmoji}</span>
        </div>

        {/* 正文 */}
        <div
          className="prose prose-pink max-w-none
            prose-p:text-gray-700 prose-p:leading-relaxed prose-p:my-4
            prose-h3:text-gray-800 prose-h3:text-lg prose-h3:font-bold prose-h3:mt-8 prose-h3:mb-3 prose-h3:flex prose-h3:items-center prose-h3:gap-2
            prose-strong:text-pink-600
            prose-em:text-gray-600
            prose-p:first:mt-0
          "
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* 底部卡片 */}
        <div className="mt-12 p-5 rounded-2xl bg-gradient-to-br from-pink-100/80 to-orange-100/80 border border-pink-200/50">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💝</div>
            <div>
              <p className="font-bold text-gray-800 mb-1">觉得有用？分享给 TA 一起看</p>
              <p className="text-sm text-gray-600">
                好的关系，是两个人一起学习成长的。
              </p>
            </div>
          </div>
        </div>

        {/* 回到列表 */}
        <div className="mt-8 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm text-pink-500 hover:text-pink-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回攻略列表
          </Link>
        </div>
      </article>
    </div>
  );
}
