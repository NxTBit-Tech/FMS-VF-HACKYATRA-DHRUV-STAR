// src/pages/Scan.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getUser } from '../services/api';
import { Scanner } from '@yudiel/react-qr-scanner';
import { QrCode, AlertTriangle, FileText, ArrowRight, UserCheck, Shield, Send, Check } from 'lucide-react';
import gsap from 'gsap';

const OFFICERS_ROSTER = [
  { id: 1, name: 'Rajesh Kumar (Revenue Inspector)', role: 'revenue_inspector' },
  { id: 2, name: 'Priya Sharma (Town Planning Officer)', role: 'town_planning_officer' },
  { id: 3, name: 'Amit Patel (Assistant Engineer)', role: 'assistant_engineer' },
  { id: 4, name: 'Vikram Singh (Executive Engineer)', role: 'executive_engineer' },
  { id: 5, name: 'S. Srinivasan (Commissioner)', role: 'commissioner' },
];

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

export default function Scan() {
  const [scanData, setScanData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualRef, setManualRef] = useState('');
  const [cameraActive, setCameraActive] = useState(true);

  // Transition & Dispatch states
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [customRecipientId, setCustomRecipientId] = useState('');

  const user = getUser();
  const navigate = useNavigate();
  const resultCardRef = useRef(null);

  const handleScanSuccess = async (text) => {
    if (!text) return;
    setCameraActive(false);
    await lookupFile(text);
  };

  const lookupFile = async (payload) => {
    setLoading(true);
    setError('');
    setScanData(null);
    try {
      // Hit backend POST /files/scan
      const data = await api.post('/files/scan', { payload });
      setScanData(data);
      
      // GSAP slide and reveal result card
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        setTimeout(() => {
          if (resultCardRef.current) {
            gsap.fromTo(resultCardRef.current,
              { y: 20, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
            );
          }
        }, 50);
      } else {
        setTimeout(() => {
          if (resultCardRef.current) {
            gsap.set(resultCardRef.current, { opacity: 1, y: 0 });
          }
        }, 50);
      }
    } catch (err) {
      setError(err.message || 'File lookup failed. The barcode or QR code may be invalid.');
      setCameraActive(true);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualRef.trim()) {
      lookupFile(manualRef.trim());
    }
  };

  const canAction = () => {
    if (!scanData || !user) return false;

    // Check if the current user has custody or is the pending holder
    const isHolder = scanData.currentHolder?.id === user.id;
    const isPending = scanData.pendingHandoff?.pendingHolderId === user.id;

    return isHolder || isPending;
  };

  const handleDispatchDirect = async (toStageId) => {
    setTransitionLoading(true);
    setError('');
    try {
      const finalNextHolderId = customRecipientId || recipientId;
      const payload = {
        transitionType: 'dispatch',
        toStageId: parseInt(toStageId, 10),
      };
      if (finalNextHolderId) {
        payload.nextHolderId = parseInt(finalNextHolderId, 10);
      }
      await api.post(`/files/${scanData.fileId}/transition`, payload);
      setRecipientId('');
      setCustomRecipientId('');
      // Refresh scan lookup
      await lookupFile(scanData.referenceNumber);
    } catch (err) {
      setError(err.message || 'Transition rejected by validator.');
    } finally {
      setTransitionLoading(false);
    }
  };

  const handleReceiveDirect = async () => {
    setTransitionLoading(true);
    setError('');
    try {
      const payload = {
        transitionType: 'receive',
        toStageId: parseInt(scanData.currentStage.id, 10),
      };
      await api.post(`/files/${scanData.fileId}/transition`, payload);
      // Refresh scan lookup
      await lookupFile(scanData.referenceNumber);
    } catch (err) {
      setError(err.message || 'Handoff pickup confirmation failed.');
    } finally {
      setTransitionLoading(false);
    }
  };

  const handleTerminalDirect = async (transitionType) => {
    setTransitionLoading(true);
    setError('');
    try {
      const payload = {
        transitionType,
      };
      await api.post(`/files/${scanData.fileId}/transition`, payload);
      await lookupFile(scanData.referenceNumber);
    } catch (err) {
      setError(err.message || 'Action failed.');
    } finally {
      setTransitionLoading(false);
    }
  };

  const isHolder = scanData?.currentHolder?.id === user?.id;
  const isPending = scanData?.pendingHandoff?.pendingHolderId === user?.id;
  const isInTransit = scanData?.pendingHandoff !== null;

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-serif font-extrabold text-govBlue-900 tracking-tight">Camera Handoff Scan</h1>
        <p className="text-xs text-govBlue-700 font-bold uppercase tracking-wider mt-1">Scan QR or Barcode to verify custody status</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-sla-red/5 border border-sla-red/30 text-sla-red rounded text-xs font-semibold flex gap-2">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
          <div>
            <p className="font-bold uppercase tracking-wider text-[10px]">Verification Failure</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* QR Code Scanner Container */}
      {cameraActive && !loading && (
        <div className="relative rounded-lg overflow-hidden border border-govBlue-200 bg-white mb-6 aspect-square shadow-sm">
          <Scanner
            onScan={(detectedCodes) => {
              const text = detectedCodes[0]?.rawValue;
              if (text) {
                handleScanSuccess(text);
              }
            }}
            onError={(err) => {
              console.log('Scanner error:', err);
            }}
          />
          <div className="absolute inset-0 border-2 border-dashed border-govBlue-500/40 pointer-events-none rounded-lg m-4 flex items-center justify-center">
            <div className="w-10 h-10 border-t-4 border-l-4 border-sla-red absolute top-0 left-0"></div>
            <div className="w-10 h-10 border-t-4 border-r-4 border-sla-red absolute top-0 right-0"></div>
            <div className="w-10 h-10 border-b-4 border-l-4 border-sla-red absolute bottom-0 left-0"></div>
            <div className="w-10 h-10 border-b-4 border-r-4 border-sla-red absolute bottom-0 right-0"></div>
            <span className="stamp-badge stamp-red text-[10px] bg-white/95 px-3 py-1 font-stamp tracking-wider select-none shadow">
              ALIGN CODE IN BRACKETS
            </span>
          </div>
        </div>
      )}

      {loading && (
        <div className="dossier-card rounded-lg py-16 text-center mb-6 flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-t-govBlue-900 border-r-transparent border-b-govBlue-900 border-l-transparent"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-govBlue-700">Resolving file identity details...</span>
        </div>
      )}

      {/* Manual Input Fallback */}
      {!scanData && !loading && (
        <form onSubmit={handleManualSubmit} className="dossier-card p-5 rounded-lg mb-6">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-govBlue-700 mb-3">Manual Registry Entry</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. TP-20260801-4921"
              value={manualRef}
              onChange={(e) => setManualRef(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-white border border-govBlue-500 rounded text-govBlue-900 placeholder-govBlue-500 focus:outline-none text-sm font-medium"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-govBlue-900 hover:bg-govBlue-850 text-white font-bold uppercase tracking-wider text-xs rounded border border-govBlue-900 transition-colors shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sla-red"
            >
              Verify
            </button>
          </div>
        </form>
      )}

      {/* Resolved Scan Result */}
      {scanData && (
        <div ref={resultCardRef} className="dossier-card rounded-lg p-6 shadow-md relative overflow-hidden mt-6">
          {/* File Tab signature element */}
          <div className="file-folder-tab font-stamp">
            REF: {scanData.referenceNumber}
          </div>

          <div className="flex items-start gap-4 pb-5 border-b border-dashed border-govBlue-200 mt-2">
            <div className="p-3 bg-govBlue-100 rounded border border-govBlue-200 text-govBlue-900">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[9px] text-govBlue-700 font-bold uppercase tracking-wider block">Verified File Record</span>
              <h2 className="text-base font-serif font-extrabold text-govBlue-900 leading-tight mt-0.5">{scanData.referenceNumber}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-govBlue-100 text-govBlue-900 rounded border border-govBlue-200">
                  Stage: {scanData.currentStage.name}
                </span>
                <span className={`stamp-badge text-[9px] ${
                  scanData.slaStatus === 'overdue' 
                    ? 'stamp-red' 
                    : 'stamp-green'
                }`}>
                  {scanData.slaStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="py-5 space-y-4 text-sm border-b border-dashed border-govBlue-200">
            <div>
              <span className="text-[10px] text-govBlue-700 font-bold uppercase tracking-wider block mb-1">Current Custody Holder</span>
              <div className="flex items-center gap-2 text-govBlue-900">
                <span className="font-serif font-extrabold">{scanData.currentHolder?.name || 'None'}</span>
                <span className="text-xs text-govBlue-700">({scanData.currentHolder?.role?.replace('_', ' ')})</span>
              </div>
            </div>

            {scanData.pendingHandoff && (
              <div>
                <span className="text-[10px] text-govBlue-700 font-bold uppercase tracking-wider block mb-1">Pending Recipient (In Transit)</span>
                <div className="flex items-center gap-2 text-sla-amber bg-sla-amber/5 px-3 py-2 rounded border border-sla-amber/35">
                  <span className="font-serif font-extrabold">{scanData.pendingHandoff.pendingHolderName}</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Box */}
          <div className="pt-6">
            {canAction() ? (
              <div className="space-y-4">
                {transitionLoading ? (
                  <div className="py-4 text-center text-xs font-bold uppercase tracking-wider text-govBlue-750 flex justify-center items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-govBlue-900 border-r-transparent border-b-govBlue-900 border-l-transparent"></div>
                    Mutating custody registry...
                  </div>
                ) : (
                  <>
                    {/* Scenario A: User is the pending holder -> confirm receive */}
                    {isPending && (
                      <div className="space-y-3">
                        <p className="text-[10px] text-sla-green font-bold uppercase tracking-wider">
                          ✓ Scanned: You are the pending recipient. Confirm pickup below.
                        </p>
                        <button
                          onClick={handleReceiveDirect}
                          className="w-full py-3 px-4 bg-sla-green hover:bg-opacity-95 text-white font-bold uppercase tracking-wider text-xs rounded border border-sla-green shadow-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                          Confirm Physical Receipt (Receive File)
                        </button>
                      </div>
                    )}

                    {/* Scenario B: User is current holder and not in transit -> dispatch */}
                    {isHolder && !isInTransit && (
                      <div className="space-y-4">
                        {/* Terminal decisions for EE/Commissioner */}
                        {(scanData.currentStage.id === 4 || scanData.currentStage.id === 5) && (
                          <div className="p-3 bg-govBlue-100 rounded border border-govBlue-200 flex flex-col gap-2">
                            <span className="text-[10px] font-bold text-govBlue-900 uppercase">Terminal Resolution:</span>
                            <div className="flex gap-2 w-full">
                              <button
                                onClick={() => handleTerminalDirect('terminal_approve')}
                                className="flex-1 py-2 bg-sla-green hover:bg-opacity-95 text-white text-xs font-bold uppercase rounded border border-sla-green transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleTerminalDirect('terminal_reject')}
                                className="flex-1 py-2 bg-sla-red hover:bg-opacity-95 text-white text-xs font-bold uppercase rounded border border-sla-red transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Dispatch section */}
                        {(() => {
                          const stageInfo = getStageInfo(scanData.currentStage.id);
                          if (!stageInfo.nextStageId) return null;
                          const allowedRecipients = OFFICERS_ROSTER.filter(o => o.role === stageInfo.nextRole);
                          return (
                            <div className="space-y-3 pt-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-govBlue-700 block">Dispatch Handoff ({stageInfo.nextRole?.replace('_', ' ')})</span>
                              <div className="grid grid-cols-2 gap-2">
                                <select
                                  value={recipientId}
                                  onChange={(e) => setRecipientId(e.target.value)}
                                  className="px-2 py-1.5 bg-white border border-govBlue-500 rounded text-govBlue-900 text-xs focus:outline-none"
                                >
                                  <option value="">-- Choose Officer --</option>
                                  {allowedRecipients.map(o => (
                                    <option key={o.id} value={o.id}>{o.name}</option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  placeholder="Or custom ID"
                                  value={customRecipientId}
                                  onChange={(e) => setCustomRecipientId(e.target.value)}
                                  className="px-2 py-1.5 bg-white border border-govBlue-500 rounded text-govBlue-900 text-xs focus:outline-none"
                                />
                              </div>
                              <button
                                onClick={() => handleDispatchDirect(stageInfo.nextStageId)}
                                disabled={!recipientId && !customRecipientId}
                                className="w-full py-2.5 px-4 bg-govBlue-900 hover:bg-govBlue-850 disabled:opacity-50 text-white font-bold uppercase tracking-wider text-xs rounded border border-govBlue-900 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                              >
                                <Send className="h-3.5 w-3.5 inline mr-1" /> Dispatch Handoff
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Scenario C: User is current holder but in transit */}
                    {isHolder && isInTransit && (
                      <div className="p-3.5 bg-govBlue-100 border border-govBlue-200 rounded text-center">
                        <p className="text-xs text-govBlue-700 font-bold uppercase tracking-wider">
                          ⌛ Dispatched: Awaiting verification scan from {scanData.pendingHandoff.pendingHolderName}.
                        </p>
                      </div>
                    )}
                  </>
                )}

                <button
                  onClick={() => navigate(`/files/${scanData.fileId}`)}
                  className="w-full mt-2 py-2.5 px-4 bg-white hover:bg-govBlue-100 text-govBlue-900 font-bold uppercase tracking-wider text-xs rounded border border-govBlue-200 shadow-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  View Full History & Files Dossier
                </button>
              </div>
            ) : (
              <div className="p-4 bg-govBlue-100 border border-govBlue-200 rounded text-center">
                <p className="text-xs text-govBlue-700 font-medium">
                  Ledger Warning: Access is locked. Custody actions can only be processed by the active holder or pending recipient.
                </p>
              </div>
            )}

            <button
              onClick={() => {
                setScanData(null);
                setCameraActive(true);
                setManualRef('');
              }}
              className="w-full mt-4 py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-govBlue-700 hover:text-govBlue-900 transition-colors"
            >
              Scan Another Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
