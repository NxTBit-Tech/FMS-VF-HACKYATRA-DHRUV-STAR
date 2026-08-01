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
        classes: 'stamp-badge stamp-red text-[10px]',
        icon: AlertTriangle
      };
    } else if (hoursNum > slaNum * 0.75) {
      return {
        label: 'Approaching SLA',
        classes: 'stamp-badge stamp-amber text-[10px]',
        icon: Clock
      };
    }
    return {
      label: 'On Time',
      classes: 'stamp-badge stamp-green text-[10px]',
      icon: CheckCircle
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Overview header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-extrabold text-govBlue-900 tracking-tight">Officer Dashboard</h1>
          <p className="text-xs text-govBlue-700 font-bold uppercase tracking-wider mt-1">
            Official Custody Queue — GVMC Approvals Ledger
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchFiles}
            disabled={loading}
            className="p-3 bg-white hover:bg-govBlue-150 text-govBlue-900 rounded border border-govBlue-200 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sla-red"
            title="Refresh Ledger List"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/scan"
            className="flex items-center gap-2 px-5 py-3 bg-govBlue-900 hover:bg-govBlue-850 active:bg-govBlue-950 text-white font-bold uppercase tracking-wider text-xs rounded border border-govBlue-900 shadow-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sla-red"
          >
            <QrCode className="h-4 w-4 shrink-0" />
            Quick Scan Registry
          </Link>
        </div>
      </div>

      {/* Grid metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="dossier-card p-6 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] text-govBlue-700 uppercase font-bold tracking-wider">Custody Files Held</span>
            <span className="text-3xl font-serif font-extrabold text-govBlue-900 block mt-1">{files.length}</span>
          </div>
          <div className="p-3 bg-govBlue-200 rounded border border-govBlue-500 text-govBlue-900">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        <div className="dossier-card p-6 rounded-lg flex items-center justify-between border-l-4 border-l-sla-red">
          <div>
            <span className="text-[10px] text-govBlue-700 uppercase font-bold tracking-wider">Overdue SLA Actions</span>
            <span className="text-3xl font-serif font-extrabold text-sla-red block mt-1">
              {files.filter(f => (Number(f.hours_at_stage) > Number(f.sla_hours))).length}
            </span>
          </div>
          <div className="p-3 bg-sla-red/5 rounded border border-sla-red/30 text-sla-red">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        <div className="dossier-card p-6 rounded-lg flex items-center justify-between border-l-4 border-l-sla-green">
          <div>
            <span className="text-[10px] text-govBlue-700 uppercase font-bold tracking-wider">On-Time Process Progress</span>
            <span className="text-3xl font-serif font-extrabold text-sla-green block mt-1">
              {files.filter(f => (Number(f.hours_at_stage) <= Number(f.sla_hours))).length}
            </span>
          </div>
          <div className="p-3 bg-sla-green/5 rounded border border-sla-green/30 text-sla-green">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main content ledger table */}
      <div className="dossier-card rounded-lg shadow-sm border border-govBlue-200 mt-8 relative">
        {/* Case-File Tab signature element */}
        <div className="file-folder-tab">
          PENDING CUSTODY RECORD ({files.length})
        </div>

        <div className="px-6 py-4 border-b border-dashed border-govBlue-200 bg-govBlue-100 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-govBlue-900">Files Pending Your Review</h2>
        </div>

        {error && (
          <div className="m-6 p-4 bg-sla-red/5 border border-sla-red/30 text-sla-red rounded text-xs font-semibold">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="h-8 w-8 text-govBlue-900 animate-spin" />
            <span className="text-xs font-bold uppercase tracking-wider text-govBlue-700">Loading your pending file registry...</span>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-20">
            <CheckCircle className="h-12 w-12 text-sla-green/45 mx-auto mb-3" />
            <p className="text-base font-serif font-extrabold text-govBlue-900">Desk Cleared!</p>
            <p className="text-xs text-govBlue-700 font-medium mt-1">All files have been successfully audited and dispatched forward.</p>
          </div>
        ) : (
          <div ref={listRef} className="divide-y divide-dashed divide-govBlue-200 bg-white">
            {files.map((file) => {
              const badge = getSlaBadge(file.hours_at_stage, file.sla_hours);
              const BadgeIcon = badge.icon;
              return (
                <div 
                  key={file.reference_number} 
                  className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-govBlue-50/50 transition-all cursor-pointer group"
                  onClick={() => {
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
                    <div className="p-3 bg-govBlue-100 rounded border border-govBlue-200 group-hover:border-govBlue-900 transition-colors">
                      <FileText className="h-6 w-6 text-govBlue-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-stamp font-bold text-govBlue-900 group-hover:text-sla-red transition-colors">
                          {file.reference_number}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-govBlue-200 text-govBlue-900 rounded border border-govBlue-200">
                          {file.stage_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-govBlue-700">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="h-3.5 w-3.5 text-govBlue-500 shrink-0" />
                          Held: {Math.max(0, Number(file.hours_at_stage)).toFixed(1)} hrs
                        </span>
                        <span className="font-medium">
                          Stage SLA: {file.sla_hours} hrs
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <span className={badge.classes}>
                      <BadgeIcon className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                      {badge.label}
                    </span>
                    <ChevronRight className="h-5 w-5 text-govBlue-500 group-hover:text-govBlue-900 transition-colors" />
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
