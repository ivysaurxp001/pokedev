/**
 * Gemini Service - Secure Version
 * All API calls are routed through Supabase Edge Functions
 * API keys are stored securely on the server side
 */

import { AIAnalysisResult } from "../types";
import { supabase } from "../lib/supabase";

// Edge Function URL - API key is stored in Supabase Secrets
const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

interface FileContext {
  name: string;
  content: string;
}

/**
 * Analyze project files using Gemini AI (via Edge Function)
 * This function triggers the analyze-project edge function which handles the AI call securely
 */
export const analyzeProject = async (files: FileContext[]): Promise<AIAnalysisResult> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    const authToken = session?.session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${EDGE_FUNCTION_URL}/analyze-direct`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
        "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify({ files }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to analyze project");
    }

    const result = await response.json();
    return result.analysis as AIAnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

/**
 * Oracle Chat - Contextual AI assistant for a project
 * Uses Edge Function to securely handle Gemini API calls
 */
export const createOracleChat = (files: FileContext[]) => {
  let chatHistory: { role: string; content: string }[] = [];

  // Build initial context from files
  let combinedContent = "";
  files.forEach(f => {
    combinedContent += `\n--- START OF FILE: ${f.name} ---\n${f.content.slice(0, 15000)}\n--- END OF FILE ---\n`;
  });

  return {
    async sendMessage(message: string): Promise<string> {
      try {
        const { data: session } = await supabase.auth.getSession();
        const authToken = session?.session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

        const response = await fetch(`${EDGE_FUNCTION_URL}/oracle-chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
            "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY || '',
          },
          body: JSON.stringify({
            message,
            context: combinedContent,
            history: chatHistory,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to get response from Oracle");
        }

        const result = await response.json();

        // Update chat history
        chatHistory.push({ role: "user", content: message });
        chatHistory.push({ role: "assistant", content: result.response });

        return result.response;
      } catch (error) {
        console.error("Oracle Chat Error:", error);
        throw error;
      }
    },
  };
};