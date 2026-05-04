import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models/Settlement";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const notifications = await Notification.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(30);

  const unreadCount = await Notification.countDocuments({ userId: session.user.id, read: false });

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  await connectDB();

  if (body.markAllRead) {
    await Notification.updateMany({ userId: session.user.id, read: false }, { read: true });
  } else if (body.id) {
    await Notification.findOneAndUpdate(
      { _id: body.id, userId: session.user.id },
      { read: true }
    );
  }

  return NextResponse.json({ success: true });
}
