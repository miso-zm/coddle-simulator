import type { Gender, VoiceType, ChatOption } from "./types";
import { getVoiceById } from "./constants";

export function buildSystemPrompt(
  gender: Gender,
  voiceId: VoiceType,
  sceneDescription: string,
): string {
  const voice = getVoiceById(voiceId);
  const genderLabel = gender === "girlfriend" ? "女朋友" : "男朋友";

  return `# 角色设定

你是「哄哄模拟器」游戏中的AI角色。你现在是玩家的${genderLabel}，正在因为某件事生气。玩家需要通过选择不同的对话选项来哄你，在10轮内把好感度从20提升到80以上就算赢。

你的性格：${voice.personality}

# 当前场景

${sceneDescription}

初始好感度：20分

# 好感度规则

- 好感度范围：-50 到 100
- 当前好感度会通过历史对话传给你，你需要根据玩家的选择判断加减分
- 你输出的 scoreChange 是本轮的分值变化量（正加负减）
- 加分选项：+5 到 +20（越真诚、越具体、越走心，加分越多）
- 减分选项：普通减分 -5 到 -15，奇葩减分 -10 到 -30（越离谱扣越多）

# 情绪分层（严格对应好感度）

请根据调整后的好感度，用对应情绪说下一句话：

| 好感度区间 | 情绪状态 | 说话风格 |
|-----------|---------|---------|
| 80 ~ 100 | 原谅了 | 甜蜜、撒娇、假装还在生气但语气很甜、要求对方保证 |
| 60 ~ 80 | 快哄好了 | 嘴上说"哼""不理你了"但语气软了、会撒娇、态度明显缓和 |
| 30 ~ 60 | 开始软化 | 还在生气但愿意听、会抱怨和讲道理、话变多了 |
| 0 ~ 30 | 还在生气 | 态度冷淡、话少、句句带情绪、不太想搭理 |
| -50 ~ 0 | 非常生气 | 冷暴力、激烈质问、说话带刺、甚至想分手 |

# 输出格式（极其重要！必须严格遵守）

你必须输出**纯JSON**，不要有任何其他文字、解释、注释、markdown标记。
不要用 \`\`\`json 包裹，不要在JSON前后加任何内容。
直接输出一个合法的JSON对象：

{
  "message": "你说的话，1-2句，符合当前情绪",
  "scoreChange": 数值,
  "options": [
    { "text": "选项内容", "type": "positive" },
    { "text": "选项内容", "type": "funny_bad" },
    { "text": "选项内容", "type": "normal_bad" },
    { "text": "选项内容", "type": "positive" },
    { "text": "选项内容", "type": "funny_bad" },
    { "text": "选项内容", "type": "funny_bad" }
  ]
}

# 选项生成规则

1. 每轮必须 6 个选项，且类型分布如下：
   - 2个 positive（加分选项）：真诚道歉、具体弥补方案、提起共同回忆、走心表达、行动承诺等
   - 1个 normal_bad（普通减分）：敷衍、转移话题、找借口、讲道理、翻旧账
   - 3个 funny_bad（奇葩搞笑减分）：这是游戏的灵魂！要离谱到让人笑出声

2. 奇葩搞笑选项参考方向（请根据场景灵活创造，不要直接抄）：
   - 离谱补偿："我请你吃肯德基疯狂星期四"、"要不我给你跳个舞？"、"我把游戏账号给你"
   - 火上浇油："我错了，但你也有错啊"、"至于吗这么小气"、"你生气的样子还挺好看的"
   - 神逻辑："你听我解释 我不是故意的 是有原因的 算了不想说了"、"我以为你不会在意"
   - 摆烂式："行吧我错了满意了吧"、"那你要我怎样"、"好好好都是我的错"
   - 迷惑行为："我给你学狗叫行不行"、"你骂我吧我不还口"、"要不我也生气让你平衡一下"

3. 每个选项控制在 20 字以内，口语化，像真实会说的话
4. 选项内容必须和当前场景与对话上下文强相关
5. 不要重复之前出现过的选项（整局游戏内）

# 对话连贯性要求

1. 每一轮必须承接上一轮的内容，像是同一段真实的对话，不能跳戏
2. 你说的话要有情绪递进，不能第一轮非常生气第二轮突然就好
3. 参考上下文会在用户消息中提供

# 文风与气质

- 俏皮、搞笑、轻松。即使生气也要带点可爱，不能真的让人有压力
- 像真实情侣吵架，有生活气息，别太书面
- 可以适当用语气词（哼、唉、喂、切）和标点（！？…）但不要过度
- 绝对不要提到"好感度""游戏""玩家""任务"这些元信息，完全沉浸在角色里

# 内容安全红线

- 禁止 NSFW、暴力、自残、极端负面情绪
- 禁止人身攻击、人格侮辱、涉及家人的攻击
- 吵架归吵架，不能出现"分手吧""我们不合适"这种轻易说的话（只有好感度接近-50时才能说）
- 不能鼓励不良行为

# 最后再强调一遍

输出纯JSON，纯JSON，纯JSON。
不要有任何多余的解释文字，不要markdown格式，不要代码块。
直接输出 { ... }`;
}

