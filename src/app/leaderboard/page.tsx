"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Clock, User } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  finalScore: number;
  scenario: string;
  result: string;
  playedAt: string;
}

export default function LeaderboardPage() {
  const [list, setList] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 拉取当前登录用户
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setCurrentUserId(data.data.id);
        }
      })
      .catch(() => {});

    // 拉取排行榜
    fetch("/api/leaderboard", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setList(data.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "刚刚";
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return d.toLocaleDateString("zh-CN");
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1)
      return "bg-gradient-to-r from-yellow-400 to-amber-500 text-white";
    if (rank === 2)
      return "bg-gradient-to-r from-gray-300 to-gray-400 text-white";
    if (rank === 3)
      return "bg-gradient-to-r from-orange-400 to-amber-600 text-white";
    return "bg-gray-100 text-gray-500";
  };

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
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-amber-500" />
            <h1 className="text-lg font-semibold text-gray-700">排行榜</h1>
          </div>
          <div className="w-5" />
        </div>
      </div>

      {/* 内容 */}
      <div className="max-w-md mx-auto px-4 py-6">
        {/* 说明文字 */}
        <div className="mb-4 text-center">
          <p className="text-sm text-gray-400">
            全服最高分 Top 20 · 仅登录用户成绩上榜
          </p>
        </div>

        {/* 排行榜列表 */}
        {loading ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 text-center border border-pink-100">
            <div className="text-gray-400 text-sm">加载中...</div>
          </div>
        ) : list.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 text-center border border-pink-100">
            <div className="text-5xl mb-4">🏆</div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              还没有人上榜
            </h2>
            <p className="text-sm text-gray-400">
              快去玩一局，成为第一个上榜的人吧！
            </p>
          </div>
        ) : (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-pink-100 overflow-hidden">
            {list.map((entry, index) => {
              const isCurrentUser = entry.userId === currentUserId;
              return (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-pink-50 last:border-b-0 transition-all ${
                    isCurrentUser
                      ? "bg-pink-50/80 border-l-4 border-l-pink-400"
                      : "hover:bg-pink-50/40"
                  }`}
                >
                  {/* 排名 */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${getRankStyle(
                      entry.rank
                    )}`}
                  >
                    {entry.rank <= 3 ? (
                      <Trophy size={14} />
                    ) : (
                      entry.rank
                    )}
                  </div>

                  {/* 用户信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center text-white text-xs flex-shrink-0">
                        <User size={12} />
                      </div>
                      <span
                        className={`font-medium truncate ${
                          isCurrentUser ? "text-pink-600" : "text-gray-700"
                        }`}
                      >
                        {entry.username}
                        {isCurrentUser && (
                          <span className="ml-1 text-xs text-pink-500">
                            （我）
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <span className="truncate">{entry.scenario}</span>
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <Clock size={10} />
                        {formatDate(entry.playedAt)}
                      </span>
                    </div>
                  </div>

                  {/* 分数 */}
                  <div className="text-right flex-shrink-0">
                    <div
                      className={`text-lg font-bold ${
                        entry.result === "win"
                          ? "text-green-500"
                          : "text-orange-500"
                      }`}
                    >
                      {entry.finalScore}
                    </div>
                    <div className="text-xs text-gray-400">
                      {entry.result === "win" ? "通关" : "未通关"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 未登录提示 */}
        {!loading && !currentUserId && (
          <div className="mt-6 bg-white/50 backdrop-blur-sm rounded-2xl p-4 text-center border border-pink-100">
            <p className="text-sm text-gray-500 mb-3">
              登录后你的最高分也能上榜哦～
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-2 bg-gradient-to-r from-pink-500 to-orange-400 text-white text-sm font-medium rounded-full hover:shadow-lg hover:shadow-pink-200 transition-all"
            >
              去登录
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
