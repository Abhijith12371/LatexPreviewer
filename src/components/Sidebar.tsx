import { NavLink } from 'react-router-dom';
import {
  Briefcase, LayoutDashboard, User, CheckCircle,
  Award, FileText, Settings, LogOut, FileCode, GraduationCap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  completionPct?: number;
}

function Sidebar({ completionPct = 0 }: SidebarProps) {
  const { logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-4.5 h-4.5" /> },
    { name: 'Experience', path: '#experience', icon: <Briefcase className="w-4.5 h-4.5" /> },
    { name: 'Projects', path: '#projects', icon: <FileCode className="w-4.5 h-4.5" /> },
    { name: 'Achievements', path: '#achievements', icon: <Award className="w-4.5 h-4.5" /> },
    { name: 'Certifications', path: '#certifications', icon: <CheckCircle className="w-4.5 h-4.5" /> },
    { name: 'Education', path: '#education', icon: <GraduationCap className="w-4.5 h-4.5" /> },
    { name: 'Resume Builder', path: '/resume-preview', icon: <FileText className="w-4.5 h-4.5" /> },
    { name: 'Settings', path: '#settings', icon: <Settings className="w-4.5 h-4.5" /> },
  ];

  // SVG donut params
  const r = 36, circ = 2 * Math.PI * r;
  const dash = (completionPct / 100) * circ;

  return (
    <div className="w-60 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-br from-brand-500 to-indigo-600 p-1.5 rounded-lg shadow">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-extrabold text-slate-900 tracking-tight">CareerHub</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive && !item.path.startsWith('#')
                  ? 'bg-brand-50 text-brand-700 font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Profile Completion Widget */}
      <div className="mx-3 mb-3 p-4 bg-gradient-to-br from-brand-50 to-indigo-50 border border-brand-100 rounded-xl flex flex-col items-center text-center">
        <div className="relative w-20 h-20 mb-2 flex items-center justify-center">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r={r} strokeWidth="7" fill="transparent" className="stroke-slate-200" />
            <circle
              cx="40" cy="40" r={r} strokeWidth="7" fill="transparent"
              strokeDasharray={circ}
              strokeDashoffset={circ - dash}
              strokeLinecap="round"
              className="stroke-brand-500 transition-all duration-700"
            />
          </svg>
          <span className="absolute text-lg font-bold text-slate-800">{completionPct}%</span>
        </div>
        <h4 className="text-xs font-bold text-slate-800">Profile Completion</h4>
        <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">Fill all sections to boost your resume</p>
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
