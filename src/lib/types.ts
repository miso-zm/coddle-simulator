// 游戏核心类型定义

export type Gender = "girlfriend" | "boyfriend";

export type VoiceType =
  | "gentle_female" // 温柔女声
  | "dominant_female" // 霸道御姐
  | "cute_female" // 可爱软妹
  | "deep_male" // 低沉男声
  | "gentle_male"; // 温柔男声

export interface VoiceOption {
  id: VoiceType;
  label: string;
  speakerId: string; // 对应 TTS 的 speaker
  gender: Gender;
  personality: string; // 给 LLM 的性格描述
}

export interface Scene {
  id: string;
  title: string;
  description: string; // 完整场景描述，给 LLM 用
  shortDesc: string; // 卡片上的简短描述
  emoji: string;
}

export type OptionType = "excellent" | "good" | "neutral" | "bad" | "worst";

export interface ChatOption {
  text: string;
  type: OptionType;
  analysis?: string; // 选项解析：为什么好/为什么不好
}

export interface GameRound {
  message: string; // 对方说的话
  scoreChange: number; // 本轮好感度变化
  selectedAnalysis: string; // 对玩家上一轮选择的解析点评
  options: ChatOption[]; // 6个选项
  audioUri?: string; // TTS 语音地址
}

export interface ChatMessage {
  id: string;
  role: "partner" | "user";
  text: string;
  round: number;
  scoreChange?: number; // 只有 partner 消息有
  audioUri?: string;
  analysis?: string; // 沟通小贴士解析
  optionAnalysis?: string; // 玩家选择的选项的解析
}

export type GameStatus = "idle" | "playing" | "won" | "lost";

export interface GameState {
  status: GameStatus;
  gender: Gender | null;
  voice: VoiceType | null;
  scene: Scene | null;
  round: number; // 当前第几轮 (1-10)
  totalRounds: number;
  score: number; // 当前好感度 (-50 ~ 100)
  messages: ChatMessage[];
  currentOptions: ChatOption[];
  isLoading: boolean;
  error: string | null;
}

export interface LocalRecord {
  bestRounds: number;
  bestScore: number;
  playCount: number;
}

export type LocalRecords = Record<string, LocalRecord>;
