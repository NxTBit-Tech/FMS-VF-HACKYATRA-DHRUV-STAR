// src/components/Header.jsx
import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { logout, getUser } from '../services/api';
import { LogOut, Home, QrCode, FilePlus, BarChart2, Briefcase } from 'lucide-react';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();

  if (!user) return null;

  const getRoleDisplayName = (role) => {
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const navItems = [];
  
  if (user.role === 'revenue_inspector') {
    navItems.push({ path: '/upload', label: 'File Upload', icon: FilePlus });
  } else if (user.role === 'commissioner') {
    navItems.push({ path: '/analytics', label: 'Analytics', icon: BarChart2 });
  } else {
    navItems.push({ path: '/dashboard', label: 'My Dashboard', icon: Home });
  }

  // Scanner is available to all roles
  navItems.push({ path: '/scan', label: 'Scan Label', icon: QrCode });
  
  // Custom template builder placeholder link
  navItems.push({ path: '/builder', label: 'Workflow Setup', icon: Briefcase });

  return (
    <header className="sticky top-0 z-40 w-full bg-govBlue-100 border-b border-govBlue-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-govBlue-900 rounded border border-govBlue-500 flex items-center justify-center font-serif font-bold text-govBlue-50 text-base tracking-wider shadow-inner">
            GV
          </div>
          <div>
            <Link to="/" className="text-sm font-serif font-extrabold text-govBlue-900 tracking-wide block hover:text-govBlue-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sla-red">
              GVMC File Management
            </Link>
            <span className="text-[10px] text-govBlue-700 block uppercase tracking-wider -mt-0.5 font-semibold">
              {user.department} Dept
            </span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded border transition-all ${
                  isActive
                    ? 'text-govBlue-900 bg-govBlue-200 border-govBlue-500 shadow-sm font-extrabold'
                    : 'text-govBlue-700 border-transparent hover:text-govBlue-900 hover:bg-govBlue-200/50'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User profile & logout */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-extrabold text-govBlue-900 block font-serif">
              {user.fullName}
            </span>
            <span className="text-[9px] text-govBlue-700 uppercase tracking-wider block font-bold">
              {getRoleDisplayName(user.role)}
            </span>
          </div>

          <div className="h-8 w-px bg-govBlue-200 hidden sm:block"></div>

          <button
            onClick={logout}
            className="p-2 text-govBlue-700 hover:text-sla-red hover:bg-sla-red/10 rounded border border-transparent hover:border-sla-red/20 transition-all"
            title="Log Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Mobile navigation bar */}
      <div className="md:hidden bg-govBlue-100 border-t border-govBlue-250 flex items-center justify-around py-2 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 text-[9px] uppercase font-bold py-1 px-2.5 rounded border transition-all ${
                isActive
                  ? 'text-govBlue-900 bg-govBlue-200 border-govBlue-200'
                  : 'text-govBlue-700 border-transparent'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
