import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const items = await db.pantryItem.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, category, quantity, unit, lowStockAt, location, notes } = body;
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const item = await db.pantryItem.create({
    data: {
      name: name.trim(),
      category: category || "dry",
      quantity: Number(quantity) ?? 1,
      unit: unit || "jar",
      lowStockAt: lowStockAt == null ? null : Number(lowStockAt),
      location: location?.trim() || null,
      notes: notes?.trim() || null,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
