"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Settlement, Notification, Activity } from "@/models/Settlement";
import User from "@/models/User";
import { revalidatePath } from "next/cache";
import { SettlementSchema } from "@/lib/validations";
import { sendSettlementEmail } from "@/lib/email";

export async function recordSettlement(data: {
  toUserId: string;
  amount: number;
  paymentMethod: "Cash" | "UPI" | "Bank Transfer" | "PayPal" | "Other";
  note?: string;
  groupId?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const parsed = SettlementSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  await connectDB();

  const settlement = await Settlement.create({
    fromUserId: session.user.id,
    toUserId: data.toUserId,
    amount: data.amount,
    currency: "INR",
    paymentMethod: data.paymentMethod ?? "Cash",
    note: data.note,
    groupId: data.groupId,
  });

  const [fromUser, toUser] = await Promise.all([
    User.findById(session.user.id),
    User.findById(data.toUserId),
  ]);

  await Notification.create({
    userId: data.toUserId,
    type: "settlement_received",
    message: `${fromUser?.name} paid you ₹${data.amount.toFixed(2)}`,
    relatedId: settlement._id,
    relatedModel: "Settlement",
  });

  if (toUser?.notificationPrefs?.email) {
    try {
      await sendSettlementEmail({
        to: toUser.email,
        name: toUser.name,
        fromName: fromUser?.name ?? "Someone",
        amount: data.amount,
      });
    } catch (err) {
      console.error("Settlement email failed:", err);
    }
  }

  await Activity.create({
    actorId: session.user.id,
    action: "settled_up",
    entityType: "Settlement",
    entityId: settlement._id,
    groupId: data.groupId,
    metadata: { toUserId: data.toUserId, amount: data.amount, toUserName: toUser?.name },
  });

  revalidatePath("/dashboard");
  revalidatePath("/friends");
  revalidatePath("/activity");
  if (data.groupId) revalidatePath(`/groups/${data.groupId}`);

  return { success: true, settlementId: settlement._id.toString() };
}
