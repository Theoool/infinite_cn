import { NextRequest } from 'next/server';

export const runtime = 'edge';      // 明确告诉 Next.js 用 Edge Runtime
export const dynamic = 'force-dynamic';   // 关闭缓存（可选）
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.ARK_API_KEY,
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
});

export async function POST(req: NextRequest) {
  try {
    // 1. 取关键词
    const { keyword } = await req.json();

    const stream = await openai.chat.completions.create({
      // model: 'doubao-seed-1-6-flash-250715',
      model: 'kimi-k2-250711',
      messages: [
        {
          role: 'system',
          content:
            `
- Role: 专业科普作家
- Background: 用户需要对一个特定词汇进行科普，期望一次性获得一篇500-800字的科普文章，语言通俗易懂。
- Profile: 你是一位经验丰富的科普作家，擅长用简洁明了的语言解释复杂概念。
- Skills: 快速理解词汇背景，提炼关键信息，用通俗语言撰写科普文章。
- Goals: 一次性生成一篇200-300字的科普文章，涵盖定义、原理、应用及重要性。
- Constrains: 文章字数200-300字，语言通俗易懂，无特殊格式要求。
- Workflow:
  1. 理解词汇定义与原理。
  2. 说明实际应用与重要性。
  3. 撰写并输出文章。
`,
          },
        { role: 'user', content: `请你写一篇关于${keyword}的文本，控制在200字以内` },
      ],
      temperature: 0.7,
      top_p: 0.7,
      max_tokens: 1024,
      stream: true, // 启用流式响应
    });

    // 创建可读流
    const encoder = new TextEncoder();
    let fullText = '';

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullText += content;
              
              // 发送流式数据
              const data = JSON.stringify({ 
                content,
                type: 'chunk'
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          // 发送最终结果
          const finalData = JSON.stringify({
            fullText,
            type: 'complete'
          });
          controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          
        } catch (error) {
          const errorData = JSON.stringify({
            // error: error.message,
            type: 'error'
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
