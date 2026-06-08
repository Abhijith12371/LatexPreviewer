import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import EditorPane from '../components/EditorPane';
import PreviewPane from '../components/PreviewPane';
import AIGeneratorPanel from '../components/AIGeneratorPanel';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import Modal from '../components/Modal';
import api from '../api';
import {
  FileText, Save, Loader2, CheckCircle2, AlertCircle,
  BookOpen, ExternalLink, Trash2, ChevronDown, ChevronUp
} from 'lucide-react';

interface SavedResume {
  id: string;
  title: string;
  pdf_url: string;
  created_at: string;
}

function ResumeBuilder() {
  const location = useLocation();
  const [latex, setLatex] = useState<string>(location.state?.latex || '');
  const [profile, setProfile] = useState<any>(null);

  // Modal & Save States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resumeTitle, setResumeTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStep, setSaveStep] = useState<'idle' | 'compiling' | 'uploading' | 'saving' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Saved Resumes
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  // Load profile to get user ID
  useEffect(() => {
    api.get('/api/profile')
      .then(r => setProfile(r.data))
      .catch(err => console.error('Failed to load profile', err));
  }, []);

  // Set default title when modal opens
  useEffect(() => {
    if (isModalOpen) {
      const defaultTitle = profile?.basic_details?.role_designation
        ? `Resume - ${profile.basic_details.role_designation}`
        : 'My AI Resume';
      setResumeTitle(defaultTitle);
      setSaveStep('idle');
      setErrorMessage('');
      setStatusMessage('');
    }
  }, [isModalOpen, profile]);

  const fetchSavedResumes = async () => {
    setLoadingSaved(true);
    try {
      const res = await api.get('/saved-resumes');
      setSavedResumes(res.data);
    } catch (err) {
      console.error('Failed to load saved resumes', err);
    } finally {
      setLoadingSaved(false);
    }
  };

  const handleToggleSaved = () => {
    if (!showSaved) fetchSavedResumes();
    setShowSaved(prev => !prev);
  };

  const handleDeleteResume = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/saved-resumes/${id}`);
      setSavedResumes(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Failed to delete resume', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenPdf = async (id: string) => {
    setOpeningId(id);
    try {
      const res = await api.get(`/resume-view-url/${id}`);
      window.open(res.data.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Failed to get signed URL', err);
      alert('Could not open PDF. Please try again.');
    } finally {
      setOpeningId(null);
    }
  };

  const handleSaveResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeTitle.trim()) {
      setErrorMessage('Please enter a title for your resume.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      // Step 1: Compiling
      setSaveStep('compiling');
      setStatusMessage('Compiling LaTeX to PDF...');

      // Step 2: Upload (backend handles both compile + upload in one call)
      setSaveStep('uploading');
      setStatusMessage('Uploading PDF to Cloudinary...');

      const res = await api.post('/save-resume', {
        title: resumeTitle,
        latex,
      });

      setSaveStep('success');
      setStatusMessage('Resume saved successfully!');

      // Add to local list
      setSavedResumes(prev => [res.data, ...prev]);

      setTimeout(() => {
        setIsModalOpen(false);
        setIsSaving(false);
        setSaveStep('idle');
      }, 1500);

    } catch (err: any) {
      console.error('Save failed:', err);
      setSaveStep('error');
      const errMsg =
        err.response?.data?.detail ||
        err.message ||
        'Failed to save resume. Please try again.';
      setErrorMessage(errMsg);
      setIsSaving(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background decoration */}
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-brand-600/10 to-transparent pointer-events-none" />

        {/* Header */}
        <TopBar title="AI Resume Builder" subtitle="Generate a tailored resume from your profile + a job description">
          <div className="flex items-center gap-2">
            {/* Saved Resumes toggle */}
            <button
              onClick={handleToggleSaved}
              className="px-3 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Saved
              {showSaved ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {/* Save button — only when latex is ready */}
            {latex.trim() && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-700 active:bg-brand-800 transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Save Resume
              </button>
            )}
          </div>
        </TopBar>

        {/* Saved Resumes Drawer */}
        {showSaved && (
          <div className="z-20 mx-4 md:mx-6 mb-2 bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Your Saved Resumes</h3>
              {loadingSaved && <Loader2 className="w-4 h-4 animate-spin text-brand-500" />}
            </div>
            {savedResumes.length === 0 && !loadingSaved ? (
              <p className="text-sm text-slate-400 italic px-4 py-4 text-center">
                No saved resumes yet. Generate and save one above!
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {savedResumes.map(r => (
                  <li key={r.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{r.title}</p>
                      <p className="text-xs text-slate-400">{formatDate(r.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <button
                        onClick={() => handleOpenPdf(r.id)}
                        disabled={openingId === r.id}
                        className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-medium transition disabled:opacity-50 cursor-pointer"
                      >
                        {openingId === r.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <ExternalLink className="w-3.5 h-3.5" />
                        }
                        Open
                      </button>
                      <button
                        onClick={() => handleDeleteResume(r.id)}
                        disabled={deletingId === r.id}
                        className="text-slate-300 hover:text-red-400 transition disabled:opacity-50 cursor-pointer"
                        title="Delete"
                      >
                        {deletingId === r.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

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

      {/* Save Resume Modal */}
      <Modal isOpen={isModalOpen} onClose={() => !isSaving && setIsModalOpen(false)} title="Save Resume">
        <form onSubmit={handleSaveResume} className="space-y-4">
          {saveStep === 'idle' || saveStep === 'error' ? (
            <>
              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 mb-2">
                <FileText className="w-5 h-5 text-brand-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-700">Save to Cloudinary</p>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Your LaTeX will be compiled to PDF and stored securely in Cloudinary. A link will be saved to your account.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Resume Title</label>
                <input
                  type="text"
                  required
                  value={resumeTitle}
                  onChange={(e) => setResumeTitle(e.target.value)}
                  placeholder="e.g. Software Engineer Resume"
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white transition"
                />
              </div>

              {errorMessage && (
                <div className="flex items-start gap-2 text-xs font-medium text-red-500 bg-red-50 p-2.5 rounded-lg border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 transition font-semibold"
                >
                  Save Resume
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              {saveStep === 'success' ? (
                <>
                  <CheckCircle2 className="w-12 h-12 text-green-500 animate-bounce mb-3" />
                  <p className="text-sm font-bold text-slate-800">{statusMessage}</p>
                  <p className="text-xs text-slate-400 mt-1">You can find it in "Saved" above.</p>
                </>
              ) : (
                <>
                  <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-3" />
                  <p className="text-sm font-semibold text-slate-800">{statusMessage}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {saveStep === 'compiling'
                      ? 'This may take up to 30 seconds for complex documents.'
                      : 'Uploading your PDF securely...'}
                  </p>
                  <p className="text-[10px] text-slate-300 mt-2">Please do not close this window.</p>
                </>
              )}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}

export default ResumeBuilder;
