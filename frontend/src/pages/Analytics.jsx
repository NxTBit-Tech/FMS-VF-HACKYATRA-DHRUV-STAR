// src/pages/Analytics.jsx
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { AlertTriangle, Clock, Users, ArrowRight, RefreshCw, BarChart2, ShieldAlert } from 'lucide-react';
import gsap from 'gsap';

export default function Analytics() {
  const [violations, setViolations] = useState([]);
  const [officerLoad, setOfficerLoad] = useState([]);
  const [avgTime, setAvgTime] = useState(0);
  const [inTransit, setInTransit] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Refs for animation
  const avgTimeRef = useRef(null);
  const violationsCountRef = useRef(null);
  const transitCountRef = useRef(null);
  const barsRef = useRef(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const [violationsData, loadData, avgData, transitData] = await Promise.all([
        api.get('/dashboard/sla-violations'),
        api.get('/dashboard/officer-load'),
        api.get('/dashboard/avg-processing-time'),
        api.get('/dashboard/in-transit'),
      ]);

      setViolations(violationsData);
      setOfficerLoad(loadData);
      
      const avgHours = Number(avgData?.avg_hours_to_approval) || 0;
      setAvgTime(avgHours);
      setInTransit(transitData);

      // GSAP Animations
      setTimeout(() => {
        // Count up numbers
        gsap.fromTo(avgTimeRef.current, { textContent: 0 }, {
          textContent: avgHours.toFixed(1),
          duration: 1.2,
          ease: 'power1.out',
          snap: { textContent: 0.1 }
        });

        gsap.fromTo(violationsCountRef.current, { textContent: 0 }, {
          textContent: violationsData.length,
          duration: 1,
          ease: 'power1.out',
          snap: { textContent: 1 }
        });

        gsap.fromTo(transitCountRef.current, { textContent: 0 }, {
          textContent: transitData.length,
          duration: 1,
          ease: 'power1.out',
          snap: { textContent: 1 }
        });

        // Animate the horizontal progress bars for workload
        if (barsRef.current) {
          const bars = barsRef.current.querySelectorAll('.work-bar');
          gsap.fromTo(bars,
            { width: '0%' },
            { width: (i, el) => el.getAttribute('data-width') + '%', duration: 1, ease: 'power2.out', stagger: 0.1 }
          );
        }
      }, 80);
    } catch (err) {
      setError(err.message || 'Failed to fetch analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-extrabold text-govBlue-900 tracking-tight">Executive Analytics</h1>
          <p className="text-xs text-govBlue-700 font-bold uppercase tracking-wider mt-1">
            Commissioner's overview of departmental efficiency, bottlenecks, and handoff integrity.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-govBlue-150 text-govBlue-900 rounded border border-govBlue-200 transition-all text-xs font-bold uppercase tracking-wider focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sla-red"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Reload Audit metrics
        </button>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-sla-red/5 border border-sla-red/30 text-sla-red rounded text-xs font-semibold">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-govBlue-900 border-r-transparent border-b-govBlue-900 border-l-transparent"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-govBlue-700">Aggregating departmental metrics...</span>
        </div>
      )}

      {!loading && (
        <div className="space-y-8">
          {/* CRITICAL CORE METRIC: FILES STUCK IN TRANSIT (VISUALLY PROMINENT) */}
          <div className="dossier-card rounded-lg p-6 shadow-sm relative overflow-hidden border-t-4 border-t-sla-red">
            {/* File Tab signature element */}
            <div className="file-folder-tab font-stamp">
              TRANSIT ALERT LOG
            </div>

            <div className="flex items-start justify-between pb-4 border-b border-dashed border-govBlue-200 mt-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-sla-red/5 rounded border border-sla-red/30 text-sla-red">
                  <ShieldAlert className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-lg font-serif font-extrabold text-govBlue-900 leading-tight">
                    Files Stuck in Transit (Custody Accountancy Gap)
                  </h2>
                  <p className="text-xs text-govBlue-700 font-medium mt-0.5">
                    Critical warning for files dispatched but not yet acknowledged via receiver scan.
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span ref={transitCountRef} className="text-3xl font-serif font-extrabold text-sla-red block leading-none">0</span>
                <span className="text-[9px] uppercase tracking-wider font-bold text-govBlue-700">stuck transfers</span>
              </div>
            </div>

            {inTransit.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-sla-green font-bold uppercase tracking-wider">✓ All handoffs completed successfully on time!</p>
                <p className="text-xs text-govBlue-700 mt-1">No files are currently stuck in transit between officer desks.</p>
              </div>
            ) : (
              <div className="divide-y divide-dashed divide-govBlue-200 mt-4 max-h-80 overflow-y-auto pr-2 bg-white">
                {inTransit.map((file) => (
                  <div key={file.reference_number} className="py-4 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-2 last:pb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-sla-red animate-pulse"></div>
                      <div>
                        <span className="text-xs font-stamp font-bold text-govBlue-900 block leading-tight">{file.reference_number}</span>
                        <span className="text-[10px] text-govBlue-700 mt-1 block">
                          Dispatched by Custodian: <span className="text-govBlue-900 font-bold">{file.dispatched_by}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-left sm:text-right">
                        <span className="text-xs text-sla-red font-bold block leading-tight">
                          {Number(file.hours_in_transit).toFixed(1)} hrs stuck
                        </span>
                        <span className="text-[9px] font-stamp text-govBlue-700 block mt-0.5">
                          Limit: {file.transit_sla_hours} hrs
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-govBlue-500 hidden sm:block" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overview Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="dossier-card p-6 rounded-lg flex items-center justify-between border-l-4 border-l-govBlue-900 shadow-sm">
              <div>
                <span className="text-[10px] text-govBlue-700 uppercase font-bold tracking-wider">Average Approval Velocity</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span ref={avgTimeRef} className="text-4xl font-serif font-extrabold text-govBlue-900 leading-none">0.0</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-govBlue-700 ml-1">hours</span>
                </div>
                <span className="text-[10px] text-govBlue-700 font-medium mt-2 block">Mean duration from initialization to final approval status</span>
              </div>
              <div className="p-3 bg-govBlue-100 rounded border border-govBlue-200 text-govBlue-900">
                <Clock className="h-8 w-8" />
              </div>
            </div>

            <div className="dossier-card p-6 rounded-lg flex items-center justify-between border-l-4 border-l-sla-red shadow-sm">
              <div>
                <span className="text-[10px] text-govBlue-700 uppercase font-bold tracking-wider">Active SLA Bottlenecks</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span ref={violationsCountRef} className="text-4xl font-serif font-extrabold text-sla-red leading-none">0</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-govBlue-700 ml-1">files</span>
                </div>
                <span className="text-[10px] text-govBlue-700 font-medium mt-2 block">Active files currently exceeding stage SLA limit</span>
              </div>
              <div className="p-3 bg-sla-red/5 rounded border border-sla-red/30 text-sla-red">
                <AlertTriangle className="h-8 w-8" />
              </div>
            </div>
          </div>

          {/* Mid Section - Load vs Violations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Per-Officer Pending Load */}
            <div className="dossier-card p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-serif font-bold text-govBlue-900 mb-6 flex items-center gap-2">
                <Users className="h-5 w-5 text-govBlue-700" />
                Officer Queue Workloads (Held Dossiers)
              </h3>

              {officerLoad.length === 0 ? (
                <p className="text-xs text-govBlue-750 font-bold uppercase tracking-wider py-6 text-center">No active workload data available.</p>
              ) : (
                <div ref={barsRef} className="space-y-4">
                  {(() => {
                    const maxFiles = Math.max(...officerLoad.map(o => parseInt(o.pending_files, 10)), 1);
                    return officerLoad.map((officer) => {
                      const count = parseInt(officer.pending_files, 10);
                      const percent = (count / maxFiles) * 100;
                      return (
                        <div key={officer.full_name} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-serif font-bold text-govBlue-900">{officer.full_name}</span>
                            <span className="text-govBlue-700 font-bold uppercase tracking-wider text-[10px]">{count} files ({officer.role?.replace('_', ' ')})</span>
                          </div>
                          <div className="h-3 w-full bg-govBlue-200 rounded overflow-hidden border border-govBlue-200 bg-white">
                            <div
                              data-width={percent}
                              className="work-bar h-full bg-govBlue-900 rounded-r"
                              style={{ width: '0%' }}
                            ></div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>

            {/* Overdue Files List */}
            <div className="dossier-card p-6 rounded-lg shadow-sm relative">
              {/* File Tab signature element */}
              <div className="file-folder-tab font-stamp">
                OVERDUE AUDIT
              </div>

              <h3 className="text-sm font-serif font-bold text-govBlue-900 mb-6 flex items-center gap-2 mt-2">
                <BarChart2 className="h-5 w-5 text-govBlue-700" />
                Active SLA Violations Detail
              </h3>

              {violations.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-sla-green font-bold uppercase tracking-wider">✓ Zero SLA violations logged!</p>
                  <p className="text-xs text-govBlue-700 mt-1">All officers are handling files within their stage limit times.</p>
                </div>
              ) : (
                <div className="divide-y divide-dashed divide-govBlue-200 max-h-80 overflow-y-auto pr-2 bg-white rounded border border-govBlue-200">
                  {violations.map((v) => (
                    <div key={v.reference_number} className="py-3 px-3 flex items-center justify-between first:pt-2 last:pb-2">
                      <div>
                        <span className="text-xs font-stamp font-bold text-govBlue-900 block leading-tight">{v.reference_number}</span>
                        <span className="text-[10px] text-govBlue-700 mt-0.5 block uppercase font-bold">Stage: {v.stage_name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-sla-red font-bold block leading-tight">
                          +{Math.max(0, Number(v.hours_at_stage) - Number(v.sla_hours)).toFixed(1)} hrs overdue
                        </span>
                        <span className="text-[9px] text-govBlue-700 block font-stamp mt-0.5">Desk hours: {Number(v.hours_at_stage).toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
