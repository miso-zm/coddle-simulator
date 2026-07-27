import { NextRequest, NextResponse } from "next/server";
import { LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";
import { z } from "zod";
import { createBlogPost, getBlogPostBySlug } from "@/storage/database/blog-repo";

const BLOG_MODEL = "doubao-seed-2-0-mini-260215";

const responseSchema = z.object({
  title: z.string(),
  summary: z.string(),
  content: z.string(), // HTML 格式
  emoji: z.string(), // emoji 封面
  read_time: z.number().int().min(1).max(30),
  slug: z.string().regex(/^[a-z0-9-]+$/).max(100),
});

const SYSTEM_PROMPT = `你是一位资深的两性情感专栏作家，擅长用轻松幽默的笔触写恋爱沟通技巧文章。

请生成一篇关于恋爱沟通技巧的博客文章，要求：
1. 主题围绕情侣吵架、沟通技巧、情感维护等
2. 风格轻松幽默、有温度，不说教
3. 结构清晰，有小标题
4. 字数 400-600 字
5. 内容要有启发性，读者看完觉得"原来如此"

必须严格返回 JSON 格式，字段如下：
- title: 文章标题（吸引人、有悬念感）
- summary: 摘要（50-80字）
- content: 正文，使用 HTML 标签，分段用 <p>，小标题用 <h3>，重点词可以用 <strong> 或 <em>
- emoji: 一个适合作为封面的 emoji 表情
- read_time: 阅读时间（分钟，整数）
- slug: URL 短链（英文小写，用连字符分隔，如 golden-30-minutes）

只返回 JSON，不要任何其他文字。`;

export async function POST(request: NextRequest) {
  try {
    const config = new Config();
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    const client = new LLMClient(config, headers);

    // 让LLM自己选题
    const userPrompt = `请写一篇新的恋爱沟通技巧文章，主题要新颖有趣，不要写和"吵架黄金30分钟"、"你说得对"、"道歉的正确方式"重复的主题。`;

    let lastError: unknown = null;

    // 重试 2 次
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const messages = [
          { role: "system" as const, content: SYSTEM_PROMPT },
          { role: "user" as const, content: attempt === 0 ? userPrompt : `${userPrompt}\n\n注意：必须返回严格合法的 JSON 格式！上一次解析失败了，请确保只有JSON，没有markdown代码块和多余文字。` },
        ];

        const resp = await client.invoke(messages, {
          model: BLOG_MODEL,
          temperature: 0.9,
        });

        let text = resp.content.trim();
        // 去掉可能的 markdown 代码块
        text = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();

        const parsed = responseSchema.safeParse(JSON.parse(text));
        if (!parsed.success) {
          lastError = parsed.error;
          continue;
        }

        // slug 去重
        let finalSlug = parsed.data.slug;
        let slugSuffix = 2;
        while (await getBlogPostBySlug(finalSlug)) {
          finalSlug = `${parsed.data.slug}-${slugSuffix++}`;
        }

        // 保存到数据库
        const newPost = await createBlogPost({
          title: parsed.data.title,
          summary: parsed.data.summary,
          content: parsed.data.content,
          emoji: parsed.data.emoji,
          read_time: parsed.data.read_time,
          slug: finalSlug,
        });

        return NextResponse.json({
          success: true,
          data: { id: newPost.id, title: newPost.title },
        });
      } catch (e) {
        lastError = e;
      }
    }

    console.error("[blog/generate] 生成失败", lastError);
    return NextResponse.json(
      { error: "文章生成失败，请稍后重试" },
      { status: 500 },
    );
  } catch (error) {
    console.error("[blog/generate] 未知错误", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 },
    );
  }
}
