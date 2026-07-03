import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  // Items not yet got come first, then recently-got (most recent first).
  const items = await db.shoppingItem.findMany({
    orderBy: [{ gotAt: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, quantity, unit, notes, pantryItemId } = body;
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const item = await db.shoppingItem.create({
    data: {
      name: name.trim(),
      quantity: Number(quantity) ?? 1,
      unit: unit || "pack",
      notes: notes?.trim() || null,
      pantryItemId: pantryItemId || null,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
