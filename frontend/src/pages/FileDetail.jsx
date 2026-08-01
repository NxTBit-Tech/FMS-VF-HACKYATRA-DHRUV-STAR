// src/pages/FileDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getUser } from '../services/api';
import FileActions from '../components/FileActions';
import { sameUserId } from '../utils/matchId';
import { FileText, Calendar, User, Check, Send } from 'lucide-react';

export default function FileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();

  const [file, setFile] = useState(null);
  const [history, setHistory] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const [fileData, historyData, usersData] = await Promise.all([
        api.get(`/files/${id}`),
        api.get(`/dashboard/history/${id}`),
        api.get('/users').catch(() => []),
      ]);
      setFile(fileData);
      setHistory(historyData);
      setOfficers(usersData);
    } catch (err) {
      setError(err.message || 'Failed to load file details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  if (loading && !file) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-govBlue-900 border-r-transparent" />
        <span className="text-sm text-govBlue-700">Loading file…</span>
      </div>
    );
  }

  if (!file) return null;

  const isCurrentHolder = sameUserId(file.current_holder_id, user?.id);
  const isPendingHolder = sameUserId(file.pending_holder_id, user?.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="text-xs font-bold uppercase text-govBlue-700 hover:text-govBlue-900 mb-6"
      >
        ← Back to dashboard
      </button>

      {error && (
        <div className="mb-6 p-4 bg-sla-red/5 border border-sla-red/30 text-sla-red rounded text-xs">{error}</div>
      )}

      <div className="dossier-card rounded-lg p-6 mb-8">
        <div className="file-folder-tab font-stamp">REF: {file.reference_number}</div>

        <div className="flex flex-wrap items-center gap-3 mt-4 mb-6">
          <h1 className="text-2xl font-serif font-extrabold text-govBlue-900">{file.reference_number}</h1>
          <span className="stamp-badge stamp-blue text-[10px]">{file.stage_name}</span>
          <span className="stamp-badge stamp-blue text-[10px]">{file.status}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm border-b border-dashed border-govBlue-200 pb-6">
          <div>
            <span className="text-[10px] font-bold uppercase text-govBlue-700">Applicant</span>
            <p className="font-serif font-extrabold">{file.applicant_name}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-govBlue-700">Contact</span>
            <p>{file.applicant_contact || '—'}</p>
          </div>
          <div className="md:col-span-2">
            <span className="text-[10px] font-bold uppercase text-govBlue-700">Property address</span>
            <p>{file.property_address || '—'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 text-sm">
          <div>
            <span className="text-[10px] font-bold uppercase text-govBlue-700">Current holder</span>
            <p className="font-serif font-extrabold">
              {isCurrentHolder ? 'You' : file.current_holder_name || `Officer #${file.current_holder_id}`}
            </p>
          </div>
          {file.pending_holder_id && (
            <div>
              <span className="text-[10px] font-bold uppercase text-govBlue-700">Pending recipient</span>
              <p className="font-serif font-extrabold text-sla-amber">
                {isPendingHolder ? 'You (action required)' : file.pending_holder_name || `#${file.pending_holder_id}`}
              </p>
            </div>
          )}
        </div>

        {(file.qr_image_path || file.barcode_image_path) && (
          <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-dashed border-govBlue-200">
            {file.qr_image_path && (
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase text-govBlue-700 mb-2">QR label</p>
                <img src={file.qr_image_path} alt="QR" className="w-32 h-32 border rounded" />
              </div>
            )}
            {file.barcode_image_path && (
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase text-govBlue-700 mb-2">Barcode label</p>
                <img src={file.barcode_image_path} alt="Barcode" className="max-h-24 border rounded" />
              </div>
            )}
          </div>
        )}
      </div>

      {file.status === 'in_progress' && (
        <div className="dossier-card rounded-lg p-6 mb-8">
          <h2 className="text-xs font-bold uppercase text-govBlue-900 mb-4">Custody actions</h2>
          <FileActions file={file} user={user} officers={officers} onSuccess={fetchDetails} />
        </div>
      )}

      <div className="dossier-card rounded-lg p-6">
        <h2 className="text-xs font-bold uppercase text-govBlue-900 mb-6 flex items-center gap-2">
          <Calendar className="h-4 w-4" /> Movement history
        </h2>
        {history.length === 0 ? (
          <p className="text-xs text-govBlue-700 text-center py-4">No custody log entries yet.</p>
        ) : (
          <div className="space-y-4">
            {history.map((log, index) => (
              <div key={index} className="flex gap-3 items-start border-l-2 border-govBlue-200 pl-4">
                <div className="flex-1 bg-white border border-govBlue-200 p-3 rounded text-sm">
                  <p className="font-serif font-extrabold text-govBlue-900">
                    {log.transition_type === 'receive'
                      ? `Received → ${log.to_stage || '—'}`
                      : log.transition_type === 'dispatch'
                      ? `Dispatched → ${log.to_stage || 'in transit'}`
                      : log.transition_type?.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-govBlue-700 mt-1 flex items-center gap-1">
                    <User className="h-3 w-3" /> {log.handled_by} · {new Date(log.scanned_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
