import { NextRequest, NextResponse } from "next/server";
import { LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";
import { z } from "zod";
import { buildSystemPrompt, buildUserMessage, buildFirstRoundMessage, parseLLMResponse, shuffleOptions } from "@/lib/prompt";
import { MAX_RETRIES, SCENES } from "@/lib/constants";
import { buildFallbackChatResponse } from "@/lib/fallback-chat";
import type { Gender, OptionType, VoiceType } from "@/lib/types";

const requestSchema = z.object({
  gender: z.enum(["girlfriend", "boyfriend"]),
  voice: z.string(),
  sceneId: z.string(),
  round: z.number().int().min(1).max(10),
  totalRounds: z.number().int().min(1).max(20),
  currentScore: z.number().min(-50).max(100),
  userChoice: z.string().optional(),
  userChoiceType: z.enum(["excellent", "good", "neutral", "bad", "worst"]).optional(),
  history: z.array(
    z.object({
      user: z.string(),
      partner: z.string(),
      scoreChange: z.number(),
    }),
  ).default([]),
  generateAudio: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "参数错误", details: parsed.error.message },
        { status: 400 },
      );
    }

    const { gender, voice, sceneId, round, totalRounds, currentScore, userChoice, userChoiceType, history } = parsed.data;

    // 查找场景
    const scene = SCENES.find((s) => s.id === sceneId);
    if (!scene) {
      return NextResponse.json({ error: "场景不存在" }, { status: 400 });
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const llmClient = new LLMClient(config, customHeaders);

    const systemPrompt = buildSystemPrompt(gender as Gender, voice as VoiceType, scene.description);

    let userPrompt: string;
    if (round === 1 && !userChoice) {
      userPrompt = buildFirstRoundMessage(scene.description);
    } else if (!userChoice) {
      return NextResponse.json({ error: "缺少用户选择" }, { status: 400 });
    } else {
      userPrompt = buildUserMessage(userChoice, currentScore, round, totalRounds, history);
    }

    // 重试机制
    let result = null;
    let lastError: Error | null = null;
    let currentUserPrompt = userPrompt;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const messages = [
          { role: "system" as const, content: systemPrompt },
          { role: "user" as const, content: currentUserPrompt },
        ];

        const response = await llmClient.invoke(messages, {
          model: "doubao-seed-2-0-mini-260215",
          temperature: 0.9,
        });

        const parsedResponse = parseLLMResponse(response.content);
        if (parsedResponse) {
          result = parsedResponse;
          break;
        }

        // 解析失败，追加提醒后重试
        if (attempt < MAX_RETRIES) {
          currentUserPrompt = `${currentUserPrompt}\n\n【重要提醒】你上一次的回复格式不正确，内容为：\n${response.content}\n\n请严格按照JSON格式输出，不要包含任何多余文字、markdown标记或代码块。直接输出 { "message": "...", "scoreChange": ..., "options": [...] }`;
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        }
      }
    }

    if (!result) {
      console.warn(
        "Chat provider unavailable, using local fallback:",
        lastError?.message || "LLM response parsing failed",
      );
      const fallback = buildFallbackChatResponse({
        scene,
        round,
        currentScore,
        userChoiceType: userChoiceType as OptionType | undefined,
      });
      return NextResponse.json({
        ...fallback,
        options: shuffleOptions(fallback.options),
        fallback: true,
      });
    }

    // 打乱选项顺序
    const shuffledOptions = shuffleOptions(result.options);

    // TTS 语音改为前端单独调用 /api/tts 获取，这里不等，加快首字响应
    return NextResponse.json({
      message: result.message,
      scoreChange: result.scoreChange,
      selectedAnalysis: result.selectedAnalysis || "",
      options: shuffledOptions,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "服务器内部错误，请稍后重试" },
      { status: 500 },
    );
  }
}
