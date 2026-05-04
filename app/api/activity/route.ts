import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Activity } from "@/models/Settlement";
import User from "@/models/User";
import Group from "@/models/Group";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const filter = searchParams.get("filter") ?? "all"; // all, friends, groups, settlements
  const limit = 20;

  // Get user's friends and groups for filtering
  const user = await User.findById(session.user.id);
  const friendIds = user?.friends.map((f) => f.toString()) ?? [];

  const groups = await Group.find({ "members.userId": session.user.id }, "_id");
  const groupIds = groups.map((g) => g._id.toString());

  let query: Record<string, unknown> = {
    $or: [
      { actorId: session.user.id },
      { actorId: { $in: friendIds } },
      { groupId: { $in: groupIds } },
    ],
  };

  if (filter === "friends") query = { actorId: { $in: [...friendIds, session.user.id] } };
  if (filter === "groups") query = { groupId: { $in: groupIds } };
  if (filter === "settlements") query = { action: "settled_up", actorId: { $in: [...friendIds, session.user.id] } };

  if (cursor) {
    query = { ...query, _id: { $lt: cursor } };
  }

  const activities = await Activity.find(query)
    .populate("actorId", "name email image")
    .sort({ createdAt: -1 })
    .limit(limit + 1);

  const hasMore = activities.length > limit;
  const items = activities.slice(0, limit);
  const nextCursor = hasMore ? items[items.length - 1]._id.toString() : null;

  return NextResponse.json({ activities: items, nextCursor });
}
