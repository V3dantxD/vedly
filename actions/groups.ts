"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Group from "@/models/Group";
import User from "@/models/User";
import { Notification, Activity } from "@/models/Settlement";
import { revalidatePath } from "next/cache";
import { CreateGroupSchema } from "@/lib/validations";
import { redirect } from "next/navigation";
import mongoose from "mongoose";

export async function createGroup(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const parsed = CreateGroupSchema.safeParse({
    name: formData.get("name"),
    emoji: formData.get("emoji"),
    type: formData.get("type"),
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { name, emoji, type } = parsed.data;

  await connectDB();

  const group = await Group.create({
    name,
    emoji: emoji ?? "👥",
    type,
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

  revalidatePath("/groups");
  return { success: true, groupId: group._id.toString() };
}

export async function updateGroup(
  groupId: string,
  data: { name?: string; simplifyDebts?: boolean; emoji?: string; type?: string }
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await connectDB();
  const group = await Group.findById(groupId);
  if (!group) return { error: "Group not found" };

  const isAdmin = group.members.some(
    (m) => m.userId.toString() === session.user.id && m.role === "admin"
  );
  if (!isAdmin) return { error: "Only admins can update group settings" };

  Object.assign(group, data);
  await group.save();

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

export async function deleteGroup(groupId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await connectDB();
  const group = await Group.findById(groupId);
  if (!group) return { error: "Group not found" };

  const isAdmin = group.members.some(
    (m) => m.userId.toString() === session.user.id && m.role === "admin"
  );
  if (!isAdmin) return { error: "Only admins can delete the group" };

  await Group.findByIdAndDelete(groupId);

  revalidatePath("/groups");
  redirect("/groups");
}

export async function addGroupMember(groupId: string, email: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await connectDB();

  const [group, userToAdd] = await Promise.all([
    Group.findById(groupId),
    User.findOne({ email: email.toLowerCase() }),
  ]);

  if (!group) return { error: "Group not found" };
  if (!userToAdd) return { error: "User not found. They must sign up on Vedly first." };

  const isAdmin = group.members.some(
    (m) => m.userId.toString() === session.user.id && m.role === "admin"
  );
  if (!isAdmin) return { error: "Only admins can add members" };

  const alreadyMember = group.members.some(
    (m) => m.userId.toString() === userToAdd._id.toString()
  );
  if (alreadyMember) return { error: "User is already a member" };

  group.members.push({ userId: userToAdd._id as mongoose.Types.ObjectId, role: "member" });
  await group.save();

  await Notification.create({
    userId: userToAdd._id,
    type: "added_to_group",
    message: `You were added to ${group.name}`,
    relatedId: group._id,
    relatedModel: "Group",
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

export async function removeGroupMember(groupId: string, userId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await connectDB();
  const group = await Group.findById(groupId);
  if (!group) return { error: "Group not found" };

  const isAdmin = group.members.some(
    (m) => m.userId.toString() === session.user.id && m.role === "admin"
  );
  const isSelf = userId === session.user.id;

  if (!isAdmin && !isSelf) return { error: "Not authorized" };

  group.members = group.members.filter(
    (m) => m.userId.toString() !== userId
  );
  await group.save();

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}
