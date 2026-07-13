import { useNavigate } from "react-router-dom";
import { EntityListPage } from "@/modules/entity-engine";
import { employeeSchema } from "./employeeSchema";
import type { Person } from "@/types/entities";

/** Thin route wrapper — all list behavior (search, table, create button)
 *  comes from the Universal Entity Engine. */
export function EmployeeListPage() {
  const navigate = useNavigate();
  return (
    <EntityListPage
      schema={employeeSchema}
      onCreate={() => navigate("/employees/new")}
      onSelect={(row: Person) => navigate(`/employees/${row.id}`)}
    />
  );
}
