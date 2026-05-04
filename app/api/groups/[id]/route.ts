import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Group from "@/models/Group";
import Expense from "@/models/Expense";
import mongoose from "mongoose";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const group = await Group.findById(id).populate("members.userId", "name email image");
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isMember = group.members.some((m) => m.userId._id?.toString() === session.user.id || m.userId.toString() === session.user.id);
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({ group });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  await connectDB();
  const group = await Group.findById(id);
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const member = group.members.find((m) => m.userId.toString() === session.user.id);
  if (!member || member.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const allowed = ["name", "emoji", "type", "simplifyDebts"];
  for (const key of allowed) {
    if (body[key] !== undefined) (group as Record<string, unknown>)[key] = body[key];
  }
  await group.save();

  return NextResponse.json({ group });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const group = await Group.findById(id);
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const member = group.members.find((m) => m.userId.toString() === session.user.id);
  if (!member || member.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await Promise.all([
    Group.findByIdAndDelete(id),
    Expense.deleteMany({ groupId: new mongoose.Types.ObjectId(id) }),
  ]);

  return NextResponse.json({ success: true });
}
