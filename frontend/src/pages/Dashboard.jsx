// src/pages/Dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, getUser } from '../services/api';
import { FileText, Clock, ChevronRight, AlertTriangle, CheckCircle, RefreshCw, QrCode } from 'lucide-react';
import gsap from 'gsap';

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = getUser();
  const navigate = useNavigate();
  const listRef = useRef(null);

  const fetchFiles = async () => {
    setLoading(true);
    setError('');
    try {
      // Get all pending files for the user
      const data = await api.get('/dashboard/pending');
      setFiles(data);
      
      // GSAP animate list items
      setTimeout(() => {
        if (listRef.current) {
          const items = listRef.current.children;
          gsap.fromTo(items, 
            { y: 15, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
          );
        }
      }, 50);
    } catch (err) {
      setError(err.message || 'Failed to fetch pending files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const getSlaBadge = (hours, sla) => {
    const hoursNum = Number(hours) || 0;
    const slaNum = Number(sla) || 0;

    if (hoursNum > slaNum) {
      return {
        label: 'Overdue',
        classes: 'bg-red-500/10 border border-red-500/30 text-red-400',
        icon: AlertTriangle
      };
    } else if (hoursNum > slaNum * 0.75) {
      return {
        label: 'Approaching SLA',
        classes: 'bg-amber-500/10 border border-amber-500/30 text-amber-400',
        icon: Clock
      };
    }
    return {
      label: 'On Time',
      classes: 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400',
      icon: CheckCircle
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Overview header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Officer Dashboard</h1>
          <p className="text-sm text-govBlue-200 mt-1">
            Review files currently awaiting actions under your official custody.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchFiles}
            disabled={loading}
            className="p-3 bg-govBlue-800/40 hover:bg-govBlue-700/40 text-govBlue-100 rounded-xl border border-govBlue-700/50 transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/scan"
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-900/30 transition-all text-sm"
          >
            <QrCode className="h-4 w-4" />
            Quick Scan
          </Link>
        </div>
      </div>

      {/* Grid metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-govBlue-200 uppercase font-semibold tracking-wider">Held Files</span>
            <span className="text-3xl font-bold text-white block mt-1">{files.length}</span>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <FileText className="h-6 w-6 text-blue-400" />
          </div>
        </div>

        <div className="glass p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-govBlue-200 uppercase font-semibold tracking-wider">Overdue Files</span>
            <span className="text-3xl font-bold text-red-400 block mt-1">
              {files.filter(f => (Number(f.hours_at_stage) > Number(f.sla_hours))).length}
            </span>
          </div>
          <div className="p-3 bg-red-500/10 rounded-xl">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
        </div>

        <div className="glass p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-govBlue-200 uppercase font-semibold tracking-wider">On-Time Files</span>
            <span className="text-3xl font-bold text-emerald-400 block mt-1">
              {files.filter(f => (Number(f.hours_at_stage) <= Number(f.sla_hours))).length}
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl">
            <CheckCircle className="h-6 w-6 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Main content table */}
      <div className="glass rounded-2xl overflow-hidden shadow-xl border border-govBlue-700/30">
        <div className="px-6 py-4 border-b border-govBlue-700/40 bg-govBlue-800/10 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Files Pending Your Actions ({files.length})</h2>
        </div>

        {error && (
          <div className="m-6 p-4 bg-red-500/10 border border-red-500/30 text-red-200 rounded-xl text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
            <span className="text-sm text-govBlue-200">Loading your pending file registry...</span>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-20">
            <CheckCircle className="h-12 w-12 text-emerald-500/40 mx-auto mb-3" />
            <p className="text-base font-semibold text-white">Clear Desk!</p>
            <p className="text-sm text-govBlue-200 mt-1">No files are currently pending your approval or handoff.</p>
          </div>
        ) : (
          <div ref={listRef} className="divide-y divide-govBlue-700/40">
            {files.map((file) => {
              const badge = getSlaBadge(file.hours_at_stage, file.sla_hours);
              const BadgeIcon = badge.icon;
              return (
                <div 
                  key={file.reference_number} 
                  className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-govBlue-800/20 transition-all cursor-pointer group"
                  onClick={() => {
                    // Search scan-lookup endpoint first using the ref, or navigate direct.
                    // The lookup yields the internal DB id which the detail view needs
                    // Wait, files list has reference_number. Can we look up by ref? Yes, /files/scan/:ref returns the DB ID!
                    // Let's resolve the reference_number to database ID by calling api scan or just navigate to detail if we have it?
                    // Wait! The result rows from /dashboard/pending do NOT contain file ID! They contain reference_number, stage_name, stage_entered_at, etc.
                    // Oh! So to go to detail, we need the file ID. We can lookup using `GET /api/files/scan/:ref` which returns the fileId!
                    // Let's route them to `/scan-resolve/${file.reference_number}` or do the fetch inline.
                    setLoading(true);
                    api.get(`/files/scan/${file.reference_number}`)
                      .then((res) => {
                        navigate(`/files/${res.fileId}`);
                      })
                      .catch((err) => {
                        setError('Failed to resolve file database ID.');
                        setLoading(false);
                      });
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-govBlue-900/80 rounded-xl border border-govBlue-700/50 group-hover:border-blue-500/50 transition-colors">
                      <FileText className="h-6 w-6 text-govBlue-200" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                          {file.reference_number}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded-md border border-blue-500/20">
                          {file.stage_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-govBlue-200">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-govBlue-500" />
                          Held for: {Math.max(0, Number(file.hours_at_stage)).toFixed(1)} hrs
                        </span>
                        <span>
                          SLA limit: {file.sla_hours} hrs
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badge.classes}`}>
                      <BadgeIcon className="h-3.5 w-3.5" />
                      {badge.label}
                    </span>
                    <ChevronRight className="h-5 w-5 text-govBlue-500 group-hover:text-white transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
