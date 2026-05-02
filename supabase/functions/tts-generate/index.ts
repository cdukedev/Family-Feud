import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, ssml, voice, cache_key } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check cache first
    if (cache_key) {
      const { data: cached } = await supabase.storage
        .from("tts-cache")
        .createSignedUrl(`${cache_key}.mp3`, 3600);

      if (cached?.signedUrl) {
        return new Response(
          JSON.stringify({ audio_url: cached.signedUrl, cached: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Call Google Cloud TTS
    const credentials = JSON.parse(Deno.env.get("GOOGLE_CLOUD_CREDENTIALS") || "{}");
    const projectId = Deno.env.get("GOOGLE_CLOUD_PROJECT_ID");

    const ttsRequest = {
      input: ssml ? { ssml } : { text },
      voice: {
        languageCode: "en-US",
        name: voice || "en-US-Neural2-D",
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 1.0,
        pitch: 0,
      },
    };

    const ttsResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${Deno.env.get("GOOGLE_TTS_API_KEY") || ""}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ttsRequest),
      }
    );

    if (!ttsResponse.ok) {
      const err = await ttsResponse.text();
      throw new Error(`TTS API error: ${err}`);
    }

    const ttsData = await ttsResponse.json();
    const audioContent = ttsData.audioContent; // base64-encoded MP3

    // Cache the audio
    const audioBuffer = Uint8Array.from(atob(audioContent), (c) => c.charCodeAt(0));
    const fileName = cache_key || `tts-${Date.now()}`;

    const { error: uploadError } = await supabase.storage
      .from("tts-cache")
      .upload(`${fileName}.mp3`, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Cache upload error:", uploadError);
    }

    // Get signed URL
    const { data: signed } = await supabase.storage
      .from("tts-cache")
      .createSignedUrl(`${fileName}.mp3`, 3600);

    return new Response(
      JSON.stringify({
        audio_url: signed?.signedUrl || null,
        audio_base64: audioContent,
        cached: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
