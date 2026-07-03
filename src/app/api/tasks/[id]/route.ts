import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const existing = await db.task.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const patch: Record<string, unknown> = {};
  if (typeof body.completed === "boolean") {
    patch.completed = body.completed;
    patch.completedAt = body.completed ? new Date() : null;
  }
  if (typeof body.title === "string") patch.title = body.title.trim();
  if (body.notes !== undefined) patch.notes = body.notes?.trim() || null;
  if (typeof body.category === "string") patch.category = body.category;
  if (typeof body.recurrence === "string") patch.recurrence = body.recurrence;
  if (typeof body.priority === "string") patch.priority = body.priority;
  if (body.dueDate !== undefined) {
    patch.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  }
  const updated = await db.task.update({ where: { id }, data: patch });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
