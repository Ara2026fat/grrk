import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { EntityFormPage } from "@/modules/entity-engine";
import { Spinner } from "@/design-system/primitives";
import { employeeSchema } from "./employeeSchema";
import { personRepository } from "@/services/data/repositories";
import type { Person } from "@/types/entities";

/** Handles both create (`/employees/new`) and edit (`/employees/:id/edit`)
 *  — the Universal Entity Engine's form doesn't need to know which. */
export function EmployeeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState<Person | undefined>();
  const [ready, setReady] = useState(!id);

  useEffect(() => {
    if (!id) return;
    personRepository.getById(id).then((record) => {
      setInitialValues(record);
      setReady(true);
    });
  }, [id]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <EntityFormPage
      schema={employeeSchema}
      initialValues={initialValues}
      onSaved={(saved) => navigate(`/employees/${saved.id}`)}
      onCancel={() => navigate(id ? `/employees/${id}` : "/employees")}
    />
  );
}
