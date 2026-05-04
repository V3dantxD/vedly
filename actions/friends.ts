"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { Notification, Activity } from "@/models/Settlement";
import { revalidatePath } from "next/cache";
import { AddFriendSchema } from "@/lib/validations";
import mongoose from "mongoose";

export async function addFriend(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const parsed = AddFriendSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { email } = parsed.data;

  if (email.toLowerCase() === session.user.email?.toLowerCase()) {
    return { error: "You cannot add yourself" };
  }

  await connectDB();

  const friend = await User.findOne({ email: email.toLowerCase() });
  if (!friend) return { error: "User not found. They must sign up on Vedly first." };

  const currentUser = await User.findById(session.user.id);
  if (!currentUser) return { error: "User not found" };

  const alreadyFriend = currentUser.friends.some(
    (f) => f.toString() === friend._id.toString()
  );
  if (alreadyFriend) return { error: "Already friends" };

  currentUser.friends.push(friend._id as mongoose.Types.ObjectId);
  friend.friends.push(currentUser._id as mongoose.Types.ObjectId);
  await Promise.all([currentUser.save(), friend.save()]);

  await Notification.create({
    userId: friend._id,
    type: "friend_added",
    message: `${currentUser.name} added you as a friend on Vedly`,
    relatedId: currentUser._id,
    relatedModel: "User",
  });

  await Activity.create({
    actorId: currentUser._id,
    action: "added_friend",
    entityType: "User",
    entityId: friend._id,
    metadata: { friendName: friend.name },
  });

  revalidatePath("/friends");
  return { success: true, friend: JSON.parse(JSON.stringify(friend)) };
}

export async function removeFriend(friendId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await connectDB();

  const [currentUser, friend] = await Promise.all([
    User.findById(session.user.id),
    User.findById(friendId),
  ]);

  if (!currentUser || !friend) return { error: "User not found" };

  currentUser.friends = currentUser.friends.filter(
    (f) => f.toString() !== friendId
  ) as mongoose.Types.ObjectId[];

  friend.friends = friend.friends.filter(
    (f) => f.toString() !== session.user.id
  ) as mongoose.Types.ObjectId[];

  await Promise.all([currentUser.save(), friend.save()]);

  revalidatePath("/friends");
  return { success: true };
}
