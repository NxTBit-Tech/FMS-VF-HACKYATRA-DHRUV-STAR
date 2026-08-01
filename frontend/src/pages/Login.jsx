// src/pages/Login.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, setToken, setUser, getUser } from '../services/api';
import { Lock, Mail, AlertTriangle, FileText } from 'lucide-react';
import gsap from 'gsap';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const formRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    // Redirect if already logged in
    const activeUser = getUser();
    if (activeUser) {
      redirectByRole(activeUser.role);
    }

    if (searchParams.get('expired')) {
      setError('Your session has expired. Please log in again.');
    }

    // GSAP Card entrance animation respecting accessibility settings
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      const tl = gsap.timeline();
      tl.fromTo(formRef.current, 
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }
      );
      tl.fromTo(titleRef.current,
        { scale: 0.98, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: 'power2.out' },
        '-=0.3'
      );
    } else {
      gsap.set(formRef.current, { opacity: 1, y: 0 });
      gsap.set(titleRef.current, { opacity: 1, scale: 1 });
    }
  }, [searchParams]);

  const redirectByRole = (role) => {
    switch (role) {
      case 'revenue_inspector':
        navigate('/upload');
        break;
      case 'commissioner':
        navigate('/analytics');
        break;
      default:
        navigate('/dashboard');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.post('/auth/login', { email, password });
      setToken(data.token);
      setUser(data.user);
      
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        // Animate card slide out on success
        gsap.to(formRef.current, {
          y: -20,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => redirectByRole(data.user.role)
        });
      } else {
        redirectByRole(data.user.role);
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
      setLoading(false);
      
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        // GSAP shake effect on error
        gsap.fromTo(formRef.current,
          { x: -8 },
          { x: 0, duration: 0.4, ease: 'rough({ strength: 1.5, points: 8, template: linear, taper: none, randomize: false })' }
        );
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-govBlue-50 px-4 relative overflow-hidden">
      {/* Background shadow outlines resembling ledger folders */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 border border-govBlue-200 rounded-full opacity-30 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 border border-govBlue-250 rounded-full opacity-20 pointer-events-none"></div>

      <div ref={formRef} className="w-full max-w-md dossier-card p-8 rounded-lg shadow-md relative mt-6">
        {/* Case-File Tab signature element */}
        <div className="file-folder-tab">
          OFFICIAL ACCESS
        </div>

        <div className="text-center mb-8">
          <div ref={titleRef} className="flex justify-center items-center mb-3">
            <span className="stamp-badge stamp-red text-xs px-3 py-1 font-stamp tracking-wider">
              GVMC DEPARTMENTAL
            </span>
          </div>
          <h1 className="text-2xl font-serif font-extrabold text-govBlue-900 tracking-tight">File Management</h1>
          <p className="text-xs text-govBlue-700 font-bold uppercase tracking-wider mt-1">Town Planning & Custody Registry</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-sla-red/5 border border-sla-red/30 text-sla-red rounded text-xs font-semibold flex items-start gap-2.5">
            <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-govBlue-750 mb-1.5">
              Officer Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-govBlue-700" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@gvmc.gov.in"
                className="block w-full pl-11 pr-4 py-2.5 bg-white border border-govBlue-500 rounded text-govBlue-900 placeholder-govBlue-500 focus:outline-none text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-govBlue-750 mb-1.5">
              Security Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-govBlue-700" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-11 pr-4 py-2.5 bg-white border border-govBlue-500 rounded text-govBlue-900 placeholder-govBlue-500 focus:outline-none text-sm font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-govBlue-900 hover:bg-govBlue-850 active:bg-govBlue-950 text-white font-bold uppercase tracking-wider text-xs rounded border border-govBlue-900 transition-all shadow-sm focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Authenticating Ledger access...' : 'Secure Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-dashed border-govBlue-200 text-center">
          <a
            href="/status"
            className="text-xs text-govBlue-900 hover:text-sla-red underline transition-colors font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
          >
            Public File Tracking Portal &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
