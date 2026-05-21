import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthProfile, User } from "@/types";

interface AuthState {
  user: User | null;
  profile: AuthProfile | null;
  setUser: (user: User | null) => void;
  setProfile: (profile: AuthProfile | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      clearAuth: () => set({ user: null, profile: null }),
    }),
    {
      name: "auth-storage",
    }
  )
);
