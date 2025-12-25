/**
 * Edge Function: Analyze Direct
 * Direct file analysis without storing to database
 * Used by frontend for quick analysis
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

interface FileContext {
    name: string;
    content: string;
}

// Gemini Analysis Schema
const analysisSchema = {
    type: "object",
    properties: {
        one_liner: {
            type: "string",
            description: "A very short, catchy one-sentence summary of what the project does.",
        },
        description: {
            type: "string",
            description: "A concise technical description of the project (2-3 sentences).",
        },
        main_features: {
            type: "array",
            items: { type: "string" },
            description: "List of key features.",
        },
        tech_stack: {
            type: "array",
            items: { type: "string" },
            description: "List of technologies, frameworks, and libraries used.",
        },
        chains: {
            type: "array",
            items: { type: "string" },
            description: "List of blockchain networks if applicable. Empty if not a dApp.",
        },
        target_users: {
            type: "array",
            items: { type: "string" },
            description: "Who is this for?",
        },
        tags: {
            type: "array",
            items: { type: "string" },
            description: "Keywords for categorization.",
        },
        run_commands: {
            type: "array",
            items: { type: "string" },
            description: "Exact commands to run the project.",
        },
        deploy_status: {
            type: "string",
            enum: ['production', 'testnet', 'local', 'unknown'],
            description: "Current deployment state.",
        },
        key_decisions: {
            type: "array",
            items: { type: "string" },
            description: "Inferred architectural decisions.",
        },
        confidence_score: {
            type: "number",
            description: "Confidence score between 0 and 1.",
        },
        missing_info: {
            type: "array",
            items: { type: "string" },
            description: "Questions about missing information.",
        },
    },
    required: ["one_liner", "description", "main_features", "tech_stack", "tags", "confidence_score"],
};

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
        const { files } = body as { files: FileContext[] };

        if (!files || files.length === 0) {
            return new Response(
                JSON.stringify({ error: "No files provided" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Build combined content
        const combinedContent = files
            .map((f) => `\n--- START OF FILE: ${f.name} ---\n${f.content.slice(0, 20000)}\n--- END OF FILE ---\n`)
            .join("");

        const prompt = `
      You are a senior technical lead and DevOps engineer (DevDex System). 
      Analyze the following project files.
      
      Your goal is to extract ACTIONABLE metadata to make this project easy to resume or deploy.
      
      CRITICAL INSTRUCTION FOR "run_commands":
      - Normalize all scripts into full execution commands.
      - If package.json has "dev": "next dev", output "npm run dev".
      - If Makefile has "test:", output "make test".
      - Do NOT output just "dev" or "start". Output the full shell command.
      
      Input Files:
      ${combinedContent}
    `;

        // Call Gemini API
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: analysisSchema,
                        temperature: 0.1,
                    },
                }),
            }
        );

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            throw new Error(`Gemini API error: ${errorText}`);
        }

        const geminiData = await geminiResponse.json();
        const analysisText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!analysisText) {
            throw new Error("No response from Gemini API");
        }

        // Clean and parse JSON
        let cleanedText = analysisText.trim();
        if (cleanedText.startsWith("```")) {
            cleanedText = cleanedText.replace(/^```(json)?/, "").replace(/```$/, "").trim();
        }

        const analysis = JSON.parse(cleanedText);

        return new Response(
            JSON.stringify({ success: true, analysis }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: any) {
        console.error("Analyze Direct Error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
