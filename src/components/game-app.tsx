"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  GameState,
  ChatMessage,
  ChatOption,
  Gender,
  VoiceType,
  Scene,
} from "@/lib/types";
import {
  SCENES,
  VOICE_OPTIONS,
  INITIAL_SCORE,
  WIN_SCORE,
  LOSE_SCORE,
  TOTAL_ROUNDS,
} from "@/lib/constants";
import { ChatBubble, TypingBubble } from "./chat-bubble";
import { OptionButtons } from "./option-buttons";
import { Avatar } from "./avatar";
import { cn } from "@/lib/utils";
import { saveLocalRecord, getSavedVoice, getSavedGender } from "@/lib/storage";
import { BestRecordsPanel } from "./best-records-panel";
import { useSearchParams } from "next/navigation";

type GamePhase = "home" | "gender-select" | "scene-select" | "voice-select" | "playing" | "won" | "lost";

interface HistoryItem {
  user: string;
  partner: string;
  scoreChange: number;
}

export function GameApp() {
  const searchParams = useSearchParams();
  const fromRounds = searchParams.get("rounds");
  const fromResult = searchParams.get("result");

  const [phase, setPhase] = useState<GamePhase>("home");
  const [gender, setGender] = useState<Gender | null>(null);
  const [voice, setVoice] = useState<VoiceType | null>(null);
  const [scene, setScene] = useState<Scene | null>(null);

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(INITIAL_SCORE);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentOptions, setCurrentOptions] = useState<ChatOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animateDirection, setAnimateDirection] = useState<"up" | "down" | null>(
    null,
  );
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 初始化时读取本地存储
  useEffect(() => {
    const savedVoice = getSavedVoice() as VoiceType | null;
    const savedGender = getSavedGender() as Gender | null;
    if (savedVoice) setVoice(savedVoice);
    if (savedGender) setGender(savedGender);
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // 触发好感度动画
  const triggerScoreAnimation = useCallback((direction: "up" | "down") => {
    setAnimateDirection(direction);
    setTimeout(() => setAnimateDirection(null), 700);
  }, []);

  // 生成第一轮对话
  const startGame = useCallback(
    async (selectedScene: Scene) => {
      if (!gender || !voice) return;

      setScene(selectedScene);
      setPhase("playing");
      setRound(1);
      setScore(INITIAL_SCORE);
      setMessages([]);
      setCurrentOptions([]);
      setHistory([]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gender,
            voice,
            sceneId: selectedScene.id,
            round: 1,
            totalRounds: TOTAL_ROUNDS,
            currentScore: INITIAL_SCORE,
            history: [],
            generateAudio: true,
          }),
        });

        if (!response.ok) {
          throw new Error("网络错误");
        }

        const data = await response.json();

        const firstMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: "partner",
          text: data.message,
          round: 1,
          scoreChange: 0,
          audioUri: data.audioUri,
        };

        setMessages([firstMessage]);
        setCurrentOptions(data.options);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败，请重试");
      } finally {
        setIsLoading(false);
      }
    },
    [gender, voice],
  );

  // 选择选项后进入下一轮
  const handleSelectOption = useCallback(
    async (option: ChatOption, index: number) => {
      if (isLoading || !scene || !gender || !voice) return;

      setSelectedOption(index);
      setIsLoading(true);
      setError(null);

      // 添加用户消息
      const userMsgId = `user-${Date.now()}`;
      const userMessage: ChatMessage = {
        id: userMsgId,
        role: "user",
        text: option.text,
        round,
      };

      setMessages((prev) => [...prev, userMessage]);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gender,
            voice,
            sceneId: scene.id,
            round: round + 1,
            totalRounds: TOTAL_ROUNDS,
            currentScore: score,
            userChoice: option.text,
            history,
            generateAudio: true,
          }),
        });

        if (!response.ok) {
          throw new Error("网络错误");
        }

        const data = await response.json();

        // 更新分数
        const newScore = Math.max(
          LOSE_SCORE,
          Math.min(100, score + data.scoreChange),
        );
        setScore(newScore);

        if (data.scoreChange > 0) {
          triggerScoreAnimation("up");
        } else if (data.scoreChange < 0) {
          triggerScoreAnimation("down");
        }

        // 添加对方回复
        const partnerMsgId = `partner-${Date.now()}`;
        const partnerMessage: ChatMessage = {
          id: partnerMsgId,
          role: "partner",
          text: data.message,
          round: round + 1,
          scoreChange: data.scoreChange,
          audioUri: data.audioUri,
        };

        setMessages((prev) => [...prev, partnerMessage]);

        // 更新历史记录
        setHistory((prev) => [
          ...prev,
          { user: option.text, partner: data.message, scoreChange: data.scoreChange },
        ]);

        // 判断游戏结束
        if (newScore >= WIN_SCORE) {
          setPhase("won");
          saveLocalRecord(scene.id, round + 1, newScore, true);
          setIsLoading(false);
          return;
        }

        if (newScore <= LOSE_SCORE) {
          setPhase("lost");
          saveLocalRecord(scene.id, round + 1, newScore, false);
          setIsLoading(false);
          return;
        }

        if (round + 1 > TOTAL_ROUNDS) {
          // 用完了所有轮次
          setPhase("lost");
          saveLocalRecord(scene.id, TOTAL_ROUNDS, newScore, false);
          setIsLoading(false);
          return;
        }

        // 继续下一轮
        setRound(round + 1);
        setCurrentOptions(data.options);
        setSelectedOption(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "出错了，请重试");
        // 回滚用户消息？
      } finally {
        setIsLoading(false);
      }
    },
    [gender, voice, scene, round, score, history, isLoading, triggerScoreAnimation],
  );

  // 重试当前轮
  const retryRound = useCallback(() => {
    setError(null);
    if (round === 1 && scene) {
      startGame(scene);
    }
    // TODO: 其他轮次的重试逻辑
  }, [round, scene, startGame]);

  // 重新开始
  const restartGame = useCallback(() => {
    if (scene) {
      startGame(scene);
    }
  }, [scene, startGame]);

  // 换个场景
  const backToScenes = useCallback(() => {
    setPhase("scene-select");
    setScene(null);
    setMessages([]);
    setCurrentOptions([]);
    setScore(INITIAL_SCORE);
    setRound(1);
    setHistory([]);
  }, []);

  // ============ 渲染 ============

  // 首页
  if (phase === "home") {
    return (
      <HomeScreen
        hasChallenge={!!fromRounds}
        challengeRounds={fromRounds ? parseInt(fromRounds) : null}
        challengeResult={fromResult}
        onStart={() => {
          if (gender && voice) {
            setPhase("scene-select");
          } else if (!gender) {
            setPhase("gender-select");
          } else {
            setPhase("voice-select");
          }
        }}
        onVoiceSettings={() => setPhase("voice-select")}
        savedGender={gender}
        savedVoice={voice}
      />
    );
  }

  // 性别选择
  if (phase === "gender-select") {
    return (
      <GenderSelectScreen
        onSelect={(g) => {
          setGender(g);
          if (voice && VOICE_OPTIONS.find(v => v.id === voice)?.gender === g) {
            setPhase("scene-select");
          } else {
            // 设置默认声音
            const defaultVoice = VOICE_OPTIONS.find((v) => v.gender === g);
            if (defaultVoice) setVoice(defaultVoice.id as VoiceType);
            setPhase("scene-select");
          }
        }}
        onBack={() => setPhase("home")}
      />
    );
  }

  // 场景选择
  if (phase === "scene-select") {
    return (
      <SceneSelectScreen
        onSelect={startGame}
        onBack={() => setPhase("home")}
        onVoiceSettings={() => setPhase("voice-select")}
        gender={gender}
        voice={voice}
      />
    );
  }

  // 声音选择
  if (phase === "voice-select") {
    return (
      <VoiceSelectScreen
        gender={gender || "girlfriend"}
        selectedVoice={voice}
        onSelect={(v) => {
          setVoice(v);
          // 如果是从场景页来的，回去
          setPhase("scene-select");
        }}
        onBack={() => setPhase(scene ? "scene-select" : "home")}
      />
    );
  }

  // 游戏中 / 结束
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#EDEDED] relative overflow-hidden wechat-bg">
      {/* 顶部导航栏 - 微信风格 */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-[#EDEDED] border-b border-gray-200/70 z-10">
        <button
          onClick={backToScenes}
          className="text-gray-700 hover:text-gray-900 p-1 -ml-1 btn-press flex items-center gap-0.5"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-[15px]">返回</span>
        </button>
        <div className="text-[16px] font-medium text-gray-900">
          {scene?.title}
        </div>
        <button className="text-gray-700 p-1 -mr-1 btn-press">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
          </svg>
        </button>
      </div>

      {/* 聊天区域 */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-3 py-3 scrollbar-hide"
      >
        {/* 好感度系统提示（嵌在对话中，像微信的系统提示） */}
        <div className="flex justify-center mb-3">
          <div className={cn(
            "bg-black/10 text-white/90 text-[11px] px-3 py-1 rounded-md backdrop-blur-sm transition-all duration-300",
            animateDirection === "up" && "bg-green-500/30",
            animateDirection === "down" && "bg-red-500/30",
          )}>
            <span className="mr-1">💬 第 {Math.min(round, TOTAL_ROUNDS)} 轮 / 共 {TOTAL_ROUNDS} 轮</span>
            <span className="mx-1 text-white/50">·</span>
            <span>好感度 {score}</span>
            <span className="mx-1 text-white/50">·</span>
            <span>目标 80</span>
          </div>
        </div>

        {messages.map((msg, idx) => (
          <ChatBubble
            key={msg.id}
            message={msg}
            gender={gender}
            isLatest={idx === messages.length - 1}
          />
        ))}

        {isLoading && <TypingBubble gender={gender} />}

        {error && (
          <div className="flex justify-center my-4">
            <div className="bg-red-50 text-red-500 text-sm px-4 py-2 rounded-lg">
              {error}
              <button
                onClick={retryRound}
                className="ml-2 underline font-medium"
              >
                重试
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 底部区域 - 微信输入框风格 */}
      {(phase === "playing" || phase === "won" || phase === "lost") &&
        currentOptions.length > 0 && (
          <div className="bg-[#F7F7F7] border-t border-gray-200/70">
            {/* 工具栏一行 */}
            <div className="flex items-center px-2 py-1.5 gap-2">
              <button className="p-1.5 text-gray-500 btn-press">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="flex-1 h-9 bg-white rounded-lg px-3 flex items-center text-gray-400 text-sm">
                选择下方回复内容
              </div>
              <button className="p-1.5 text-gray-500 btn-press">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <rect x="4" y="4" width="16" height="16" rx="3" />
                  <path d="M4 8h16M8 4v16" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* 选项 / 结束面板 */}
            <div className="px-3 pt-1 pb-3 pb-safe">
              {phase === "playing" && (
                <OptionButtons
                  options={currentOptions}
                  onSelect={(opt) => {
                    const idx = currentOptions.indexOf(opt);
                    handleSelectOption(opt, idx);
                  }}
                  disabled={isLoading}
                  selectedIndex={selectedOption}
                />
              )}

              {phase === "won" && (
                <EndScreen
                  won={true}
                  rounds={round}
                  score={score}
                  scene={scene}
                  onRestart={restartGame}
                  onSwitchScene={backToScenes}
                />
              )}

              {phase === "lost" && (
                <EndScreen
                  won={false}
                  rounds={round}
                  score={score}
                  scene={scene}
                  onRestart={restartGame}
                  onSwitchScene={backToScenes}
                />
              )}
            </div>
          </div>
        )}
    </div>
  );
}

// ==================== 子组件 ====================

function HomeScreen({
  onStart,
  onVoiceSettings,
  savedGender,
  savedVoice,
  hasChallenge,
  challengeRounds,
  challengeResult,
}: {
  onStart: () => void;
  onVoiceSettings: () => void;
  savedGender: Gender | null;
  savedVoice: VoiceType | null;
  hasChallenge: boolean;
  challengeRounds: number | null;
  challengeResult: string | null;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-b from-pink-50 via-white to-orange-50 animate-fade-in">
      {/* Logo 和标题 */}
      <div className="text-center mb-10">
        <div className="text-6xl mb-4">💕</div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent mb-2">
          哄哄模拟器
        </h1>
        <p className="text-gray-500 text-sm">
          你能在10轮内哄好生气的TA吗？
        </p>
      </div>

      {/* 挑战横幅 */}
      {hasChallenge && challengeRounds && (
        <div className="w-full max-w-sm bg-gradient-to-r from-pink-100 to-orange-100 rounded-2xl p-4 mb-4 text-center animate-fade-in">
          <p className="text-sm text-gray-600 mb-1">
            你的朋友用{" "}
            <span className="font-bold text-pink-600">{challengeRounds} 轮</span>{" "}
            就{challengeResult === "win" ? "哄好了" : "没哄好"}！
          </p>
          <p className="text-xs text-gray-500">来试试你能几轮通关？</p>
        </div>
      )}

      {/* 最佳战绩 */}
      <div className="w-full max-w-sm mb-6">
        <BestRecordsPanel />
      </div>

      {/* 主按钮 */}
      <button
        onClick={onStart}
        className="w-full max-w-sm py-4 bg-gradient-to-r from-pink-500 to-orange-400 text-white text-lg font-semibold rounded-2xl shadow-lg shadow-pink-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 btn-press"
      >
        开始游戏
      </button>

      {/* 次级按钮 */}
      <div className="flex gap-4 mt-4">
        <button
          onClick={onVoiceSettings}
          className="text-gray-500 text-sm hover:text-pink-500 transition-colors btn-press"
        >
          🔊 声音设置
        </button>
      </div>

      {/* 底部提示 */}
      <div className="mt-auto text-xs text-gray-400">
        {savedGender && savedVoice
          ? `已选择：${savedGender === "girlfriend" ? "女朋友" : "男朋友"} · ${
              VOICE_OPTIONS.find((v) => v.id === savedVoice)?.label
            }`
          : ""}
      </div>
    </div>
  );
}

function GenderSelectScreen({
  onSelect,
  onBack,
}: {
  onSelect: (gender: Gender) => void;
  onBack: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col px-6 py-8 bg-gradient-to-b from-pink-50 to-white animate-fade-in">
      <button
        onClick={onBack}
        className="text-gray-500 hover:text-gray-700 self-start p-1 -ml-1 btn-press"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex-1 flex flex-col justify-center">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          对方是你的…
        </h2>
        <p className="text-center text-gray-500 text-sm mb-10">
          选一个你想哄的对象
        </p>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => onSelect("girlfriend")}
            className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 w-36 btn-press border-2 border-transparent hover:border-pink-300"
          >
            <Avatar role="partner" gender="girlfriend" size="lg" />
            <span className="font-medium text-gray-700">女朋友</span>
          </button>

          <button
            onClick={() => onSelect("boyfriend")}
            className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 w-36 btn-press border-2 border-transparent hover:border-blue-300"
          >
            <Avatar role="partner" gender="boyfriend" size="lg" />
            <span className="font-medium text-gray-700">男朋友</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function SceneSelectScreen({
  onSelect,
  onBack,
  onVoiceSettings,
  gender,
  voice,
}: {
  onSelect: (scene: Scene) => void;
  onBack: () => void;
  onVoiceSettings: () => void;
  gender: Gender | null;
  voice: VoiceType | null;
}) {
  return (
    <div className="min-h-screen flex flex-col px-4 py-6 bg-gradient-to-b from-pink-50 to-white animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 p-1 -ml-1 btn-press"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-gray-800">选择场景</h2>
        <button
          onClick={onVoiceSettings}
          className="text-gray-400 hover:text-pink-500 text-sm btn-press"
        >
          🔊
        </button>
      </div>

      <div className="flex-1 space-y-3 pb-6">
        {SCENES.map((scene, index) => (
          <button
            key={scene.id}
            onClick={() => onSelect(scene)}
            className={cn(
              "w-full text-left p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 btn-press",
              "border border-gray-100 hover:border-pink-200",
              "animate-fade-in",
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{scene.emoji}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-800 mb-1">{scene.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {scene.shortDesc}
                </p>
              </div>
              <svg
                className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {voice && (
        <div className="text-center text-xs text-gray-400 pb-2">
          当前声音：{VOICE_OPTIONS.find((v) => v.id === voice)?.label}
        </div>
      )}
    </div>
  );
}

function VoiceSelectScreen({
  gender,
  selectedVoice,
  onSelect,
  onBack,
}: {
  gender: Gender;
  selectedVoice: VoiceType | null;
  onSelect: (voice: VoiceType) => void;
  onBack: () => void;
}) {
  const filteredVoices = VOICE_OPTIONS.filter((v) => v.gender === gender);

  const [playingId, setPlayingId] = useState<string | null>(null);

  const playSample = async (voiceId: string, speakerId: string) => {
    if (playingId) return;
    setPlayingId(voiceId);

    try {
      const sampleText =
        gender === "girlfriend" ? "哼，我生气了，你自己想清楚错在哪了！" : "我现在不太想说话，你先好好想想吧。";
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sampleText, voice: voiceId }),
      });

      if (!response.ok) throw new Error("failed");
      const data = await response.json();

      const audio = new Audio(data.audioUri);
      audio.onended = () => setPlayingId(null);
      audio.onerror = () => setPlayingId(null);
      audio.play();
    } catch {
      setPlayingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-4 py-6 bg-gradient-to-b from-pink-50 to-white animate-fade-in">
      <button
        onClick={onBack}
        className="text-gray-500 hover:text-gray-700 self-start p-1 -ml-1 mb-6 btn-press"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <h2 className="text-xl font-semibold text-center text-gray-800 mb-2">
        选择声音
      </h2>
      <p className="text-center text-sm text-gray-500 mb-6">
        点击可以试听
      </p>

      <div className="flex-1 space-y-3">
        {filteredVoices.map((v) => (
          <button
            key={v.id}
            onClick={() => onSelect(v.id as VoiceType)}
            className={cn(
              "w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-200 btn-press",
              selectedVoice === v.id
                ? "bg-pink-50 border-2 border-pink-400"
                : "bg-white border-2 border-transparent hover:border-pink-200 shadow-sm",
            )}
          >
            <Avatar
              role="partner"
              gender={gender}
              size="md"
            />
            <div className="flex-1 text-left">
              <div className="font-medium text-gray-800">{v.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {v.personality.slice(0, 20)}…
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                playSample(v.id, v.speakerId);
              }}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                playingId === v.id
                  ? "bg-pink-500 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-pink-100 hover:text-pink-500",
              )}
            >
              {playingId === v.id ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </button>
        ))}
      </div>
    </div>
  );
}

function EndScreen({
  won,
  rounds,
  score,
  scene,
  onRestart,
  onSwitchScene,
}: {
  won: boolean;
  rounds: number;
  score: number;
  scene: Scene | null;
  onRestart: () => void;
  onSwitchScene: () => void;
}) {
  const [confettiPieces, setConfettiPieces] = useState<
    Array<{ left: number; delay: number; color: string }>
  >([]);

  useEffect(() => {
    if (won) {
      const colors = ["#FF6B9D", "#FFD93D", "#6BCB77", "#4D96FF", "#FF6B6B", "#C56CF0"];
      const pieces = Array.from({ length: 50 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
      setConfettiPieces(pieces);
    }
  }, [won]);

  const shareResult = async () => {
    const shareUrl = `${window.location.origin}?result=${won ? "win" : "lose"}&rounds=${rounds}`;
    const shareText = won
      ? `我在「哄哄模拟器」里只用了 ${rounds} 轮就哄好了${scene?.title}场景的TA！你能几轮通关？`
      : `我在「哄哄模拟器」的${scene?.title}场景里翻车了…你来试试能不能哄好？`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "哄哄模拟器",
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // 用户取消分享
      }
    } else {
      // 复制链接
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert("链接已复制到剪贴板！");
      } catch {
        prompt("复制下面的链接分享给朋友：", shareUrl);
      }
    }
  };

  return (
    <div className="relative py-2 text-center animate-fade-in">
      {/* 撒花效果 */}
      {won && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          {confettiPieces.map((piece, i) => (
            <div
              key={i}
              className="confetti-piece rounded-sm"
              style={{
                left: `${piece.left}%`,
                backgroundColor: piece.color,
                animationDelay: `${piece.delay}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* 结果标题 */}
      <div className={cn("mb-4", !won && "animate-heart-break")}>
        <div className="text-5xl mb-2">{won ? "🥰" : "💔"}</div>
        <h3
          className={cn(
            "text-2xl font-bold",
            won ? "text-pink-500" : "text-gray-600",
          )}
        >
          {won ? "恭喜通关！" : "哄人失败…"}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {won
            ? `你用了 ${rounds} 轮就哄好了TA，好感度 ${score} 分！`
            : `坚持了 ${rounds} 轮，最终好感度 ${score} 分`}
        </p>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-col gap-2">
        <button
          onClick={shareResult}
          className="w-full py-3 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all btn-press"
        >
          📤 分享给朋友
        </button>
        <div className="flex gap-2">
          <button
            onClick={onRestart}
            className="flex-1 py-2.5 bg-pink-50 text-pink-600 font-medium rounded-xl hover:bg-pink-100 transition-colors btn-press"
          >
            再玩一次
          </button>
          <button
            onClick={onSwitchScene}
            className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors btn-press"
          >
            换个场景
          </button>
        </div>
      </div>
    </div>
  );
}
