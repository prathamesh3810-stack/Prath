import React, { useState, useCallback } from 'react';
import { InputPanel } from './components/InputPanel';
import { ReportPanel } from './components/ReportPanel';
import { auditContent, rewriteContent } from './services/geminiService';
import { Scorecard } from './types';
import { LLMModel, ContentType } from './constants';

const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [scorecard, setScorecard] = useState<Scorecard | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [auditedContent, setAuditedContent] = useState<string>('');

    const [isRewriting, setIsRewriting] = useState<boolean>(false);
    const [rewrittenContent, setRewrittenContent] = useState<string | null>(null);
    const [rewriteExplanation, setRewriteExplanation] = useState<string | null>(null);
    const [rewriteError, setRewriteError] = useState<string | null>(null);


    const handleAuditRequest = useCallback(async (
        content: string,
        contentType: ContentType,
        modelFocus: LLMModel[],
        goalContext: string,
        knowledgeBaseContent: string
    ) => {
        if (!content) {
            setError('Content cannot be empty.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setScorecard(null);
        setAuditedContent(content);
        setRewrittenContent(null);
        setRewriteExplanation(null);
        setRewriteError(null);

        try {
            const resultScorecard = await auditContent(content, contentType, modelFocus, goalContext, knowledgeBaseContent);
            setScorecard(resultScorecard);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleRewriteRequest = useCallback(async () => {
        if (!auditedContent || !scorecard?.summary_report) {
            setRewriteError("Missing original content or a summary report to perform a rewrite.");
            return;
        }
        setIsRewriting(true);
        setRewrittenContent(null);
        setRewriteExplanation(null);
        setRewriteError(null);
    
        try {
            const improvementPlan = `Based on the following analysis, please rewrite the content: ${scorecard.summary_report}`;
            const { rewrittenContent, explanation } = await rewriteContent(auditedContent, improvementPlan);
            setRewrittenContent(rewrittenContent);
            setRewriteExplanation(explanation);
        } catch (err) {
            console.error(err);
            setRewriteError(err instanceof Error ? err.message : 'An unknown error occurred during rewrite.');
        } finally {
            setIsRewriting(false);
        }
    }, [auditedContent, scorecard]);

    return (
        <div className="min-h-screen bg-black text-gray-200">
            <header className="py-8 px-4 sm:px-8 border-b border-gray-800">
                 <h1 className="text-4xl font-heading font-bold text-center text-white tracking-tight">
                    <span role="img" aria-label="audit icon" className="mr-3">🔬</span>
                    LLM Readiness Auditor
                </h1>
                <p className="text-center text-gray-400 mt-2 font-medium">
                    Analyze your content's performance across major LLMs.
                </p>
            </header>
            <main className="p-4 sm:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-2">
                        <InputPanel onAuditRequest={handleAuditRequest} isLoading={isLoading} />
                    </div>
                    <div className="lg:col-span-3">
                        <ReportPanel 
                            scorecard={scorecard} 
                            isLoading={isLoading} 
                            error={error}
                            onRewriteRequest={handleRewriteRequest}
                            isRewriting={isRewriting}
                            rewrittenContent={rewrittenContent}
                            rewriteExplanation={rewriteExplanation}
                            rewriteError={rewriteError}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;