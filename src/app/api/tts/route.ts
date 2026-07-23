import { NextRequest, NextResponse } from "next/server";
import { TTSClient, Config, HeaderUtils } from "coze-coding-dev-sdk";
import { z } from "zod";
import { getVoiceById, VOICE_OPTIONS } from "@/lib/constants";

const requestSchema = z.object({
  text: z.string().min(1).max(500),
  voice: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "参数错误" },
        { status: 400 },
      );
    }

    const { text, voice } = parsed.data;

    const voiceConfig = VOICE_OPTIONS.find((v) => v.id === voice);
    if (!voiceConfig) {
      return NextResponse.json({ error: "无效的声音类型" }, { status: 400 });
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const ttsClient = new TTSClient(config, customHeaders);

    const response = await ttsClient.synthesize({
      uid: "honghong_player",
      text,
      speaker: voiceConfig.speakerId,
      audioFormat: "mp3",
      sampleRate: 24000,
    });

    return NextResponse.json({
      audioUri: response.audioUri,
    });
  } catch (error) {
    console.error("TTS API error:", error);
    return NextResponse.json(
      { error: "语音生成失败" },
      { status: 500 },
    );
  }
}
