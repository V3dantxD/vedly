import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Expense from "@/models/Expense";
import User from "@/models/User";
import Group from "@/models/Group";
import { notFound, redirect } from "next/navigation";
import EditExpenseClient from "@/components/expenses/EditExpenseClient";

export default async function EditExpensePage({
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

  // Only creator can edit
  const isCreator =
    expense.createdBy?._id?.toString() === session.user.id ||
    expense.createdBy?.toString() === session.user.id;

  if (!isCreator) redirect(`/expenses/${id}`);

  // Get people involved for re-splitting
  const user = await User.findById(session.user.id).populate(
    "friends",
    "name email image"
  );
  const friends = (
    user?.friends as unknown as {
      _id: string;
      name: string;
      email: string;
      image?: string;
    }[]
  ) ?? [];

  let groupMembers: { _id: string; name: string; email: string; image?: string }[] = [];

  if (expense.groupId) {
    const group = await Group.findById(expense.groupId).populate(
      "members.userId",
      "name email image"
    );
    if (group) {
      groupMembers = group.members
        .map(
          (m) =>
            m.userId as unknown as {
              _id: string;
              name: string;
              email: string;
              image?: string;
            }
        )
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
    <EditExpenseClient
      expense={JSON.parse(JSON.stringify(expense))}
      currentUser={currentUser}
      friends={friends}
      groupMembers={groupMembers}
    />
  );
}
