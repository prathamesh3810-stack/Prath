import React, { useRef, useEffect, useState } from 'react';
import { Scorecard } from '../types';
import { ScoreGauge } from './ScoreGauge';
import { Spinner } from './Spinner';
import { DocumentIcon, DownloadIcon, SparklesIcon, CopyIcon, CheckIcon, SummaryIcon, ChatGptIcon, GeminiIcon, ClaudeIcon, PerplexityIcon, GrokIcon, EeatIcon, CrossCircleIcon, LightBulbIcon } from './icons';

declare global {
    interface Window {
        DOMPurify: any;
        marked: any;
    }
}

interface ReportPanelProps {
    scorecard: Scorecard | null;
    isLoading: boolean;
    error: string | null;
    onRewriteRequest: () => void;
    isRewriting: boolean;
    rewrittenContent: string | null;
    rewriteExplanation: string | null;
    rewriteError: string | null;
}

const ReportSection: React.FC<{ title: string, icon: React.ReactNode, children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-zinc-950/40 border border-zinc-800/60 p-6 sm:p-8 rounded-2xl shadow-inner">
        <h3 className="font-heading font-bold text-2xl mb-6 text-white flex items-center gap-3">
            <span className="p-2 bg-zinc-900 rounded-lg">{icon}</span>
            {title}
        </h3>
        <div className="prose prose-invert prose-slate max-w-none 
            prose-headings:font-heading prose-headings:font-bold prose-headings:text-gray-100
            prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-6
            prose-strong:text-white prose-strong:font-semibold
            prose-ul:list-disc prose-li:marker:text-blue-500 prose-li:text-gray-300
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4">
            {children}
        </div>
    </div>
);

