// src/pages/CitizenStatus.jsx
import React, { useState } from 'react';
import { api, getUser } from '../services/api';
import { Search, ShieldAlert, CheckCircle, Clock, FileText } from 'lucide-react';
import gsap from 'gsap';

export default function CitizenStatus() {
  const [refNumber, setRefNumber] = useState('');
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resultRef = React.useRef(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!refNumber.trim()) return;

    setLoading(true);
    setError('');
    setStatusData(null);

    try {
      // Hit public endpoint GET /public/status/:referenceNumber
      const data = await api.get(`/public/status/${refNumber.trim()}`);
      setStatusData(data);

      // GSAP fade in result
      setTimeout(() => {
        if (resultRef.current) {
          gsap.fromTo(resultRef.current,
            { scale: 0.98, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.5, ease: 'power2.out' }
          );
        }
      }, 50);
    } catch (err) {
      if (err.status === 404) {
        setError('No file found matching that reference number. Please check the spelling and try again.');
      } else {
        setError(err.message || 'An error occurred during file search.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'stamp-badge stamp-green text-xs';
      case 'rejected': return 'stamp-badge stamp-red text-xs';
      default: return 'stamp-badge stamp-blue text-xs';
    }
  };

  return (
    <div className="min-h-screen bg-govBlue-50 flex flex-col justify-between py-12 px-4 relative overflow-hidden">
      {/* Background shadow outlines */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 border border-govBlue-200 rounded-full opacity-35 pointer-events-none"></div>

      <div className="w-full max-w-xl mx-auto flex-1 flex flex-col justify-center relative z-10">
        <div className="text-center mb-10">
          <div className="h-14 w-14 bg-govBlue-100 border border-govBlue-200 rounded-lg flex items-center justify-center mx-auto mb-4 text-govBlue-900 shadow-sm">
            <FileText className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-serif font-extrabold text-govBlue-900 tracking-tight">GVMC File Tracker</h1>
          <p className="text-xs text-govBlue-700 font-bold uppercase tracking-wider mt-2">
            Public Tracking Registry — Town Planning & approvals
          </p>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSearch} className="dossier-card p-6 rounded-lg shadow-sm mb-8 relative">
          {/* File Tab signature element */}
          <div className="file-folder-tab font-stamp">
            REGISTRY SEARCH
          </div>

          <label className="block text-[10px] font-bold uppercase tracking-wider text-govBlue-700 mb-3 mt-2">
            Enter File Reference Number
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
              placeholder="e.g. TP-20260801-4921"
              className="block w-full pl-4 pr-12 py-3.5 bg-white border border-govBlue-500 rounded text-govBlue-900 placeholder-govBlue-500 focus:outline-none text-sm font-stamp font-bold tracking-wide"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute inset-y-1.5 right-1.5 px-3.5 bg-govBlue-900 hover:bg-govBlue-850 text-white rounded transition-colors flex items-center justify-center disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sla-red"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-white border-r-transparent border-b-white border-l-transparent"></div>
              ) : (
                <Search className="h-4.5 w-4.5" />
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 bg-sla-red/5 border border-sla-red/30 text-sla-red rounded text-xs font-semibold flex gap-2.5 max-w-md mx-auto mb-8">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Results Block */}
        {statusData && (
          <div ref={resultRef} className="dossier-card rounded-lg p-6 shadow-md max-w-md mx-auto w-full relative overflow-hidden">
            {/* File Tab signature element */}
            <div className="file-folder-tab font-stamp">
              REF: {statusData.reference_number}
            </div>

            <div className="border-b border-dashed border-govBlue-200 pb-4 mt-2">
              <span className="text-[9px] text-govBlue-700 font-bold uppercase tracking-wider">File Reference</span>
              <h2 className="text-base font-stamp font-bold text-govBlue-900 mt-0.5">{statusData.reference_number}</h2>
            </div>

            <div className="grid grid-cols-2 gap-6 py-4">
              <div>
                <span className="text-[9px] text-govBlue-700 font-bold uppercase tracking-wider block">Current Stage</span>
                <span className="font-serif font-extrabold text-govBlue-900 text-sm block mt-1">{statusData.stage_name}</span>
              </div>

              <div>
                <span className="text-[9px] text-govBlue-700 font-bold uppercase tracking-wider block">Resolution Status</span>
                <div className="mt-1">
                  <span className={getStatusColor(statusData.status)}>
                    {statusData.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-dashed border-govBlue-200 flex items-center gap-2 text-xs text-govBlue-700 font-stamp uppercase">
              <Clock className="h-4 w-4 text-govBlue-500 shrink-0" />
              <span>Updated: {new Date(statusData.stage_entered_at).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      <div className="text-center pt-8 text-xs font-bold uppercase tracking-wider text-govBlue-700">
        {getUser() ? (
          <a href={getUser().role === 'commissioner' ? '/analytics' : '/dashboard'} className="hover:text-govBlue-900 underline transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sla-red">
            Go to Officer Dashboard &rarr;
          </a>
        ) : (
          <a href="/login" className="hover:text-govBlue-900 underline transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sla-red">
            Officer Portal Authentication &rarr;
          </a>
        )}
      </div>
    </div>
  );
}
