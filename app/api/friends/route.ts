import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { Notification } from "@/models/Settlement";
import { Activity } from "@/models/Settlement";
import mongoose from "mongoose";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.user.id).populate("friends", "name email image defaultCurrency");
  return NextResponse.json({ friends: user?.friends ?? [] });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  await connectDB();

  if (email.toLowerCase() === session.user.email?.toLowerCase()) {
    return NextResponse.json({ error: "You cannot add yourself" }, { status: 400 });
  }

  const friend = await User.findOne({ email: email.toLowerCase() });
  if (!friend) return NextResponse.json({ error: "User not found. They must sign up first." }, { status: 404 });

  const currentUser = await User.findById(session.user.id);
  if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const alreadyFriend = currentUser.friends.some((f) => f.toString() === friend._id.toString());
  if (alreadyFriend) return NextResponse.json({ error: "Already friends" }, { status: 400 });

  // Add each other as friends
  currentUser.friends.push(friend._id as mongoose.Types.ObjectId);
  friend.friends.push(currentUser._id as mongoose.Types.ObjectId);
  await Promise.all([currentUser.save(), friend.save()]);

  // Create notifications
  await Notification.create([
    {
      userId: friend._id,
      type: "friend_added",
      message: `${currentUser.name} added you as a friend on Vedly`,
      relatedId: currentUser._id,
      relatedModel: "User",
    },
  ]);

  // Activity
  await Activity.create({
    actorId: currentUser._id,
    action: "added_friend",
    entityType: "User",
    entityId: friend._id,
    metadata: { friendName: friend.name },
  });

  return NextResponse.json({ friend });
}
