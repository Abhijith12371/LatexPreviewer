import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Loader2, RefreshCw } from 'lucide-react';

interface PreviewPaneProps {
  latex: string;
}

const PreviewPane: React.FC<PreviewPaneProps> = ({ latex }) => {
  const [isCompiling, setIsCompiling] = useState(false);
  const [isFullDocument, setIsFullDocument] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const submitToBackend = async () => {
    setIsCompiling(true);
    setErrorMsg(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/compile-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latex })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server returned ${res.status}`);
      }

      const blob = await res.blob();
      const newPdfUrl = URL.createObjectURL(blob);
      setPdfUrl(newPdfUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to compile PDF.');
      setPdfUrl(null);
    } finally {
      setIsCompiling(false);
    }
  };

  useEffect(() => {
    const fullDoc = latex.includes('\\documentclass');
    setIsFullDocument(fullDoc);

    if (!fullDoc || !latex.trim()) {
      setIsCompiling(false);
      return;
    }

    // Debounce so rapid typing doesn't spam the external compiler
    const timer = setTimeout(() => {
      submitToBackend();
    }, 1800);

    return () => {
      clearTimeout(timer);
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [latex]);

  const renderMathPreview = () => {
    if (!latex.trim()) {
      return (
        <div className="text-slate-500 italic flex items-center justify-center h-full">
          Preview will appear here...
        </div>
      );
    }

    try {
      const html = katex.renderToString(latex, {
        displayMode: true,
        throwOnError: true,
        output: 'html',
      });
      return (
        <div
          dangerouslySetInnerHTML={{ __html: html }}
          className="overflow-auto scrollbar-custom max-h-full pb-4"
        />
      );
    } catch (err: any) {
      return (
        <div className="text-red-400 bg-red-950/30 p-4 rounded-lg border border-red-900/50 font-mono text-sm overflow-auto w-full">
          {err.message || 'Syntax Error'}
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-800/40 rounded-xl overflow-hidden border border-slate-700/50 shadow-inner relative">
      <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700/50 flex items-center justify-between z-10">
        <h2 className="text-sm font-medium text-slate-300 tracking-wide uppercase">
          Live Preview {isFullDocument ? '(PDF)' : '(Math)'}
        </h2>
        <div className="flex items-center gap-3">
          {isCompiling && (
            <div className="flex items-center gap-2 text-brand-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Compiling...</span>
            </div>
          )}
          {isFullDocument && !isCompiling && (
            <button
              onClick={submitToBackend}
              title="Recompile PDF"
              className="flex items-center gap-1.5 text-slate-400 hover:text-brand-400 transition-colors text-xs border border-slate-600/50 hover:border-brand-500/50 px-2 py-1 rounded-md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Recompile
            </button>
          )}
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center min-h-0 bg-slate-900/50 relative">
        {!isFullDocument ? (
          <div className="p-6 h-full w-full flex items-center justify-center bg-white/5 overflow-auto">
            {renderMathPreview()}
          </div>
        ) : (
          <div className="w-full h-full relative flex flex-col">
            {/* Loading overlay */}
            {isCompiling && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm">
                <Loader2 className="w-10 h-10 text-brand-400 animate-spin mb-4" />
                <p className="text-slate-300 font-medium">Compiling PDF via Backend...</p>
                <p className="text-slate-500 text-sm mt-1">This may take 15-30 seconds</p>
              </div>
            )}

            {errorMsg ? (
              <div className="flex-grow p-6 overflow-auto bg-slate-900">
                <div className="bg-red-950/40 border border-red-900/50 rounded-lg p-4">
                  <h3 className="text-red-400 font-semibold mb-2">Compilation Error</h3>
                  <pre className="text-red-300/80 text-xs font-mono whitespace-pre-wrap">
                    {errorMsg}
                  </pre>
                </div>
              </div>
            ) : pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-full border-none bg-white"
                title="PDF Preview"
              />
            ) : (
              <div className="flex-grow flex items-center justify-center text-slate-500">
                Waiting for PDF...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPane;
