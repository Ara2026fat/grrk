import { useSyncDirectionWithLanguage } from "@/shared/hooks/useDirection";

/** Tiny bridge component so `useSyncDirectionWithLanguage` (a hook) runs
 *  once at the top of the provider tree without forcing AppProviders itself
 *  to become a hook-consuming component. */
export function DirectionSync() {
  useSyncDirectionWithLanguage();
  return null;
}
