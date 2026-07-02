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

  const tasks = [
    { title: "Collect eggs from the coop", category: "animals", recurrence: "daily", dueDate: day(0), priority: "high" },
    { title: "Water greenhouse seedlings", category: "garden", recurrence: "daily", dueDate: day(0), priority: "high" },
    { title: "Check fence line near the orchard", category: "maintenance", recurrence: "weekly", dueDate: day(0), priority: "normal" },
    { title: "Turn the compost pile", category: "garden", recurrence: "weekly", dueDate: day(1), priority: "normal" },
    { title: "Refill chicken waterer", category: "animals", recurrence: "daily", dueDate: day(0), priority: "normal" },
    { title: "Harvest cherry tomatoes", category: "harvest", recurrence: "daily", dueDate: day(0), priority: "high" },
    { title: "Order more layer feed", category: "general", recurrence: "none", dueDate: day(2), priority: "normal", notes: "Down to one bag — supplier runs delivery on Thursdays." },
    { title: "Prune the heritage apple trees", category: "garden", recurrence: "yearly", dueDate: day(7), priority: "low" },
    { title: "Inspect beehive #2 for queen cells", category: "animals", recurrence: "weekly", dueDate: day(3), priority: "normal" },
    { title: "Stack firewood under the lean-to", category: "maintenance", recurrence: "none", dueDate: day(4), priority: "low" },
  ];

  const plantings = [
    { crop: "Tomato", variety: "San Marzano", bed: "Bed 3", status: "growing", datePlanted: day(-42), expectedHarvest: day(14), quantity: 12 },
    { crop: "Tomato", variety: "Sungold (cherry)", bed: "Bed 3", status: "harvest-ready", datePlanted: day(-58), expectedHarvest: day(-3), quantity: 8 },
    { crop: "Lettuce", variety: "Buttercrunch", bed: "Bed 1", status: "growing", datePlanted: day(-21), expectedHarvest: day(7), quantity: 24 },
    { crop: "Garlic", variety: "Music", bed: "Bed 5", status: "growing", datePlanted: day(-180), expectedHarvest: day(40), quantity: 60 },
    { crop: "Winter Squash", variety: "Butternut", bed: "Bed 6", status: "growing", datePlanted: day(-50), expectedHarvest: day(60), quantity: 10 },
    { crop: "Basil", variety: "Genovese", bed: "Greenhouse", status: "growing", datePlanted: day(-18), expectedHarvest: day(10), quantity: 16 },
    { crop: "Radish", variety: "French Breakfast", bed: "Bed 2", status: "harvest-ready", datePlanted: day(-28), expectedHarvest: day(-2), quantity: 40 },
    { crop: "Carrot", variety: "Nantes", bed: "Bed 2", status: "growing", datePlanted: day(-30), expectedHarvest: day(30), quantity: 80 },
    { crop: "Garlic", variety: "Chesnok Red", bed: "Bed 5", status: "harvested", datePlanted: day(-220), actualHarvest: day(-15), quantity: 48, notes: "Cured for two weeks in the barn loft." },
    { crop: "Peas", variety: "Sugar Snap", bed: "Bed 4", status: "seeded", datePlanted: day(-6), expectedHarvest: day(48), quantity: 30 },
    { crop: "Kale", variety: "Lacinato", bed: "Bed 1", status: "planned", expectedHarvest: day(75), quantity: 18, notes: "Direct-sow once soil hits 10°C." },
  ];

  for (const t of tasks) {
    await db.task.create({ data: t });
  }
  for (const p of plantings) {
    await db.planting.create({ data: p });
  }

  return NextResponse.json({
    ok: true,
    seeded: { tasks: tasks.length, plantings: plantings.length },
  });
}
