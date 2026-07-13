import { useTranslation } from "react-i18next";
import { DocumentPanel } from "./DocumentPanel";
import { getApplicableDocumentTypes } from "./documentTypeRegistry";
import type { EntityType } from "@/types/entities";

interface DocumentEngineSectionProps {
  entityType: EntityType;
  entityId: string;
  onChanged?: () => void;
}

/**
 * THE Generic Document Engine entry point (Roadmap Phase 2 / Blueprint
 * Section 6, point 3). Attach this ONE component to any entity's detail
 * page — `<DocumentEngineSection entityType="employee" entityId={id} />` —
 * and it renders exactly the document panels applicable to that entity
 * type, driven entirely by the Document Type Registry.
 *
 * This is what "do not create document-specific implementations" means in
 * practice: there is no `NationalIdSection`, no `PassportSection`. There is
 * one section, one panel component (`DocumentPanel`), and a config table.
 * When Company/Organization/Contractor/Visitor modules are built in a
 * later stage, they attach this exact same component with their own
 * `entityType` and immediately get Vehicle Registration, Vehicle
 * Insurance, Company Documents, Iqama, Passport, etc. — whichever rows in
 * the registry list that entity type — with zero new Document Engine code.
 */
export function DocumentEngineSection({ entityType, entityId, onChanged }: DocumentEngineSectionProps) {
  const { t } = useTranslation();
  const applicableTypes = getApplicableDocumentTypes(entityType);

  if (applicableTypes.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sectionTitle font-semibold text-text-primary">{t("nav.documents")}</h2>
      {applicableTypes.map((documentType) => (
        <DocumentPanel
          key={documentType.code}
          entityType={entityType}
          entityId={entityId}
          documentTypeCode={documentType.code}
          titleKey={documentType.titleKey}
          onChanged={onChanged}
        />
      ))}
    </div>
  );
}
