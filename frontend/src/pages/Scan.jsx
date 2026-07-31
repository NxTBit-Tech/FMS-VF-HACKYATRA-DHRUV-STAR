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
        <h1 className="text-2xl font-bold text-white tracking-tight">Camera Handoff Scan</h1>
        <p className="text-sm text-govBlue-200 mt-1">Scan a file's QR or Code128 barcode to verify custody state</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-200 rounded-xl text-sm flex gap-2">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
          <div>
            <p className="font-semibold">Scan Error</p>
            <p className="text-xs text-red-300 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* QR Code Scanner */}
      {cameraActive && !loading && (
        <div className="relative rounded-2xl overflow-hidden glass border border-govBlue-700/50 mb-6 aspect-square shadow-2xl">
          <Scanner
            onResult={(text) => handleScanSuccess(text)}
            onError={(err) => {
              console.log('Scanner error:', err);
              // Fail silently to manual input if webcam fails
            }}
          />
          <div className="absolute inset-0 border-2 border-dashed border-blue-500/40 pointer-events-none rounded-2xl m-4 flex items-center justify-center">
            <div className="w-10 h-10 border-t-4 border-l-4 border-blue-400 absolute top-0 left-0"></div>
            <div className="w-10 h-10 border-t-4 border-r-4 border-blue-400 absolute top-0 right-0"></div>
            <div className="w-10 h-10 border-b-4 border-l-4 border-blue-400 absolute bottom-0 left-0"></div>
            <div className="w-10 h-10 border-b-4 border-r-4 border-blue-400 absolute bottom-0 right-0"></div>
            <span className="text-xs font-semibold uppercase text-blue-300 bg-[#030f26]/80 px-3 py-1 rounded-full tracking-wider border border-blue-500/20">
              Align Code in Box
            </span>
          </div>
        </div>
      )}

      {loading && (
        <div className="glass rounded-2xl py-16 text-center border border-govBlue-700/30 mb-6 flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent"></div>
          <span className="text-sm text-govBlue-200">Resolving file identity details...</span>
        </div>
      )}

      {/* Manual Input Fallback */}
      {!scanData && !loading && (
        <form onSubmit={handleManualSubmit} className="glass p-5 rounded-2xl border border-govBlue-700/30 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-govBlue-100 mb-3">Manual Entry Reference</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. TP-20260801-4921"
              value={manualRef}
              onChange={(e) => setManualRef(e.target.value)}
              className="flex-1 px-3.5 py-2.5 bg-govBlue-900/60 border border-govBlue-700/50 rounded-xl text-white placeholder-govBlue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-colors shadow shadow-blue-900/20"
            >
              Verify
            </button>
          </div>
        </form>
      )}

      {/* Resolved Scan Result */}
      {scanData && (
        <div ref={resultCardRef} className="glass rounded-2xl border border-govBlue-700/50 p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none"></div>

          <div className="flex items-start gap-4 pb-5 border-b border-govBlue-700/40">
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] text-govBlue-200 font-semibold uppercase tracking-wider">File Reference</span>
              <h2 className="text-lg font-extrabold text-white leading-tight">{scanData.referenceNumber}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 bg-govBlue-900 text-govBlue-100 rounded border border-govBlue-700">
                  {scanData.currentStage.name}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  scanData.slaStatus === 'overdue' 
                    ? 'bg-red-500/10 border border-red-500/20 text-red-400' 
                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                }`}>
                  {scanData.slaStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="py-5 space-y-4 text-sm border-b border-govBlue-700/40">
            <div>
              <span className="text-xs text-govBlue-200 block mb-1">Current Custody Holder</span>
              <div className="flex items-center gap-2 text-white">
                <UserCheck className="h-4 w-4 text-blue-400" />
                <span className="font-semibold">{scanData.currentHolder?.name || 'None'}</span>
                <span className="text-xs text-govBlue-200">({scanData.currentHolder?.role})</span>
              </div>
            </div>

            {scanData.pendingHandoff && (
              <div>
                <span className="text-xs text-govBlue-200 block mb-1">Pending Recipient (In Transit)</span>
                <div className="flex items-center gap-2 text-amber-400 bg-amber-500/5 p-2 rounded-lg border border-amber-500/20">
                  <ArrowRight className="h-4 w-4" />
                  <span className="font-semibold">{scanData.pendingHandoff.pendingHolderName}</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Box */}
          <div className="pt-6">
            {canAction() ? (
              <div className="space-y-3">
                <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 mb-2">
                  <Shield className="h-3.5 w-3.5" />
                  You have verified rights to perform actions on this file.
                </p>
                <button
                  onClick={() => navigate(`/files/${scanData.fileId}`)}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/30 text-sm flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Proceed to Handoff / Actions
                </button>
              </div>
            ) : (
              <div className="p-4 bg-govBlue-900/60 border border-govBlue-700/50 rounded-xl text-center">
                <p className="text-xs text-govBlue-200">
                  You do not currently hold this file. All transitions are locked to the verified holder.
                </p>
              </div>
            )}

            <button
              onClick={() => {
                setScanData(null);
                setCameraActive(true);
                setManualRef('');
              }}
              className="w-full mt-3 py-2.5 px-4 text-xs font-semibold text-govBlue-200 hover:text-white transition-colors"
            >
              Scan Another Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
