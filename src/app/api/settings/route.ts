import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const DEFAULT_LOCATION = {
  label: "Auckland",
  lat: -36.8485,
  lon: 174.7633,
};

export async function GET() {
  const row = await db.setting.findUnique({ where: { key: "location" } });
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
  const setting = await db.setting.upsert({
    where: { key: "location" },
    create: { key: "location", value },
    update: { value },
  });
  return NextResponse.json(JSON.parse(setting.value));
}
