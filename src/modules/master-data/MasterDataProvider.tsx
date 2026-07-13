import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { masterDataRepository } from "@/services/data/repositories";
import { setMasterDataCache } from "@/services/master-data/masterDataCache";
import type { MasterDataRecord } from "@/types/entities";
import type { MasterDataCategoryKey } from "./masterDataCategories";

/**
 * Master Data Engine — client-side provider (Section 10 / 17.5).
 * Loads all master data once and exposes category-scoped accessors so any
 * component (a form <select>, the restricted-profession check, a
 * notification threshold read) gets the same cached, bilingual list without
 * re-querying IndexedDB repeatedly.
 */
interface MasterDataContextValue {
  getByCategory: (category: MasterDataCategoryKey | string) => MasterDataRecord[];
  getByCode: (category: MasterDataCategoryKey | string, code: string) => MasterDataRecord | undefined;
  reload: () => Promise<void>;
  isLoading: boolean;
}

const MasterDataContext = createContext<MasterDataContextValue | undefined>(undefined);

export function MasterDataProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<MasterDataRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function reload() {
    setIsLoading(true);
    const { items } = await masterDataRepository.list({ filters: { isActive: true } });
    setRecords(items);
    setMasterDataCache(items);
    setIsLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  const value: MasterDataContextValue = {
    getByCategory: (category) => records.filter((r) => r.category === category),
    getByCode: (category, code) => records.find((r) => r.category === category && r.code === code),
    reload,
    isLoading,
  };

  return <MasterDataContext.Provider value={value}>{children}</MasterDataContext.Provider>;
}

export function useMasterData(): MasterDataContextValue {
  const ctx = useContext(MasterDataContext);
  if (!ctx) throw new Error("useMasterData must be used within a MasterDataProvider");
  return ctx;
}
