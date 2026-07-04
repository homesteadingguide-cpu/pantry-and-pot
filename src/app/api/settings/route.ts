import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/session";

const DEFAULT_LOCATION = {
  label: "Auckland",
  lat: -36.8485,
  lon: 174.7633,
};

export async function GET() {
  const { user } = await getSessionInfo();
  // Demo (null) users share a default location; signed-in users have their own setting.
  const row = user
    ? await db.setting.findUnique({ where: { key: "location" } })
    : null;
  // Note: for demo mode we always return the default — demo users can't save settings.
  if (!row) {
    return NextResponse.json(DEFAULT_LOCATION);
  }
  try {
    return NextResponse.json(JSON.parse(row.value));
  } catch {
    return NextResponse.json(DEFAULT_LOCATION);
  }
}

export async function PUT(req: NextRequest) {
  const { user, canMutate } = await getSessionInfo();
  if (!user || !canMutate) {
    return NextResponse.json(
      { error: "Sign in to make changes." },
      { status: 401 },
    );
  }
  const body = await req.json();
  const { label, lat, lon } = body;
  if (
    typeof label !== "string" ||
    typeof lat !== "number" ||
    typeof lon !== "number"
  ) {
    return NextResponse.json(
      { error: "label (string), lat (number), lon (number) required" },
      { status: 400 },
    );
  }
  const value = JSON.stringify({ label: label.trim(), lat, lon });
  // Upsert by composite key+userId — for SQLite we use the key alone and update value.
  const existing = await db.setting.findUnique({ where: { key: "location" } });
  if (existing && existing.userId === user.id) {
    const updated = await db.setting.update({
      where: { key: "location" },
      data: { value },
    });
    return NextResponse.json(JSON.parse(updated.value));
  }
  const created = await db.setting.create({
    data: { key: `location`, value, userId: user.id },
  });
  return NextResponse.json(JSON.parse(created.value));
}
