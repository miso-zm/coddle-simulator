import { NextRequest, NextResponse } from "next/server";
import { LLMClient, Config, HeaderUtils, TTSClient } from "coze-coding-dev-sdk";
import { z } from "zod";
import { buildSystemPrompt, buildUserMessage, buildFirstRoundMessage, parseLLMResponse, shuffleOptions } from "@/lib/prompt";
import { getVoiceById, MAX_RETRIES, SCENES } from "@/lib/constants";
import type { Gender, VoiceType } from "@/lib/types";

const requestSchema = z.object({
  gender: z.enum(["girlfriend", "boyfriend"]),
  voice: z.string(),
  sceneId: z.string(),
  round: z.number().int().min(1).max(10),
  totalRounds: z.number().int().min(1).max(20),
  currentScore: z.number().min(-50).max(100),
  userChoice: z.string().optional(),
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

    const { gender, voice, sceneId, round, totalRounds, currentScore, userChoice, history, generateAudio } = parsed.data;

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
    if (round === 1) {
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
          model: "doubao-seed-2-0-lite-260215",
          temperature: 1.2,
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
      return NextResponse.json(
        { error: lastError?.message || "生成回复失败，请重试" },
        { status: 500 },
      );
    }

    // 打乱选项顺序
    const shuffledOptions = shuffleOptions(result.options);

    // 生成 TTS 语音
    let audioUri: string | undefined;
    if (generateAudio) {
      try {
        const ttsClient = new TTSClient(config, customHeaders);
        const voiceConfig = getVoiceById(voice as VoiceType);
        const ttsResponse = await ttsClient.synthesize({
          uid: "honghong_player",
          text: result.message,
          speaker: voiceConfig.speakerId,
          audioFormat: "mp3",
          sampleRate: 24000,
        });
        audioUri = ttsResponse.audioUri;
      } catch (ttsErr) {
        // TTS 失败不影响主流程
        console.warn("TTS generation failed:", ttsErr);
      }
    }

    return NextResponse.json({
      message: result.message,
      scoreChange: result.scoreChange,
      options: shuffledOptions,
      audioUri,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "服务器内部错误，请稍后重试" },
      { status: 500 },
    );
  }
}
