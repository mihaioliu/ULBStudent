import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const systemPrompt = [
  "Ești Eliot, asistentul ULBStudent pentru studenții ULBS.",
  "Răspunde concis, util și în limba română.",
  "Ajută cu profesori, documente, discuții, profil, raportări și orientare academică.",
  "Nu inventa date private și nu cere parole sau chei API."
].join(" ");

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

function cleanPrompt(value: unknown) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1200);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Metodă neacceptată." }, 405);
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY");
  const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";

  if (!apiKey) {
    return jsonResponse({
      error: "Asistentul AI nu este configurat încă. Setează GEMINI_API_KEY în Supabase Function Secrets."
    }, 503);
  }

  let prompt = "";
  try {
    const body = await req.json();
    prompt = cleanPrompt(body?.prompt);
  } catch {
    return jsonResponse({ error: "Cererea nu conține JSON valid." }, 400);
  }

  if (!prompt) {
    return jsonResponse({ error: "Scrie un mesaj pentru asistent." }, 400);
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\nÎntrebarea studentului: ${prompt}` }]
            }
          ],
          generationConfig: {
            temperature: 0.45,
            maxOutputTokens: 500
          }
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      const message = result?.error?.message || "Serviciul AI nu a putut genera răspunsul.";
      return jsonResponse({ error: message }, response.status);
    }

    const reply = result?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "")
      .join("")
      .trim();

    if (!reply) {
      return jsonResponse({ error: "Nu am primit un răspuns valid de la model." }, 502);
    }

    return jsonResponse({ reply });
  } catch {
    return jsonResponse({ error: "Asistentul AI nu este disponibil momentan. Încearcă din nou." }, 502);
  }
});
