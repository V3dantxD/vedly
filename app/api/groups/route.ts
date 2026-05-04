import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Group from "@/models/Group";
import { Activity } from "@/models/Settlement";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const groups = await Group.find({ "members.userId": session.user.id })
    .populate("members.userId", "name email image")
    .sort({ createdAt: -1 });

  return NextResponse.json({ groups });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, emoji, type } = body;

  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  await connectDB();

  const group = await Group.create({
    name,
    emoji: emoji || "👥",
    type: type || "Other",
    members: [{ userId: session.user.id, role: "admin" }],
    currency: "INR",
    createdBy: session.user.id,
  });

  await Activity.create({
    actorId: session.user.id,
    action: "created_group",
    entityType: "Group",
    entityId: group._id,
    groupId: group._id,
    metadata: { groupName: group.name },
  });

  return NextResponse.json({ group }, { status: 201 });
}
