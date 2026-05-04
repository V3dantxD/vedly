import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Expense from "@/models/Expense";
import User from "@/models/User";
import { Notification, Activity } from "@/models/Settlement";
import { revalidatePath } from "next/cache";
import { sendExpenseAddedEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const skip = parseInt(searchParams.get("skip") ?? "0");

  const query: Record<string, unknown> = groupId
    ? { groupId }
    : {
        $or: [
          { "paidBy.userId": session.user.id },
          { "splits.userId": session.user.id },
        ],
      };

  const [expenses, total] = await Promise.all([
    Expense.find(query)
      .populate("paidBy.userId splits.userId createdBy", "name email image")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit),
    Expense.countDocuments(query),
  ]);

  return NextResponse.json({ expenses, total });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  await connectDB();

  const expense = await Expense.create({
    ...body,
    currency: "INR",
    createdBy: session.user.id,
  });

  const populated = await Expense.findById(expense._id)
    .populate("paidBy.userId splits.userId createdBy", "name email image");

  // Notifications + emails
  const creatorUser = await User.findById(session.user.id);
  const splitUserIds = body.splits
    .map((s: { userId: string }) => s.userId)
    .filter((id: string) => id !== session.user.id);

  await Promise.all(
    splitUserIds.map(async (userId: string) => {
      const splitUser = await User.findById(userId);
      if (!splitUser) return;

      const userSplit = body.splits.find((s: { userId: string; amount: number }) => s.userId === userId);

      await Notification.create({
        userId,
        type: "expense_added",
        message: `${creatorUser?.name} added "${body.description}" — your share: ₹${userSplit?.amount?.toFixed(2)}`,
        relatedId: expense._id,
        relatedModel: "Expense",
      });

      if (splitUser.notificationPrefs?.email) {
        try {
          await sendExpenseAddedEmail({
            to: splitUser.email,
            name: splitUser.name,
            addedBy: creatorUser?.name ?? "Someone",
            description: body.description,
            amount: body.amount,
            yourShare: userSplit?.amount ?? 0,
          });
        } catch {}
      }
    })
  );

  await Activity.create({
    actorId: session.user.id,
    action: "added_expense",
    entityType: "Expense",
    entityId: expense._id,
    groupId: body.groupId,
    metadata: { description: body.description, amount: body.amount },
  });

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  revalidatePath("/activity");

  return NextResponse.json({ expense: populated }, { status: 201 });
}
