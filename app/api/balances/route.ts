import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { calculatePairBalance } from "@/lib/balance";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.user.id).populate("friends", "name email image");
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const balances = await Promise.all(
    (user.friends as unknown as { _id: string; name: string; email: string; image?: string }[]).map(async (friend) => {
      const amount = await calculatePairBalance(session.user.id, friend._id.toString());
      return { friend, amount };
    })
  );

  const totalOwed = balances.filter((b) => b.amount > 0).reduce((s, b) => s + b.amount, 0);
  const totalOwe = balances.filter((b) => b.amount < 0).reduce((s, b) => s + Math.abs(b.amount), 0);

  return NextResponse.json({
    balances,
    summary: { totalOwed, totalOwe, net: totalOwed - totalOwe },
  });
}
