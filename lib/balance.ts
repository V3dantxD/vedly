import { connectDB } from "./db";
import Expense from "@/models/Expense";
import { Settlement } from "@/models/Settlement";
import mongoose from "mongoose";

export async function calculatePairBalance(
  userAId: string,
  userBId: string
): Promise<number> {
  await connectDB();

  const userA = new mongoose.Types.ObjectId(userAId);
  const userB = new mongoose.Types.ObjectId(userBId);

  // Get all expenses involving both users
  const expenses = await Expense.find({
    $or: [
      { "paidBy.userId": userA, "splits.userId": userB },
      { "paidBy.userId": userB, "splits.userId": userA },
    ],
  });

  let balance = 0; // positive = userB owes userA

  for (const expense of expenses) {
    const aPaid = expense.paidBy
      .filter((p) => p.userId.toString() === userAId)
      .reduce((s, p) => s + p.amount, 0);

    const bPaid = expense.paidBy
      .filter((p) => p.userId.toString() === userBId)
      .reduce((s, p) => s + p.amount, 0);

    const aSplit = expense.splits
      .filter((s) => s.userId.toString() === userAId)
      .reduce((s, p) => s + p.amount, 0);

    const bSplit = expense.splits
      .filter((s) => s.userId.toString() === userBId)
      .reduce((s, p) => s + p.amount, 0);

    // userA paid for userB's share
    balance += aPaid - aSplit;
    balance -= bPaid - bSplit;
  }

  // Settlements
  const settlements = await Settlement.find({
    $or: [
      { fromUserId: userA, toUserId: userB },
      { fromUserId: userB, toUserId: userA },
    ],
  });

  for (const s of settlements) {
    if (s.fromUserId.toString() === userBId) {
      balance -= s.amount; // userB paid userA
    } else {
      balance += s.amount; // userA paid userB
    }
  }

  return Math.round(balance * 100) / 100;
}

export async function calculateGroupBalances(
  groupId: string
): Promise<Map<string, number>> {
  await connectDB();

  const expenses = await Expense.find({ groupId: new mongoose.Types.ObjectId(groupId) });
  const settlements = await Settlement.find({ groupId: new mongoose.Types.ObjectId(groupId) });

  const balances = new Map<string, number>();

  const add = (userId: string, amount: number) => {
    balances.set(userId, (balances.get(userId) ?? 0) + amount);
  };

  for (const expense of expenses) {
    for (const p of expense.paidBy) {
      add(p.userId.toString(), p.amount);
    }
    for (const s of expense.splits) {
      add(s.userId.toString(), -s.amount);
    }
  }

  for (const s of settlements) {
    add(s.fromUserId.toString(), -s.amount);
    add(s.toUserId.toString(), s.amount);
  }

  // Round all values
  for (const [key, val] of balances) {
    balances.set(key, Math.round(val * 100) / 100);
  }

  return balances;
}

export interface DebtTransaction {
  from: string;
  to: string;
  amount: number;
}

export function simplifyDebts(balances: Map<string, number>): DebtTransaction[] {
  const creditors: Array<{ id: string; amount: number }> = [];
  const debtors: Array<{ id: string; amount: number }> = [];

  for (const [id, amount] of balances) {
    if (Math.abs(amount) < 0.01) continue;
    if (amount > 0) creditors.push({ id, amount });
    else debtors.push({ id, amount: -amount });
  }

  const transactions: DebtTransaction[] = [];

  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const credit = creditors[i];
    const debt = debtors[j];
    const amount = Math.min(credit.amount, debt.amount);

    transactions.push({ from: debt.id, to: credit.id, amount: Math.round(amount * 100) / 100 });

    credit.amount -= amount;
    debt.amount -= amount;

    if (credit.amount < 0.01) i++;
    if (debt.amount < 0.01) j++;
  }

  return transactions;
}

