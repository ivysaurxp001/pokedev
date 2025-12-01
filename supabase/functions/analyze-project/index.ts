// Supabase Edge Function: Analyze Project
// This function is triggered when a new project file is uploaded
// It downloads the file, calls Gemini AI, and updates the project record

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface FileContext {
  name: string;
  content: string;
}

interface AIAnalysisResult {
  one_liner: string;
  description: string;
  main_features: string[];
  tech_stack: string[];
  chains: string[];
  target_users: string[];
  tags: string[];
  run_commands: string[];
  deploy_status: 'production' | 'testnet' | 'local' | 'unknown';
  key_decisions: string[];
  confidence_score: number;
  missing_info: string[];
}

// Gemini Analysis Schema (matches geminiService.ts)
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
      description: "List of technologies, frameworks, and libraries used (e.g., React, Supabase, Solidity, Foundry).",
    },
    chains: {
      type: "array",
      items: { type: "string" },
      description: "List of blockchain networks if applicable (e.g., Ethereum, Arbitrum, Solana). Empty if not a dApp.",
    },
    target_users: {
      type: "array",
      items: { type: "string" },
      description: "Who is this for? (e.g., Developers, DeFi Traders, End Users).",
    },
    tags: {
      type: "array",
      items: { type: "string" },
      description: "Keywords for categorization (e.g., 'DeFi', 'Dashboard', 'Automation', 'Escrow').",
    },
    run_commands: {
      type: "array",
      items: { type: "string" },
      description: "Exact, standard commands to run the project. Do not use aliases. (e.g., 'npm run dev' instead of 'dev', 'forge test' instead of 'test').",
    },
    deploy_status: {
      type: "string",
      enum: ['production', 'testnet', 'local', 'unknown'],
      description: "Current deployment state inferred from content. 'production' if live URLs found, 'local' if only setup steps.",
    },
    key_decisions: {
      type: "array",
      items: { type: "string" },
      description: "Inferred architectural decisions or reasons for choosing specific tools (e.g., 'Uses Next.js for SSR', 'Foundry for fast testing').",
    },
    confidence_score: {
      type: "number",
      description: "A number between 0 and 1 indicating how confident you are in this analysis based on the provided text.",
    },
    missing_info: {
      type: "array",
      items: { type: "string" },
      description: "Questions about critical missing information (e.g., 'What chain is this deployed on?', 'Is this Mainnet ready?').",
    },
  },
  required: ["one_liner", "description", "main_features", "tech_stack", "tags", "confidence_score", "chains", "target_users", "run_commands", "key_decisions"],
};

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body
    const body = await req.json();
    const { project_id, file_ids } = body;

    if (!project_id || !file_ids || file_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing project_id or file_ids" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1. Create or get existing job
    let jobId: string;
    const { data: existingJob } = await supabase
      .from("ai_jobs")
      .select("id")
      .eq("project_id", project_id)
      .eq("status", "queued")
      .single();

    if (existingJob) {
      jobId = existingJob.id;
      // Update file_ids to include new files
      await supabase
        .from("ai_jobs")
        .update({ 
          file_ids: [...new Set([...existingJob.file_ids || [], ...file_ids])],
          updated_at: new Date().toISOString()
        })
        .eq("id", jobId);
    } else {
      const { data: newJob, error: jobError } = await supabase
        .from("ai_jobs")
        .insert({
          project_id,
          file_ids,
          status: "queued",
          model: "gemini-2.5-flash",
        })
        .select()
        .single();

      if (jobError || !newJob) {
        throw new Error(`Failed to create job: ${jobError?.message}`);
      }
      jobId = newJob.id;
    }

    // 2. Update job status to running
    await supabase
      .from("ai_jobs")
      .update({ status: "running", updated_at: new Date().toISOString() })
      .eq("id", jobId);

    // 3. Fetch file metadata
    const { data: files, error: filesError } = await supabase
      .from("project_files")
      .select("id, name, path, bucket")
      .in("id", file_ids);

    if (filesError || !files || files.length === 0) {
      throw new Error(`Failed to fetch files: ${filesError?.message}`);
    }

    // 4. Download file contents from Storage
    const fileContexts: FileContext[] = [];
    for (const file of files) {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(file.bucket)
        .download(file.path);

      if (downloadError) {
        console.error(`Failed to download ${file.path}:`, downloadError);
        continue;
      }

      const content = await fileData.text();
      fileContexts.push({
        name: file.name,
        content: content.slice(0, 20000), // Limit content size
      });
    }

    if (fileContexts.length === 0) {
      throw new Error("No file contents could be downloaded");
    }

    // 5. Call Gemini API
    const combinedContent = fileContexts
      .map((f) => `\n--- START OF FILE: ${f.name} ---\n${f.content}\n--- END OF FILE ---\n`)
      .join("");

    const prompt = `
      You are a senior technical lead and DevOps engineer (DevDex System). 
      Analyze the following project files.
      
      Your goal is to extract ACTIONABLE metadata to make this project easy to resume or deploy.
      
      CRITICAL INSTRUCTION FOR "run_commands":
      - Normalize all scripts into full execution commands.
      - If package.json has "dev": "next dev", output "npm run dev" (or pnpm/yarn if inferred).
      - If Makefile has "test:", output "make test".
      - If Foundry project, output "forge test".
      - Do NOT output just "dev" or "start". Output the full shell command.
      
      1. **Run Commands**: Look for 'scripts' in package.json, Makefile targets, or README instructions. 
      2. **Tech Stack**: precise detection from package.json or go.mod or requirements.txt.
      3. **Deploy Status**: Look for 'vercel.app' links, contract addresses, or 'localhost' mentions.
      
      Input Files:
      ${combinedContent}
    `;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

    // Clean JSON response
    let cleanedText = analysisText.trim();
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```(json)?/, "").replace(/```$/, "").trim();
    }

    const analysis: AIAnalysisResult = JSON.parse(cleanedText);

    // 6. Update job with result
    await supabase
      .from("ai_jobs")
      .update({
        status: "done",
        result: analysis,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    // 7. Auto-update project record
    const { data: project } = await supabase
      .from("projects")
      .select("name")
      .eq("id", project_id)
      .single();

    const updateData: any = {
      one_liner_ai: analysis.one_liner,
      description_ai: analysis.description,
      features_ai: analysis.main_features,
      stack_ai: analysis.tech_stack,
      chains_ai: analysis.chains,
      target_users_ai: analysis.target_users,
      tags_ai: analysis.tags,
      confidence_score: analysis.confidence_score,
      run_commands_ai: analysis.run_commands || [],
      key_decisions_ai: analysis.key_decisions || [],
      deploy_status_ai: analysis.deploy_status || "unknown",
      ai_updated_at: new Date().toISOString(),
    };

    // Intelligent naming: only update if name is empty
    if (!project?.name || project.name === "New Project" || project.name === "") {
      updateData.name = files[0]?.name.split(".")[0] || "Untitled Project";
    }

    await supabase.from("projects").update(updateData).eq("id", project_id);

    return new Response(
      JSON.stringify({ success: true, job_id: jobId }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: any) {
    console.error("Edge Function Error:", error);

    // Try to update job status to error if we have project_id from the original request
    // Note: We can't re-read the request body, so we'll try to get it from the error context
    // In production, you might want to pass project_id as a query parameter or store it differently
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase
          .from("ai_jobs")
          .update({
            status: "error",
            error: error.message || "Unknown error",
            updated_at: new Date().toISOString(),
          })
          .eq("project_id", body.project_id)
          .eq("status", "running");
      } catch (updateError) {
        console.error("Failed to update job status:", updateError);
      }
    }

    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

