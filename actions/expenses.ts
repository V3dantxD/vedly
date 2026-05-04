"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Expense from "@/models/Expense";
import User from "@/models/User";
import { Notification, Activity } from "@/models/Settlement";
import { revalidatePath } from "next/cache";
import { AddExpenseSchema } from "@/lib/validations";
import { sendExpenseAddedEmail } from "@/lib/email";
import { redirect } from "next/navigation";

export async function createExpense(data: {
  description: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  groupId?: string;
  splitType: string;
  paidBy: { userId: string; amount: number }[];
  splits: { userId: string; amount: number }[];
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const parsed = AddExpenseSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  await connectDB();

  const expense = await Expense.create({
    ...parsed.data,
    currency: "INR",
    createdBy: session.user.id,
  });

  // Notify all split participants except the creator
  const creatorUser = await User.findById(session.user.id);
  const splitUserIds = data.splits
    .map((s) => s.userId)
    .filter((id) => id !== session.user.id);

  await Promise.all(
    splitUserIds.map(async (userId) => {
      const splitUser = await User.findById(userId);
      if (!splitUser) return;

      const userShare = data.splits.find((s) => s.userId === userId);

      await Notification.create({
        userId,
        type: "expense_added",
        message: `${creatorUser?.name} added "${data.description}" — your share: ₹${userShare?.amount?.toFixed(2)}`,
        relatedId: expense._id,
        relatedModel: "Expense",
      });

      if (splitUser.notificationPrefs?.email) {
        try {
          await sendExpenseAddedEmail({
            to: splitUser.email,
            name: splitUser.name,
            addedBy: creatorUser?.name ?? "Someone",
            description: data.description,
            amount: data.amount,
            yourShare: userShare?.amount ?? 0,
          });
        } catch (err) {
          console.error("Email send failed:", err);
        }
      }
    })
  );

  await Activity.create({
    actorId: session.user.id,
    action: "added_expense",
    entityType: "Expense",
    entityId: expense._id,
    groupId: data.groupId,
    metadata: { description: data.description, amount: data.amount },
  });

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  revalidatePath("/activity");
  if (data.groupId) revalidatePath(`/groups/${data.groupId}`);

  return { success: true, expenseId: expense._id.toString() };
}

export async function updateExpense(
  expenseId: string,
  data: Partial<{
    description: string;
    amount: number;
    category: string;
    date: string;
    notes: string;
    paidBy: { userId: string; amount: number }[];
    splits: { userId: string; amount: number }[];
  }>
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await connectDB();
  const expense = await Expense.findById(expenseId);
  if (!expense) return { error: "Expense not found" };

  if (expense.createdBy.toString() !== session.user.id) {
    return { error: "Only the creator can edit this expense" };
  }

  Object.assign(expense, data);
  await expense.save();

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  if (expense.groupId) revalidatePath(`/groups/${expense.groupId}`);

  return { success: true };
}

export async function deleteExpense(expenseId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await connectDB();
  const expense = await Expense.findById(expenseId);
  if (!expense) return { error: "Expense not found" };

  if (expense.createdBy.toString() !== session.user.id) {
    return { error: "Only the creator can delete this expense" };
  }

  const groupId = expense.groupId?.toString();
  await expense.deleteOne();

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  revalidatePath("/activity");
  if (groupId) revalidatePath(`/groups/${groupId}`);

  return { success: true };
}
