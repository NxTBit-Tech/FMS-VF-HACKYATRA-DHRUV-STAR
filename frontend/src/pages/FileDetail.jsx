// src/pages/FileDetail.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getUser } from '../services/api';
import { FileText, Clock, User, UserCheck, Calendar, ArrowRight, Shield, AlertTriangle, Check, X, Send } from 'lucide-react';
import gsap from 'gsap';

// Roster of mock officers matching typical role requirements for handoff selection
const OFFICERS_ROSTER = [
  { id: 1, name: 'Rajesh Kumar (Revenue Inspector)', role: 'revenue_inspector' },
  { id: 2, name: 'Priya Sharma (Town Planning Officer)', role: 'town_planning_officer' },
  { id: 3, name: 'Amit Patel (Assistant Engineer)', role: 'assistant_engineer' },
  { id: 4, name: 'Vikram Singh (Executive Engineer)', role: 'executive_engineer' },
  { id: 5, name: 'S. Srinivasan (Commissioner)', role: 'commissioner' },
];

export default function FileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();

  const [file, setFile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Transition Form State
  const [recipientId, setRecipientId] = useState('');
  const [customRecipientId, setCustomRecipientId] = useState('');
  const [transitNote, setTransitNote] = useState('');

  const timelineRef = useRef(null);

  const fetchDetails = async () => {
    setLoading(true);
    setError('');
    try {
      // Get file basic detail (uses backend GET /files/:id)
      const fileData = await api.get(`/files/${id}`);
      setFile(fileData);
      
      // Get file history (uses backend GET /dashboard/history/:fileId)
      const historyData = await api.get(`/dashboard/history/${id}`);
      setHistory(historyData);

      // GSAP timeline animation
      setTimeout(() => {
        if (timelineRef.current) {
          gsap.fromTo(timelineRef.current.children,
            { x: -15, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power2.out' }
          );
        }
      }, 50);
    } catch (err) {
      setError(err.message || 'Failed to load file details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleTransition = async (transitionType, toStageId = null, forcedNextHolder = null) => {
    setTransitionLoading(true);
    setError('');
    try {
      const finalNextHolderId = forcedNextHolder || customRecipientId || recipientId;
      
      const payload = {
        transitionType,
        toStageId: toStageId ? parseInt(toStageId, 10) : null,
      };

      if (finalNextHolderId) {
        payload.nextHolderId = parseInt(finalNextHolderId, 10);
      }

      // Hit POST /files/:id/transition
      await api.post(`/files/${id}/transition`, payload);
      
      // Reload on success
      setRecipientId('');
      setCustomRecipientId('');
      fetchDetails();
    } catch (err) {
      setError(err.message || 'Transition rejected by server validation.');
    } finally {
      setTransitionLoading(false);
    }
  };

  if (loading && !file) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent"></div>
        <span className="text-sm text-govBlue-200">Retrieving file details and logs...</span>
      </div>
    );
  }

  if (!file) return null;

  const isCurrentHolder = file.current_holder_id === user?.id;
  const isPendingHolder = file.pending_holder_id === user?.id;
  const isInTransit = file.pending_holder_id !== null;

  // Determine stage and workflow mapping
  const getStageInfo = (stageId) => {
    switch (stageId) {
      case 1: return { name: 'Submitted', nextStageId: 2, nextRole: 'town_planning_officer', prevStageId: null };
      case 2: return { name: 'Under Review', nextStageId: 3, nextRole: 'assistant_engineer', prevStageId: 1 };
      case 3: return { name: 'Site Inspection', nextStageId: 4, nextRole: 'executive_engineer', prevStageId: 2 };
      case 4: return { name: 'Final Approval', nextStageId: 5, nextRole: 'commissioner', prevStageId: 3 };
      case 5: return { name: 'Commissioner Review', nextStageId: null, nextRole: null, prevStageId: 4 };
      default: return { name: 'Unknown', nextStageId: null, nextRole: null, prevStageId: null };
    }
  };

  const stageInfo = getStageInfo(file.current_stage_id);

  // Filter roster by allowed roles for next stage
  const allowedRecipientsForNext = OFFICERS_ROSTER.filter(o => o.role === stageInfo.nextRole);
  const allowedRecipientsForPrev = OFFICERS_ROSTER.filter(o => o.role === getStageInfo(stageInfo.prevStageId).nextRole || o.role === 'revenue_inspector');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-xs text-govBlue-200 hover:text-white transition-colors"
        >
          &larr; Back to Dashboard
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-200 rounded-xl text-sm flex gap-2">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main File Detail Card */}
      <div className="glass rounded-2xl p-6 border border-govBlue-700/50 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-govBlue-700/40 gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
              <FileText className="h-7 w-7" />
            </div>
            <div>
              <span className="text-[10px] text-govBlue-200 uppercase tracking-wider font-semibold">Reference Number</span>
              <h1 className="text-2xl font-extrabold text-white leading-tight">{file.reference_number}</h1>
              <p className="text-xs text-govBlue-200 mt-1">Created on {new Date(file.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1.5 bg-govBlue-900 border border-govBlue-700 rounded-lg text-xs font-semibold text-white">
              Stage: {file.stage_name}
            </span>
            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${
              file.status === 'approved'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                : file.status === 'rejected'
                ? 'bg-red-500/15 border border-red-500/30 text-red-400'
                : 'bg-blue-500/15 border border-blue-500/30 text-blue-300'
            }`}>
              {file.status}
            </span>
          </div>
        </div>

        {/* Applicant / Property Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-govBlue-700/40 text-sm">
          <div className="space-y-3">
            <div>
              <span className="text-xs text-govBlue-200 block">Applicant Name</span>
              <span className="font-semibold text-white block mt-0.5">{file.applicant_name}</span>
            </div>
            <div>
              <span className="text-xs text-govBlue-200 block">Applicant Contact</span>
              <span className="font-semibold text-white block mt-0.5">{file.applicant_contact || 'N/A'}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-xs text-govBlue-200 block">Property Location</span>
              <span className="font-semibold text-white block mt-0.5">{file.property_address || 'N/A'}</span>
            </div>
            <div>
              <span className="text-xs text-govBlue-200 block">Department</span>
              <span className="font-semibold text-white block mt-0.5">{file.department}</span>
            </div>
          </div>
        </div>

        {/* Custody Info */}
        <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <span className="text-xs text-govBlue-200 block">Current Custody</span>
            <div className="flex items-center gap-2 mt-1.5 text-white">
              <UserCheck className="h-4.5 w-4.5 text-blue-400" />
              <div>
                <span className="font-semibold block leading-tight">
                  {file.current_holder_id === user?.id ? 'Held by You' : `Officer ID: ${file.current_holder_id}`}
                </span>
                <span className="text-[10px] text-govBlue-200 font-medium">Entered stage on {new Date(file.stage_entered_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {isInTransit && (
            <div>
              <span className="text-xs text-govBlue-200 block">Pending Transfer Handoff</span>
              <div className="flex items-center gap-2 mt-1.5 text-amber-400 bg-amber-500/5 border border-amber-500/20 p-2.5 rounded-xl">
                <ArrowRight className="h-4.5 w-4.5 shrink-0" />
                <div>
                  <span className="font-semibold block leading-tight">
                    {file.pending_holder_id === user?.id ? 'Sent to You' : `Recipient ID: ${file.pending_holder_id}`}
                  </span>
                  <span className="text-[10px] text-amber-500/80 block">Dispatched at {new Date(file.dispatched_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action / State Machine Controls */}
      {file.status === 'in_progress' && (
        <div className="glass rounded-2xl p-6 border border-govBlue-700/50 mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <Shield className="h-4.5 w-4.5 text-blue-400" />
            Custody Handoff panel
          </h2>

          {transitionLoading && (
            <div className="py-4 text-center text-xs text-govBlue-200 flex justify-center items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent"></div>
              Processing custody ledger mutation...
            </div>
          )}

          {!transitionLoading && (
            <div>
              {/* Scenario 1: Officer holds the file -> Can dispatch or approve/reject */}
              {isCurrentHolder && !isInTransit && (
                <div className="space-y-6">
                  {/* Executive actions if final stage */}
                  {(file.current_stage_id === 4 || file.current_stage_id === 5) && (
                    <div className="p-4 bg-govBlue-900/60 rounded-xl border border-govBlue-700/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-semibold text-white block">Terminal Decision Panel</span>
                        <span className="text-[10px] text-govBlue-200 block">Close the file's lifecycle permanently</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTransition('terminal_approve')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition-colors"
                        >
                          <Check className="h-4 w-4" /> Approve File
                        </button>
                        <button
                          onClick={() => handleTransition('terminal_reject')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow transition-colors"
                        >
                          <X className="h-4 w-4" /> Reject File
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Forward Dispatch Selector */}
                  {stageInfo.nextStageId && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-govBlue-100">Forward Dispatch to next stage</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] uppercase text-govBlue-200 block mb-1">Select Next Officer</label>
                          <select
                            value={recipientId}
                            onChange={(e) => setRecipientId(e.target.value)}
                            className="block w-full px-3 py-2 bg-govBlue-900/60 border border-govBlue-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">-- Choose Officer --</option>
                            {allowedRecipientsForNext.map(o => (
                              <option key={o.id} value={o.id}>{o.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase text-govBlue-200 block mb-1">Or enter Custom Recipient User ID</label>
                          <input
                            type="number"
                            placeholder="Officer DB User ID"
                            value={customRecipientId}
                            onChange={(e) => setCustomRecipientId(e.target.value)}
                            className="block w-full px-3 py-2 bg-govBlue-900/60 border border-govBlue-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleTransition('dispatch', stageInfo.nextStageId)}
                        disabled={!recipientId && !customRecipientId}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        <Send className="h-3.5 w-3.5" /> Dispatch Handoff
                      </button>
                    </div>
                  )}

                  {/* Send Back Dispatch Selector */}
                  {stageInfo.prevStageId && (
                    <div className="pt-4 border-t border-govBlue-700/40 space-y-3">
                      <h3 className="text-xs font-semibold text-govBlue-100">Send Back (Return File)</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] uppercase text-govBlue-200 block mb-1">Select Previous Officer</label>
                          <select
                            value={recipientId}
                            onChange={(e) => setRecipientId(e.target.value)}
                            className="block w-full px-3 py-2 bg-govBlue-900/60 border border-govBlue-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">-- Choose Officer --</option>
                            {allowedRecipientsForPrev.map(o => (
                              <option key={o.id} value={o.id}>{o.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={() => handleTransition('dispatch', stageInfo.prevStageId)}
                        disabled={!recipientId && !customRecipientId}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-govBlue-800 hover:bg-govBlue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        <Send className="h-3.5 w-3.5" /> Send Back Handoff
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Scenario 2: User is the pending recipient -> Must claim / confirm pickup */}
              {isPendingHolder && (
                <div className="p-5 bg-blue-500/5 rounded-xl border border-blue-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Pending Custody Handoff</h3>
                    <p className="text-xs text-govBlue-200 mt-0.5">
                      Confirm physical receipt of this file to proceed.
                    </p>
                  </div>
                  <button
                    onClick={() => handleTransition('receive', file.current_stage_id)}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-blue-900/30 transition-colors"
                  >
                    <Check className="h-4 w-4" /> Confirm Handoff Pickup
                  </button>
                </div>
              )}

              {/* Scenario 3: Neither holder nor pending recipient */}
              {!isCurrentHolder && !isPendingHolder && (
                <div className="p-4 bg-govBlue-900/50 rounded-xl border border-govBlue-700/40 text-center">
                  <p className="text-xs text-govBlue-200">
                    You do not currently hold this file. Mutations can only be dispatched by the current holder ({file.current_holder_id}), or received by the pending recipient.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Movement Timeline */}
      <div className="glass rounded-2xl p-6 border border-govBlue-700/50">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-6 flex items-center gap-2">
          <Calendar className="h-4.5 w-4.5 text-blue-400" />
          Custody Audit Ledger Log
        </h2>

        {history.length === 0 ? (
          <p className="text-sm text-govBlue-200 py-4 text-center">No moves logged for this file yet.</p>
        ) : (
          <div ref={timelineRef} className="space-y-6 relative before:absolute before:inset-y-1 before:left-3 before:w-0.5 before:bg-govBlue-700/40">
            {history.map((log, index) => (
              <div key={index} className="flex gap-4 items-start relative">
                <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center border ${
                  log.transition_type === 'receive'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : log.transition_type === 'dispatch'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}>
                  {log.transition_type === 'receive' ? (
                    <Check className="h-3 w-3" />
                  ) : log.transition_type === 'dispatch' ? (
                    <Send className="h-3 w-3" />
                  ) : (
                    <User className="h-3 w-3" />
                  )}
                </div>

                <div className="flex-1 bg-govBlue-900/40 border border-govBlue-700/30 p-4 rounded-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs font-bold text-white">
                      {log.transition_type === 'receive' 
                        ? `Received at stage: ${log.to_stage}` 
                        : log.transition_type === 'dispatch'
                        ? `Dispatched to stage: ${log.to_stage || 'N/A'}`
                        : `Decision: ${log.transition_type}`}
                    </span>
                    <span className="text-[10px] text-govBlue-200">{new Date(log.scanned_at).toLocaleString()}</span>
                  </div>

                  <p className="text-xs text-govBlue-200 mt-1">
                    Handled by: <span className="font-semibold text-white">{log.handled_by}</span>
                  </p>

                  <div className="flex gap-4 mt-2 text-[10px] text-govBlue-200">
                    {log.time_at_previous_stage_hours !== null && (
                      <span>Time spent at previous: {Number(log.time_at_previous_stage_hours).toFixed(1)} hrs</span>
                    )}
                    {log.transit_hours !== null && (
                      <span className="text-amber-400 font-medium">In Transit gap: {Number(log.transit_hours).toFixed(1)} hrs</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
