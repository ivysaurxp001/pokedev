/**
 * Edge Function: Oracle Chat
 * Contextual AI chat for project Q&A
 * Handles Gemini API calls securely on server side
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

interface ChatMessage {
    role: string;
    content: string;
}

serve(async (req) => {
    // CORS headers
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    };

    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
        if (!GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY not configured in Edge Function secrets");
        }

        const body = await req.json();
        const { message, context, history } = body as {
            message: string;
            context: string;
            history: ChatMessage[];
        };

        if (!message) {
            return new Response(
                JSON.stringify({ error: "No message provided" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Build conversation with system instruction
        const systemInstruction = `
      You are the "Oracle" of this specific software project. 
      You have read the codebase files provided below.
      Answer the user's questions strictly based on these files.
      
      Style:
      - Be concise and technical.
      - If asked for code, provide it.
      - If asked "How do I run this?", look for scripts/Makefiles.
      - If the answer is not in the files, say "Data not found in source files."
      
      PROJECT FILES CONTEXT:
      ${context || "No context provided"}
    `;

        // Build chat history for Gemini
        const contents = [];

        // Add previous messages
        if (history && history.length > 0) {
            for (const msg of history) {
                contents.push({
                    role: msg.role === "user" ? "user" : "model",
                    parts: [{ text: msg.content }],
                });
            }
        }

        // Add current message
        contents.push({
            role: "user",
            parts: [{ text: message }],
        });

        // Call Gemini API
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents,
                    systemInstruction: {
                        parts: [{ text: systemInstruction }],
                    },
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2048,
                    },
                }),
            }
        );

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            throw new Error(`Gemini API error: ${errorText}`);
        }

        const geminiData = await geminiResponse.json();
        const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
            throw new Error("No response from Gemini API");
        }

        return new Response(
            JSON.stringify({ success: true, response: responseText }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: any) {
        console.error("Oracle Chat Error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
