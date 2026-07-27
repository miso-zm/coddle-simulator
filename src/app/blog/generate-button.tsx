"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function GeneratePostButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const resp = await fetch("/api/blog/generate", { method: "POST" });
      const data = await resp.json();
      if (data.success) {
        alert(`新文章生成成功：${data.data.title}`);
        router.refresh();
      } else {
        alert(`生成失败：${data.error || "未知错误"}`);
      }
    } catch (e) {
      alert("生成失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 text-white text-sm font-medium shadow-lg shadow-pink-200/50 hover:shadow-pink-300/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4" />
      )}
      {loading ? "AI 写作中…" : "AI写新文章"}
    </button>
  );
}
