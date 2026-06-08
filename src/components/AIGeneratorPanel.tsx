import React, { useState } from 'react';
import { Bot, Download, FileText, Loader2, Play } from 'lucide-react';

interface AIGeneratorPanelProps {
  onGenerate: (latex: string) => void;
}

const AIGeneratorPanel: React.FC<AIGeneratorPanelProps> = ({ onGenerate }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedTex, setGeneratedTex] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description.');
      return;
    }

    setIsLoading(true);
    setError('');
    setGeneratedTex(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/generate-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_description: jobDescription,
          candidate_id: 'user_123',
        }),
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail?.detail || 'Failed to generate resume. Ensure the backend is running.');
      }

      const data = await response.json();
      console.log('[AI Generator] latex preview:', data.latex?.substring(0, 120));

      if (data.latex) {
        onGenerate(data.latex);
        setGeneratedTex(data.latex);
      } else {
        throw new Error('No LaTeX content returned from the server.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTex = () => {
    if (!generatedTex) return;
    const blob = new Blob([generatedTex], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.tex';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-800/40 rounded-xl overflow-hidden border border-slate-700/50 shadow-inner">
      <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-300 tracking-wide uppercase flex items-center gap-2">
          <Bot className="w-4 h-4 text-brand-400" />
          AI Generator
        </h2>
      </div>

      <div className="flex-grow p-4 flex flex-col gap-4 overflow-y-auto scrollbar-custom">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            Target Job Description
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
            className="w-full h-48 bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 text-slate-200 text-sm focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 resize-none transition-all"
          />
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-950/30 p-3 rounded-lg border border-red-900/50">
            {error}
          </div>
        )}

        {generatedTex && (
          <div className="bg-green-950/30 border border-green-800/40 rounded-lg p-3 flex flex-col gap-2">
            <p className="text-green-400 text-sm font-medium">✓ Resume generated successfully!</p>
            <p className="text-slate-400 text-xs">
              The LaTeX is now in the editor. The preview pane will compile it shortly (may take ~30s).
            </p>
            <button
              onClick={handleDownloadTex}
              className="flex items-center gap-2 text-xs text-slate-300 hover:text-white border border-slate-600/50 hover:border-slate-400/50 rounded-md px-2 py-1.5 transition-colors w-fit"
            >
              <Download className="w-3.5 h-3.5" />
              Download .tex file
            </button>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Resume...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Generate with AI
            </>
          )}
        </button>
        <p className="text-xs text-slate-500 text-center">
          Generates ATS-friendly LaTeX based on candidate profile.
        </p>
      </div>
    </div>
  );
};

export default AIGeneratorPanel;
