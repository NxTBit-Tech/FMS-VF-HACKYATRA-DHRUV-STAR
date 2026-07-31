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
    <header className="glass sticky top-0 z-40 w-full border-b border-govBlue-700/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-base tracking-wider shadow shadow-blue-500/20">
            GV
          </div>
          <div>
            <Link to="/" className="text-sm font-bold text-white tracking-wide block hover:text-blue-400 transition-colors">
              GVMC File Management
            </Link>
            <span className="text-[10px] text-govBlue-200 block uppercase tracking-wider -mt-0.5">
              {user.department} Dept
            </span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'text-white bg-blue-500/10 border border-blue-500/20 shadow-inner'
                    : 'text-govBlue-200 hover:text-white hover:bg-govBlue-800/40'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User profile & logout */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-semibold text-white block">
              {user.fullName}
            </span>
            <span className="text-[10px] text-govBlue-200 uppercase tracking-wider block font-medium">
              {getRoleDisplayName(user.role)}
            </span>
          </div>

          <div className="h-8 w-px bg-govBlue-700/40 hidden sm:block"></div>

          <button
            onClick={logout}
            className="p-2 text-govBlue-200 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            title="Log Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Mobile navigation bar */}
      <div className="md:hidden glass-light border-t border-govBlue-700/30 flex items-center justify-around py-2 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-medium py-1 px-2.5 rounded-md transition-all ${
                isActive
                  ? 'text-blue-400 bg-blue-500/5'
                  : 'text-govBlue-200'
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
