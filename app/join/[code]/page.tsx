import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Group from "@/models/Group";
import { redirect } from "next/navigation";
import mongoose from "mongoose";

export default async function JoinGroupPage({ params }: { params: Promise<{ code: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { code } = await params;
  await connectDB();

  const group = await Group.findOne({ inviteCode: code.toUpperCase() });
  if (!group) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
          <div style={{ fontSize: "3rem" }}>🔍</div>
          <div style={{ marginTop: "1rem", fontFamily: "var(--font-display)", fontSize: "1.25rem" }}>Group not found</div>
          <div style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>Invalid invite code: {code}</div>
        </div>
      </div>
    );
  }

  const alreadyMember = group.members.some((m) => m.userId.toString() === session.user.id);
  if (!alreadyMember) {
    group.members.push({ userId: new mongoose.Types.ObjectId(session.user.id), role: "member" });
    await group.save();
  }

  redirect(`/groups/${group._id}`);
}
