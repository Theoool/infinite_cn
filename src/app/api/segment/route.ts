import { NextRequest } from 'next/server';
import init, { cut } from 'jieba-wasm';

// Use Node.js runtime instead of Edge runtime for WASM support
export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    
    if (!text) {
      return Response.json({ error: 'Text is required' }, { status: 400 });
    }

    // Initialize jieba and perform word segmentation
    await init();
    const segments = cut(text);
    
    return Response.json({ segments });
  } catch (error: unknown) {
    console.error('Segmentation error:', error);
    return Response.json({ error: error }, { status: 500 });
  }
}
