import { Bell } from 'lucide-react';

interface TopBarProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

function TopBar({ title, subtitle, children }: TopBarProps) {
  return (
    <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 flex-shrink-0">
      <div>
        <h1 className="text-xl font-bold text-slate-900 leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {children}
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-brand-200 shadow-sm">
            <img
              src="https://api.dicebear.com/7.x/notionists/svg?seed=user&backgroundColor=dbeafe"
              alt="avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-700 leading-none">My Profile</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Candidate</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
