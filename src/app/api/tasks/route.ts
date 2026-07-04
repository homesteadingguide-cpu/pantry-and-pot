import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/session";

export async function GET() {
  const { user } = await getSessionInfo();
  // Unsigned visitors see demo data (userId = null).
  // Signed-in users see only their own data.
  const where = user ? { userId: user.id } : { userId: null };
  const tasks = await db.task.findMany({
    where,
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const { user, canMutate } = await getSessionInfo();
  if (!user || !canMutate) {
    return NextResponse.json(
      { error: "Sign in to make changes." },
      { status: 401 },
    );
  }
  const body = await req.json();
  const { title, notes, category, recurrence, dueDate, priority } = body;
  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  const task = await db.task.create({
    data: {
      title: title.trim(),
      notes: notes?.trim() || null,
      category: category || "general",
      recurrence: recurrence || "none",
      priority: priority || "normal",
      dueDate: dueDate ? new Date(dueDate) : null,
      userId: user.id,
    },
  });
  return NextResponse.json(task, { status: 201 });
}
