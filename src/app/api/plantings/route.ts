import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const plantings = await db.planting.findMany({
    orderBy: [{ status: "asc" }, { datePlanted: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(plantings);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { crop, variety, bed, status, datePlanted, expectedHarvest, quantity, notes } = body;
  if (!crop || typeof crop !== "string") {
    return NextResponse.json({ error: "crop is required" }, { status: 400 });
  }
  const planting = await db.planting.create({
    data: {
      crop: crop.trim(),
      variety: variety?.trim() || null,
      bed: bed?.trim() || null,
      status: status || "planned",
      quantity: Number(quantity) || 1,
      notes: notes?.trim() || null,
      datePlanted: datePlanted ? new Date(datePlanted) : null,
      expectedHarvest: expectedHarvest ? new Date(expectedHarvest) : null,
    },
  });
  return NextResponse.json(planting, { status: 201 });
}
