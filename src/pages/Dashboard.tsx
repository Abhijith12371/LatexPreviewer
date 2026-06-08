import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import Modal from '../components/Modal';
import api from '../api';
import {
  User, Briefcase, FileCode, Award, CheckCircle,
  GraduationCap, Pencil, Plus, Trash2, GitBranch,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';


/* ─── helpers ─── */
const uid = () => Math.random().toString(36).slice(2, 9);

const Field = ({ label, value, onChange, type = 'text', placeholder = '' }: any) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white transition"
    />
  </div>
);

const Textarea = ({ label, value, onChange, placeholder = '', rows = 3 }: any) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
    <textarea
      value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white transition resize-none"
    />
  </div>
);

const SaveBtn = ({ onClick, saving }: any) => (
  <div className="mt-6 flex justify-end">
    <button
      onClick={onClick} disabled={saving}
      className="px-5 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 disabled:opacity-50 transition"
    >
      {saving ? 'Saving…' : 'Save Changes'}
    </button>
  </div>
);

const EmptyState = ({ msg }: { msg: string }) => (
  <p className="text-sm text-slate-400 text-center py-6">{msg}</p>
);

/* ─── card header ─── */
const CardHeader = ({ icon, title, color, onAdd }: any) => (
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-2">
      <div className={`${color} p-2 rounded-full`}>{icon}</div>
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
    </div>
    {onAdd && (
      <button onClick={onAdd} className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 transition">
        <Plus className="w-4 h-4" /> Add
      </button>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════ */
export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savedResumes, setSavedResumes] = useState<any[]>([]);
  const [resumesLoading, setResumesLoading] = useState(true);

  /* modal open states */
  const [modal, setModal] = useState<string | null>(null);
  const open = (m: string) => setModal(m);
  const close = () => setModal(null);

  /* form states */
  const [personal, setPersonal] = useState<any>({});
  const [basic, setBasic] = useState<any>({});
  const [expForm, setExpForm] = useState<any>({});
  const [projForm, setProjForm] = useState<any>({});
  const [certForm, setCertForm] = useState<any>({});
  const [achForm, setAchForm] = useState<any>({});
  const [eduForm, setEduForm] = useState<any>({});

  const fetchSavedResumes = async () => {
    setResumesLoading(true);
    try {
      const res = await api.get('/saved-resumes');
      setSavedResumes(res.data);
    } catch (err) {
      console.error('Error fetching saved resumes:', err);
    } finally {
      setResumesLoading(false);
    }
  };


  useEffect(() => {
    api.get('/api/profile').then(r => {
      setProfile(r.data);
      setPersonal(r.data.personal || {});
      setBasic(r.data.basic_details || {});
      fetchSavedResumes();
    }).catch(console.error).finally(() => setLoading(false));
  }, []);


  const handleDeleteResume = async (resumeId: string) => {
    if (!window.confirm('Are you sure you want to delete this saved resume?')) return;
    try {
      await api.delete(`/saved-resumes/${resumeId}`);
      setSavedResumes(prev => prev.filter(r => r.id !== resumeId));
    } catch (err) {
      console.error('Error deleting resume:', err);
      alert('Failed to delete the resume. Please try again.');
    }
  };


  const handleOpenResume = (resume: any) => {
    navigate('/resume-preview', { state: { latex: resume.latex } });
  };

  /* ─── save helpers ─── */
  const save = async (patch: any) => {
    setSaving(true);
    try {
      const updated = { ...profile, ...patch };
      const res = await api.put('/api/profile', updated);
      setProfile(res.data);
    } finally { setSaving(false); close(); }
  };

  const savePersonal = () => save({ personal });
  const saveBasic = () => save({ basic_details: basic });

  /* list helpers */
  const addItem = (key: string, item: any) =>
    save({ [key]: [...(profile?.[key] ?? []), item] });
  const removeItem = (key: string, id: string) =>
    save({ [key]: profile[key].filter((x: any) => x.id !== id) });

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading your profile…</p>
      </div>
    </div>
  );

  /* completion calc */
  const sections = [
    profile?.personal?.name, profile?.personal?.email,
    profile?.basic_details?.role_designation,
    profile?.experiences?.length, profile?.projects?.length,
    profile?.education?.length, profile?.certifications?.length,
    profile?.achievements?.length,
  ];
  const filled = sections.filter(Boolean).length;
  const pct = Math.round((filled / sections.length) * 100);

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <Sidebar completionPct={pct} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Complete Your Profile" />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-5">

            {/* ── Personal Info ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative">
              <div className="absolute top-5 right-5">
                <button onClick={() => open('personal')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
              <CardHeader icon={<User className="w-5 h-5 text-blue-500" />} color="bg-blue-50" title="Personal Information" />

              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow ring-2 ring-brand-100">
                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${profile?.personal?.name || 'user'}&backgroundColor=e2e8f0`} alt="avatar" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{profile?.personal?.name || <span className="text-slate-400 italic">No name</span>}</p>
                  <p className="text-sm text-slate-500">{profile?.personal?.email || '—'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {[['Phone', profile?.personal?.phone], ['Location', profile?.personal?.location], ['GitHub', profile?.personal?.github], ['LinkedIn', profile?.personal?.linkedin]].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-slate-700 truncate">{val || <span className="text-slate-300 italic">—</span>}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Basic Details ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative">
              <div className="absolute top-5 right-5">
                <button onClick={() => open('basic')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
              <CardHeader icon={<Briefcase className="w-5 h-5 text-indigo-500" />} color="bg-indigo-50" title="Basic Details" />
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Designation', profile?.basic_details?.role_designation],
                  ['Current Role', profile?.basic_details?.current_role],
                  ['Experience', profile?.basic_details?.experience_years ? `${profile.basic_details.experience_years} yrs` : '—'],
                  ['Notice Period', profile?.basic_details?.notice_period],
                  ['Expected CTC', profile?.basic_details?.expected_ctc ? `${profile.basic_details.expected_ctc} LPA` : '—'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-slate-700 truncate">{val || <span className="text-slate-300 italic">—</span>}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Experience ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <CardHeader icon={<Briefcase className="w-5 h-5 text-sky-500" />} color="bg-sky-50" title="Experience"
                onAdd={() => { setExpForm({ id: uid(), company: '', role: '', location: '', duration: '', bullet_library: [''] }); open('exp'); }} />
              {profile?.experiences?.length > 0
                ? <div className="space-y-3">{profile.experiences.map((exp: any) => (
                  <div key={exp.id} className="flex gap-3 group">
                    <div className="mt-1 w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{exp.role}</p>
                          <p className="text-xs text-slate-500">{exp.company} · {exp.location}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{exp.duration}</p>
                        </div>
                        <button onClick={() => removeItem('experiences', exp.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}</div>
                : <EmptyState msg="No experience added yet." />}
            </div>

            {/* ── Projects ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <CardHeader icon={<FileCode className="w-5 h-5 text-rose-500" />} color="bg-rose-50" title="Projects"
                onAdd={() => { setProjForm({ id: uid(), title: '', description: '', technologies: [], github_link: '' }); open('proj'); }} />
              {profile?.projects?.length > 0
                ? <div className="space-y-3">{profile.projects.map((proj: any) => (
                  <div key={proj.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100 group relative">
                    <button onClick={() => removeItem('projects', proj.id)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-start gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{proj.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{proj.description}</p>
                        {proj.github_link && (
                          <a href={proj.github_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-brand-600 mt-1 hover:underline">
                            <GitBranch className="w-3 h-3" /> {proj.github_link}
                          </a>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(proj.technologies || []).map((t: string) => (
                            <span key={t} className="px-2 py-0.5 bg-white border border-slate-200 text-[10px] text-slate-600 rounded-md">{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}</div>
                : <EmptyState msg="No projects added yet." />}
            </div>

            {/* ── Achievements ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <CardHeader icon={<Award className="w-5 h-5 text-amber-500" />} color="bg-amber-50" title="Achievements"
                onAdd={() => { setAchForm({ id: uid(), title: '', description: '', category: 'Award' }); open('ach'); }} />
              {profile?.achievements?.length > 0
                ? <div className="space-y-3">{profile.achievements.map((ach: any) => (
                  <div key={ach.id} className="flex gap-3 group">
                    <div className="bg-amber-100 p-1.5 rounded-lg flex-shrink-0">
                      <Award className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-bold text-slate-800">{ach.title}</p>
                        <button onClick={() => removeItem('achievements', ach.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{ach.description}</p>
                      <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-1 inline-block">{ach.category}</span>
                    </div>
                  </div>
                ))}</div>
                : <EmptyState msg="No achievements added yet." />}
            </div>

            {/* ── Certifications ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <CardHeader icon={<CheckCircle className="w-5 h-5 text-violet-500" />} color="bg-violet-50" title="Certifications"
                onAdd={() => { setCertForm({ id: uid(), name: '', issuer: '', date: '' }); open('cert'); }} />
              {profile?.certifications?.length > 0
                ? <div className="space-y-3">{profile.certifications.map((cert: any) => (
                  <div key={cert.id} className="flex gap-3 group">
                    <div className="bg-violet-100 p-1.5 rounded-lg flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-bold text-slate-800">{cert.name}</p>
                        <button onClick={() => removeItem('certifications', cert.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500">{cert.issuer} · {cert.date}</p>
                    </div>
                  </div>
                ))}</div>
                : <EmptyState msg="No certifications added yet." />}
            </div>

            {/* ── Education ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 xl:col-span-2">
              <CardHeader icon={<GraduationCap className="w-5 h-5 text-teal-500" />} color="bg-teal-50" title="Education"
                onAdd={() => { setEduForm({ id: uid(), institution: '', degree: '', gpa: '', graduation_date: '' }); open('edu'); }} />
              {profile?.education?.length > 0
                ? <div className="divide-y divide-slate-100">{profile.education.map((edu: any) => (
                  <div key={edu.id} className="flex justify-between items-center py-3 group">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{edu.degree}</p>
                      <p className="text-xs text-slate-500">{edu.institution}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-slate-500">{edu.graduation_date}</p>
                        <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full mt-0.5 inline-block">{edu.gpa} GPA</span>
                      </div>
                      <button onClick={() => removeItem('education', edu.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}</div>
                : <EmptyState msg="No education added yet." />}
            </div>

            {/* ── Saved Resumes ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 xl:col-span-2">
              <CardHeader 
                icon={<FileText className="w-5 h-5 text-brand-600" />} 
                color="bg-brand-50" 
                title="Saved Resumes" 
              />

              
              {resumesLoading ? (
                <div className="flex justify-center items-center py-6">
                  <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-slate-500 ml-2">Loading saved resumes...</span>
                </div>
              ) : savedResumes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedResumes.map((resume) => (
                    <div key={resume.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 transition-all flex flex-col justify-between group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-brand-500 shadow-sm flex-shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 leading-snug line-clamp-1">{resume.title}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Saved on {new Date(resume.created_at).toLocaleDateString(undefined, { 
                                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                              })}

                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteResume(resume.id)} 
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition"
                          title="Delete Resume"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200/60 justify-end">
                        <button 
                          onClick={() => handleOpenResume(resume)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs font-semibold rounded-lg transition"
                        >
                          <FileCode className="w-3.5 h-3.5" />
                          Open in Editor
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState msg="No resumes saved yet. Go to the Resume Builder page to generate and save one!" />
              )}
            </div>

          </div>
        </main>
      </div>

      {/* ══════════ MODALS ══════════ */}

      {/* Personal Info */}
      <Modal isOpen={modal === 'personal'} onClose={close} title="Edit Personal Information">
        <div className="space-y-3">
          <Field label="Full Name" value={personal.name || ''} onChange={(v: string) => setPersonal({ ...personal, name: v })} />
          <Field label="Email" type="email" value={personal.email || ''} onChange={(v: string) => setPersonal({ ...personal, email: v })} />
          <Field label="Phone" value={personal.phone || ''} onChange={(v: string) => setPersonal({ ...personal, phone: v })} placeholder="+91 9876543210" />
          <Field label="Location" value={personal.location || ''} onChange={(v: string) => setPersonal({ ...personal, location: v })} placeholder="City, State" />
          <Field label="LinkedIn URL" value={personal.linkedin || ''} onChange={(v: string) => setPersonal({ ...personal, linkedin: v })} placeholder="linkedin.com/in/username" />
          <Field label="GitHub URL" value={personal.github || ''} onChange={(v: string) => setPersonal({ ...personal, github: v })} placeholder="github.com/username" />
          <Field label="Portfolio URL" value={personal.portfolio || ''} onChange={(v: string) => setPersonal({ ...personal, portfolio: v })} placeholder="yourportfolio.com (optional)" />
        </div>
        <SaveBtn onClick={savePersonal} saving={saving} />
      </Modal>

      {/* Basic Details */}
      <Modal isOpen={modal === 'basic'} onClose={close} title="Edit Basic Details">
        <div className="space-y-3">
          <Field label="Role / Designation" value={basic.role_designation || ''} onChange={(v: string) => setBasic({ ...basic, role_designation: v })} placeholder="e.g. Full Stack Developer" />
          <Field label="Current Role / Company" value={basic.current_role || ''} onChange={(v: string) => setBasic({ ...basic, current_role: v })} placeholder="e.g. SDE at Infosys" />
          <Field label="Experience (years)" value={basic.experience_years || ''} onChange={(v: string) => setBasic({ ...basic, experience_years: v })} placeholder="e.g. 2" />
          <Field label="Notice Period" value={basic.notice_period || ''} onChange={(v: string) => setBasic({ ...basic, notice_period: v })} placeholder="e.g. 30 days / Immediate" />
          <Field label="Expected CTC (LPA)" value={basic.expected_ctc || ''} onChange={(v: string) => setBasic({ ...basic, expected_ctc: v })} placeholder="e.g. 12" />
        </div>
        <SaveBtn onClick={saveBasic} saving={saving} />
      </Modal>

      {/* Experience */}
      <Modal isOpen={modal === 'exp'} onClose={close} title="Add Experience">
        <div className="space-y-3">
          <Field label="Role / Position" value={expForm.role || ''} onChange={(v: string) => setExpForm({ ...expForm, role: v })} placeholder="e.g. ML Engineer Intern" />
          <Field label="Company" value={expForm.company || ''} onChange={(v: string) => setExpForm({ ...expForm, company: v })} placeholder="e.g. Google" />
          <Field label="Location" value={expForm.location || ''} onChange={(v: string) => setExpForm({ ...expForm, location: v })} placeholder="e.g. Bangalore, India" />
          <Field label="Duration" value={expForm.duration || ''} onChange={(v: string) => setExpForm({ ...expForm, duration: v })} placeholder="e.g. Jun 2024 – Aug 2024" />
          <Textarea label="Key Responsibilities (one per line)" rows={4}
            value={(expForm.bullet_library || ['']).join('\n')}
            onChange={(v: string) => setExpForm({ ...expForm, bullet_library: v.split('\n') })}
            placeholder="• Developed feature X that improved Y by Z%" />
        </div>
        <SaveBtn onClick={() => addItem('experiences', expForm)} saving={saving} />
      </Modal>

      {/* Projects */}
      <Modal isOpen={modal === 'proj'} onClose={close} title="Add Project">
        <div className="space-y-3">
          <Field label="Project Title" value={projForm.title || ''} onChange={(v: string) => setProjForm({ ...projForm, title: v })} placeholder="e.g. AI Resume Builder" />
          <Textarea label="Description" rows={3} value={projForm.description || ''} onChange={(v: string) => setProjForm({ ...projForm, description: v })} placeholder="Brief description of what you built and its impact." />
          <Field label="Technologies (comma-separated)" value={(projForm.technologies || []).join(', ')} onChange={(v: string) => setProjForm({ ...projForm, technologies: v.split(',').map((s: string) => s.trim()).filter(Boolean) })} placeholder="React, Python, FastAPI" />
          <Field label="GitHub Link" value={projForm.github_link || ''} onChange={(v: string) => setProjForm({ ...projForm, github_link: v })} placeholder="https://github.com/..." />
        </div>
        <SaveBtn onClick={() => addItem('projects', projForm)} saving={saving} />
      </Modal>

      {/* Achievement */}
      <Modal isOpen={modal === 'ach'} onClose={close} title="Add Achievement">
        <div className="space-y-3">
          <Field label="Title" value={achForm.title || ''} onChange={(v: string) => setAchForm({ ...achForm, title: v })} placeholder="e.g. 1st Place — National Hackathon" />
          <Textarea label="Description" rows={3} value={achForm.description || ''} onChange={(v: string) => setAchForm({ ...achForm, description: v })} placeholder="Describe the achievement, metrics, and impact." />
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
            <select value={achForm.category || 'Award'} onChange={e => setAchForm({ ...achForm, category: e.target.value })}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-400 transition">
              {['Award', 'Competition', 'Publication', 'Ranking', 'Other'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <SaveBtn onClick={() => addItem('achievements', achForm)} saving={saving} />
      </Modal>

      {/* Certification */}
      <Modal isOpen={modal === 'cert'} onClose={close} title="Add Certification">
        <div className="space-y-3">
          <Field label="Certification Name" value={certForm.name || ''} onChange={(v: string) => setCertForm({ ...certForm, name: v })} placeholder="e.g. AWS Solutions Architect" />
          <Field label="Issuing Organization" value={certForm.issuer || ''} onChange={(v: string) => setCertForm({ ...certForm, issuer: v })} placeholder="e.g. Amazon Web Services" />
          <Field label="Date Issued" value={certForm.date || ''} onChange={(v: string) => setCertForm({ ...certForm, date: v })} placeholder="e.g. March 2024" />
        </div>
        <SaveBtn onClick={() => addItem('certifications', certForm)} saving={saving} />
      </Modal>

      {/* Education */}
      <Modal isOpen={modal === 'edu'} onClose={close} title="Add Education">
        <div className="space-y-3">
          <Field label="Institution Name" value={eduForm.institution || ''} onChange={(v: string) => setEduForm({ ...eduForm, institution: v })} placeholder="e.g. IIT Bombay" />
          <Field label="Degree / Course" value={eduForm.degree || ''} onChange={(v: string) => setEduForm({ ...eduForm, degree: v })} placeholder="e.g. B.Tech in Computer Science" />
          <Field label="GPA / Percentage" value={eduForm.gpa || ''} onChange={(v: string) => setEduForm({ ...eduForm, gpa: v })} placeholder="e.g. 8.5 / 10" />
          <Field label="Graduation Date" value={eduForm.graduation_date || ''} onChange={(v: string) => setEduForm({ ...eduForm, graduation_date: v })} placeholder="e.g. May 2025 | Hyderabad" />
        </div>
        <SaveBtn onClick={() => addItem('education', eduForm)} saving={saving} />
      </Modal>

    </div>
  );
}
