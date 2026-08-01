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
        <h1 className="text-3xl font-serif font-extrabold text-govBlue-900 tracking-tight">Workflow Setup</h1>
        <p className="text-xs text-govBlue-700 font-bold uppercase tracking-wider mt-1">
          Customize stage orders, owning roles, and SLA timeframes for departmental routing slip workflows.
        </p>
      </div>

      {/* Connection Warning Banner */}
      <div className="mb-8 p-4 bg-sla-amber/5 border border-sla-amber/30 text-govBlue-900 rounded flex gap-3 items-start max-w-2xl mx-auto shadow-sm">
        <AlertCircle className="h-5 w-5 text-sla-amber shrink-0 mt-0.5" />
        <div>
          <p className="font-bold uppercase tracking-wider text-[10px]">Feature Pending Registry Link</p>
          <p className="text-xs text-govBlue-700 mt-1 font-medium">
            The JSON-to-rows schema materializer engine is not yet activated on the backend server.
            You can design custom workflows in this sandbox, but changes cannot be saved or applied yet.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Editor Form */}
        <div className="dossier-card p-6 rounded-lg space-y-6">
          <h2 className="text-sm font-serif font-extrabold text-govBlue-900 flex items-center gap-2">
            <Plus className="h-5 w-5 text-govBlue-700" />
            Append New Stage
          </h2>

          <form onSubmit={addStage} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-govBlue-700 mb-1.5">
                Stage Name
              </label>
              <input
                type="text"
                placeholder="e.g. Structural Audit"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                className="block w-full px-3 py-2 bg-white border border-govBlue-500 rounded text-govBlue-900 placeholder-govBlue-500 focus:outline-none text-sm font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-govBlue-700 mb-1.5">
                  Owning Role
                </label>
                <select
                  value={newStageRole}
                  onChange={(e) => setNewStageRole(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-white border border-govBlue-500 rounded text-govBlue-900 text-sm focus:outline-none"
                >
                  <option value="revenue_inspector">Revenue Inspector</option>
                  <option value="town_planning_officer">Town Planning Officer</option>
                  <option value="assistant_engineer">Assistant Engineer</option>
                  <option value="executive_engineer">Executive Engineer</option>
                  <option value="commissioner">Commissioner</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-govBlue-700 mb-1.5">
                  SLA (Hours)
                </label>
                <input
                  type="number"
                  value={newStageSla}
                  onChange={(e) => setNewStageSla(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-govBlue-500 rounded text-govBlue-900 text-sm focus:outline-none font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-govBlue-900 hover:bg-govBlue-850 text-white font-bold uppercase tracking-wider text-xs rounded border border-govBlue-900 transition-colors shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sla-red"
            >
              Add Stage to Plan
            </button>
          </form>
        </div>

        {/* Live Sequence Outline */}
        <div className="dossier-card p-6 rounded-lg flex flex-col justify-between relative mt-6 md:mt-0">
          {/* File Tab signature element */}
          <div className="file-folder-tab font-stamp">
            ROUTING SEQUENCE
          </div>

          <div className="mt-2">
            <h2 className="text-sm font-serif font-extrabold text-govBlue-900 mb-6 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-govBlue-700" />
              Workflow Sequence Preview
            </h2>

            <div className="space-y-4">
              {stages.map((stage, index) => (
                <div key={stage.id} className="flex items-center gap-3 bg-white p-3 rounded border border-govBlue-200 group shadow-sm">
                  <div className="h-6 w-6 rounded-full bg-govBlue-100 text-govBlue-900 font-bold text-xs flex items-center justify-center border border-govBlue-200">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-serif font-bold text-govBlue-900 block leading-tight">{stage.name}</span>
                    <span className="text-[10px] text-govBlue-700 font-bold uppercase tracking-wider block mt-0.5">{stage.role?.replace('_', ' ')} • {stage.sla}h SLA</span>
                  </div>
                  {stages.length > 1 && (
                    <button
                      onClick={() => removeStage(stage.id)}
                      className="p-1.5 text-govBlue-500 hover:text-sla-red hover:bg-sla-red/5 rounded border border-transparent hover:border-sla-red/20 transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-dashed border-govBlue-200">
            <button
              disabled
              className="w-full py-3 px-4 bg-govBlue-100 text-govBlue-550 font-bold uppercase tracking-wider text-xs rounded border border-govBlue-200 cursor-not-allowed"
            >
              Save Workflow Template (Disabled)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
