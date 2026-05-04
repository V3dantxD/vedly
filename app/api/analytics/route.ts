import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Expense from "@/models/Expense";
import { Settlement } from "@/models/Settlement";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") ?? "6months";

  await connectDB();

  const now = new Date();
  let startDate: Date;
  if (range === "1month") startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  else if (range === "3months") startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  else if (range === "all") startDate = new Date(2020, 0, 1);
  else startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const userId = new mongoose.Types.ObjectId(session.user.id);

  const expenses = await Expense.find({
    date: { $gte: startDate },
    $or: [{ "splits.userId": userId }, { "paidBy.userId": userId }],
  });

  // Monthly spending
  const monthlyMap = new Map<string, Record<string, number>>();
  for (const exp of expenses) {
    const key = `${exp.date.getFullYear()}-${String(exp.date.getMonth() + 1).padStart(2, "0")}`;
    const userSplit = exp.splits.find((s) => s.userId.toString() === session.user.id);
    if (!userSplit) continue;
    if (!monthlyMap.has(key)) monthlyMap.set(key, {});
    const m = monthlyMap.get(key)!;
    m[exp.category] = (m[exp.category] ?? 0) + userSplit.amount;
  }

  const monthlySpending = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, categories]) => ({ month, ...categories, total: Object.values(categories).reduce((s, v) => s + v, 0) }));

  // Category breakdown (current month)
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const categoryMap = new Map<string, number>();
  for (const exp of expenses) {
    if (exp.date < currentMonthStart) continue;
    const userSplit = exp.splits.find((s) => s.userId.toString() === session.user.id);
    if (!userSplit) continue;
    categoryMap.set(exp.category, (categoryMap.get(exp.category) ?? 0) + userSplit.amount);
  }
  const categoryBreakdown = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));

  // Paid vs owed per month
  const paidMap = new Map<string, number>();
  const owedMap = new Map<string, number>();
  for (const exp of expenses) {
    const key = `${exp.date.getFullYear()}-${String(exp.date.getMonth() + 1).padStart(2, "0")}`;
    const paid = exp.paidBy.find((p) => p.userId.toString() === session.user.id);
    const split = exp.splits.find((s) => s.userId.toString() === session.user.id);
    if (paid) paidMap.set(key, (paidMap.get(key) ?? 0) + paid.amount);
    if (split) owedMap.set(key, (owedMap.get(key) ?? 0) + split.amount);
  }

  const allKeys = new Set([...paidMap.keys(), ...owedMap.keys()]);
  const paidVsOwed = Array.from(allKeys)
    .sort()
    .map((month) => ({ month, paid: paidMap.get(month) ?? 0, owed: owedMap.get(month) ?? 0 }));

  return NextResponse.json({ monthlySpending, categoryBreakdown, paidVsOwed });
}
