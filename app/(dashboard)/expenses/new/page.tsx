import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Group from "@/models/Group";
import AddExpenseClient from "@/components/expenses/AddExpenseClient";

export default async function AddExpensePage({
  searchParams,
}: {
  searchParams: Promise<{ groupId?: string }>;
}) {
  const session = await auth();
  if (!session) return null;

  const { groupId } = await searchParams;
  await connectDB();

  const user = await User.findById(session.user.id).populate("friends", "name email image");
  const friends = (user?.friends as unknown as { _id: string; name: string; email: string; image?: string }[]) ?? [];

  let groupMembers: { _id: string; name: string; email: string; image?: string }[] = [];
  let groupData: { _id: string; name: string; emoji: string } | null = null;

  if (groupId) {
    const group = await Group.findById(groupId).populate("members.userId", "name email image");
    if (group) {
      groupData = { _id: group._id.toString(), name: group.name, emoji: group.emoji };
      groupMembers = group.members
        .map((m) => m.userId as unknown as { _id: string; name: string; email: string; image?: string })
        .filter((u) => u?._id?.toString() !== session.user.id);
    }
  }

  const currentUser = {
    _id: session.user.id,
    name: session.user.name ?? "You",
    email: session.user.email ?? "",
    image: session.user.image ?? undefined,
  };

  return (
    <AddExpenseClient
      currentUser={currentUser}
      friends={friends}
      groupMembers={groupMembers}
      groupData={groupData}
      preselectedGroupId={groupId}
    />
  );
}
