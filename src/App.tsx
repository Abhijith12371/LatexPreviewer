import { useState } from 'react';
import { Sigma } from 'lucide-react';
import EditorPane from './components/EditorPane';
import PreviewPane from './components/PreviewPane';

function App() {
  const [latex, setLatex] = useState<string>(
    'f(x) = \\int_{-\\infty}^{\\infty} \\hat f(\\xi)\\,e^{2 \\pi i \\xi x} \\,d\\xi'
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-900 overflow-hidden font-sans relative">
      {/* Background decoration */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-brand-600/20 to-transparent pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="flex-none z-10 bg-slate-900/50 backdrop-blur-md border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-brand-500/20 p-2 rounded-lg border border-brand-500/30">
            <Sigma className="w-6 h-6 text-brand-400" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-purple-400 tracking-tight">
            LaTeX Live
          </h1>
        </div>
        <div className="text-slate-400 text-sm">
          Real-time math renderer
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow z-10 p-4 md:p-6 overflow-hidden">
        <div className="glass-panel w-full h-full p-2 flex flex-col lg:flex-row gap-2">
          <div className="flex-1 min-h-[40%] lg:min-h-0 relative group">
            <EditorPane value={latex} onChange={setLatex} />
          </div>
          <div className="hidden lg:block w-px bg-slate-700/50 my-4" />
          <div className="block lg:hidden h-px w-full bg-slate-700/50 mx-4" />
          <div className="flex-1 min-h-[40%] lg:min-h-0 relative">
            <PreviewPane latex={latex} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
