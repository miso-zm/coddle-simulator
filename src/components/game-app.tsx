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
import { ChatBubble } from "./chat-bubble";
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

  // 异步获取语音并更新指定消息的 audioUri（不阻塞 UI）
  const fetchAudioForMessage = useCallback(async (messageId: string, text: string) => {
    if (!voice || !text) return;
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.audioUri) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, audioUri: data.audioUri } : m)),
        );
      }
    } catch {
      // 语音失败不影响主流程
    }
  }, [voice]);

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
          audioUri: undefined,
        };

        setMessages([firstMessage]);
        setCurrentOptions(data.options);

        // 后台异步生成语音，不阻塞显示
        fetchAudioForMessage(firstMessage.id, data.message);
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

      // 添加用户消息（带上选项解析）
      const userMsgId = `user-${Date.now()}`;
      const userMessage: ChatMessage = {
        id: userMsgId,
        role: "user",
        text: option.text,
        round,
        optionAnalysis: option.analysis,
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
          audioUri: undefined,
          analysis: data.selectedAnalysis || "",
        };

        setMessages((prev) => [...prev, partnerMessage]);

        // 后台异步生成语音，不阻塞 UI
        fetchAudioForMessage(partnerMsgId, data.message);

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
    <div className="flex flex-col h-screen max-w-md mx-auto relative overflow-hidden chat-bg md:shadow-2xl md:my-4 md:rounded-3xl md:h-[calc(100vh-2rem)] md:border md:border-pink-100">
      {/* 顶部导航栏 — 玻璃拟态 */}
      <div className="glass-nav flex items-center justify-between px-4 py-3 z-20 relative">
        <button
          onClick={backToScenes}
          className="flex items-center gap-1 text-pink-500 hover:text-pink-600 p-1 -ml-1.5 transition-colors active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">返回</span>
        </button>

        <div className="flex flex-col items-center">
          <div className="text-[15px] font-semibold text-gray-800 tracking-tight flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-300 to-rose-400 flex items-center justify-center text-white text-[10px] font-bold">
              TA
            </div>
            {scene?.title}
          </div>
          <div className="mood-tag text-pink-600 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
            {score >= 80 ? "已原谅" : score >= 60 ? "快哄好了" : score >= 30 ? "开始软化" : score >= 0 ? "还在生气" : "非常生气"}
          </div>
        </div>

        <button className="p-1.5 -mr-1 text-pink-400 hover:text-pink-600 transition-colors active:scale-95">
          <svg className="w-[20px] h-[20px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
        </button>
      </div>

      {/* 好感度进度条 — 精致胶囊款 */}
      <div className="px-5 py-2 z-10 relative">
        <div className="flex items-center justify-between text-xs text-pink-500/70 mb-1.5">
          <span className="font-medium">好感度</span>
          <span className={cn(
            "font-bold text-pink-500 tabular-nums",
            animateDirection === "up" && "text-green-500 animate-bounce-in",
            animateDirection === "down" && "text-red-500 animate-pulse"
          )}>
            {score} / 80
          </span>
        </div>
        <div className={cn(
          "affinity-bar",
          animateDirection === "up" && "animate-score-up",
          animateDirection === "down" && "animate-score-down"
        )}>
          <div
            className="affinity-fill"
            style={{
              width: `${Math.max(0, Math.min(100, ((score + 50) / 130) * 100))}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-pink-300 mt-1">
          <span>−50</span>
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>

      {/* 聊天区域 */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-3 pretty-scroll relative z-10"
      >
        {/* 轮次提示 */}
        <div className="flex justify-center mb-4">
          <div className="system-msg">
            第 {Math.min(round, TOTAL_ROUNDS)} / {TOTAL_ROUNDS} 轮
          </div>
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className="mb-4">
            <ChatBubble message={msg} />
          </div>
        ))}

        {isLoading && (
          <div className="mb-4">
            <ChatBubble
              message={{
                id: "typing",
                role: "partner",
                text: "",
                scoreChange: 0,
                round,
              }}
              isTyping={true}
            />
          </div>
        )}

        {error && (
          <div className="flex justify-center my-4 animate-fade-in">
            <div className="bg-red-50/80 backdrop-blur-sm text-red-500 text-sm px-4 py-2.5 rounded-xl border border-red-100 shadow-sm">
              {error}
              <button
                onClick={retryRound}
                className="ml-2 underline font-medium hover:text-red-600"
              >
                重试
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 底部区域 — 玻璃拟态输入栏 */}
      {(phase === "playing" || phase === "won" || phase === "lost") &&
        currentOptions.length > 0 && (
          <div className="glass-input relative z-10">
            {/* 输入框提示行 */}
            <div className="flex items-center px-4 pt-3 pb-2 gap-2">
              <button className="p-1.5 text-pink-400 hover:text-pink-500 transition-colors">
                <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M12 2v10m0 0l-3-3m3 3l3-3M5 14v5a2 2 0 002 2h10a2 2 0 002-2v-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="flex-1 input-field h-10 px-4 flex items-center text-pink-300 text-sm">
                <span className="truncate">选择下方回复，看看对方反应…</span>
              </div>
              <button className="p-1.5 text-pink-400 hover:text-pink-500 transition-colors">
                <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8 12h8M12 8v8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* 选项 / 结束面板 */}
            <div className="px-4 pb-4 pt-1">
              {phase === "playing" && (
                <OptionButtons
                  options={currentOptions}
                  onSelect={(opt) => {
                    const idx = currentOptions.indexOf(opt);
                    handleSelectOption(opt, idx);
                  }}
                  disabled={isLoading}
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
        <div className="relative inline-block mb-4">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-heartbeat">
            <defs>
              <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6B9D" />
                <stop offset="100%" stopColor="#FF8C42" />
              </linearGradient>
              <filter id="heartShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#FF6B9D" floodOpacity="0.3" />
              </filter>
            </defs>
            <path
              d="M40 68C40 68 12 48 12 30C12 18 21 10 30 10C34.5 10 38 12 40 15C42 12 45.5 10 50 10C59 10 68 18 68 30C68 48 40 68 40 68Z"
              fill="url(#heartGrad)"
              filter="url(#heartShadow)"
            />
            <path
              d="M26 22C29 20 33 21 35 24C35.5 24.8 35 26 34.2 26.5C33.4 27 32.2 26.7 31.8 25.8C30.5 24 28 23.5 26.5 24.5C25.8 25 24.8 24.7 24.5 24C23.8 22.5 24.5 20.5 26 22Z"
              fill="white"
              fillOpacity="0.6"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent mb-2">
          哄哄模拟器
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed max-w-[260px] text-center">
          学一点高情商沟通，哄好生气的TA
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
        开始练习
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
