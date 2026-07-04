import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/session";

export async function GET() {
  const { user } = await getSessionInfo();
  const where = user ? { userId: user.id } : { userId: null };
  const batches = await db.batch.findMany({
    where,
    orderBy: [{ status: "asc" }, { startDate: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(batches);
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
  const { type, name, status, startDate, expectedEnd, notes } = body;
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const batch = await db.batch.create({
    data: {
      type: type || "other",
      name: name.trim(),
      status: status || "active",
      notes: notes?.trim() || null,
      startDate: startDate ? new Date(startDate) : null,
      expectedEnd: expectedEnd ? new Date(expectedEnd) : null,
      userId: user.id,
    },
  });
  return NextResponse.json(batch, { status: 201 });
}
