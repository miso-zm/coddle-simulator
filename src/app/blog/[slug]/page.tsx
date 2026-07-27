import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Heart } from "lucide-react";
import { getBlogPostBySlug } from "@/storage/database/blog-repo";
import { ShareButton } from "./share-button";

export const dynamic = 'force-dynamic';

export default async function BlogDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const post = await getBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

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
              {post.read_time} 分钟阅读
            </p>
          </div>
          <ShareButton title={post.title} text={post.summary} />
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
          <span className="text-6xl animate-float">{post.emoji}</span>
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
            ← 回到恋爱攻略列表
          </Link>
        </div>
      </article>
    </div>
  );
}
