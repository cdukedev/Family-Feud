import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioBlob = formData.get('audio') as File;

    if (!audioBlob) {
      return NextResponse.json({ error: 'No audio data provided' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_STT_API_KEY || process.env.GOOGLE_CLOUD_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'STT not configured — GOOGLE_STT_API_KEY not set' },
        { status: 501 },
      );
    }

    const audioBytes = await audioBlob.arrayBuffer();
    const audioBase64 = Buffer.from(audioBytes).toString('base64');

    const sttRequest = {
      config: {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode: 'en-US',
        model: 'latest_long',
        enableAutomaticPunctuation: true,
        maxAlternatives: 1,
      },
      audio: { content: audioBase64 },
    };

    const sttResponse = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sttRequest),
      },
    );

    if (!sttResponse.ok) {
      const err = await sttResponse.text();
      throw new Error(`STT API error: ${err}`);
    }

    const sttData = await sttResponse.json();
    const transcript = sttData.results?.[0]?.alternatives?.[0]?.transcript || '';
    const confidence = sttData.results?.[0]?.alternatives?.[0]?.confidence || 0;

    return NextResponse.json({ transcript, confidence });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