export const ReportPanel: React.FC<ReportPanelProps> = ({ scorecard, isLoading, error, onRewriteRequest, isRewriting, rewrittenContent, rewriteExplanation, rewriteError }) => {
    const summaryRef = useRef<HTMLDivElement>(null);
    const optimizedRef = useRef<HTMLDivElement>(null);
    const explanationRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);

    const parseMarkdown = (text: string) => {
        if (!text) return '';
        const rawHtml = window.marked ? (typeof window.marked.parse === 'function' ? window.marked.parse(text) : window.marked(text)) : text;
        return window.DOMPurify ? window.DOMPurify.sanitize(rawHtml) : rawHtml;
    };

    useEffect(() => {
        if (scorecard?.summary_report && summaryRef.current) {
            summaryRef.current.innerHTML = parseMarkdown(scorecard.summary_report);
        }
    }, [scorecard]);

    useEffect(() => {
        if (rewrittenContent && optimizedRef.current) {
            optimizedRef.current.innerHTML = parseMarkdown(rewrittenContent);
        }
    }, [rewrittenContent]);

    useEffect(() => {
        if (rewriteExplanation && explanationRef.current) {
            explanationRef.current.innerHTML = parseMarkdown(rewriteExplanation);
        }
    }, [rewriteExplanation]);

    const handleCopy = () => {
        if (rewrittenContent) {
            navigator.clipboard.writeText(rewrittenContent);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 flex flex-col items-center justify-center min-h-[600px]">
                <Spinner />
                <h3 className="mt-8 text-2xl font-heading font-bold text-white">Running Deep Audit</h3>
                <p className="text-gray-400 mt-2 text-center max-w-md">Our specialized AI models are analyzing your content for semantic density, trust signals, and model-specific retrieval patterns.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-zinc-900 border border-red-900/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-red-950/50 rounded-full flex items-center justify-center text-red-500 mb-4">
                    <CrossCircleIcon />
                </div>
                <h3 className="text-xl font-heading font-bold text-white mb-2">Audit Failed</h3>
                <p className="text-red-400 max-w-sm mb-6">{error}</p>
                <button onClick={() => window.location.reload()} className="bg-zinc-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-zinc-700 transition">Try Again</button>
            </div>
        );
    }

    if (!scorecard) {
        return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 flex flex-col items-center justify-center min-h-[600px] border-dashed">
                <DocumentIcon />
                <h3 className="mt-8 text-2xl font-heading font-bold text-white">Ready for Analysis</h3>
                <p className="text-gray-500 mt-2 text-center max-w-xs">Submit your content on the left to generate a comprehensive LLM Readiness Report.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-zinc-800">
                    <div>
                        <h2 className="text-3xl font-heading font-bold text-white">Audit Result</h2>
                        <p className="text-gray-400">Content Performance across AI Ecosystem</p>
                    </div>
                    <button onClick={() => {
                        const blob = new Blob([JSON.stringify(scorecard, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'audit-report.json';
                        a.click();
                    }} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-gray-300 px-4 py-2 rounded-lg transition text-sm font-medium">
                        <DownloadIcon /> Export Data
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 mb-12">
                    <ScoreGauge label="ChatGPT" score={scorecard.chatgpt_score} maxScore={10} color="#10a37f" icon={<ChatGptIcon />} />
                    <ScoreGauge label="Perplexity" score={scorecard.perplexity_score} maxScore={10} color="#21bbd3" icon={<PerplexityIcon />} />
                    <ScoreGauge label="Grok" score={scorecard.grok_score} maxScore={10} color="#e11d48" icon={<GrokIcon />} />
                    <ScoreGauge label="Claude" score={scorecard.claude_score} maxScore={10} color="#d97706" icon={<ClaudeIcon />} />
                    <ScoreGauge label="Gemini" score={scorecard.gemini_score} maxScore={10} color="#4f46e5" icon={<GeminiIcon />} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12 bg-black/30 p-4 rounded-xl border border-zinc-800/50">
                    {[
                        { label: 'Experience', score: scorecard.experience_score },
                        { label: 'Expertise', score: scorecard.expertise_score },
                        { label: 'Authority', score: scorecard.authoritativeness_score },
                        { label: 'Trust', score: scorecard.trustworthiness_score }
                    ].map(item => (
                        <div key={item.label} className="text-center">
                            <div className="text-2xl font-heading font-bold text-yellow-500">{item.score.toFixed(1)}</div>
                            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{item.label}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="p-5 rounded-xl bg-green-950/10 border border-green-900/30">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-green-500 mb-3 flex items-center gap-2">
                            <CheckIcon /> Key Wins
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            {scorecard.key_wins.map((w, i) => <li key={i} className="flex gap-2"><span>•</span>{w}</li>)}
                        </ul>
                    </div>
                    <div className="p-5 rounded-xl bg-red-950/10 border border-red-900/30">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-red-500 mb-3 flex items-center gap-2">
                            <CrossCircleIcon /> Gaps
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            {scorecard.what_is_missing.map((w, i) => <li key={i} className="flex gap-2"><span>•</span>{w}</li>)}
                        </ul>
                    </div>
                    <div className="p-5 rounded-xl bg-blue-950/10 border border-blue-900/30">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-3 flex items-center gap-2">
                            <LightBulbIcon /> Actionable
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            {scorecard.areas_for_improvement.map((w, i) => <li key={i} className="flex gap-2"><span>•</span>{w}</li>)}
                        </ul>
                    </div>
                </div>

                <ReportSection title="Detailed Summary Report" icon={<SummaryIcon />}>
                    <div ref={summaryRef}></div>
                </ReportSection>

                <div className="mt-12 pt-12 border-t border-zinc-800">
                    <div className="flex flex-col items-center text-center">
                        <h3 className="text-2xl font-heading font-bold text-white mb-2">Apply Optimizations</h3>
                        <p className="text-gray-400 mb-8 max-w-md">Generate a version of your content that is semantically tuned for LLM retrieval and E-E-A-T dominance.</p>
                        <button 
                            onClick={onRewriteRequest}
                            disabled={isRewriting}
                            className="bg-white text-black px-10 py-4 rounded-xl font-heading font-bold text-lg hover:bg-gray-200 transition shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                        >
                            <SparklesIcon />
                            {isRewriting ? 'Processing Strategy...' : 'Optimize Content Now'}
                        </button>
                    </div>

                    {isRewriting && (
                        <div className="mt-8 flex flex-col items-center p-12 bg-zinc-950/50 rounded-2xl border border-zinc-800 border-dashed">
                            <Spinner />
                            <p className="mt-4 text-gray-300 font-heading">Applying semantic adjustments...</p>
                        </div>
                    )}

                    {rewriteError && (
                        <div className="mt-8 p-4 bg-red-950/20 border border-red-900/50 rounded-xl text-red-400 text-center">{rewriteError}</div>
                    )}

                    {rewrittenContent && (
                        <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-black border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
                                <div className="p-4 sm:p-6 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
                                    <h4 className="font-heading font-bold text-xl text-white flex items-center gap-2">
                                        <SparklesIcon /> AI-Optimized Content
                                    </h4>
                                    <button onClick={handleCopy} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-gray-300 px-4 py-2 rounded-lg transition text-xs font-bold">
                                        {copied ? <CheckIcon /> : <CopyIcon />}
                                        {copied ? 'Copied' : 'Copy Result'}
                                    </button>
                                </div>
                                <div className="p-6 sm:p-10">
                                    <div ref={optimizedRef} className="prose prose-invert prose-lg max-w-none 
                                        prose-headings:font-heading prose-headings:font-bold prose-headings:text-white
                                        prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-8
                                        prose-strong:text-blue-400 prose-strong:font-bold"></div>
                                    
                                    {rewriteExplanation && (
                                        <div className="mt-10 pt-10 border-t border-zinc-800">
                                            <h5 className="font-heading font-bold text-blue-400 mb-4 uppercase tracking-widest text-xs">Strategic Changes:</h5>
                                            <div ref={explanationRef} className="prose prose-invert prose-sm text-gray-400"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};