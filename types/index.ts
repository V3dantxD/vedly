export type Category =
  | "Food" | "Travel" | "Accommodation" | "Utilities"
  | "Entertainment" | "Shopping" | "Healthcare" | "Education" | "Other";

export type SplitType = "equal" | "exact" | "percent" | "shares" | "adjustment";

export interface UserBasic {
  _id: string;
  name: string;
  email: string;
  image?: string;
  defaultCurrency: string;
}

export interface GroupMember {
  userId: UserBasic;
  role: "admin" | "member";
}

export interface GroupData {
  _id: string;
  name: string;
  emoji: string;
  type: "Home" | "Trip" | "Couple" | "Work" | "Other";
  members: GroupMember[];
  currency: string;
  simplifyDebts: boolean;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
}

export interface PaidBy {
  userId: UserBasic;
  amount: number;
}

export interface Split {
  userId: UserBasic;
  amount: number;
  splitType: SplitType;
}

export interface ExpenseData {
  _id: string;
  description: string;
  amount: number;
  currency: string;
  category: Category;
  paidBy: PaidBy[];
  splits: Split[];
  groupId?: string;
  date: string;
  notes?: string;
  createdBy: UserBasic;
  createdAt: string;
  updatedAt: string;
}

export interface SettlementData {
  _id: string;
  fromUserId: UserBasic;
  toUserId: UserBasic;
  amount: number;
  currency: string;
  groupId?: string;
  paymentMethod: "Cash" | "UPI" | "Bank Transfer" | "PayPal" | "Other";
  date: string;
  note?: string;
  createdAt: string;
}

export interface BalanceSummary {
  totalOwed: number;
  totalOwe: number;
  net: number;
}

export interface FriendBalance {
  friend: UserBasic;
  amount: number; // positive = they owe you, negative = you owe them
}

export interface GroupBalance {
  userId: UserBasic;
  amount: number;
}

export interface SimplifiedDebt {
  from: UserBasic;
  to: UserBasic;
  amount: number;
}

export interface ActivityItem {
  _id: string;
  actorId: UserBasic;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  groupId?: string;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedId?: string;
}

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: "cat-food",
  Travel: "cat-travel",
  Accommodation: "cat-accommodation",
  Utilities: "cat-utilities",
  Entertainment: "cat-entertainment",
  Shopping: "cat-shopping",
  Healthcare: "cat-healthcare",
  Education: "cat-education",
  Other: "cat-other",
};

export const CATEGORY_ICONS: Record<Category, string> = {
  Food: "🍕",
  Travel: "✈️",
  Accommodation: "🏠",
  Utilities: "⚡",
  Entertainment: "🎬",
  Shopping: "🛍️",
  Healthcare: "💊",
  Education: "📚",
  Other: "📦",
};

export const GROUP_EMOJIS: Record<string, string> = {
  Home: "🏠",
  Trip: "✈️",
  Couple: "💑",
  Work: "💼",
  Other: "👥",
};
