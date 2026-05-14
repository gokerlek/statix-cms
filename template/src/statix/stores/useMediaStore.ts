import { createSelectorFunctions } from "auto-zustand-selectors-hook";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export type MediaStoreTarget = "media" | "files";

interface MediaStoreState {
  isOpen: boolean;
  mode: "upload" | "select";
  /**
   * Which R2 bucket the drawer should drive — `"media"` (default)
   * shows image uploads, `"files"` swaps to the document bucket so
   * `FileField` can reuse the exact same drawer chrome instead of
   * its own modal.
   */
  target: MediaStoreTarget;
  refreshTrigger: number;
  onSelect?: (value: string) => void;
}

interface MediaStoreActions {
  openDrawer: (
    mode: "upload" | "select",
    onSelect?: (value: string) => void,
    target?: MediaStoreTarget,
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
    target: "media",
    refreshTrigger: 0,
    onSelect: undefined,
    openDrawer: (mode, onSelect, target = "media") =>
      set((state) => {
        state.isOpen = true;
        state.mode = mode;
        state.target = target;
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
        state.target = "media";
      }),
    refreshLibrary: () => {
      set((state) => {
        state.refreshTrigger += 1;
      });
    },
  })),
);

export const useMediaStore = createSelectorFunctions(useMediaStoreBase);
