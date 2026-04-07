import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { prompt } = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY')

    // REVENIM LA MODELUL CARE FUNCTIONEAZA: Gemini 2.5 Flash
    const MODEL = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: `Ești Eliot. Ajută studentul: ${prompt}` }] 
        }]
      })
    })

    const result = await response.json()

    if (result.candidates && result.candidates.length > 0) {
      const textAI = result.candidates[0].content.parts[0].text
      return new Response(JSON.stringify({ reply: textAI }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else {
      const errorMsg = result.error ? result.error.message : "Eroare la modelul 2.5 Flash.";
      return new Response(JSON.stringify({ reply: `⚠️ Notă: ${errorMsg}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

  } catch (error) {
    return new Response(JSON.stringify({ reply: "Eroare server: " + error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})