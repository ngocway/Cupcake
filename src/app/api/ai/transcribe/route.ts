import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth } from '@/auth';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key is not configured' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const response = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      response_format: 'text',
    });

    const transcript = typeof response === 'string' ? response : (response as any).text;

    return NextResponse.json({ transcript: transcript?.trim() || '' });
  } catch (error: any) {
    console.error('Error in AI transcription:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
