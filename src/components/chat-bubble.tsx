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
  const [displayedText, setDisplayedText] = useState("");

  // 打字机效果（对方消息）
  useEffect(() => {
    if (!isPartner) {
      setDisplayedText(message.text);
      return;
    }

    // 已显示过的不再重新打
    if (displayedText.length >= message.text.length) return;

    let i = displayedText.length;
    const text = message.text;
    const timer = setInterval(() => {
      i += 1;
      setDisplayedText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
      }
    }, 25);

    return () => clearInterval(timer);
  }, [message.text, isPartner]);

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

  const isTyping = isPartner && displayedText.length === 0 && isLatest;

  return (
    <div
      className={cn(
        "flex gap-2 mb-3 animate-bubble-in",
        isPartner ? "justify-start" : "justify-end",
      )}
    >
      {/* 头像 - 左侧（对方）或右侧（用户） */}
      {isPartner && <Avatar role="partner" gender={gender} size="sm" />}
      {!isPartner && <Avatar role="user" gender={gender} size="sm" />}

      <div className="max-w-[72%]">
        <div
          className={cn(
            "relative px-3.5 py-2.5 text-[15px] leading-relaxed rounded-[14px]",
            isPartner
              ? "bg-white text-gray-800 bubble-left-wechat bubble-shine-left"
              : "bg-[#95EC69] text-[#1a1a1a] bubble-right-wechat bubble-shine-right",
          )}
        >
          {isTyping ? (
            <div className="flex items-center gap-1 px-1 py-1">
              <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full" />
              <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full" />
              <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full" />
            </div>
          ) : (
            <div className="whitespace-pre-wrap break-words">
              {isPartner ? displayedText : message.text}
              {/* 打字光标 */}
              {isLatest && isPartner && displayedText.length < message.text.length && (
                <span className="inline-block w-[2px] h-4 bg-gray-500/50 ml-0.5 animate-pulse align-[-3px]" />
              )}
            </div>
          )}
        </div>

        {/* 语音播放按钮（对方消息才有） */}
        {!isTyping && isPartner && message.audioUri && (
          <button
            onClick={togglePlay}
            className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors btn-press"
          >
            {isPlaying ? (
              <>
                <span className="flex items-end gap-0.5 h-3">
                  <span className="w-[2px] h-2 bg-gray-400 animate-pulse" style={{animationDelay: '0s'}} />
                  <span className="w-[2px] h-3 bg-gray-400 animate-pulse" style={{animationDelay: '0.15s'}} />
                  <span className="w-[2px] h-2 bg-gray-400 animate-pulse" style={{animationDelay: '0.3s'}} />
                </span>
                <span>播放中</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>语音</span>
              </>
            )}
            <audio ref={audioRef} src={message.audioUri} preload="none" />
          </button>
        )}

        {/* 好感度变化提示（对方消息才有） */}
        {!isTyping && isPartner &&
          message.scoreChange !== undefined &&
          message.scoreChange !== 0 && (
            <div
              className={cn(
                "mt-1 text-xs font-semibold",
                message.scoreChange > 0
                  ? "text-green-500 animate-score-up"
                  : "text-red-500 animate-score-down",
              )}
            >
              {message.scoreChange > 0 ? "↑ +" : "↓ "}
              {message.scoreChange}
            </div>
          )}

        {/* 沟通小贴士解析（对方消息才有） */}
        {!isTyping && isPartner && message.analysis && (
          <div className="analysis-card mt-2 px-3 py-2 text-[13px] text-amber-800 leading-relaxed animate-fade-in">
            <span className="font-medium">💡 沟通小贴士：</span>
            {message.analysis}
          </div>
        )}
      </div>
    </div>
  );
}

// 正在输入的气泡组件
export function TypingBubble({ gender }: { gender: "girlfriend" | "boyfriend" | null }) {
  return (
    <div className="flex gap-2 mb-3 animate-bubble-in">
      <Avatar role="partner" gender={gender} size="sm" />
      <div className="bg-white rounded-[14px] px-3.5 py-2.5 bubble-left-wechat bubble-shine-left">
        <div className="flex items-center gap-1">
          <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full" />
          <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full" />
          <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full" />
        </div>
      </div>
    </div>
  );
}
