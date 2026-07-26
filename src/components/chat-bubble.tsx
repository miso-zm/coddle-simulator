"use client";

import { useEffect, useState } from "react";
import type { ChatMessage } from "@/lib/types";

interface ChatBubbleProps {
  message: ChatMessage;
  isTyping?: boolean;
}

export function ChatBubble({ message, isTyping = false }: ChatBubbleProps) {
  const isMe = message.role === "user";
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isTyping) return;
    if (message.role === "user") {
      setDisplayedText(message.text);
      setIsComplete(true);
      return;
    }

    let i = 0;
    const text = message.text;
    const speed = Math.max(15, Math.floor(600 / text.length));

    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [message.text, message.role, isTyping]);

  if (isTyping) {
    return (
      <div className="flex items-start gap-2 animate-bubble-in">
        {/* 头像占位，与上方头像对齐 */}
        <div className="w-9 h-9 flex-shrink-0 opacity-0" />
        <div className="bubble-other px-4 py-3 flex items-center gap-1">
          <span className="typing-dot w-1.5 h-1.5 rounded-full" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 animate-bubble-in">
      {/* 气泡行 */}
      <div className={`flex items-start gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
        <div className={`w-9 h-9 flex-shrink-0 rounded-full overflow-hidden ${isMe ? "bg-gradient-to-br from-pink-400 to-rose-500" : "bg-gradient-to-br from-pink-200 to-pink-300"}`}>
          {/* 简化头像 */}
          <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
            {isMe ? "我" : "TA"}
          </div>
        </div>
        <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1.5`}>
          <div className={`${isMe ? "bubble-me" : "bubble-other"} px-4 py-2.5 text-[15px] leading-relaxed`}>
            <p className={isMe ? "text-white" : "text-gray-800"}>{displayedText}</p>
            {!isComplete && message.role !== "user" && (
              <span className="inline-block w-0.5 h-4 bg-pink-400 ml-0.5 align-middle animate-pulse" />
            )}
          </div>
          {/* 语音播放按钮（仅对方消息） */}
          {!isMe && isComplete && (
            message.audioUri ? (
              <button
                onClick={() => {
                  const audio = new Audio(message.audioUri!);
                  audio.play().catch(() => {});
                }}
                className="voice-btn"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                听语音
              </button>
            ) : (
              <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse" />
                语音生成中…
              </span>
            )
          )}
        </div>
      </div>

      {/* 沟通小贴士 — 在对方气泡下方展示 */}
      {!isMe && message.analysis && isComplete && (
        <div className="ml-11 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <div className={`tip-card p-3 text-xs leading-relaxed max-w-[85%] ${
            message.scoreChange && message.scoreChange > 0 ? "tip-card-green text-green-700" : "text-amber-700"
          }`}>
            <div className="font-semibold mb-1 flex items-center gap-1 relative z-10">
              <span>💡</span>
              <span>{message.scoreChange && message.scoreChange > 0 ? "加分原因" : "踩雷了哦"}</span>
            </div>
            <p className="relative z-10">{message.analysis}</p>
          </div>
        </div>
      )}
    </div>
  );
}
