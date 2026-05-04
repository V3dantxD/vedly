import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Settlement, Notification, Activity } from "@/models/Settlement";
import User from "@/models/User";
import { sendSettlementEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { toUserId, amount, paymentMethod, note, groupId } = body;

  await connectDB();

  const settlement = await Settlement.create({
    fromUserId: session.user.id,
    toUserId,
    amount,
    currency: "INR",
    paymentMethod: paymentMethod ?? "Cash",
    note,
    groupId,
  });

  const [fromUser, toUser] = await Promise.all([
    User.findById(session.user.id),
    User.findById(toUserId),
  ]);

  await Notification.create({
    userId: toUserId,
    type: "settlement_received",
    message: `${fromUser?.name} paid you ₹${amount.toFixed(2)}`,
    relatedId: settlement._id,
    relatedModel: "Settlement",
  });

  if (toUser?.notificationPrefs?.email) {
    try {
      await sendSettlementEmail({
        to: toUser.email,
        name: toUser.name,
        fromName: fromUser?.name ?? "Someone",
        amount,
      });
    } catch {}
  }

  await Activity.create({
    actorId: session.user.id,
    action: "settled_up",
    entityType: "Settlement",
    entityId: settlement._id,
    groupId,
    metadata: { toUserId, amount, toUserName: toUser?.name },
  });

  revalidatePath("/dashboard");
  revalidatePath("/activity");

  return NextResponse.json({ settlement }, { status: 201 });
}
