import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const existing = await db.batch.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const patch: Record<string, unknown> = {};
  if (typeof body.type === "string") patch.type = body.type;
  if (typeof body.name === "string") patch.name = body.name.trim();
  if (typeof body.status === "string") patch.status = body.status;
  if (body.notes !== undefined) patch.notes = body.notes?.trim() || null;
  if (body.startDate !== undefined) {
    patch.startDate = body.startDate ? new Date(body.startDate) : null;
  }
  if (body.expectedEnd !== undefined) {
    patch.expectedEnd = body.expectedEnd ? new Date(body.expectedEnd) : null;
  }
  if (body.actualEnd !== undefined) {
    patch.actualEnd = body.actualEnd ? new Date(body.actualEnd) : null;
  }
  // "Mark as fed" — refresh startDate to now for an active culture.
  if (body.markFed === true) {
    patch.startDate = new Date();
  }
  // If moving to "consumed" or "discarded", set actualEnd automatically.
  if (
    (body.status === "consumed" || body.status === "discarded") &&
    !existing.actualEnd
  ) {
    patch.actualEnd = new Date();
  }
  const updated = await db.batch.update({ where: { id }, data: patch });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.batch.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
