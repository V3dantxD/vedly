import { z } from "zod";

export const AddFriendSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

export const CreateGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(60),
  emoji: z.string().optional(),
  type: z.enum(["Home", "Trip", "Couple", "Work", "Other"]),
});

export const AddExpenseSchema = z.object({
  description: z.string().min(1, "Description required").max(200),
  amount: z.number().positive("Amount must be positive"),
  category: z.enum(["Food", "Travel", "Accommodation", "Utilities", "Entertainment", "Shopping", "Healthcare", "Education", "Other"]),
  date: z.string(),
  notes: z.string().optional(),
  groupId: z.string().optional(),
  splitType: z.enum(["equal", "exact", "percent", "shares", "adjustment"]),
  paidBy: z.array(z.object({ userId: z.string(), amount: z.number() })).min(1),
  splits: z.array(z.object({ userId: z.string(), amount: z.number() })).min(1),
});

export const SettlementSchema = z.object({
  toUserId: z.string().min(1, "Select who you're paying"),
  amount: z.number().positive("Amount must be positive"),
  paymentMethod: z.enum(["Cash", "UPI", "Bank Transfer", "PayPal", "Other"]),
  note: z.string().optional(),
  groupId: z.string().optional(),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  timezone: z.string().optional(),
  notificationPrefs: z.object({
    email: z.boolean(),
    inApp: z.boolean(),
  }).optional(),
});

export type AddFriendInput = z.infer<typeof AddFriendSchema>;
export type CreateGroupInput = z.infer<typeof CreateGroupSchema>;
export type AddExpenseInput = z.infer<typeof AddExpenseSchema>;
export type SettlementInput = z.infer<typeof SettlementSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
