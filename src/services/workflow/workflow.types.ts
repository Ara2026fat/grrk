/**
 * Workflow Engine data model (Blueprint Standard 17.9).
 * Definitions are structured, versionable data — never code — so a future
 * visual designer can be built as a pure UI layer over this same schema.
 */
export type WorkflowStepType = "approval" | "task" | "notification";

export interface WorkflowStepDefinition {
  stepId: string;
  type: WorkflowStepType;
  labelKey: string;
  assigneeRoleId?: string;
  slaHours?: number;
  escalateToRoleId?: string;
}

export interface WorkflowDefinition {
  id: string;
  code: string;
  labelKey: string;
  entityType: string;
  steps: WorkflowStepDefinition[];
  isActive: boolean;
}

export type WorkflowInstanceStatus = "pending" | "inProgress" | "approved" | "rejected" | "escalated" | "completed";

export interface WorkflowStepHistoryEntry {
  stepId: string;
  status: WorkflowInstanceStatus;
  actedBy?: string;
  actedAt?: string;
  comment?: string;
}

export interface WorkflowInstance {
  id: string;
  workflowDefinitionId: string;
  entityType: string;
  entityId: string;
  currentStepId: string;
  status: WorkflowInstanceStatus;
  history: WorkflowStepHistoryEntry[];
  startedAt: string;
  dueAt?: string;
}
