import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const day = (offset: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
};

export async function POST() {
  // Wipe demo tables clean before seeding.
  await db.task.deleteMany();
  await db.planting.deleteMany();
  await db.batch.deleteMany();
  await db.pantryItem.deleteMany();

  const tasks = [
    // Kitchen routines
    { title: "Feed sourdough starter ‘Bubbles’", category: "kitchen", recurrence: "daily", dueDate: day(0), priority: "high", notes: "1:1:1 ratio — 20g starter, 20g flour, 20g water." },
    { title: "Bottle kombucha 2F (raspberry-ginger)", category: "brewing", recurrence: "none", dueDate: day(0), priority: "high", notes: "Burp the swing-tops at 36h to avoid geyers." },
    { title: "Mix overnight poolish for tomorrow’s loaf", category: "kitchen", recurrence: "daily", dueDate: day(0), priority: "normal" },
    { title: "Stretch-and-fold the dough at 9pm", category: "kitchen", recurrence: "none", dueDate: day(0), priority: "normal" },
    // Balcony
    { title: "Water the balcony tomatoes", category: "balcony", recurrence: "daily", dueDate: day(0), priority: "high", notes: "Top-water, avoid splashing leaves — they mildew easily." },
    { title: "Mist the microgreens tray", category: "balcony", recurrence: "daily", dueDate: day(0), priority: "normal" },
    { title: "Rotate the sprout jar to drain", category: "balcony", recurrence: "daily", dueDate: day(0), priority: "normal" },
    { title: "Top up the herb planter — basil is bolting", category: "balcony", recurrence: "weekly", dueDate: day(1), priority: "low" },
    // Pantry
    { title: "Check sauerkraut — should be day 14", category: "pantry", recurrence: "none", dueDate: day(0), priority: "high", notes: "Tangy, no longer fizzing — move to fridge." },
    { title: "Order more bread flour — down to one bag", category: "pantry", recurrence: "none", dueDate: day(2), priority: "normal" },
    { title: "Label the kimchi jar with the start date", category: "pantry", recurrence: "none", dueDate: day(0), priority: "low" },
    // Brewing
    { title: "Start a new jun batch from the SCOBY hotel", category: "brewing", recurrence: "weekly", dueDate: day(1), priority: "normal" },
    { title: "Feed the milk kefir grains", category: "brewing", recurrence: "daily", dueDate: day(0), priority: "normal", notes: "1 cup milk per tablespoon of grains." },
    { title: "Decant the apple scrap vinegar", category: "brewing", recurrence: "none", dueDate: day(3), priority: "low" },
  ];

  const plantings = [
    { crop: "Cherry Tomato", variety: "Tiny Tim (determinate)", spot: "Balcony railing pot", status: "growing", datePlanted: day(-48), expectedHarvest: day(10), quantity: 2, notes: "Staked to the railing with twine. Self-pollinating but give a shake on still days." },
    { crop: "Basil", variety: "Genovese", spot: "Kitchen windowsill", status: "growing", datePlanted: day(-21), expectedHarvest: day(5), quantity: 1 },
    { crop: "Microgreens", variety: "Radish ‘China Rose’", spot: "Grow shelf, tray #2", status: "growing", datePlanted: day(-7), expectedHarvest: day(3), quantity: 1, notes: "Bottom-water only after day 3." },
    { crop: "Sprouts", variety: "Mung bean", spot: "Mason jar, counter", status: "growing", datePlanted: day(-3), expectedHarvest: day(2), quantity: 1 },
    { crop: "Scallions", variety: "Evergreen Bunching", spot: "Kitchen windowsill jar", status: "growing", datePlanted: day(-30), expectedHarvest: day(0), quantity: 1, notes: "Regrown from grocery-store scraps in water." },
    { crop: "Chili", variety: "Cayenne", spot: "Balcony corner pot", status: "harvest-ready", datePlanted: day(-90), expectedHarvest: day(-2), quantity: 1 },
    { crop: "Lettuce", variety: "Salad Bowl (cut-and-come-again)", spot: "Window box", status: "growing", datePlanted: day(-18), expectedHarvest: day(7), quantity: 1 },
    { crop: "Mint", variety: "Spearmint", spot: "Balcony floor pot", status: "growing", datePlanted: day(-60), expectedHarvest: day(0), quantity: 1, notes: "Keep in its own pot — it’ll take over." },
    { crop: "Microgreens", variety: "Broccoli", spot: "Grow shelf, tray #1", status: "harvested", datePlanted: day(-14), actualHarvest: day(-1), quantity: 1, notes: "Cut above the soil line with scissors." },
    { crop: "Microgreens", variety: "Sunflower", spot: "Grow shelf, tray #3", status: "planned", expectedHarvest: day(10), quantity: 1, notes: "Soak seeds 8h before sowing." },
  ];

  const batches = [
    { type: "sourdough", name: "Bubbles — the starter", status: "active", startDate: day(-420), notes: "Fed twice daily at room temp, or weekly from the fridge." },
    { type: "kombucha", name: "Raspberry-ginger 2F", status: "fermenting", startDate: day(-2), expectedEnd: day(1), notes: "Swing-top bottle at room temp. Burp daily." },
    { type: "kombucha", name: "SCOBY hotel", status: "active", startDate: day(-200), notes: "Back-up cultures in sweet tea. Top up every 4 weeks." },
    { type: "kraut", name: "Green cabbage & caraway", status: "fermenting", startDate: day(-14), expectedEnd: day(0), notes: "2% salt by weight. Burp daily." },
    { type: "kimchi", name: "Napa & daikon batch", status: "fermenting", startDate: day(-3), expectedEnd: day(7), notes: "Counter for 3 days, then fridge." },
    { type: "kefir", name: "Milk kefir grains", status: "active", startDate: day(-90), notes: "Daily feed — 1 tbsp grains per cup milk." },
    { type: "vinegar", name: "Apple scrap vinegar", status: "fermenting", startDate: day(-30), expectedEnd: day(3), notes: "Stir daily until mother forms, then cover with cloth." },
    { type: "sourdough", name: "Poolish for tomorrow’s loaf", status: "active", startDate: day(0), expectedEnd: day(1), notes: "100g flour, 100g water, pinch of starter." },
    { type: "kombucha", name: "Original SCOBY batch (1F)", status: "ready", startDate: day(-21), expectedEnd: day(-1), notes: "Moved to fridge — drink within 2 weeks." },
  ];

  const pantry = [
    { name: "Bread flour", category: "dry", quantity: 1, unit: "bag", lowStockAt: 1, location: "Top shelf", notes: "12.5kg strong white. Supplier delivers Thursday." },
    { name: "Whole rye flour", category: "dry", quantity: 2, unit: "bag", lowStockAt: 1, location: "Top shelf" },
    { name: "Sea salt", category: "supply", quantity: 800, unit: "g", lowStockAt: 200, location: "Spice drawer" },
    { name: "Sauerkraut — green cabbage", category: "ferment", quantity: 2, unit: "jar", location: "Fridge door", notes: "Eat within 6 months." },
    { name: "Kimchi — napa & daikon", category: "ferment", quantity: 1, unit: "jar", location: "Fridge door" },
    { name: "Pickled radish", category: "preserve", quantity: 3, unit: "jar", location: "Pantry shelf, left" },
    { name: "Strawberry jam (no-pectin)", category: "preserve", quantity: 4, unit: "jar", location: "Pantry shelf, right" },
    { name: "Sourdough starter backup (dehydrated)", category: "supply", quantity: 2, unit: "pack", location: "Drawer", notes: "Insurance policy." },
    { name: "Loose-leaf black tea", category: "supply", quantity: 250, unit: "g", lowStockAt: 100, location: "Spice drawer", notes: "For kombucha 1F." },
    { name: "Cane sugar", category: "supply", quantity: 1.5, unit: "kg", lowStockAt: 0.5, location: "Top shelf" },
    { name: "Bottled kombucha — original", category: "ferment", quantity: 4, unit: "bottle", lowStockAt: 2, location: "Fridge" },
    { name: "Sourdough crackers", category: "dry", quantity: 1, unit: "pack", lowStockAt: 1, location: "Pantry shelf, top", notes: "Made from discard — 200°C for 18 min." },
    { name: "Dried oregano", category: "spice", quantity: 50, unit: "g", location: "Spice drawer" },
    { name: "Dried chili flakes", category: "spice", quantity: 80, unit: "g", location: "Spice drawer", notes: "From last year’s balcony cayenne." },
    { name: "Bay leaves", category: "spice", quantity: 30, unit: "g", location: "Spice drawer" },
    { name: "Black peppercorns", category: "spice", quantity: 1, unit: "jar", lowStockAt: 0.25, location: "Spice drawer" },
  ];

  for (const t of tasks) {
    await db.task.create({ data: t });
  }
  for (const p of plantings) {
    await db.planting.create({ data: p });
  }
  for (const b of batches) {
    await db.batch.create({ data: b });
  }
  for (const p of pantry) {
    await db.pantryItem.create({ data: p });
  }

  return NextResponse.json({
    ok: true,
    seeded: {
      tasks: tasks.length,
      plantings: plantings.length,
      batches: batches.length,
      pantry: pantry.length,
    },
  });
}
