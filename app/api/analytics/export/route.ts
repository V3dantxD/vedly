import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Expense from "@/models/Expense";
import Group from "@/models/Group";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const expenses = await Expense.find({
    $or: [{ "splits.userId": session.user.id }, { "paidBy.userId": session.user.id }],
  })
    .populate("paidBy.userId splits.userId createdBy", "name email")
    .populate("groupId", "name")
    .sort({ date: -1 });

  const rows = [
    "date,description,category,amount,your_share,group,paid_by",
  ];

  for (const exp of expenses) {
    const userSplit = exp.splits.find((s) => s.userId?._id?.toString() === session.user.id || s.userId?.toString() === session.user.id);
    const paidByNames = exp.paidBy.map((p) => (p.userId as unknown as { name: string }).name).join("; ");
    const groupName = (exp.groupId as unknown as { name: string } | null)?.name ?? "";
    const date = exp.date.toISOString().split("T")[0];

    rows.push(
      [
        date,
        `"${exp.description.replace(/"/g, '""')}"`,
        exp.category,
        exp.amount.toFixed(2),
        (userSplit?.amount ?? 0).toFixed(2),
        `"${groupName}"`,
        `"${paidByNames}"`,
      ].join(",")
    );
  }

  const csv = rows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="vedly-expenses-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
