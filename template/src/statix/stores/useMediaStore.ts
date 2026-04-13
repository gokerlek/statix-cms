import { createSelectorFunctions } from "auto-zustand-selectors-hook";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface MediaStoreState {
  isOpen: boolean;
  mode: "upload" | "select";
  refreshTrigger: number;
  onSelect?: (url: string) => void;
}

interface MediaStoreActions {
  openDrawer: (
    mode: "upload" | "select",
    onSelect?: (url: string) => void,
  ) => void;
  setMode: (mode: "upload" | "select") => void;
  closeDrawer: () => void;
  refreshLibrary: () => void;
}

type MediaStore = MediaStoreState & MediaStoreActions;

const useMediaStoreBase = create<MediaStore>()(
  immer((set) => ({
    isOpen: false,
    mode: "select",
    refreshTrigger: 0,
    onSelect: undefined,
    openDrawer: (mode, onSelect) =>
      set((state) => {
        state.isOpen = true;
        state.mode = mode;
        state.onSelect = onSelect;
      }),
    setMode: (mode) =>
      set((state) => {
        state.mode = mode;
      }),
    closeDrawer: () =>
      set((state) => {
        state.isOpen = false;
        state.onSelect = undefined;
      }),
    refreshLibrary: () => {
      set((state) => {
        state.refreshTrigger += 1;
      });
    },
  })),
);

export const useMediaStore = createSelectorFunctions(useMediaStoreBase);
