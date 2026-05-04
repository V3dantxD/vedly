import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Expense from "@/models/Expense";
import { Settlement } from "@/models/Settlement";
import { calculatePairBalance, formatINR } from "@/lib/balance";
import { notFound } from "next/navigation";
import FriendDetailClient from "@/components/friends/FriendDetailClient";
import mongoose from "mongoose";

export default async function FriendDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) return null;

  const { id } = await params;
  await connectDB();

  const [currentUser, friend] = await Promise.all([
    User.findById(session.user.id),
    User.findById(id, "name email image"),
  ]);

  if (!friend) notFound();

  // Verify they are friends
  const isFriend = currentUser?.friends.some((f) => f.toString() === id);
  if (!isFriend) notFound();

  const userA = new mongoose.Types.ObjectId(session.user.id);
  const userB = new mongoose.Types.ObjectId(id);

  // Shared expenses
  const expenses = await Expense.find({
    $or: [
      { "paidBy.userId": userA, "splits.userId": userB },
      { "paidBy.userId": userB, "splits.userId": userA },
    ],
  })
    .populate("paidBy.userId splits.userId createdBy", "name email image")
    .sort({ date: -1 })
    .limit(50);

  // Settlements between them
  const settlements = await Settlement.find({
    $or: [
      { fromUserId: userA, toUserId: userB },
      { fromUserId: userB, toUserId: userA },
    ],
  })
    .sort({ date: -1 })
    .limit(20);

  const balance = await calculatePairBalance(session.user.id, id);

  return (
    <FriendDetailClient
      friend={JSON.parse(JSON.stringify(friend))}
      expenses={JSON.parse(JSON.stringify(expenses))}
      settlements={JSON.parse(JSON.stringify(settlements))}
      balance={balance}
      currentUserId={session.user.id}
    />
  );
}
