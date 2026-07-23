"use client";

import { Avatar } from "./avatar";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface ChatBubbleProps {
  message: ChatMessage;
  gender: "girlfriend" | "boyfriend" | null;
  isLatest?: boolean;
}

export function ChatBubble({ message, gender, isLatest }: ChatBubbleProps) {
  const isPartner = message.role === "partner";
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (!audioRef.current || !message.audioUri) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [message.audioUri]);

  // 最新一条对方消息自动播放一次？
  // 按照用户要求：用户点击播放才有语音播放
  // 所以不自动播放

  return (
    <div
      className={cn(
        "flex gap-2 mb-4 animate-bubble-in",
        isPartner ? "justify-start" : "justify-end flex-row-reverse",
      )}
    >
      <Avatar role={message.role} gender={gender} size="md" />

      <div className="max-w-[70%]">
        <div
          className={cn(
            "relative px-4 py-2.5 text-[15px] leading-relaxed shadow-sm",
            isPartner
              ? "bg-white text-gray-800 rounded-2xl rounded-tl-md bubble-left"
              : "bg-[#95EC69] text-gray-800 rounded-2xl rounded-tr-md bubble-right",
          )}
        >
          {message.text}
        </div>

        {/* 语音播放按钮 - 只有对方消息且有语音时显示 */}
        {isPartner && message.audioUri && (
          <button
            onClick={togglePlay}
            className="mt-1 flex items-center gap-1 text-xs text-gray-400 hover:text-pink-500 transition-colors btn-press"
          >
            {isPlaying ? (
              <>
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
                <span>播放中…</span>
              </>
            ) : (
              <>
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>播放语音</span>
              </>
            )}
            <audio ref={audioRef} src={message.audioUri} preload="none" />
          </button>
        )}

        {/* 好感度变化提示（对方消息才有） */}
        {isPartner &&
          message.scoreChange !== undefined &&
          message.scoreChange !== 0 && (
            <div
              className={cn(
                "mt-1 text-xs font-medium",
                message.scoreChange > 0 ? "text-green-500" : "text-red-500",
              )}
            >
              {message.scoreChange > 0 ? "↑" : "↓"}{" "}
              {Math.abs(message.scoreChange)}
            </div>
          )}
      </div>

      {isPartner && isLatest && (
        <audio ref={audioRef} src={message.audioUri} className="hidden" />
      )}
    </div>
  );
}

// 正在输入的占位气泡
export function TypingBubble({ gender }: { gender: "girlfriend" | "boyfriend" | null }) {
  return (
    <div className="flex gap-2 mb-4 animate-bubble-in">
      <Avatar role="partner" gender={gender} size="md" />
      <div className="relative px-4 py-3 bg-white rounded-2xl rounded-tl-md shadow-sm bubble-left">
        <div className="flex gap-1">
          <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
          <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
          <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
        </div>
      </div>
    </div>
  );
}
