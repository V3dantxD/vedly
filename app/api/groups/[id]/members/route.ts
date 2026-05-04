import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Group from "@/models/Group";
import User from "@/models/User";
import { Notification } from "@/models/Settlement";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { email } = await req.json();

  await connectDB();

  const group = await Group.findById(id);
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = group.members.some((m) => m.userId.toString() === session.user.id && m.role === "admin");
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const user = await User.findOne({ email });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const alreadyMember = group.members.some((m) => m.userId.toString() === user._id.toString());
  if (alreadyMember) return NextResponse.json({ error: "Already a member" }, { status: 400 });

  group.members.push({ userId: user._id, role: "member" });
  await group.save();

  await Notification.create({
    userId: user._id,
    type: "added_to_group",
    message: `You were added to ${group.name}`,
    relatedId: group._id,
    relatedModel: "Group",
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { userId } = await req.json();

  await connectDB();
  const group = await Group.findById(id);
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = group.members.some((m) => m.userId.toString() === session.user.id && m.role === "admin");
  const isSelf = userId === session.user.id;
  if (!isAdmin && !isSelf) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  group.members = group.members.filter((m) => m.userId.toString() !== userId);
  await group.save();

  return NextResponse.json({ success: true });
}
