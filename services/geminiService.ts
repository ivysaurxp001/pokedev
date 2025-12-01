import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIAnalysisResult } from "../types";

// Use VITE env var for client-side access
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    one_liner: {
      type: Type.STRING,
      description: "A very short, catchy one-sentence summary of what the project does.",
    },
    description: {
      type: Type.STRING,
      description: "A concise technical description of the project (2-3 sentences).",
    },
    main_features: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of key features.",
    },
    tech_stack: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of technologies, frameworks, and libraries used (e.g., React, Supabase, Solidity, Foundry).",
    },
    chains: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of blockchain networks if applicable (e.g., Ethereum, Arbitrum, Solana). Empty if not a dApp.",
    },
    target_users: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Who is this for? (e.g., Developers, DeFi Traders, End Users).",
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Keywords for categorization (e.g., 'DeFi', 'Dashboard', 'Automation', 'Escrow').",
    },
    // Actionable Fields
    run_commands: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Exact, standard commands to run the project. Do not use aliases. (e.g., 'npm run dev' instead of 'dev', 'forge test' instead of 'test').",
    },
    deploy_status: {
        type: Type.STRING,
        enum: ['production', 'testnet', 'local', 'unknown'],
        description: "Current deployment state inferred from content. 'production' if live URLs found, 'local' if only setup steps.",
    },
    key_decisions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Inferred architectural decisions or reasons for choosing specific tools (e.g., 'Uses Next.js for SSR', 'Foundry for fast testing').",
    },
    confidence_score: {
      type: Type.NUMBER,
      description: "A number between 0 and 1 indicating how confident you are in this analysis based on the provided text.",
    },
    missing_info: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Questions about critical missing information (e.g., 'What chain is this deployed on?', 'Is this Mainnet ready?').",
    },
  },
  required: ["one_liner", "description", "main_features", "tech_stack", "tags", "confidence_score", "chains", "target_users", "run_commands", "key_decisions"],
};

// Helper to strip Markdown code blocks
const cleanJson = (text: string): string => {
  let clean = text.trim();
  if (clean.startsWith('```')) {
    // Remove opening ```json or ```
    clean = clean.replace(/^```(json)?/, '').replace(/```$/, '');
  }
  return clean.trim();
};

interface FileContext {
  name: string;
  content: string;
}

export const analyzeProject = async (files: FileContext[]): Promise<AIAnalysisResult> => {
  try {
    // Construct multi-file context
    let combinedContent = "";
    files.forEach(f => {
      combinedContent += `\n--- START OF FILE: ${f.name} ---\n${f.content.slice(0, 20000)}\n--- END OF FILE ---\n`;
    });

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

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.1, // Lower temperature for more deterministic commands
      },
    });

    if (response.text) {
      const cleanedText = cleanJson(response.text);
      return JSON.parse(cleanedText) as AIAnalysisResult;
    }
    throw new Error("No response text generated");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

/**
 * Creates a chat session with the project context embedded.
 */
export const createOracleChat = (files: FileContext[]) => {
   let combinedContent = "";
    files.forEach(f => {
      combinedContent += `\n--- START OF FILE: ${f.name} ---\n${f.content.slice(0, 15000)}\n--- END OF FILE ---\n`;
    });

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
    ${combinedContent}
  `;

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
    }
  });
};