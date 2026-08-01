// Town Planning pilot workflow mirror (UI hints only — backend enforces via allowed_transitions).

export const RECEIVE_ROLE_BY_EDGE = {
  '1-2': 'town_planning_officer',
  '2-3': 'assistant_engineer',
  '3-4': 'executive_engineer',
  '4-5': 'commissioner',
  '2-1': 'revenue_inspector',
  '3-2': 'town_planning_officer',
};

export function getForwardTarget(stageId) {
  const id = Number(stageId);
  if (id >= 1 && id <= 4) return id + 1;
  return null;
}

export function getBackwardTarget(stageId) {
  const id = Number(stageId);
  if (id >= 2 && id <= 5) return id - 1;
  return null;
}

export function getReceiveRole(fromStageId, toStageId) {
  return RECEIVE_ROLE_BY_EDGE[`${fromStageId}-${toStageId}`] ?? null;
}

export function getStageLabel(stageId) {
  const labels = {
    1: 'Submitted',
    2: 'Under Review',
    3: 'Site Inspection',
    4: 'Final Approval',
    5: 'Commissioner Review',
  };
  return labels[stageId] || `Stage ${stageId}`;
}

export function filterOfficersForReceive(officers, fromStageId, toStageId) {
  const role = getReceiveRole(fromStageId, toStageId);
  if (!role) return [];
  return officers.filter((o) => o.role === role);
}

export function normalizeFileRecord(raw) {
  if (!raw) return null;
  return {
    fileId: raw.fileId ?? raw.id,
    referenceNumber: raw.referenceNumber ?? raw.reference_number,
    status: raw.status,
    currentStageId: raw.currentStage?.id ?? raw.current_stage_id ?? raw.stage_id,
    currentStageName: raw.currentStage?.name ?? raw.stage_name,
    currentHolderId: raw.currentHolder?.id ?? raw.current_holder_id,
    currentHolderName: raw.currentHolder?.name ?? raw.current_holder_name,
    pendingHolderId: raw.pendingHandoff?.pendingHolderId ?? raw.pending_holder_id,
    pendingHolderName: raw.pendingHandoff?.pendingHolderName ?? raw.pending_holder_name,
    pendingToStageId: Number(raw.pendingHandoff?.pendingToStageId ?? raw.pending_to_stage_id) || null,
    dispatchedAt: raw.pendingHandoff?.dispatchedAt ?? raw.dispatched_at,
    slaStatus: raw.slaStatus,
    hoursAtStage: raw.hoursAtStage ?? raw.hours_at_stage,
  };
}
