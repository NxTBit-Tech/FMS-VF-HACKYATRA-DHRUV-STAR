// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, getUser } from '../services/api';
import { FileText, Clock, ChevronRight, AlertTriangle, CheckCircle, RefreshCw, QrCode } from 'lucide-react';

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = getUser();
  const navigate = useNavigate();

  const fetchFiles = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/dashboard/pending');
      setFiles(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch pending files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const openFile = (file) => {
    if (file.file_id) {
      navigate(`/files/${file.file_id}`);
      return;
    }
    api
      .post('/files/scan', { payload: file.reference_number })
      .then((res) => navigate(`/files/${res.fileId}`))
      .catch(() => setError('Could not resolve file.'));
  };

  const getSlaBadge = (hours, sla) => {
    const h = Number(hours) || 0;
    const s = Number(sla) || 0;
    if (h > s) return { label: 'Overdue', classes: 'stamp-badge stamp-red text-[10px]', icon: AlertTriangle };
    if (h > s * 0.75) return { label: 'Approaching SLA', classes: 'stamp-badge stamp-amber text-[10px]', icon: Clock };
    return { label: 'On Time', classes: 'stamp-badge stamp-green text-[10px]', icon: CheckCircle };
  };

  const queueLabel = (reason) => {
    if (reason === 'awaiting_receive') return { text: 'Awaiting your receipt', class: 'bg-sla-amber/10 text-sla-amber border-sla-amber/30' };
    if (reason === 'on_desk') return { text: 'On your desk', class: 'bg-govBlue-100 text-govBlue-900 border-govBlue-200' };
    return { text: 'Org view', class: 'bg-govBlue-100 text-govBlue-700 border-govBlue-200' };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-extrabold text-govBlue-900">
            {user?.role === 'revenue_inspector' ? 'Revenue Inspector Desk' : 'Officer Dashboard'}
          </h1>
          <p className="text-xs text-govBlue-700 font-bold uppercase tracking-wider mt-1">
            {user?.role === 'revenue_inspector'
              ? 'Your submitted files, desk work, and incoming handoffs'
              : 'Files on your desk and awaiting your receipt'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={fetchFiles}
            disabled={loading}
            className="p-3 bg-white border border-govBlue-200 rounded"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {user?.role === 'revenue_inspector' && (
            <Link
              to="/upload"
              className="flex items-center gap-2 px-4 py-3 bg-sla-green text-white text-xs font-bold uppercase rounded"
            >
              New file
            </Link>
          )}
          <Link
            to="/scan"
            className="flex items-center gap-2 px-5 py-3 bg-govBlue-900 text-white text-xs font-bold uppercase rounded"
          >
            <QrCode className="h-4 w-4" /> Scan
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="dossier-card p-6 rounded-lg">
          <span className="text-[10px] text-govBlue-700 uppercase font-bold">In your queue</span>
          <span className="text-3xl font-serif font-extrabold text-govBlue-900 block mt-1">{files.length}</span>
        </div>
        <div className="dossier-card p-6 rounded-lg border-l-4 border-l-sla-red">
          <span className="text-[10px] text-govBlue-700 uppercase font-bold">Overdue</span>
          <span className="text-3xl font-serif font-extrabold text-sla-red block mt-1">
            {files.filter((f) => Number(f.hours_at_stage) > Number(f.sla_hours)).length}
          </span>
        </div>
        <div className="dossier-card p-6 rounded-lg border-l-4 border-l-sla-amber">
          <span className="text-[10px] text-govBlue-700 uppercase font-bold">Awaiting receipt</span>
          <span className="text-3xl font-serif font-extrabold text-sla-amber block mt-1">
            {files.filter((f) => f.queue_reason === 'awaiting_receive').length}
          </span>
        </div>
      </div>

      <div className="dossier-card rounded-lg">
        <div className="file-folder-tab">PENDING ({files.length})</div>

        {error && (
          <div className="m-6 p-4 bg-sla-red/5 border border-sla-red/30 text-sla-red rounded text-xs">{error}</div>
        )}

        {loading ? (
          <div className="py-20 text-center text-xs font-bold uppercase text-govBlue-700">Loading…</div>
        ) : files.length === 0 ? (
          <div className="text-center py-20">
            <CheckCircle className="h-12 w-12 text-sla-green/45 mx-auto mb-3" />
            <p className="font-serif font-extrabold">Desk cleared</p>
            <p className="text-xs text-govBlue-700 mt-1">No files need your action right now.</p>
          </div>
        ) : (
          <div className="divide-y divide-dashed divide-govBlue-200">
            {files.map((file) => {
              const badge = getSlaBadge(file.hours_at_stage, file.sla_hours);
              const BadgeIcon = badge.icon;
              const q = queueLabel(file.queue_reason);
              return (
                <button
                  type="button"
                  key={file.reference_number}
                  onClick={() => openFile(file)}
                  className="w-full text-left px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-govBlue-50/50"
                >
                  <div className="flex items-start gap-4">
                    <FileText className="h-6 w-6 text-govBlue-700 shrink-0 mt-1" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-stamp font-bold text-govBlue-900">{file.reference_number}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-govBlue-200 rounded">
                          {file.stage_name}
                        </span>
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${q.class}`}>
                          {q.text}
                        </span>
                      </div>
                      <p className="text-xs text-govBlue-700 mt-1">
                        {Number(file.hours_at_stage).toFixed(1)} hrs at stage · SLA {file.sla_hours} hrs
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={badge.classes}>
                      <BadgeIcon className="h-3.5 w-3.5 inline mr-1" />
                      {badge.label}
                    </span>
                    <ChevronRight className="h-5 w-5 text-govBlue-500" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
