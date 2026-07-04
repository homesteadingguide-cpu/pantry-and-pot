import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/session";

export async function GET() {
  const { user } = await getSessionInfo();
  const where = user ? { userId: user.id } : { userId: null };
  const plantings = await db.planting.findMany({
    where,
    orderBy: [{ status: "asc" }, { datePlanted: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(plantings);
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
  const { crop, variety, spot, status, datePlanted, expectedHarvest, quantity, notes } = body;
  if (!crop || typeof crop !== "string") {
    return NextResponse.json({ error: "crop is required" }, { status: 400 });
  }
  const planting = await db.planting.create({
    data: {
      crop: crop.trim(),
      variety: variety?.trim() || null,
      spot: spot?.trim() || null,
      status: status || "planned",
      quantity: Number(quantity) || 1,
      notes: notes?.trim() || null,
      datePlanted: datePlanted ? new Date(datePlanted) : null,
      expectedHarvest: expectedHarvest ? new Date(expectedHarvest) : null,
      userId: user.id,
    },
  });
  return NextResponse.json(planting, { status: 201 });
}
