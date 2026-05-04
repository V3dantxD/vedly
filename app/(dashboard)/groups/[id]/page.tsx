import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Group from "@/models/Group";
import { notFound } from "next/navigation";
import GroupDetailClient from "@/components/groups/GroupDetailClient";

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return null;

  const { id } = await params;
  await connectDB();

  const group = await Group.findById(id).populate("members.userId", "name email image");
  if (!group) notFound();

  const isMember = group.members.some(
    (m) => m.userId?._id?.toString() === session.user.id || m.userId?.toString() === session.user.id
  );
  if (!isMember) notFound();

  const userRole = group.members.find(
    (m) => m.userId?._id?.toString() === session.user.id || m.userId?.toString() === session.user.id
  )?.role;

  return (
    <GroupDetailClient
      group={JSON.parse(JSON.stringify(group))}
      currentUserId={session.user.id}
      userRole={userRole ?? "member"}
    />
  );
}
