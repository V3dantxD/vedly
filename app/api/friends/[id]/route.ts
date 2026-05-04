import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import mongoose from "mongoose";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const currentUser = await User.findById(session.user.id);
  const friend = await User.findById(id);
  if (!currentUser || !friend) return NextResponse.json({ error: "Not found" }, { status: 404 });

  currentUser.friends = currentUser.friends.filter((f) => f.toString() !== id) as mongoose.Types.ObjectId[];
  friend.friends = friend.friends.filter((f) => f.toString() !== session.user.id) as mongoose.Types.ObjectId[];

  await Promise.all([currentUser.save(), friend.save()]);
  return NextResponse.json({ success: true });
}
