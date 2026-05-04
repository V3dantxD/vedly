"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models/Settlement";
import { revalidatePath } from "next/cache";

export async function markNotificationRead(notificationId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await connectDB();
  await Notification.findOneAndUpdate(
    { _id: notificationId, userId: session.user.id },
    { read: true }
  );

  revalidatePath("/");
  return { success: true };
}

export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await connectDB();
  await Notification.updateMany(
    { userId: session.user.id, read: false },
    { read: true }
  );

  revalidatePath("/");
  return { success: true };
}

export async function getUnreadCount(): Promise<number> {
  const session = await auth();
  if (!session) return 0;

  await connectDB();
  return Notification.countDocuments({ userId: session.user.id, read: false });
}
