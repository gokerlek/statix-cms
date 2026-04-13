import { createSelectorFunctions } from "auto-zustand-selectors-hook";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { CMSUser } from "@/app/admin/users/page";

// ─── State ────────────────────────────────────────────────────────────────────
// Loading states are managed by React Query (isPending).
// This store owns UI-only state.

interface UserDetailStoreState {
  // Avatar
  currentImage: string | null;
  // Name inline edit
  editingName: boolean;
  nameValue: string;
  // Role staged change
  pendingRole: "admin" | "user";
  demoteConfirmOpen: boolean;
  // Ban form visibility
  banFormOpen: boolean;
  // Delete dialog
  deleteDialogOpen: boolean;
}

interface UserDetailStoreActions {
  resetUser: (user: CMSUser) => void;
  setCurrentImage: (url: string | null) => void;
  setEditingName: (v: boolean) => void;
  setNameValue: (v: string) => void;
  setPendingRole: (role: "admin" | "user") => void;
  setDemoteConfirm: (v: boolean) => void;
  setBanFormOpen: (v: boolean) => void;
  setDeleteDialog: (v: boolean) => void;
}

type UserDetailStore = UserDetailStoreState & UserDetailStoreActions;

const useUserDetailStoreBase = create<UserDetailStore>()(
  immer((set) => ({
    // Initial state
    currentImage: null,
    editingName: false,
    nameValue: "",
    pendingRole: "user",
    demoteConfirmOpen: false,
    banFormOpen: false,
    deleteDialogOpen: false,

    // Actions
    resetUser: (user) =>
      set((state) => {
        state.currentImage = user.image;
        state.editingName = false;
        state.nameValue = user.name ?? "";
        state.pendingRole = user.role ?? "user";
        state.demoteConfirmOpen = false;
        state.banFormOpen = false;
        state.deleteDialogOpen = false;
      }),
    setCurrentImage: (url) =>
      set((state) => {
        state.currentImage = url;
      }),
    setEditingName: (v) =>
      set((state) => {
        state.editingName = v;
      }),
    setNameValue: (v) =>
      set((state) => {
        state.nameValue = v;
      }),
    setPendingRole: (role) =>
      set((state) => {
        state.pendingRole = role;
      }),
    setDemoteConfirm: (v) =>
      set((state) => {
        state.demoteConfirmOpen = v;
      }),
    setBanFormOpen: (v) =>
      set((state) => {
        state.banFormOpen = v;
      }),
    setDeleteDialog: (v) =>
      set((state) => {
        state.deleteDialogOpen = v;
      }),
  })),
);

export const useUserDetailStore = createSelectorFunctions(useUserDetailStoreBase);
