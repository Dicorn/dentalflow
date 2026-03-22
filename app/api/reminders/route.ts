import { NextRequest, NextResponse } from "next/server";
import { triggerReminders } from "@/lib/actions/reminders";

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await triggerReminders();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Reminders cron error:", error);
    return NextResponse.json({ error: "Error al procesar recordatorios" }, { status: 500 });
  }
}
