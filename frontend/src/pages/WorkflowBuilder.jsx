// src/pages/WorkflowBuilder.jsx
import React, { useState } from 'react';
import { Briefcase, AlertCircle, Plus, Trash2, ArrowRight } from 'lucide-react';

export default function WorkflowBuilder() {
  const [stages, setStages] = useState([
    { id: 1, name: 'Submitted', role: 'revenue_inspector', sla: 24 },
    { id: 2, name: 'Under Review', role: 'town_planning_officer', sla: 48 },
    { id: 3, name: 'Site Inspection', role: 'assistant_engineer', sla: 72 },
  ]);

  const [newStageName, setNewStageName] = useState('');
  const [newStageRole, setNewStageRole] = useState('revenue_inspector');
  const [newStageSla, setNewStageSla] = useState(24);

  const addStage = (e) => {
    e.preventDefault();
    if (!newStageName.trim()) return;

    setStages([
      ...stages,
      {
        id: Date.now(),
        name: newStageName.trim(),
        role: newStageRole,
        sla: parseInt(newStageSla, 10) || 24,
      },
    ]);

    setNewStageName('');
    setNewStageSla(24);
  };

  const removeStage = (id) => {
    if (stages.length <= 1) return;
    setStages(stages.filter((s) => s.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Workflow Setup</h1>
        <p className="text-sm text-govBlue-200 mt-1">
          Customize stage orders, owning roles, and SLA timeframes for departmental workflows.
        </p>
      </div>

      {/* Connection Warning Banner */}
      <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-xl text-sm flex gap-3 items-start max-w-2xl mx-auto shadow-lg">
        <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Feature Coming Soon (Not Connected)</p>
          <p className="text-xs text-amber-300/90 mt-0.5">
            The JSON-to-rows schema materializer engine is not yet activated on the backend server.
            You can design custom workflows in this sandbox, but changes cannot be saved or applied yet.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Editor Form */}
        <div className="glass p-6 rounded-2xl border border-govBlue-700/50 space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-400" />
            Append New Stage
          </h2>

          <form onSubmit={addStage} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-govBlue-100 mb-2">
                Stage Name
              </label>
              <input
                type="text"
                placeholder="e.g. Structural Audit"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                className="block w-full px-3 py-2.5 bg-govBlue-900/60 border border-govBlue-700/50 rounded-xl text-white placeholder-govBlue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-govBlue-100 mb-2">
                  Owning Role
                </label>
                <select
                  value={newStageRole}
                  onChange={(e) => setNewStageRole(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-govBlue-900/60 border border-govBlue-700/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                >
                  <option value="revenue_inspector">Revenue Inspector</option>
                  <option value="town_planning_officer">Town Planning Officer</option>
                  <option value="assistant_engineer">Assistant Engineer</option>
                  <option value="executive_engineer">Executive Engineer</option>
                  <option value="commissioner">Commissioner</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-govBlue-100 mb-2">
                  SLA (Hours)
                </label>
                <input
                  type="number"
                  value={newStageSla}
                  onChange={(e) => setNewStageSla(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-govBlue-900/60 border border-govBlue-700/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-colors shadow shadow-blue-900/20"
            >
              Add Stage to Plan
            </button>
          </form>
        </div>

        {/* Live Sequence Outline */}
        <div className="glass p-6 rounded-2xl border border-govBlue-700/50 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white mb-6 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-400" />
              Workflow Sequence Preview
            </h2>

            <div className="space-y-4">
              {stages.map((stage, index) => (
                <div key={stage.id} className="flex items-center gap-3 bg-govBlue-900/40 p-3 rounded-xl border border-govBlue-700/30 group">
                  <div className="h-6 w-6 rounded-full bg-blue-600/10 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/20">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-white block leading-tight">{stage.name}</span>
                    <span className="text-[10px] text-govBlue-200 uppercase tracking-wider">{stage.role} • {stage.sla}h SLA</span>
                  </div>
                  {stages.length > 1 && (
                    <button
                      onClick={() => removeStage(stage.id)}
                      className="p-1.5 text-govBlue-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-govBlue-700/40">
            <button
              disabled
              className="w-full py-3 px-4 bg-govBlue-800 text-govBlue-500 font-semibold rounded-xl cursor-not-allowed text-sm flex items-center justify-center gap-2 border border-govBlue-700/50"
            >
              Save Workflow Template (Disabled)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
