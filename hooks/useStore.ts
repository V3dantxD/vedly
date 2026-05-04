import { create } from "zustand";

// ─── UI Store ───────────────────────────────────────────────────────────────

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  addExpenseOpen: boolean;
  setAddExpenseOpen: (open: boolean) => void;

  settleUpOpen: boolean;
  settleUpTarget: { userId: string; name: string; amount: number } | null;
  openSettleUp: (target: { userId: string; name: string; amount: number }) => void;
  closeSettleUp: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  addExpenseOpen: false,
  setAddExpenseOpen: (open) => set({ addExpenseOpen: open }),

  settleUpOpen: false,
  settleUpTarget: null,
  openSettleUp: (target) => set({ settleUpOpen: true, settleUpTarget: target }),
  closeSettleUp: () => set({ settleUpOpen: false, settleUpTarget: null }),
}));

// ─── User Store ──────────────────────────────────────────────────────────────

interface UserState {
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  userImage: string | null;
  setUser: (user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  }) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  userId: null,
  userName: null,
  userEmail: null,
  userImage: null,
  setUser: (user) =>
    set({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image ?? null,
    }),
  clearUser: () =>
    set({ userId: null, userName: null, userEmail: null, userImage: null }),
}));

// ─── Notification Store ───────────────────────────────────────────────────────

interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  decrementUnread: () => void;
  resetUnread: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  incrementUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
  decrementUnread: () =>
    set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),
  resetUnread: () => set({ unreadCount: 0 }),
}));
