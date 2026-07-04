import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/session";

async function ownsTask(id: string, userId: string | null) {
  const task = await db.task.findUnique({ where: { id } });
  if (!task) return false;
  // If signed in, must own it. If demo (null user), must be demo data.
  return task.userId === userId;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { user, canMutate } = await getSessionInfo();
  if (!user || !canMutate) {
    return NextResponse.json(
      { error: "Sign in to make changes." },
      { status: 401 },
    );
  }
  if (!(await ownsTask(id, user.id))) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const body = await req.json();
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
  const { user, canMutate } = await getSessionInfo();
  if (!user || !canMutate) {
    return NextResponse.json(
      { error: "Sign in to make changes." },
      { status: 401 },
    );
  }
  if (!(await ownsTask(id, user.id))) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await db.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
