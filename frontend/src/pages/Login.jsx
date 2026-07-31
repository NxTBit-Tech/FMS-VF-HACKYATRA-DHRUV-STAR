// src/pages/Login.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, setToken, setUser, getUser } from '../services/api';
import { Lock, Mail, AlertTriangle, ShieldCheck } from 'lucide-react';
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

    // GSAP Card entrance animation
    const tl = gsap.timeline();
    tl.fromTo(formRef.current, 
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
    );
    tl.fromTo(titleRef.current,
      { scale: 0.95, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.7)' },
      '-=0.4'
    );
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
      
      // Animate card slide out on success
      gsap.to(formRef.current, {
        y: -30,
        opacity: 0,
        duration: 0.4,
        ease: 'power3.in',
        onComplete: () => redirectByRole(data.user.role)
      });
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
      setLoading(false);
      
      // GSAP shake effect on error
      gsap.fromTo(formRef.current,
        { x: -10 },
        { x: 0, duration: 0.5, ease: 'rough({ strength: 2, points: 10, template: linear, taper: none, randomize: false })' }
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030f26] px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-900/10 rounded-full blur-3xl pointer-events-none"></div>

      <div ref={formRef} className="w-full max-w-md glass p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div ref={titleRef} className="flex justify-center items-center mb-3">
            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
              <ShieldCheck className="h-10 w-10 text-blue-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">GVMC File Management</h1>
          <p className="text-sm text-govBlue-200 mt-1">Departmental Login — Town Planning Scope</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-200 rounded-xl text-sm flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-govBlue-100 mb-2">
              Officer Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-govBlue-500" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@gvmc.gov.in"
                className="block w-full pl-11 pr-4 py-3 bg-govBlue-900/60 border border-govBlue-700/50 rounded-xl text-white placeholder-govBlue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-govBlue-100 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-govBlue-500" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-11 pr-4 py-3 bg-govBlue-900/60 border border-govBlue-700/50 rounded-xl text-white placeholder-govBlue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 active:from-blue-700 active:to-blue-800 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-govBlue-700/30 text-center">
          <a
            href="/status"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium inline-flex items-center gap-1.5"
          >
            Looking for public file tracking?
          </a>
        </div>
      </div>
    </div>
  );
}