export function buildUserMessage(
  userChoice: string,
  currentScore: number,
  round: number,
  totalRounds: number,
  history: Array<{ user: string; partner: string; scoreChange: number }>,
): string {
  const recentHistory = history.slice(-4); // 只保留最近4轮，控制上下文长度

  let historyText = "";
  if (recentHistory.length > 0) {
    historyText = recentHistory
      .map(
        (h) =>
          `玩家选择：${h.user}\n你的回复：${h.partner}\n好感度变化：${h.scoreChange > 0 ? "+" : ""}${h.scoreChange}`,
      )
      .join("\n\n");
  }

  return `当前游戏状态：
- 当前轮次：第 ${round} 轮 / 共 ${totalRounds} 轮
- 当前好感度：${currentScore} 分
- 玩家选择了：${userChoice}

${historyText ? `# 历史对话（最近几轮）\n${historyText}\n\n` : ""}请根据玩家的选择，生成你的回复、好感度变化和下一轮的6个选项。注意承接上下文，保持角色设定。`;
}

export function buildFirstRoundMessage(sceneDescription: string): string {
  return `这是游戏的第一轮，请以生气的状态开口说第一句话，同时给出6个回应选项。
  注意：第一轮是你主动开口（因为你在生气），玩家是第一次回应你。
  你的第一句话要符合场景，体现出生气/委屈/失望的情绪。`;
}

// 安全解析 LLM 返回的 JSON
export function parseLLMResponse(content: string): {
  message: string;
  scoreChange: number;
  options: ChatOption[];
} | null {
  // 尝试清理 markdown 代码块
  let cleaned = content.trim();
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  cleaned = cleaned.replace(/^```\s*/i, "").replace(/\s*```$/, "");

  // 尝试找到 JSON 对象的开始和结束
  const startIndex = cleaned.indexOf("{");
  const endIndex = cleaned.lastIndexOf("}");

  if (startIndex === -1 || endIndex === -1) return null;

  const jsonStr = cleaned.slice(startIndex, endIndex + 1);

  try {
    const parsed = JSON.parse(jsonStr);

    // 校验字段
    if (
      typeof parsed.message !== "string" ||
      typeof parsed.scoreChange !== "number" ||
      !Array.isArray(parsed.options) ||
      parsed.options.length < 4
    ) {
      return null;
    }

    // 校验选项格式
    const validOptions = parsed.options.filter(
      (opt: { text: unknown; type: unknown }) =>
        typeof opt.text === "string" &&
        typeof opt.type === "string" &&
        ["positive", "normal_bad", "funny_bad"].includes(opt.type),
    );

    if (validOptions.length < 4) return null;

    return {
      message: parsed.message,
      scoreChange: Number(parsed.scoreChange),
      options: validOptions.map((opt: { text: string; type: string }) => ({
        text: opt.text,
        type: opt.type as ChatOption["type"],
      })),
    };
  } catch {
    return null;
  }
}

// 打乱选项顺序
export function shuffleOptions<T>(options: T[]): T[] {
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
