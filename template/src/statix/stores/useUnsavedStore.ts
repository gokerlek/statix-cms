import { createSelectorFunctions } from "auto-zustand-selectors-hook";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface UnsavedItem {
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
