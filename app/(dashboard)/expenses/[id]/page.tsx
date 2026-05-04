import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Expense from "@/models/Expense";
import { notFound } from "next/navigation";
import ExpenseDetailClient from "@/components/expenses/ExpenseDetailClient";

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) return null;

  const { id } = await params;
  await connectDB();

  const expense = await Expense.findById(id).populate(
    "paidBy.userId splits.userId createdBy",
    "name email image"
  );

  if (!expense) notFound();

  // Check user is part of this expense
  const isInvolved =
    expense.paidBy.some(
      (p) =>
        p.userId?._id?.toString() === session.user.id ||
        p.userId?.toString() === session.user.id
    ) ||
    expense.splits.some(
      (s) =>
        s.userId?._id?.toString() === session.user.id ||
        s.userId?.toString() === session.user.id
    ) ||
    expense.createdBy?._id?.toString() === session.user.id ||
    expense.createdBy?.toString() === session.user.id;

  if (!isInvolved) notFound();

  return (
    <ExpenseDetailClient
      expense={JSON.parse(JSON.stringify(expense))}
      currentUserId={session.user.id}
    />
  );
}
