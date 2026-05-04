import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { calculatePairBalance } from "@/lib/balance";
import { formatINR } from "@/lib/utils";
import FriendsClient from "@/components/friends/FriendsClient";

export default async function FriendsPage() {
  const session = await auth();
  if (!session) return null;

  await connectDB();
  const user = await User.findById(session.user.id).populate("friends", "name email image");
  const friends = (user?.friends as unknown as { _id: string; name: string; email: string; image?: string }[]) ?? [];

  const balances = await Promise.all(
    friends.map(async (friend) => ({
      friend,
      amount: await calculatePairBalance(session.user.id, friend._id.toString()),
    }))
  );

  return <FriendsClient initialBalances={balances} currentUserId={session.user.id} />;
}
