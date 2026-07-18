import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  LogOut,
  Menu,
  X,
  Building2,
  Printer,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Admissions', path: '/admissions', icon: ClipboardList },
    { name: 'Print Reports', path: '/reports', icon: Printer },
  ];

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'OP';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 antialiased">
      {/* Top Professional Accent Bar */}
      <div className="h-1 bg-slate-950 w-full no-print"></div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-40 no-print">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-155 transition duration-200"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div className="flex items-center gap-2.5">
            <Building2 size={18} className="text-slate-800" />
            <span className="text-sm font-black tracking-tight text-slate-950">
              ITI Admission Portal
            </span>
          </div>
        </div>

        {/* Profile Panel */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-extrabold text-slate-850 leading-none">{user?.name}</span>
            <span className="text-[9px] font-bold text-slate-400 mt-1 leading-none uppercase tracking-wide">
              Operator
            </span>
          </div>
          
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shadow-xs">
            {userInitials}
          </div>

          <div className="w-px h-5 bg-slate-200"></div>
          
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition duration-200"
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Workspace Wrapper */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col justify-between p-5 shrink-0 no-print">
          <div className="space-y-6">
            <p className="px-3 text-[9px] font-bold uppercase tracking-widest text-slate-400">
              Navigation Menu
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                      isActive
                        ? 'bg-slate-950 text-white shadow-sm'
                        : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={16} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-slate-900/40 backdrop-blur-sm no-print" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-64 max-w-xs h-full bg-white p-6 flex flex-col justify-between shadow-2xl transition" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xs font-extrabold text-slate-900 tracking-wider">ITI PORTAL</h2>
                    <p className="text-[9px] text-slate-400 font-bold tracking-tight">Internal Registry System</p>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 border border-slate-250 rounded-xl text-slate-550 hover:bg-slate-100"
                  >
                    <X size={16} />
                  </button>
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                          isActive
                            ? 'bg-slate-950 text-white'
                            : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <Icon size={16} />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold">
                    {userInitials}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 leading-none">{user?.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold mt-1 leading-none">Operator</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition text-left"
                >
                  <LogOut size={16} />
                  Log Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Content Area */}
        <main className="flex-1 bg-slate-50 p-6 overflow-y-auto print:p-0 print:bg-white">
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8 min-h-full print:p-0 print:border-none print:shadow-none">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
