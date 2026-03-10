
export interface Scorecard {
  chatgpt_score: number;
  perplexity_score: number;
  grok_score: number;
  claude_score: number;
  gemini_score: number;
  
  experience_score: number;
  expertise_score: number;
  authoritativeness_score: number;
  trustworthiness_score: number;
  
  conversational_percentage: number;
  
  key_wins: string[];
  what_is_missing: string[];
  areas_for_improvement: string[];
  
  summary_report: string;
}
