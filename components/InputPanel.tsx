import React, { useState } from 'react';
import { CONTENT_TYPES, LLM_MODELS, ContentType, LLMModel, DEFAULT_KNOWLEDGE_BASE } from '../constants';
import { UploadIcon, LinkIcon } from './icons';
import { fetchUrlContent } from '../services/geminiService';

// Add declarations for CDN libraries
declare global {
    interface Window {
        mammoth: any;
        pdfjsLib: any;
    }
}

interface InputPanelProps {
    onAuditRequest: (content: string, contentType: ContentType, modelFocus: LLMModel[], goalContext: string, knowledgeBaseContent: string) => void;
    isLoading: boolean;
}

export const InputPanel: React.FC<InputPanelProps> = ({ onAuditRequest, isLoading }) => {
    const [content, setContent] = useState<string>('');
    const [contentType, setContentType] = useState<ContentType>(ContentType.Article);
    const [selectedModels, setSelectedModels] = useState<LLMModel[]>(LLM_MODELS);
    const [goalContext, setGoalContext] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');
    const [isParsingFile, setIsParsingFile] = useState<boolean>(false);
    
    const [url, setUrl] = useState<string>('');
    const [isFetchingUrl, setIsFetchingUrl] = useState<boolean>(false);
    const [urlError, setUrlError] = useState<string | null>(null);

    const [knowledgeBaseContent, setKnowledgeBaseContent] = useState<string>(DEFAULT_KNOWLEDGE_BASE);
    const [knowledgeBaseFileNames, setKnowledgeBaseFileNames] = useState<string[]>([]);
    const [isParsingKbFile, setIsParsingKbFile] = useState<boolean>(false);


    const handleModelChange = (model: LLMModel) => {
        setSelectedModels(prev =>
            prev.includes(model) ? prev.filter(m => m !== model) : [...prev, model]
        );
    };
    
    const parseFile = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            const reader = new FileReader();

            reader.onload = async (event) => {
                try {
                    const arrayBuffer = event.target?.result as ArrayBuffer;
                    if (fileExtension === 'docx') {
                        if (arrayBuffer) {
                            const result = await window.mammoth.extractRawText({ arrayBuffer });
                            resolve(result.value);
                        }
                    } else if (fileExtension === 'pdf') {
                        if (arrayBuffer) {
                            const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                            let fullText = '';
                            for (let i = 1; i <= pdf.numPages; i++) {
                                const page = await pdf.getPage(i);
                                const textContent = await page.getTextContent();
                                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                                fullText += pageText + '\n\n';
                            }
                            resolve(fullText.trim());
                        }
                    } else { // Handles .txt, .md, etc.
                        resolve(event.target?.result as string || '');
                    }
                } catch (err) {
                    reject(new Error(`Could not parse the file: ${file.name}`));
                }
            };
            reader.onerror = () => reject(new Error(`Could not read the file: ${file.name}`));

            if (fileExtension === 'docx' || fileExtension === 'pdf') {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsText(file);
            }
        });
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setContent('');
        setUrl('');
        setUrlError(null);
        setIsParsingFile(true);
        try {
            const textContent = await parseFile(file);
            setContent(textContent);
        } catch (error) {
            console.error(error);
            setContent(error instanceof Error ? error.message : 'An unknown error occurred during file parsing.');
        } finally {
            setIsParsingFile(false);
        }
    };
    
    const handleUrlFetch = async () => {
        if (!url) {
            setUrlError("Please enter a URL.");
            return;
        }
        setIsFetchingUrl(true);
        setUrlError(null);
        setContent('');
        setFileName('');
        try {
            const textContent = await fetchUrlContent(url);
            setContent(textContent);
            setFileName(url);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            setUrlError(errorMessage);
            setContent(`Failed to fetch content from URL: ${errorMessage}`);
        } finally {
            setIsFetchingUrl(false);
        }
    };

    const handleKnowledgeBaseFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsParsingKbFile(true);
        const fileList: File[] = Array.from(files);
        const newFileNames = fileList.map(f => f.name);
        setKnowledgeBaseFileNames(prev => [...prev, ...newFileNames]);
        
        let parseError = '';

        for (const file of fileList) {
            try {
                const textContent = await parseFile(file);
                setKnowledgeBaseContent(prev => 
                    `${prev}\n\n--- START OF FILE: ${file.name} ---\n${textContent}\n--- END OF FILE: ${file.name} ---\n`
                );
            } catch (error) {
                 console.error(error);
                 parseError += (error instanceof Error ? error.message : `Unknown error for ${file.name}`) + '\n';
            }
        }
        
        if(parseError) {
            setKnowledgeBaseContent(prev => `${prev}\n\n[ERROR] The following files could not be processed:\n${parseError}`);
        }

        setIsParsingKbFile(false);
        e.target.value = '';
    };



    const handleSubmit = () => {
        let sourceDescription = 'Pasted Content';
        if (fileName) {
             try {
                // A simple check to see if it's a URL
                new URL(fileName);
                sourceDescription = `Content from URL: ${fileName}`;
            } catch (_) {
                sourceDescription = `Uploaded file: ${fileName}`;
            }
        }

        let fullGoalContext = `Source Context: ${sourceDescription}`;
        if (goalContext) {
            fullGoalContext += ` | User Goal: ${goalContext}`;
        }
        onAuditRequest(content, contentType, selectedModels, fullGoalContext, knowledgeBaseContent);
    };
    
    const isBusy = isLoading || isParsingFile || isParsingKbFile || isFetchingUrl;
    
    return (
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-2xl space-y-6">
            <div>
                 <label htmlFor="content-area" className="block text-lg font-heading font-semibold text-gray-200 mb-2">
                    Paste Content
                </label>
                <textarea
                    id="content-area"
                    rows={8}
                    className="w-full bg-black border border-gray-700 rounded-lg p-4 text-gray-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition disabled:opacity-50 font-mono text-sm"
                    placeholder={isParsingFile ? "Processing file..." : (isFetchingUrl ? "Fetching content from URL..." : "Paste your content here...")}
                    value={content}
                    onChange={(e) => {
                        setContent(e.target.value);
                        setFileName('');
                        setUrl('');
                        setUrlError(null);
                    }}
                    disabled={isParsingFile || isFetchingUrl}
                />
            </div>
            
            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-800"></div>
                <span className="flex-shrink mx-4 text-gray-500 text-xs font-heading uppercase tracking-wider">OR</span>
                <div className="flex-grow border-t border-gray-800"></div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-heading font-medium text-gray-300">
                    Upload a File
                </label>
                <div className="flex items-center">
                    <label htmlFor="file-upload" className={`relative cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-gray-300 font-medium py-2.5 px-5 rounded-lg inline-flex items-center transition border border-zinc-700 ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <UploadIcon />
                        <span className="ml-2 font-heading">Upload File</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".txt,.md,.docx,.pdf" onChange={handleFileChange} disabled={isBusy} />
                    </label>
                    {fileName && !url && <p className="text-sm text-gray-400 ml-4 truncate" title={fileName}>{fileName}</p>}
                </div>
            </div>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-800"></div>
                <span className="flex-shrink mx-4 text-gray-500 text-xs font-heading uppercase tracking-wider">OR</span>
                <div className="flex-grow border-t border-gray-800"></div>
            </div>

            <div>
                 <label htmlFor="url-input" className="block text-sm font-heading font-medium text-gray-300 mb-2">
                    Fetch from URL
                </label>
                <div className="flex items-stretch shadow-sm">
                    <div className="relative flex-grow">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                            <LinkIcon />
                        </div>
                        <input
                            id="url-input"
                            type="url"
                            className="w-full bg-black border border-gray-700 rounded-l-lg p-3 pl-10 text-gray-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition disabled:opacity-50"
                            placeholder="https://example.com/article"
                            value={url}
                            onChange={(e) => {
                                setUrl(e.target.value);
                                setUrlError(null);
                            }}
                            disabled={isBusy}
                        />
                    </div>
                    <button onClick={handleUrlFetch} disabled={isBusy} className="bg-zinc-800 hover:bg-zinc-700 border border-l-0 border-gray-700 text-gray-300 font-heading font-medium py-2 px-4 rounded-r-lg inline-flex items-center transition disabled:opacity-50 disabled:cursor-not-allowed">
                        {isFetchingUrl ? 'Fetching...' : 'Fetch'}
                    </button>
                </div>
                {urlError && <p className="text-sm text-red-400 mt-2">{urlError}</p>}
            </div>

            <details className="bg-black/40 border border-zinc-800 rounded-lg group">
                <summary className="cursor-pointer p-3 font-heading font-medium text-gray-300 hover:text-white flex justify-between items-center">
                    <span>Auditing Guidelines</span>
                    <span className="transform group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="p-4 border-t border-zinc-800 space-y-4">
                    <p className="text-sm text-gray-400">The auditor will use these guidelines to perform its analysis. The default rules are loaded below.</p>
                     <textarea
                        id="kb-content-area"
                        rows={8}
                        className="w-full bg-black border border-gray-800 rounded-lg p-3 text-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition disabled:opacity-50 font-mono text-xs"
                        placeholder={isParsingKbFile ? "Processing file(s)..." : "Default guidelines loaded. You can edit, clear, or add to them here."}
                        value={knowledgeBaseContent}
                        onChange={(e) => setKnowledgeBaseContent(e.target.value)}
                        disabled={isParsingKbFile}
                    />
                    <div className="flex items-center">
                         <label htmlFor="kb-file-upload" className={`relative cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-gray-300 font-medium py-2 px-4 rounded-lg inline-flex items-center transition border border-zinc-700 ${isParsingKbFile || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <UploadIcon />
                            <span className="ml-2 font-heading text-sm">Upload Guidelines</span>
                            <input id="kb-file-upload" name="kb-file-upload" type="file" className="sr-only" accept=".txt,.md,.docx,.pdf" onChange={handleKnowledgeBaseFileChange} disabled={isParsingKbFile || isLoading} multiple />
                        </label>
                    </div>
                     {knowledgeBaseFileNames.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {knowledgeBaseFileNames.map((name, i) => (
                                <span key={`${name}-${i}`} className="bg-blue-900/30 border border-blue-800 text-xs text-blue-200 px-2 py-1 rounded-full">{name}</span>
                            ))}
                        </div>
                    )}
                </div>
            </details>

            <div>
                <label htmlFor="content-type" className="block text-sm font-heading font-medium text-gray-300 mb-2">
                    Content Type
                </label>
                <select
                    id="content-type"
                    className="w-full bg-black border border-gray-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value as ContentType)}
                >
                    {CONTENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
            </div>

            <div>
                <label className="block text-sm font-heading font-medium text-gray-300 mb-2">
                    Model Focus
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {LLM_MODELS.map(model => (
                        <div key={model} className="flex items-center bg-black/40 p-2 rounded border border-gray-800">
                            <input
                                id={`model-${model}`}
                                type="checkbox"
                                checked={selectedModels.includes(model)}
                                onChange={() => handleModelChange(model)}
                                className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-600 ring-offset-gray-900"
                            />
                            <label htmlFor={`model-${model}`} className="ml-2 text-sm text-gray-300 font-medium">{model}</label>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <label htmlFor="goal-context" className="block text-sm font-heading font-medium text-gray-300 mb-2">
                    Goal Context (Optional)
                </label>
                <input
                    id="goal-context"
                    type="text"
                    className="w-full bg-black border border-gray-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="e.g., Finance Knowledge Base"
                    value={goalContext}
                    onChange={(e) => setGoalContext(e.target.value)}
                />
            </div>
            
            <button
                onClick={handleSubmit}
                disabled={isBusy || !content}
                className="w-full bg-white text-black hover:bg-gray-200 disabled:bg-gray-700 disabled:text-gray-500 font-heading font-bold py-4 px-4 rounded-xl transition duration-300 ease-in-out flex items-center justify-center disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-lg"
            >
                {isLoading ? 'Analyzing...' : 'Audit Content'}
            </button>
        </div>
    );
};