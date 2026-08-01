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
          className="text-xs font-bold uppercase tracking-wider text-govBlue-700 hover:text-govBlue-900 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sla-red"
        >
          &larr; Back to Dashboard
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-sla-red/5 border border-sla-red/30 text-sla-red rounded text-xs font-semibold">
          <span>{error}</span>
        </div>
      )}

      {/* Main File Detail Dossier Card */}
      <div className="dossier-card rounded-lg p-6 mb-8 relative overflow-hidden mt-6">
        {/* Case-File Tab signature element */}
        <div className="file-folder-tab font-stamp">
          REF: {file.reference_number}
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-dashed border-govBlue-200 gap-4 mt-2">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-govBlue-100 rounded border border-govBlue-200 text-govBlue-900">
              <FileText className="h-7 w-7" />
            </div>
            <div>
              <span className="text-[9px] text-govBlue-700 font-bold uppercase tracking-wider block">Official Case Reference</span>
              <h1 className="text-2xl font-serif font-extrabold text-govBlue-900 leading-tight mt-0.5">{file.reference_number}</h1>
              <p className="text-xs text-govBlue-750 font-medium mt-1">Registry created on {new Date(file.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="stamp-badge stamp-blue text-[10px]">
              {file.stage_name}
            </span>
            <span className={`stamp-badge text-[10px] ${
              file.status === 'approved'
                ? 'stamp-green'
                : file.status === 'rejected'
                ? 'stamp-red'
                : 'stamp-blue'
            }`}>
              {file.status}
            </span>
          </div>
        </div>

        {/* Applicant / Property Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-dashed border-govBlue-200 text-sm">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-govBlue-700 font-bold uppercase tracking-wider block">Applicant Full Name</span>
              <span className="font-serif font-extrabold text-govBlue-900 text-base mt-1 block">{file.applicant_name}</span>
            </div>
            <div>
              <span className="text-[10px] text-govBlue-700 font-bold uppercase tracking-wider block">Applicant Contact Contact</span>
              <span className="font-medium text-govBlue-900 mt-1 block">{file.applicant_contact || 'None Documented'}</span>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-govBlue-700 font-bold uppercase tracking-wider block">Property / Site Address</span>
              <span className="font-medium text-govBlue-900 mt-1 block">{file.property_address || 'None Documented'}</span>
            </div>
            <div>
              <span className="text-[10px] text-govBlue-700 font-bold uppercase tracking-wider block">Assigned Bureau</span>
              <span className="font-serif font-bold text-govBlue-900 mt-1 block">{file.department}</span>
            </div>
          </div>
        </div>

        {/* Custody Info */}
        <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <span className="text-[10px] text-govBlue-700 font-bold uppercase tracking-wider block">Active Custody Holder</span>
            <div className="flex items-center gap-2 mt-2 text-govBlue-900">
              <UserCheck className="h-5 w-5 text-govBlue-700 shrink-0" />
              <div>
                <span className="font-serif font-extrabold block leading-tight">
                  {file.current_holder_id === user?.id ? 'Held by Your Office' : `Officer ID: ${file.current_holder_id}`}
                </span>
                <span className="text-[10px] text-govBlue-700 block font-medium mt-0.5">Custody entered: {new Date(file.stage_entered_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {isInTransit && (
            <div>
              <span className="text-[10px] text-govBlue-700 font-bold uppercase tracking-wider block">Pending Transit Status</span>
              <div className="flex items-center gap-2 mt-2 text-sla-amber bg-sla-amber/5 border border-sla-amber/30 p-2.5 rounded">
                <ArrowRight className="h-4.5 w-4.5 shrink-0 animate-pulse" />
                <div>
                  <span className="font-serif font-extrabold block leading-tight">
                    {file.pending_holder_id === user?.id ? 'Sent to You (Action Required)' : `In Transit to Officer ID: ${file.pending_holder_id}`}
                  </span>
                  <span className="text-[9px] text-govBlue-750 block font-bold mt-0.5">Dispatched: {new Date(file.dispatched_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action / State Machine Controls */}
      {file.status === 'in_progress' && (
        <div className="dossier-card rounded-lg p-6 mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-govBlue-900 mb-4 flex items-center gap-2">
            <Shield className="h-4.5 w-4.5 text-govBlue-700" />
            Registry Custody Controls
          </h2>

          {transitionLoading && (
            <div className="py-4 text-center text-xs font-bold uppercase tracking-wider text-govBlue-750 flex justify-center items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-govBlue-900 border-r-transparent border-b-govBlue-900 border-l-transparent"></div>
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
                    <div className="p-4 bg-govBlue-100 rounded border border-govBlue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-serif font-extrabold text-govBlue-900 block">Terminal Resolution</span>
                        <span className="text-[10px] text-govBlue-700 font-bold uppercase tracking-wider mt-0.5 block">Close the file's lifecycle permanently</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTransition('terminal_approve')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-sla-green hover:bg-opacity-95 text-white text-xs font-bold uppercase tracking-wider rounded border border-sla-green transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sla-red"
                        >
                          <Check className="h-4 w-4" /> Approve File
                        </button>
                        <button
                          onClick={() => handleTransition('terminal_reject')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-sla-red hover:bg-opacity-95 text-white text-xs font-bold uppercase tracking-wider rounded border border-sla-red transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sla-red"
                        >
                          <X className="h-4 w-4" /> Reject File
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Forward Dispatch Selector */}
                  {stageInfo.nextStageId && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-govBlue-900">Forward Dispatch Handoff</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-bold uppercase text-govBlue-700 block mb-1">Select Verified Next Officer</label>
                          <select
                            value={recipientId}
                            onChange={(e) => setRecipientId(e.target.value)}
                            className="block w-full px-3 py-2 bg-white border border-govBlue-500 rounded text-govBlue-900 text-sm focus:outline-none"
                          >
                            <option value="">-- Choose Officer --</option>
                            {allowedRecipientsForNext.map(o => (
                              <option key={o.id} value={o.id}>{o.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-govBlue-700 block mb-1">Or enter Custom Recipient ID</label>
                          <input
                            type="number"
                            placeholder="Officer DB User ID"
                            value={customRecipientId}
                            onChange={(e) => setCustomRecipientId(e.target.value)}
                            className="block w-full px-3 py-2 bg-white border border-govBlue-500 rounded text-govBlue-900 text-sm focus:outline-none"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleTransition('dispatch', stageInfo.nextStageId)}
                        disabled={!recipientId && !customRecipientId}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-govBlue-900 hover:bg-govBlue-850 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded border border-govBlue-900 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sla-red"
                      >
                        <Send className="h-3.5 w-3.5" /> Dispatch Handoff
                      </button>
                    </div>
                  )}

                  {/* Send Back Dispatch Selector */}
                  {stageInfo.prevStageId && (
                    <div className="pt-5 border-t border-dashed border-govBlue-200 space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-govBlue-900">Return File (Send Back)</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-bold uppercase text-govBlue-700 block mb-1">Select Previous Officer</label>
                          <select
                            value={recipientId}
                            onChange={(e) => setRecipientId(e.target.value)}
                            className="block w-full px-3 py-2 bg-white border border-govBlue-500 rounded text-govBlue-900 text-sm focus:outline-none"
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
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-govBlue-100 text-govBlue-900 disabled:opacity-50 text-xs font-bold uppercase tracking-wider rounded border border-govBlue-200 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sla-red"
                      >
                        <Send className="h-3.5 w-3.5" /> Send Back Handoff
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Scenario 2: User is the pending recipient -> Must claim / confirm pickup */}
              {isPendingHolder && (
                <div className="p-5 bg-govBlue-100 rounded border border-govBlue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-govBlue-900">Confirm Physical Custody</h3>
                    <p className="text-xs text-govBlue-700 mt-1 font-medium">
                      Please verify physical receipt of the paper file folder before updating the digital registry.
                    </p>
                  </div>
                  <button
                    onClick={() => handleTransition('receive', file.current_stage_id)}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-sla-green hover:bg-opacity-95 text-white text-xs font-bold uppercase tracking-wider rounded border border-sla-green transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sla-red"
                  >
                    <Check className="h-4 w-4" /> Confirm Handoff Pickup
                  </button>
                </div>
              )}

              {/* Scenario 3: Neither holder nor pending recipient */}
              {!isCurrentHolder && !isPendingHolder && (
                <div className="p-4 bg-govBlue-100 border border-govBlue-200 rounded text-center">
                  <p className="text-xs text-govBlue-700 font-medium">
                    Ledger View: You do not currently hold this dossier. Modifications can only be dispatched by the active folder custodian ({file.current_holder_id}) or received by the pending recipient.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Movement Timeline */}
      <div className="dossier-card rounded-lg p-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-govBlue-900 mb-6 flex items-center gap-2">
          <Calendar className="h-4.5 w-4.5 text-govBlue-700" />
          Custody Audit Ledger Log
        </h2>

        {history.length === 0 ? (
          <p className="text-xs text-govBlue-750 font-bold uppercase tracking-wider py-4 text-center">No transactions logged for this file.</p>
        ) : (
          <div ref={timelineRef} className="space-y-6 relative before:absolute before:inset-y-1 before:left-3 before:w-px before:border-l before:border-dashed before:border-govBlue-200">
            {history.map((log, index) => (
              <div key={index} className="flex gap-4 items-start relative">
                <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center border ${
                  log.transition_type === 'receive'
                    ? 'bg-govBlue-900 border-govBlue-900 text-white'
                    : log.transition_type === 'dispatch'
                    ? 'bg-white border-govBlue-500 text-govBlue-900'
                    : 'bg-sla-red/10 border-sla-red/30 text-sla-red'
                }`}>
                  {log.transition_type === 'receive' ? (
                    <Check className="h-3 w-3" />
                  ) : log.transition_type === 'dispatch' ? (
                    <Send className="h-3 w-3" />
                  ) : (
                    <User className="h-3 w-3" />
                  )}
                </div>

                <div className="flex-1 bg-white border border-govBlue-200 p-4 rounded shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-dashed border-govBlue-100 pb-2 mb-2">
                    <span className="text-xs font-serif font-extrabold text-govBlue-900">
                      {log.transition_type === 'receive' 
                        ? `Acknowledged Custody: ${log.to_stage}` 
                        : log.transition_type === 'dispatch'
                        ? `Dispatched to: ${log.to_stage || 'N/A'}`
                        : `Executive Action: ${log.transition_type?.replace('_', ' ')}`}
                    </span>
                    <span className="text-[10px] text-govBlue-700 font-stamp">{new Date(log.scanned_at).toLocaleString()}</span>
                  </div>

                  <p className="text-xs text-govBlue-750 font-medium">
                    Handled By Custodian: <span className="font-serif font-bold text-govBlue-900">{log.handled_by}</span>
                  </p>

                  <div className="flex gap-4 mt-2 text-[10px] text-govBlue-700 font-stamp uppercase">
                    {log.time_at_previous_stage_hours !== null && (
                      <span>Desk Time: {Number(log.time_at_previous_stage_hours).toFixed(1)} hrs</span>
                    )}
                    {log.transit_hours !== null && (
                      <span className="text-sla-amber font-bold">Transit Time: {Number(log.transit_hours).toFixed(1)} hrs</span>
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
