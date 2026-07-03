import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const batches = await db.batch.findMany({
    orderBy: [
      { status: "asc" },
      { startDate: "desc" },
      { createdAt: "desc" },
    ],
  });
  return NextResponse.json(batches);
}

export async function POST(req: NextRequest) {
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
    },
  });
  return NextResponse.json(batch, { status: 201 });
}
