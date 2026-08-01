// src/pages/Upload.jsx
import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { FilePlus, Printer, FileText, CheckCircle, ArrowRight, Phone, Home, User } from 'lucide-react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import gsap from 'gsap';

export default function Upload() {
  const [applicantName, setApplicantName] = useState('');
  const [applicantContact, setApplicantContact] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdFile, setCreatedFile] = useState(null);

  const qrCanvasRef = useRef(null);
  const barcodeSvgRef = useRef(null);
  const successCardRef = useRef(null);

  useEffect(() => {
    if (createdFile) {
      // Render QR code onto canvas
      if (qrCanvasRef.current) {
        QRCode.toCanvas(
          qrCanvasRef.current,
          createdFile.qr_payload,
          { width: 180, margin: 1 },
          (err) => {
            if (err) console.error('QR rendering error:', err);
          }
        );
      }
      
      // Render Barcode onto SVG
      if (barcodeSvgRef.current) {
        try {
          JsBarcode(barcodeSvgRef.current, createdFile.barcode_payload, {
            format: 'CODE128',
            width: 2,
            height: 60,
            displayValue: true,
            fontSize: 12,
            textMargin: 4,
            background: '#ffffff',
            lineColor: '#000000',
          });
        } catch (err) {
          console.error('Barcode rendering error:', err);
        }
      }

      // GSAP Entrance
      setTimeout(() => {
        if (successCardRef.current) {
          gsap.fromTo(successCardRef.current,
            { scale: 0.95, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.5)' }
          );
        }
      }, 50);
    }
  }, [createdFile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setCreatedFile(null);

    try {
      // Hit POST /files
      const fileData = await api.post('/files', {
        applicantName,
        applicantContact: applicantContact || null,
        propertyAddress: propertyAddress || null,
      });

      setCreatedFile(fileData);
      
      // Clear form inputs
      setApplicantName('');
      setApplicantContact('');
      setPropertyAddress('');
    } catch (err) {
      setError(err.message || 'Failed to create file application.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-label-card').innerHTML;
    const originalContent = document.body.innerHTML;
    
    // Create print window style overrides
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body { background: white; color: black; padding: 20px; }
        .no-print { display: none; }
        .print-container { display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px solid #000; padding: 20px; border-radius: 8px; max-width: 400px; margin: 0 auto; text-align: center; }
      }
    `;
    document.head.appendChild(style);

    window.print();
    
    // Remove the print styles after print dialog closes
    document.head.removeChild(style);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-serif font-extrabold text-govBlue-900 tracking-tight">Initiate File Application</h1>
        <p className="text-xs text-govBlue-700 font-bold uppercase tracking-wider mt-1">
          Revenue Inspectors: Create a new Town Planning file and generate physical custody labels.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload Form */}
        <div className="dossier-card p-6 rounded-lg">
          {/* File Tab signature element */}
          <div className="file-folder-tab font-stamp">
            NEW FILE REGISTRATION
          </div>

          <h2 className="text-sm font-serif font-extrabold text-govBlue-900 mb-6 flex items-center gap-2 mt-2">
            <FilePlus className="h-5 w-5 text-govBlue-700" />
            Applicant Information
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-sla-red/5 border border-sla-red/30 text-sla-red rounded text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-govBlue-700 mb-1.5">
                Applicant Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4.5 w-4.5 text-govBlue-700" />
                </div>
                <input
                  type="text"
                  required
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="e.g. Shri K. Vasudev"
                  className="block w-full pl-10 pr-4 py-2.5 bg-white border border-govBlue-500 rounded text-govBlue-900 placeholder-govBlue-500 focus:outline-none text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-govBlue-700 mb-1.5">
                Contact Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4.5 w-4.5 text-govBlue-700" />
                </div>
                <input
                  type="text"
                  value={applicantContact}
                  onChange={(e) => setApplicantContact(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="block w-full pl-10 pr-4 py-2.5 bg-white border border-govBlue-500 rounded text-govBlue-900 placeholder-govBlue-500 focus:outline-none text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-govBlue-700 mb-1.5">
                Property / Plot Location Details
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                  <Home className="h-4.5 w-4.5 text-govBlue-700" />
                </div>
                <textarea
                  rows="3"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  placeholder="Full plot details and property address..."
                  className="block w-full pl-10 pr-4 py-2.5 bg-white border border-govBlue-500 rounded text-govBlue-900 placeholder-govBlue-500 focus:outline-none text-sm font-medium"
                ></textarea>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-govBlue-900 hover:bg-govBlue-850 active:bg-govBlue-950 text-white font-bold uppercase tracking-wider text-xs rounded border border-govBlue-900 transition-all shadow-sm focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting Registry Application...' : 'Create File Application'}
            </button>
          </form>
        </div>

        {/* Dynamic Label Code Preview (Generated Client-Side) */}
        <div>
          {createdFile ? (
            <div ref={successCardRef} className="dossier-card p-6 rounded-lg border-sla-green/30 bg-white shadow-md space-y-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-sla-green shrink-0" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-govBlue-900">Application Registered</h3>
                  <p className="text-[10px] text-govBlue-700 font-bold uppercase tracking-wider mt-0.5">Reference code active in DB</p>
                </div>
              </div>

              {/* Printable Card Area */}
              <div id="printable-label-card" className="bg-white p-6 rounded border-2 border-double border-govBlue-900 text-black flex flex-col items-center justify-center text-center shadow-sm print-container">
                <h4 className="text-xs font-stamp font-bold tracking-wider uppercase text-govBlue-900 border-b border-govBlue-200 pb-2 w-full mb-4">
                  GVMC DEPARTMENTAL FILE LABEL
                </h4>
                
                {/* QR Code Canvas */}
                <div className="mb-4 bg-white p-2 border border-govBlue-200 rounded">
                  <canvas ref={qrCanvasRef}></canvas>
                </div>

                {/* Code128 Barcode */}
                <div className="mb-4">
                  <svg ref={barcodeSvgRef} className="mx-auto"></svg>
                </div>

                <div className="text-[10px] font-stamp text-govBlue-900">
                  <span className="block font-bold">REF: {createdFile.reference_number}</span>
                  <span className="block text-[9px] mt-0.5">Town Planning Scope (Stage 1)</span>
                </div>
              </div>

              <button
                onClick={handlePrint}
                className="w-full py-3 px-4 bg-sla-green hover:bg-opacity-95 text-white font-bold uppercase tracking-wider text-xs rounded border border-sla-green shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print Physical Labels
              </button>
            </div>
          ) : (
            <div className="dossier-card p-6 rounded-lg text-center py-24">
              <FileText className="h-12 w-12 text-govBlue-200 mx-auto mb-3" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-govBlue-900">Labels Preview</h3>
              <p className="text-[10px] font-bold uppercase tracking-wider text-govBlue-700 mt-2 max-w-xs mx-auto">
                Submit an application form to generate client-side QR codes and barcodes for printing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
