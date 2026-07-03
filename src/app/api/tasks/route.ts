import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const tasks = await db.task.findMany({
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, notes, category, recurrence, dueDate, priority } = body;
  if (!title || typeof title !== "string") {
    return NextResponse.json(
      { error: "title is required" },
      { status: 400 },
    );
  }
  const task = await db.task.create({
    data: {
      title: title.trim(),
      notes: notes?.trim() || null,
      category: category || "general",
      recurrence: recurrence || "none",
      priority: priority || "normal",
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });
  return NextResponse.json(task, { status: 201 });
}
