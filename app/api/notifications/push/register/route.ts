import { NextRequest, NextResponse } from "next/server";
import { registerDeviceToken } from "@/lib/services/push-notifications";
import { supabase } from "@/lib/supabase/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, platform, userId } = body;

    if (!token || !platform || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await registerDeviceToken(userId, token, platform, supabase);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Register device error:", error);
    return NextResponse.json(
      { error: "Failed to register device" },
      { status: 500 }
    );
  }
}
