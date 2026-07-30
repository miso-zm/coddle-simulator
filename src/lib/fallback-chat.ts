import type { ChatOption, OptionType, Scene } from "./types";

interface FallbackChatResponse {
  message: string;
  scoreChange: number;
  selectedAnalysis: string;
  options: ChatOption[];
}

const FIRST_MESSAGES: Record<string, string> = {
  anniversary:
    "你真的完全不记得今天是什么日子吗？我等了一整天，最后等到的却是你一句“今天怎么了”。",
  ignored_messages:
    "我昨晚给你发了那么多消息，你一条都没回。你知道我从担心到失望，一晚上是什么感受吗？",
  flirty_chat:
    "这些聊天记录你准备怎么解释？如果这也叫普通朋友，那你有没有想过我看到会有多难受？",
  lost_cat:
    "我把它交给你，是因为我相信你。现在它不见了，你让我怎么冷静下来？",
  public_embarrassment:
    "你觉得那只是个玩笑，可当着所有人的面被你这样说，我真的觉得自己一点都没被尊重。",
};

const OPTION_TEXTS: Record<OptionType, readonly string[]> = {
  excellent: [
    "我先不解释，你愿意告诉我最受伤的是什么吗？",
    "你的难过不是小题大做，是我没有守住边界。",
    "这件事是我的责任，我想先完整听完你的感受。",
    "我会认真补救，你希望我现在先做什么？",
  ],
  good: [
    "对不起，我真的很在乎你的感受。",
    "我知道自己错了，我们好好聊聊好吗？",
    "我不想敷衍过去，会认真面对这件事。",
    "我愿意改，也愿意给你时间消化。",
  ],
  neutral: [
    "别生气了，我们晚点再说吧。",
    "我知道错了，这件事先翻篇好吗？",
    "事情已经发生了，先冷静一下吧。",
    "我现在也不知道该说什么。",
  ],
  bad: [
    "我又不是故意的，你别想得太严重。",
    "你先冷静点，情绪这么大没法沟通。",
    "我已经道歉了，你还想让我怎么样？",
    "这件事也不能全怪我吧。",
    "你自己不也做过类似的事吗？",
    "为什么每次都要把小事闹这么大？",
    "我只是怕你误会，所以才没早说。",
    "你总盯着我的错，谁受得了？",
  ],
  worst: [
    "随便你怎么想，我不想再解释了。",
    "你要一直这样，那就别聊了。",
    "受不了就算了，没必要继续。",
    "都是你太敏感，问题根本不在我。",
  ],
};

const SCORE_CHANGES: Record<OptionType, number> = {
  excellent: 16,
  good: 9,
  neutral: 1,
  bad: -10,
  worst: -20,
};

const ANALYSES: Record<OptionType, string> = {
  excellent: "先接住情绪并承担责任，能重新建立安全感",
  good: "态度真诚，但还需要更具体地回应对方的感受",
  neutral: "回避核心感受只会暂时停火，无法真正修复关系",
  bad: "辩解和否定情绪，会让对方觉得自己不被理解",
  worst: "冷暴力和反向指责会严重破坏关系中的信任",
};

const RESPONSE_MESSAGES: Record<OptionType, string> = {
  excellent:
    "你愿意先听我的感受，而不是急着为自己辩解，这让我稍微安心了一点。至少我能感觉到，你在认真面对这件事。",
  good:
    "我听到了你的道歉，也知道你是在乎我的。只是我现在还需要一点时间，也需要看到你真正会怎么做。",
  neutral:
    "我不是只想听一句“我错了”。如果我们不把真正的问题说清楚，下次还是会发生。",
  bad:
    "你还是在解释自己，却没有在意我为什么难过。这样只会让我觉得，我的感受在你眼里根本不重要。",
  worst:
    "原来我认真说出自己的受伤，换来的就是这种态度。那我现在真的不想再和你说了。",
};

function option(text: string, type: OptionType): ChatOption {
  return { text, type, analysis: ANALYSES[type] };
}

function buildOptions(round: number): ChatOption[] {
  const index = Math.max(0, round - 1);
  const badTexts = OPTION_TEXTS.bad;

  return [
    option(OPTION_TEXTS.excellent[index % OPTION_TEXTS.excellent.length], "excellent"),
    option(OPTION_TEXTS.good[index % OPTION_TEXTS.good.length], "good"),
    option(OPTION_TEXTS.neutral[index % OPTION_TEXTS.neutral.length], "neutral"),
    option(badTexts[(index * 2) % badTexts.length], "bad"),
    option(badTexts[(index * 2 + 1) % badTexts.length], "bad"),
    option(OPTION_TEXTS.worst[index % OPTION_TEXTS.worst.length], "worst"),
  ];
}

export function buildFallbackChatResponse({
  scene,
  round,
  currentScore,
  userChoiceType,
}: {
  scene: Scene;
  round: number;
  currentScore: number;
  userChoiceType?: OptionType;
}): FallbackChatResponse {
  if (round === 1) {
    return {
      message:
        FIRST_MESSAGES[scene.id] ??
        `关于“${scene.title}”这件事，我真的很失望。你愿意认真听听我的感受吗？`,
      scoreChange: 0,
      selectedAnalysis: "",
      options: buildOptions(round),
    };
  }

  const type = userChoiceType ?? "neutral";
  const scoreChange = SCORE_CHANGES[type];
  const nextScore = currentScore + scoreChange;
  const repairedMessage =
    nextScore >= 70
      ? "我能感觉到你是真的在面对这件事。给我一点时间，我愿意和你一起把它修复好。"
      : RESPONSE_MESSAGES[type];

  return {
    message: repairedMessage,
    scoreChange,
    selectedAnalysis: ANALYSES[type],
    options: buildOptions(round),
  };
}
