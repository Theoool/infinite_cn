// app/api/segment/route.ts
import { NextRequest } from 'next/server';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { Segment, useDefault: UseDefault } = require('segmentit') as any;

export const runtime = 'nodejs';     // 明确 Node Runtime

// 单例分词器，首次加载后缓存
let segmentit:any = null;

function getSegmentor() {
  if (!segmentit) {
    segmentit = UseDefault(new Segment());
  }
  return segmentit;
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) {
      return Response.json({ error: 'Text is required' }, { status: 400 });
    }

    const seg = getSegmentor().doSegment(text);
    const words = seg.map((item:any) => item.w);

    return Response.json({ segments: words });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}
