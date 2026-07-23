"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { WIN_SCORE, LOSE_SCORE, INITIAL_SCORE } from "@/lib/constants";

interface AffinityBarProps {
  score: number; // -50 到 100
  round: number;
  totalRounds: number;
  animateDirection?: "up" | "down" | null;
}

export function AffinityBar({
  score,
  round,
  totalRounds,
  animateDirection,
}: AffinityBarProps) {
  const [displayScore, setDisplayScore] = useState(score);

  useEffect(() => {
    setDisplayScore(score);
  }, [score]);

  // 把 -50 ~ 100 的范围映射到 0 ~ 100 的进度条
  const totalRange = WIN_SCORE - LOSE_SCORE; // 150
  const normalizedScore = ((displayScore - LOSE_SCORE) / totalRange) * 100;
  const clampedScore = Math.max(0, Math.min(100, normalizedScore));

  // 计算初始线（20分对应的位置）和胜利线（80分对应的位置）
  const initialLinePos = ((INITIAL_SCORE - LOSE_SCORE) / totalRange) * 100;
  const winLinePos = ((WIN_SCORE - LOSE_SCORE) / totalRange) * 100;

  // 根据分数决定进度条颜色
  const getBarColor = () => {
    if (displayScore >= WIN_SCORE) return "bg-gradient-to-r from-green-400 to-green-500";
    if (displayScore >= 60) return "bg-gradient-to-r from-pink-300 to-pink-500";
    if (displayScore >= 30) return "bg-gradient-to-r from-yellow-300 to-orange-400";
    if (displayScore >= 0) return "bg-gradient-to-r from-orange-400 to-red-400";
    return "bg-gradient-to-r from-red-500 to-red-600";
  };

  const getEmoji = () => {
    if (displayScore >= WIN_SCORE) return "🥰";
    if (displayScore >= 60) return "😊";
    if (displayScore >= 30) return "😐";
    if (displayScore >= 0) return "😤";
    return "😭";
  };

  return (
    <div className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getEmoji()}</span>
          <span className="text-sm text-gray-600">好感度</span>
          <span className="text-sm font-semibold text-gray-800">
            {displayScore}
          </span>
        </div>
        <div className="text-sm text-gray-500">
          第 <span className="font-semibold text-pink-500">{round}</span> 轮 /
          共 {totalRounds} 轮
        </div>
      </div>
      <div
        className={cn(
          "relative h-2.5 bg-gray-100 rounded-full overflow-visible transition-all duration-500",
          animateDirection === "up" && "animate-score-up",
          animateDirection === "down" && "animate-score-down",
        )}
      >
        {/* 初始线标记 */}
        <div
          className="absolute top-0 w-px h-full bg-gray-300 z-10"
          style={{ left: `${initialLinePos}%` }}
        />

        {/* 胜利线标记 */}
        <div
          className="absolute top-0 w-0.5 h-full bg-green-400 z-10"
          style={{ left: `${winLinePos}%` }}
        >
          <div className="absolute -top-4 right-1/2 translate-x-1/2 text-[10px] text-green-600 whitespace-nowrap">
            通关
          </div>
        </div>

        {/* 进度条 */}
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            getBarColor(),
          )}
          style={{ width: `${clampedScore}%` }}
        />
      </div>
    </div>
  );
}
