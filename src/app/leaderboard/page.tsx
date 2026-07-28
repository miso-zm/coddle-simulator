import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-orange-50 to-amber-50">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-white/70 backdrop-blur-md border-b border-pink-100">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="text-gray-500 hover:text-pink-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-semibold text-gray-700">排行榜</h1>
          <div className="w-5" />
        </div>
      </div>

      {/* 内容 */}
      <div className="max-w-md mx-auto px-4 py-10">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 text-center border border-pink-100">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            排行榜即将上线
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            我们正在筹备全服排行榜功能
            <br />
            届时可以和所有玩家一较高下
            <br />
            敬请期待～
          </p>
          <Link
            href="/"
            className="inline-block mt-6 px-6 py-2 bg-gradient-to-r from-pink-400 to-orange-400 text-white text-sm font-medium rounded-full hover:shadow-lg hover:shadow-pink-200 transition-all duration-200 btn-press"
          >
            回去练习
          </Link>
        </div>
      </div>
    </div>
  );
}
