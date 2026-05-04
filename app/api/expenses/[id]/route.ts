import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Expense from "@/models/Expense";
import { revalidatePath } from "next/cache";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const expense = await Expense.findById(id)
    .populate("paidBy.userId splits.userId createdBy", "name email image");

  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ expense });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  await connectDB();
  const expense = await Expense.findById(id);
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (expense.createdBy.toString() !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allowed = ["description", "amount", "category", "paidBy", "splits", "date", "notes"];
  for (const key of allowed) {
    if (body[key] !== undefined) (expense as Record<string, unknown>)[key] = body[key];
  }
  await expense.save();

  revalidatePath("/dashboard");
  revalidatePath("/expenses");

  return NextResponse.json({ expense });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const expense = await Expense.findById(id);
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (expense.createdBy.toString() !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await expense.deleteOne();
  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  revalidatePath("/activity");

  return NextResponse.json({ success: true });
}
