// src/pages/CitizenStatus.jsx
import React, { useState } from 'react';
import { api } from '../services/api';
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
      case 'approved': return 'text-emerald-450 bg-emerald-500/10 border-emerald-500/20';
      case 'rejected': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-[#030f26] flex flex-col justify-between py-12 px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-xl mx-auto flex-1 flex flex-col justify-center relative z-10">
        <div className="text-center mb-10">
          <div className="h-14 w-14 bg-blue-600/15 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-400">
            <FileText className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">GVMC File Tracker</h1>
          <p className="text-sm text-govBlue-200 mt-2">
            Public Status Portal — Town Planning & Building Approvals
          </p>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSearch} className="glass p-6 rounded-2xl border border-govBlue-700/50 shadow-2xl mb-8">
          <label className="block text-xs font-semibold uppercase tracking-wider text-govBlue-100 mb-3">
            Enter Reference Number
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
              placeholder="e.g. TP-20260801-4921"
              className="block w-full pl-4 pr-12 py-3.5 bg-govBlue-900/60 border border-govBlue-700/50 rounded-xl text-white placeholder-govBlue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm font-semibold tracking-wide"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute inset-y-1.5 right-1.5 px-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
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
          <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-200 rounded-xl text-sm flex gap-2.5 max-w-md mx-auto">
            <ShieldAlert className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Results Block */}
        {statusData && (
          <div ref={resultRef} className="glass rounded-2xl border border-govBlue-700/50 p-6 shadow-2xl space-y-6 max-w-md mx-auto w-full">
            <div className="border-b border-govBlue-700/40 pb-4">
              <span className="text-[10px] text-govBlue-200 uppercase tracking-wider font-semibold">Reference Number</span>
              <h2 className="text-base font-extrabold text-white">{statusData.reference_number}</h2>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <span className="text-[10px] text-govBlue-200 uppercase tracking-wider block">Current Stage</span>
                <span className="font-bold text-white text-sm block mt-1">{statusData.stage_name}</span>
              </div>

              <div>
                <span className="text-[10px] text-govBlue-200 uppercase tracking-wider block">Resolution Status</span>
                <span className={`inline-block px-2.5 py-0.5 mt-1 border text-xs font-bold uppercase rounded ${getStatusColor(statusData.status)}`}>
                  {statusData.status}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-govBlue-700/40 flex items-center gap-2 text-xs text-govBlue-200">
              <Clock className="h-4 w-4 text-govBlue-500" />
              <span>Last stage entry updated: {new Date(statusData.stage_entered_at).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      <div className="text-center pt-8 text-xs text-govBlue-200">
        <a href="/login" className="hover:text-white transition-colors">
          Officer Portal Authentication &rarr;
        </a>
      </div>
    </div>
  );
}
