import { db } from "@/services/data/db";
import { auditEngine } from "@/services/audit/AuditEngine";
import type { WorkflowDefinition, WorkflowInstance, WorkflowInstanceStatus } from "./workflow.types";

/**
 * Workflow Engine foundation (Blueprint 17.9). Stage 0 provides:
 *   - persistence for definitions/instances (via the same repository/IndexedDB
 *     layer as everything else — 17.1)
 *   - instance lifecycle primitives (start, advance, escalate)
 *   - automatic Audit Log + Timeline visibility on every transition
 *
 * NOT included in Stage 0 (deferred to the Compliance/Workflow business
 * stage): the actual triggers that start a workflow from a Compliance or
 * Notification event, SLA-breach scheduling, and the visual designer.
 * Those consume this engine — they do not require changes to it.
 */
class WorkflowEngine {
  async registerDefinition(definition: WorkflowDefinition): Promise<void> {
    await db.workflowDefinitions.put(definition);
  }

  async startInstance(definitionId: string, entityType: string, entityId: string): Promise<WorkflowInstance> {
    const definition = await db.workflowDefinitions.get(definitionId);
    if (!definition) throw new Error(`Unknown workflow definition: ${definitionId}`);
    const firstStep = definition.steps[0];
    if (!firstStep) throw new Error(`Workflow definition ${definitionId} has no steps`);

    const instance: WorkflowInstance = {
      id: crypto.randomUUID(),
      workflowDefinitionId: definitionId,
      entityType,
      entityId,
      currentStepId: firstStep.stepId,
      status: "pending",
      history: [{ stepId: firstStep.stepId, status: "pending", actedAt: new Date().toISOString() }],
      startedAt: new Date().toISOString(),
      dueAt: firstStep.slaHours
        ? new Date(Date.now() + firstStep.slaHours * 3600_000).toISOString()
        : undefined,
    };
    await db.workflowInstances.add(instance);
    await auditEngine.record({ entityType: "workflowInstance", entityId: instance.id, action: "create" });
    return instance;
  }

  async advance(
    instanceId: string,
    status: WorkflowInstanceStatus,
    actedBy?: string,
    comment?: string
  ): Promise<WorkflowInstance> {
    const instance = await db.workflowInstances.get(instanceId);
    if (!instance) throw new Error(`Unknown workflow instance: ${instanceId}`);

    const definition = await db.workflowDefinitions.get(instance.workflowDefinitionId);
    const currentIndex = definition?.steps.findIndex((s) => s.stepId === instance.currentStepId) ?? -1;
    const nextStep = definition?.steps[currentIndex + 1];

    const updated: WorkflowInstance = {
      ...instance,
      status: nextStep ? "inProgress" : status,
      currentStepId: nextStep ? nextStep.stepId : instance.currentStepId,
      history: [
        ...instance.history,
        { stepId: instance.currentStepId, status, actedBy, actedAt: new Date().toISOString(), comment },
      ],
    };
    await db.workflowInstances.put(updated);
    await auditEngine.record({ entityType: "workflowInstance", entityId: instance.id, action: "statusChange" });
    // Reminders/escalations are emitted as Notification Engine entries, not
    // a parallel notification system (Blueprint 17.9) — wired in Stage 3/4.
    return updated;
  }
}

export const workflowEngine = new WorkflowEngine();
