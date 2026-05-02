import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text, ssml, voice, cache_key } = await request.json();

    const apiKey = process.env.GOOGLE_TTS_API_KEY || process.env.GOOGLE_CLOUD_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'TTS not configured — GOOGLE_TTS_API_KEY not set' },
        { status: 501 },
      );
    }

    const ttsRequest = {
      input: ssml ? { ssml } : { text },
      voice: { languageCode: 'en-US', name: voice || 'en-US-Neural2-D' },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0, pitch: 0 },
    };

    const ttsResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ttsRequest),
      },
    );

    if (!ttsResponse.ok) {
      const err = await ttsResponse.text();
      throw new Error(`TTS API error: ${err}`);
    }

    const ttsData = await ttsResponse.json();
    return NextResponse.json({
      audio_base64: ttsData.audioContent,
      cached: false,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
