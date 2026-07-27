"use client";

import { Share2 } from "lucide-react";

interface ShareButtonProps {
  title: string;
  text: string;
}

export function ShareButton({ title, text }: ShareButtonProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text });
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
    <button
      className="p-2 rounded-full hover:bg-pink-100/60 transition-all text-gray-500 hover:text-pink-500"
      onClick={handleShare}
    >
      <Share2 className="w-5 h-5" />
    </button>
  );
}
