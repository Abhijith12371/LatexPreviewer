import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Loader2 } from 'lucide-react';

interface PreviewPaneProps {
  latex: string;
}

const PreviewPane: React.FC<PreviewPaneProps> = ({ latex }) => {
  const [isCompiling, setIsCompiling] = useState(false);
  const [isFullDocument, setIsFullDocument] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const fullDoc = latex.includes('\\documentclass');
    setIsFullDocument(fullDoc);

    if (!fullDoc || !latex.trim()) {
      setIsCompiling(false);
      return;
    }

    // Debounce the PDF compilation
    const timer = setTimeout(() => {
      setIsCompiling(true);
      // Submit the hidden form to compile via texlive.net
      if (formRef.current) {
        formRef.current.submit();
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [latex]);

  const handleIframeLoad = () => {
    setIsCompiling(false);
  };

  const renderMathPreview = () => {
    if (!latex.trim()) {
      return <div className="text-slate-500 italic flex items-center justify-center h-full">Preview will appear here...</div>;
    }

    try {
      const html = katex.renderToString(latex, {
        displayMode: true,
        throwOnError: true,
        output: 'html',
      });
      return <div dangerouslySetInnerHTML={{ __html: html }} className="overflow-auto scrollbar-custom max-h-full pb-4" />;
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
        {isCompiling && (
          <div className="flex items-center gap-2 text-brand-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Compiling...</span>
          </div>
        )}
      </div>
      
      <div className="flex-grow flex items-center justify-center min-h-0 bg-slate-900/50 relative">
        {!isFullDocument ? (
          <div className="p-6 h-full w-full flex items-center justify-center bg-white/5 overflow-auto">
            {renderMathPreview()}
          </div>
        ) : (
          <div className="w-full h-full relative">
            {/* Hidden form to bypass CORS and submit directly to iframe */}
            <form 
              ref={formRef} 
              target="pdf-frame" 
              action="https://texlive.net/cgi-bin/latexcgi" 
              method="POST" 
              encType="multipart/form-data"
              className="hidden"
            >
              <input type="hidden" name="filecontents[]" value={latex} />
              <input type="hidden" name="filename[]" value="document.tex" />
              <input type="hidden" name="engine" value="pdflatex" />
              <input type="hidden" name="return" value="pdf" />
            </form>
            
            <iframe 
              name="pdf-frame"
              ref={iframeRef}
              onLoad={handleIframeLoad}
              className={`w-full h-full border-none bg-white transition-opacity duration-300 ${isCompiling ? 'opacity-50' : 'opacity-100'}`}
              title="PDF Preview"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPane;
