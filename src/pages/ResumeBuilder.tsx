import { useState } from 'react';
import EditorPane from '../components/EditorPane';
import PreviewPane from '../components/PreviewPane';
import AIGeneratorPanel from '../components/AIGeneratorPanel';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';

function ResumeBuilder() {
  const [latex, setLatex] = useState<string>('');

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background decoration */}
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-brand-600/10 to-transparent pointer-events-none" />
        
        {/* Header */}
        <TopBar title="AI Resume Builder" subtitle="Generate a tailored resume from your profile + a job description" />

        {/* Main Content */}
        <main className="flex-grow z-10 p-4 md:p-6 overflow-hidden">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 w-full h-full p-2 flex flex-col lg:flex-row gap-2">
            {/* Left Panel: AI Generator */}
            <div className="flex-[0.25] min-h-[40%] lg:min-h-0 relative group">
              <AIGeneratorPanel onGenerate={setLatex} />
            </div>
            
            <div className="hidden lg:block w-px bg-slate-200 my-4" />
            <div className="block lg:hidden h-px w-full bg-slate-200 mx-4" />
            
            {/* Middle Panel: Editor */}
            <div className="flex-[0.35] min-h-[40%] lg:min-h-0 relative group">
              <EditorPane value={latex} onChange={setLatex} />
            </div>
            
            <div className="hidden lg:block w-px bg-slate-200 my-4" />
            <div className="block lg:hidden h-px w-full bg-slate-200 mx-4" />
            
            {/* Right Panel: Preview */}
            <div className="flex-[0.40] min-h-[40%] lg:min-h-0 relative">
              <PreviewPane latex={latex} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default ResumeBuilder;
