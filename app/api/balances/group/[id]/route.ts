import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Group from "@/models/Group";
import User from "@/models/User";
import { calculateGroupBalances, simplifyDebts } from "@/lib/balance";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const group = await Group.findById(id);
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const balanceMap = await calculateGroupBalances(id);
  const simplified = simplifyDebts(balanceMap);

  // Populate user info
  const userIds = Array.from(balanceMap.keys());
  const users = await User.find({ _id: { $in: userIds } }, "name email image");
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  const balances = Array.from(balanceMap.entries()).map(([userId, amount]) => ({
    user: userMap.get(userId),
    amount,
  }));

  const simplifiedWithUsers = simplified.map((t) => ({
    from: userMap.get(t.from),
    to: userMap.get(t.to),
    amount: t.amount,
  }));

  return NextResponse.json({ balances, simplified: group.simplifyDebts ? simplifiedWithUsers : null });
}
