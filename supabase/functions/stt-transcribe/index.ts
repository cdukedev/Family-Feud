import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get audio data from the request
    const formData = await req.formData();
    const audioBlob = formData.get("audio") as File;

    if (!audioBlob) {
      throw new Error("No audio data provided");
    }

    const audioBytes = await audioBlob.arrayBuffer();
    const audioBase64 = btoa(
      String.fromCharCode(...new Uint8Array(audioBytes))
    );

    // Call Google Cloud STT
    const sttRequest = {
      config: {
        encoding: "WEBM_OPUS",
        sampleRateHertz: 48000,
        languageCode: "en-US",
        model: "latest_long",
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: false,
        maxAlternatives: 1,
      },
      audio: {
        content: audioBase64,
      },
    };

    const apiKey = Deno.env.get("GOOGLE_STT_API_KEY") || Deno.env.get("GOOGLE_CLOUD_API_KEY") || "";

    const sttResponse = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sttRequest),
      }
    );

    if (!sttResponse.ok) {
      const err = await sttResponse.text();
      throw new Error(`STT API error: ${err}`);
    }

    const sttData = await sttResponse.json();

    // Extract transcript
    const transcript =
      sttData.results?.[0]?.alternatives?.[0]?.transcript || "";
    const confidence =
      sttData.results?.[0]?.alternatives?.[0]?.confidence || 0;

    return new Response(
      JSON.stringify({ transcript, confidence }),
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
