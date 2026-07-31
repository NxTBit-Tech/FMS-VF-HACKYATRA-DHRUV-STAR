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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-serif">Executive Analytics</h1>
          <p className="text-sm text-govBlue-200 mt-1">
            Commissioner's overview of departmental efficiency, bottlenecks, and handoff integrity.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-govBlue-850 hover:bg-govBlue-800 text-govBlue-100 rounded-xl border border-govBlue-700/50 transition-all text-xs font-semibold"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Reload Audit metrics
        </button>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 text-red-200 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent"></div>
          <span className="text-sm text-govBlue-200">Aggregating departmental metrics...</span>
        </div>
      )}

      {!loading && (
        <div className="space-y-8">
          {/* CRITICAL CORE METRIC: FILES STUCK IN TRANSIT (VISUALLY PROMINENT) */}
          <div className="glass rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-500/5 to-govBlue-800/10 p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-start justify-between pb-4 border-b border-govBlue-700/30">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-500/10 rounded-2xl text-red-400 border border-red-500/20 shadow-md">
                  <ShieldAlert className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white leading-tight">
                    Files Stuck in Transit (Custody Accountability Gate)
                  </h2>
                  <p className="text-xs text-govBlue-200 mt-0.5">
                    Critical warning for files dispatched but not yet acknowledged via receiver scan past standard transit SLA.
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span ref={transitCountRef} className="text-3xl font-extrabold text-red-400 block leading-none">0</span>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-govBlue-200">overdue transfers</span>
              </div>
            </div>

            {inTransit.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-emerald-400 font-semibold">All handoffs completed on time!</p>
                <p className="text-xs text-govBlue-200 mt-1">No files are currently stuck in transit between officer desks.</p>
              </div>
            ) : (
              <div className="divide-y divide-govBlue-700/30 mt-4 max-h-80 overflow-y-auto pr-2">
                {inTransit.map((file) => (
                  <div key={file.reference_number} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                      <div>
                        <span className="text-xs font-bold text-white block leading-tight">{file.reference_number}</span>
                        <span className="text-[10px] text-govBlue-200 mt-0.5 block">
                          Dispatched by: <span className="text-white font-semibold">{file.dispatched_by}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-left sm:text-right">
                        <span className="text-xs text-red-400 font-semibold block leading-tight">
                          {Number(file.hours_in_transit).toFixed(1)} hrs stuck
                        </span>
                        <span className="text-[9px] text-govBlue-200 block">
                          Transit SLA Limit: {file.transit_sla_hours} hrs
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
            <div className="glass p-6 rounded-2xl flex items-center justify-between border-l-4 border-l-blue-500 shadow-xl">
              <div>
                <span className="text-xs text-govBlue-200 uppercase font-semibold tracking-wider">Average Approval Speed</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span ref={avgTimeRef} className="text-4xl font-extrabold text-white leading-none">0.0</span>
                  <span className="text-sm font-semibold text-govBlue-200">hours</span>
                </div>
                <span className="text-[10px] text-govBlue-200 mt-1 block">Accumulated average from first scan to final approved status</span>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-400">
                <Clock className="h-8 w-8" />
              </div>
            </div>

            <div className="glass p-6 rounded-2xl flex items-center justify-between border-l-4 border-l-red-500 shadow-xl">
              <div>
                <span className="text-xs text-govBlue-200 uppercase font-semibold tracking-wider">Current SLA Violations</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span ref={violationsCountRef} className="text-4xl font-extrabold text-red-400 leading-none">0</span>
                  <span className="text-sm font-semibold text-govBlue-200">files</span>
                </div>
                <span className="text-[10px] text-govBlue-200 mt-1 block">In-progress files exceeding stage-level hours limit</span>
              </div>
              <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-450">
                <AlertTriangle className="h-8 w-8" />
              </div>
            </div>
          </div>

          {/* Mid Section - Load vs Violations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Per-Officer Pending Load */}
            <div className="glass p-6 rounded-2xl border border-govBlue-700/50 shadow-xl">
              <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                Officer Pending Workloads (Held Files)
              </h3>

              {officerLoad.length === 0 ? (
                <p className="text-sm text-govBlue-200 py-6 text-center">No active workload data available.</p>
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
                            <span className="font-semibold text-white">{officer.full_name}</span>
                            <span className="text-govBlue-200 font-medium">{count} files ({officer.role.replace('_', ' ')})</span>
                          </div>
                          <div className="h-3 w-full bg-govBlue-900 rounded-full overflow-hidden border border-govBlue-700/40">
                            <div
                              data-width={percent}
                              className="work-bar h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
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
            <div className="glass p-6 rounded-2xl border border-govBlue-700/50 shadow-xl">
              <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-blue-400" />
                Active SLA Violations Detail
              </h3>

              {violations.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-emerald-400 font-semibold">Zero SLA violations logged!</p>
                  <p className="text-xs text-govBlue-200 mt-1">All officers are handling files within their stage limit times.</p>
                </div>
              ) : (
                <div className="divide-y divide-govBlue-700/30 max-h-80 overflow-y-auto pr-2">
                  {violations.map((v) => (
                    <div key={v.reference_number} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                      <div>
                        <span className="text-xs font-bold text-white block leading-tight">{v.reference_number}</span>
                        <span className="text-[10px] text-govBlue-200 mt-0.5 block">Stage: {v.stage_name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-red-400 font-semibold block leading-tight">
                          +{Math.max(0, Number(v.hours_at_stage) - Number(v.sla_hours)).toFixed(1)} hrs overdue
                        </span>
                        <span className="text-[9px] text-govBlue-200 block">Total desk hours: {Number(v.hours_at_stage).toFixed(1)}</span>
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
