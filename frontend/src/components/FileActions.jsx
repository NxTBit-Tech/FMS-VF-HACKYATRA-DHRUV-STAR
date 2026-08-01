// Reusable custody action panel — mirrors backend rules for UX only.
import React, { useState } from 'react';
import { api } from '../services/api';
import { sameUserId } from '../utils/matchId';
import {
  getForwardTarget,
  getBackwardTarget,
  filterOfficersForReceive,
  getStageLabel,
  normalizeFileRecord,
} from '../utils/workflow';
import { Check, Send, X, AlertTriangle } from 'lucide-react';

export default function FileActions({ file: rawFile, user, officers = [], onSuccess, compact = false }) {
  const file = normalizeFileRecord(rawFile);
  const [forwardRecipientId, setForwardRecipientId] = useState('');
  const [backwardRecipientId, setBackwardRecipientId] = useState('');
  const [escalateRecipientId, setEscalateRecipientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!file || file.status !== 'in_progress') return null;

  const isCurrentHolder = sameUserId(file.currentHolderId, user?.id);
  const isPendingHolder = sameUserId(file.pendingHolderId, user?.id);
  const isInTransit = file.pendingHolderId != null;
  const forwardTarget = getForwardTarget(file.currentStageId);
  const backwardTarget = getBackwardTarget(file.currentStageId);

  const forwardRecipients = forwardTarget
    ? filterOfficersForReceive(officers, file.currentStageId, forwardTarget)
    : [];
  const backwardRecipients = backwardTarget
    ? filterOfficersForReceive(officers, file.currentStageId, backwardTarget)
    : [];
  const escalateRecipients = filterOfficersForReceive(officers, 4, 5);

  const runTransition = async (transitionType, toStageId, nextHolderId = null) => {
    setLoading(true);
    setError('');
    try {
      const body = { transitionType, toStageId: toStageId ?? null };
      if (nextHolderId) body.nextHolderId = Number(nextHolderId);
      await api.post(`/files/${file.fileId}/transition`, body);
      setForwardRecipientId('');
      setBackwardRecipientId('');
      setEscalateRecipientId('');
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Transition rejected.');
    } finally {
      setLoading(false);
    }
  };

  const canTerminal =
    isCurrentHolder &&
    !isInTransit &&
    (file.currentStageId === 4 || file.currentStageId === 5) &&
    (user?.role === 'executive_engineer' || user?.role === 'commissioner');

  const canEscalate =
    isCurrentHolder &&
    !isInTransit &&
    file.currentStageId === 4 &&
    user?.role === 'executive_engineer';

  return (
    <div className={compact ? 'space-y-3' : 'space-y-6'}>
      {error && (
        <div className="p-3 bg-sla-red/5 border border-sla-red/30 text-sla-red rounded text-xs flex gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <p className="text-xs font-bold uppercase tracking-wider text-govBlue-700 text-center py-2">
          Updating custody ledger…
        </p>
      )}

      {!loading && isPendingHolder && (
        <div className="p-4 bg-sla-green/5 border border-sla-green/30 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase text-govBlue-900">Confirm Receipt</h3>
            {file.pendingToStageId ? (
              <p className="text-xs text-govBlue-700 mt-1">
                File will move to {getStageLabel(file.pendingToStageId)} after you confirm pickup.
              </p>
            ) : (
              <p className="text-xs text-sla-amber mt-1">
                Pending handoff detected — confirm physical receipt to update the registry.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() =>
              runTransition('receive', file.pendingToStageId ? Number(file.pendingToStageId) : forwardTarget)
            }
            disabled={!file.pendingToStageId && !forwardTarget}
            className="flex items-center gap-1.5 px-4 py-2 bg-sla-green text-white text-xs font-bold uppercase rounded disabled:opacity-50"
          >
            <Check className="h-4 w-4" /> Confirm Receipt
          </button>
        </div>
      )}

      {!loading && isCurrentHolder && !isInTransit && (
        <>
          {canTerminal && (
            <div className="p-4 bg-govBlue-100 rounded border border-govBlue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase text-govBlue-900">Terminal decision</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => runTransition('terminal_approve', null)}
                  className="flex items-center gap-1 px-3 py-2 bg-sla-green text-white text-xs font-bold uppercase rounded"
                >
                  <Check className="h-4 w-4" /> Approve
                </button>
                <button
                  type="button"
                  onClick={() => runTransition('terminal_reject', null)}
                  className="flex items-center gap-1 px-3 py-2 bg-sla-red text-white text-xs font-bold uppercase rounded"
                >
                  <X className="h-4 w-4" /> Reject
                </button>
              </div>
            </div>
          )}

          {canEscalate && (
            <div className="p-4 border border-govBlue-200 rounded space-y-3">
              <h3 className="text-xs font-bold uppercase text-govBlue-900">Escalate to Commissioner</h3>
              <select
                value={escalateRecipientId}
                onChange={(e) => setEscalateRecipientId(e.target.value)}
                className="w-full px-3 py-2 border border-govBlue-500 rounded text-sm"
              >
                <option value="">Select Commissioner</option>
                {escalateRecipients.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.full_name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!escalateRecipientId}
                onClick={() => runTransition('dispatch', 5, escalateRecipientId)}
                className="flex items-center gap-1.5 px-4 py-2 bg-govBlue-900 text-white text-xs font-bold uppercase rounded disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" /> Escalate
              </button>
            </div>
          )}

          {forwardTarget && file.currentStageId !== 4 && (
            <div className="p-4 border border-govBlue-200 rounded space-y-3">
              <h3 className="text-xs font-bold uppercase text-govBlue-900">
                Forward to {getStageLabel(forwardTarget)}
              </h3>
              {forwardRecipients.length === 0 ? (
                <p className="text-xs text-sla-amber">
                  No officers loaded for this handoff. Enter user ID from seed data or refresh.
                </p>
              ) : (
                <select
                  value={forwardRecipientId}
                  onChange={(e) => setForwardRecipientId(e.target.value)}
                  className="w-full px-3 py-2 border border-govBlue-500 rounded text-sm"
                >
                  <option value="">Select receiving officer</option>
                  {forwardRecipients.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.full_name} (ID {o.id})
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                disabled={!forwardRecipientId}
                onClick={() => runTransition('dispatch', forwardTarget, forwardRecipientId)}
                className="flex items-center gap-1.5 px-4 py-2 bg-govBlue-900 text-white text-xs font-bold uppercase rounded disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" /> Dispatch
              </button>
            </div>
          )}

          {backwardTarget && file.currentStageId > 1 && (
            <div className="p-4 border border-dashed border-govBlue-200 rounded space-y-3">
              <h3 className="text-xs font-bold uppercase text-govBlue-900">
                Send back to {getStageLabel(backwardTarget)}
              </h3>
              <select
                value={backwardRecipientId}
                onChange={(e) => setBackwardRecipientId(e.target.value)}
                className="w-full px-3 py-2 border border-govBlue-500 rounded text-sm"
              >
                <option value="">Select officer</option>
                {backwardRecipients.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.full_name} (ID {o.id})
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!backwardRecipientId}
                onClick={() => runTransition('dispatch', backwardTarget, backwardRecipientId)}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-govBlue-200 text-govBlue-900 text-xs font-bold uppercase rounded disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" /> Send Back
              </button>
            </div>
          )}
        </>
      )}

      {!loading && !isCurrentHolder && !isPendingHolder && (
        <p className="text-xs text-govBlue-700 text-center p-3 bg-govBlue-100 rounded">
          View only — you are not the current or pending holder for this file.
        </p>
      )}
    </div>
  );
}
