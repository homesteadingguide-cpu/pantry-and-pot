import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/session";

export async function GET() {
  const { user } = await getSessionInfo();
  const where = user ? { userId: user.id } : { userId: null };
  const items = await db.shoppingItem.findMany({
    where,
    orderBy: [{ gotAt: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(items);
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
      userId: user.id,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
