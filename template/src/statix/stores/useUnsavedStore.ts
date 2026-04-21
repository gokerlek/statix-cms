import { createSelectorFunctions } from "auto-zustand-selectors-hook";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export interface UnsavedItem {
  collectionSlug: string;
  id: string;
  title: string;
  lastUpdated: string;
}

interface UnsavedStoreState {
  unsavedItems: Record<string, UnsavedItem>;
  isAlertDismissed: boolean;
  _hasHydrated: boolean;
}

interface UnsavedStoreActions {
  addChange: (collectionSlug: string, id: string, title: string) => void;
  removeChange: (collectionSlug: string, id: string) => void;
  hasChange: (collectionSlug: string, id: string) => boolean;
  getUnsavedByCollection: (collectionSlug: string) => UnsavedItem[];
  dismissAlert: () => void;
  /**
   * Remove store entries whose matching `localStorage` draft is missing.
   *
   * The store is persisted, so if a user closed the tab mid-edit, reloaded the
   * OS, or crashed the browser, `unsavedItems` can keep pointing at drafts
   * that no longer exist on disk. Call this on dashboard mount (and anywhere
   * else that surfaces the alert) so we don't show a false "changes pending"
   * banner for rows whose draft is gone.
   */
  cleanupOrphans: () => void;
  /** Wipe the entire unsaved index — used by a manual "Clear all" action. */
  clearAll: () => void;
}

type UnsavedStore = UnsavedStoreState & UnsavedStoreActions;

const useUnsavedStoreBase = create<UnsavedStore>()(
  persist(
    immer((set, get) => ({
      unsavedItems: {},
      isAlertDismissed: false,
      _hasHydrated: false,
      addChange: (collectionSlug, id, title) => {
        const key = `${collectionSlug}-${id}`;

        set((state) => {
          state.unsavedItems[key] = {
            collectionSlug,
            id,
            title,
            lastUpdated: new Date().toISOString(),
          };
          state.isAlertDismissed = false;
        });
      },
      removeChange: (collectionSlug, id) => {
        const key = `${collectionSlug}-${id}`;

        set((state) => {
          delete state.unsavedItems[key];
        });
      },
      hasChange: (collectionSlug, id) => {
        // Return false before hydration to prevent SSR mismatch
        if (!get()._hasHydrated) return false;

        const key = `${collectionSlug}-${id}`;

        return !!get().unsavedItems[key];
      },
      getUnsavedByCollection: (collectionSlug) => {
        const items = get().unsavedItems;

        return Object.values(items).filter(
          (item) => item.collectionSlug === collectionSlug,
        );
      },
      dismissAlert: () =>
        set((state) => {
          state.isAlertDismissed = true;
        }),
      cleanupOrphans: () => {
        // Must be client-side — no-op during SSR.
        if (typeof window === "undefined") return;

        set((state) => {
          for (const [key, item] of Object.entries(state.unsavedItems)) {
            const draftKey = `unsaved-content-${item.collectionSlug}-${item.id}`;
            const draft = window.localStorage.getItem(draftKey);
            // Entry is orphaned when there's no matching draft payload,
            // or when the payload is an empty object (e.g. after a save
            // raced with a tab reload).
            if (!draft) {
              delete state.unsavedItems[key];
              continue;
            }
            try {
              const parsed = JSON.parse(draft) as Record<string, unknown>;
              if (!parsed || Object.keys(parsed).length === 0) {
                window.localStorage.removeItem(draftKey);
                delete state.unsavedItems[key];
              }
            } catch {
              // Malformed draft — treat as orphan.
              window.localStorage.removeItem(draftKey);
              delete state.unsavedItems[key];
            }
          }
        });
      },
      clearAll: () => {
        if (typeof window !== "undefined") {
          // Drop every matching localStorage draft so the two stores stay
          // in sync. We only touch keys the store knows about.
          for (const item of Object.values(get().unsavedItems)) {
            window.localStorage.removeItem(
              `unsaved-content-${item.collectionSlug}-${item.id}`,
            );
          }
        }
        set((state) => {
          state.unsavedItems = {};
          state.isAlertDismissed = false;
        });
      },
    })),
    {
      name: "git-cms-unsaved-index",
      partialize: (state) => ({ unsavedItems: state.unsavedItems }),
      onRehydrateStorage: () => () => {
        // Use setState to properly trigger reactivity
        useUnsavedStoreBase.setState({ _hasHydrated: true });
      },
    },
  ),
);

export const useUnsavedStore = createSelectorFunctions(useUnsavedStoreBase);
