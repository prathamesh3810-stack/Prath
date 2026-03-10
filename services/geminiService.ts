import { GoogleGenAI, Type } from "@google/genai";
import { Scorecard } from '../types';
import { LLMModel, ContentType } from '../constants';

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        chatgpt_score: { type: Type.NUMBER },
        perplexity_score: { type: Type.NUMBER },
        grok_score: { type: Type.NUMBER },
        claude_score: { type: Type.NUMBER },
        gemini_score: { type: Type.NUMBER },
        experience_score: { type: Type.NUMBER },
        expertise_score: { type: Type.NUMBER },
        authoritativeness_score: { type: Type.NUMBER },
        trustworthiness_score: { type: Type.NUMBER },
        conversational_percentage: { type: Type.NUMBER },
        key_wins: { type: Type.ARRAY, items: { type: Type.STRING } },
        what_is_missing: { type: Type.ARRAY, items: { type: Type.STRING } },
        areas_for_improvement: { type: Type.ARRAY, items: { type: Type.STRING } },
        summary_report: { type: Type.STRING }
    },
    required: [
        "chatgpt_score", "perplexity_score", "grok_score", "claude_score", "gemini_score",
        "experience_score", "expertise_score", "authoritativeness_score", "trustworthiness_score",
        "conversational_percentage", "key_wins", "what_is_missing", "areas_for_improvement", "summary_report"
    ]
};

const rewriteResponseSchema = {
    type: Type.OBJECT,
    properties: {
        rewrittenContent: { type: Type.STRING, description: "The completely rewritten content in structured Markdown format." },
        explanation: { type: Type.STRING, description: "A detailed explanation of the strategic changes made." }
    },
    required: ["rewrittenContent", "explanation"]
};


export async function auditContent(
    userContent: string,
    contentType: ContentType,
    modelFocus: LLMModel[],
    goalContext: string,
    knowledgeBaseContent: string
): Promise<Scorecard> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
You are a professional LLM Readiness Auditor. 
${knowledgeBaseContent}

--- AUDITING CONTEXT ---
Type: ${contentType}
Goal: ${goalContext}
Focus: ${modelFocus.join(', ')}
-----------------------

--- CONTENT ---
${userContent}
----------------`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.1, 
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Audit Error:", error);
        throw new Error("Failed to audit content. Ensure your API key is valid and content is not blocked.");
    }
}

export async function rewriteContent(originalContent: string, improvementPlan: string): Promise<{ rewrittenContent: string, explanation: string }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
    You are a world-class content strategist and AI optimization expert.
    
    ORIGINAL CONTENT:
    ${originalContent}
    
    IMPROVEMENT STRATEGY:
    ${improvementPlan}
    
    TASK:
    Completely rewrite the content to be "AI-First". 
    
    OUTPUT FORMAT REQUIREMENTS:
    - NEAT STRUCTURE: Use clear H1, H2, and H3 headers.
    - DETAILED PARAGRAPHS: Do not use excessive bullet points. Explain concepts in rich, informative paragraphs.
    - LOGICAL FLOW: Ensure a clear introduction, middle development, and conclusion.
    - MARKDOWN: Use bolding for emphasis on key entities.
    - EXPLANATION: Provide a detailed summary of why this version is better for LLMs.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: rewriteResponseSchema,
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Rewrite Error:", error);
        throw new Error("Failed to optimize content.");
    }
}

export async function fetchUrlContent(url: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Perform a Google Search to extract the main content from: ${url}. 
    Return the clean text of the article/page, excluding headers/footers/ads.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return response.text || "No content found.";
    } catch (error) {
        throw new Error("URL fetch failed.");
    }
}