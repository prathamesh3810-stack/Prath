export enum ContentType {
    Article = "Article",
    Guide = "Guide",
    TechnicalDoc = "Technical Doc",
    FAQ = "FAQ",
    KnowledgeBase = "Knowledge Base",
    MarketingPage = "Marketing Page"
}

export const CONTENT_TYPES: ContentType[] = Object.values(ContentType);

export enum LLMModel {
    ChatGPT = "ChatGPT",
    Gemini = "Gemini",
    Claude = "Claude",
    Perplexity = "Perplexity",
    Grok = "Grok",
}

export const LLM_MODELS: LLMModel[] = Object.values(LLMModel);

export const DEFAULT_KNOWLEDGE_BASE = `
Title: LLM Readiness Auditor — Granular Scoring Instructions

Purpose:
Analyze content and provide a granular scorecard with individual scores (0-10) for each major LLM, a detailed E-E-A-T breakdown, a conversational percentage, and specific lists for wins, gaps, and improvements.

INSTRUCTIONS FOR THE RATER / AUTOMATED RUBRIC

Your entire analysis and output MUST be based on the provided instructions. Your response MUST be a single JSON object that strictly adheres to the schema defined below. All scores are from 0 to 10 unless otherwise specified.

--- SCORING METRICS (0-10) ---

1. LLM-SPECIFIC SCORES (0-10 for each):
   - ChatGPT Score: Conversational clarity, follow-up potential, and friendly tone.
   - Perplexity Score: Directness of answers, citation readiness, and factual density.
   - Grok Score: Depth of reasoning, presence of edge cases, and logical progression.
   - Claude Score: Nuance, handling of safety/disclaimers, and balanced arguments.
   - Gemini Score: Schema/metadata readiness, multi-modal potential, and entity consistency.

2. E-E-A-T BREAKDOWN (0-10 for each):
   - Experience Score: Authentic, first-hand experience.
   - Expertise Score: Deep subject matter knowledge.
   - Authoritativeness Score: Credibility of source/author.
   - Trustworthiness Score: Transparency and factual accuracy.

3. CONVERSATIONAL PERCENTAGE (0-10):
   - Suitability for conversational contexts.

--- QUALITATIVE LISTS ---

1. KEY WINS (Array of Strings):
   - 3-5 specific high points.

2. WHAT IS MISSING (Array of Strings):
   - 3-5 specific missing elements.

3. AREAS FOR IMPROVEMENT (Array of Strings):
   - 3-5 actionable steps.

4. SUMMARY REPORT (Markdown String):
   - Provide a HIGHLY DETAILED, professional report.
   - Use long paragraphs (at least 3-4 sentences each) for analysis.
   - Use H3 (###) for sections. 
   - Structure:
     ### Executive Overview
     Provide a comprehensive analysis of why the content is or isn't ready for AI retrieval. Discuss the overall "voice" and its impact on performance.
     
     ### Model-Specific Insights
     Explain the logic behind the scores for each focus model. Why did it excel in Perplexity but fail in Claude? Use specific examples from the text.
     
     ### Content Quality & Trust (E-E-A-T)
     Detail the signals that build or erode trust. Focus on specific paragraphs or statements that demonstrate expertise or lack thereof.
     
     ### Optimization Roadmap
     A deep dive into the most critical shifts needed to become "AI-First" content.

--- FINAL JSON OUTPUT STRUCTURE ---

{
  "chatgpt_score": 0.0,
  "perplexity_score": 0.0,
  "grok_score": 0.0,
  "claude_score": 0.0,
  "gemini_score": 0.0,
  "experience_score": 0.0,
  "expertise_score": 0.0,
  "authoritativeness_score": 0.0,
  "trustworthiness_score": 0.0,
  "conversational_percentage": 0.0,
  "key_wins": [],
  "what_is_missing": [],
  "areas_for_improvement": [],
  "summary_report": ""
}
`;