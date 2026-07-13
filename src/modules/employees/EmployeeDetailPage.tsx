import { useNavigate, useParams } from "react-router-dom";
import { EntityDetailPage } from "@/modules/entity-engine";
import { employeeSchema } from "./employeeSchema";
import { EmployeeComplianceSection } from "./EmployeeComplianceSection";

/**
 * Composes the generic EntityDetailPage (fields + Universal Timeline +
 * delete confirmation) with the Employee-specific compliance section
 * (restricted-profession warning + National ID panel) via the `children`
 * slot — no fork of the detail page itself.
 */
export function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  if (!id) return null;

  return (
    <EntityDetailPage
      schema={employeeSchema}
      entityId={id}
      entityType="employee"
      onEdit={() => navigate(`/employees/${id}/edit`)}
      onBack={() => navigate("/employees")}
      onDeleted={() => navigate("/employees")}
    >
      <EmployeeComplianceSection employeeId={id} />
    </EntityDetailPage>
  );
}
