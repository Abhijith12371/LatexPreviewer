import React from 'react';

interface EditorPaneProps {
  value: string;
  onChange: (value: string) => void;
}

const EditorPane: React.FC<EditorPaneProps> = ({ value, onChange }) => {
  return (
    <div className="flex flex-col h-full w-full bg-slate-900/40 rounded-xl overflow-hidden border border-slate-700/50 shadow-inner">
      <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-300 tracking-wide uppercase">LaTeX Input</h2>
      </div>
      <div className="flex-grow p-4 overflow-hidden relative">
        <textarea
          className="w-full h-full bg-transparent text-slate-200 font-mono text-sm sm:text-base resize-none focus:outline-none scrollbar-custom"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type or paste your LaTeX code here... \n\nExample:\n\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}"
          spellCheck="false"
        />
      </div>
    </div>
  );
};

export default EditorPane;
