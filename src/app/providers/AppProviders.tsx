import { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/design-system/theme";
import { MasterDataProvider } from "@/modules/master-data/MasterDataProvider";
import { ToastProvider } from "@/shared/components/Toast";
import { DirectionSync } from "./DirectionSync";
import { AuthProvider } from "./AuthProvider";
import "@/i18n";

/**
 * Composition of every cross-cutting provider (Stage 0 requirement:
 * "Application architecture"). Order matters: ThemeProvider must wrap
 * DirectionSync (which reads useTheme), and both must be above anything
 * that reads master data or routes. ToastProvider (UX polish pass) sits
 * near the top so any page can call `useToast()` for save/delete feedback.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <DirectionSync />
      <ToastProvider>
        <AuthProvider>
          <MasterDataProvider>
            <BrowserRouter>{children}</BrowserRouter>
          </MasterDataProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
