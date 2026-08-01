// src/pages/Scan.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getUser } from '../services/api';
import { Scanner } from '@yudiel/react-qr-scanner';
import { QrCode, AlertTriangle, FileText, ArrowRight, UserCheck, Shield, Send, Check } from 'lucide-react';
import gsap from 'gsap';

export default function Scan() {
  const [scanData, setScanData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualRef, setManualRef] = useState('');
  const [cameraActive, setCameraActive] = useState(true);
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
      setTimeout(() => {
        if (resultCardRef.current) {
          gsap.fromTo(resultCardRef.current,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
          );
        }
      }, 50);
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

    // Commissioner can't modify/move custody (they only review terminal approval stages)
    return isHolder || isPending;
  };

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
            onResult={(text) => handleScanSuccess(text)}
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
              <div className="space-y-3">
                <p className="text-[10px] text-sla-green font-bold uppercase tracking-wider mb-2">
                  ✓ Verification Approved: Access rights granted.
                </p>
                <button
                  onClick={() => navigate(`/files/${scanData.fileId}`)}
                  className="w-full py-3 px-4 bg-govBlue-900 hover:bg-govBlue-850 text-white font-bold uppercase tracking-wider text-xs rounded border border-govBlue-900 shadow-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sla-red"
                >
                  Proceed to Handoff / Action Panel
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
