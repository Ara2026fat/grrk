import { supabase } from "@/services/data/supabaseClient";
import { auditEngine } from "@/services/audit/AuditEngine";
import type { WorkflowDefinition, WorkflowInstance, WorkflowInstanceStatus } from "./workflow.types";

/**
 * Workflow Engine foundation (Blueprint 17.9). Cloud Migration
 * (Section 13): definitions/instances now persist via Supabase.
 */
class WorkflowEngine {
  async registerDefinition(definition: WorkflowDefinition): Promise<void> {
    const { error } = await supabase.from("workflowDefinitions").upsert(definition);
    if (error) throw error;
  }

  async startInstance(definitionId: string, entityType: string, entityId: string): Promise<WorkflowInstance> {
    const { data: definition, error: defError } = await supabase
      .from("workflowDefinitions")
      .select("*")
      .eq("id", definitionId)
      .maybeSingle();
    if (defError) throw defError;
    if (!definition) throw new Error(`Unknown workflow definition: ${definitionId}`);

    const firstStep = (definition as WorkflowDefinition).steps[0];
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
        ? new Date(Date.now() + firstStep.slaHours * 3_600_000).toISOString()
        : undefined,
    };

    const { error } = await supabase.from("workflowInstances").insert(instance);
    if (error) throw error;
    await auditEngine.record({ entityType: "workflowInstance", entityId: instance.id, action: "create" });
    return instance;
  }

  async advance(
    instanceId: string,
    status: WorkflowInstanceStatus,
    actedBy?: string,
    comment?: string
  ): Promise<WorkflowInstance> {
    const { data: instance, error: instError } = await supabase
      .from("workflowInstances")
      .select("*")
      .eq("id", instanceId)
      .maybeSingle();
    if (instError) throw instError;
    if (!instance) throw new Error(`Unknown workflow instance: ${instanceId}`);

    const { data: definition, error: defError } = await supabase
      .from("workflowDefinitions")
      .select("*")
      .eq("id", (instance as WorkflowInstance).workflowDefinitionId)
      .maybeSingle();
    if (defError) throw defError;

    const steps = (definition as WorkflowDefinition | null)?.steps;
    const currentIndex = steps?.findIndex((s) => s.stepId === (instance as WorkflowInstance).currentStepId) ?? -1;
    const nextStep = steps?.[currentIndex + 1];

    const updated: WorkflowInstance = {
      ...(instance as WorkflowInstance),
      status: nextStep ? "inProgress" : status,
      currentStepId: nextStep ? nextStep.stepId : (instance as WorkflowInstance).currentStepId,
      history: [
        ...(instance as WorkflowInstance).history,
        { stepId: (instance as WorkflowInstance).currentStepId, status, actedBy, actedAt: new Date().toISOString(), comment },
      ],
    };

    const { error } = await supabase.from("workflowInstances").update(updated).eq("id", instanceId);
    if (error) throw error;
    await auditEngine.record({ entityType: "workflowInstance", entityId: instance.id, action: "statusChange" });
    return updated;
  }
}

export const workflowEngine = new WorkflowEngine();
