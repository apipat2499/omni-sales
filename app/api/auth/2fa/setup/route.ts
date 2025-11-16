import { NextRequest, NextResponse } from "next/server";
import { generateTwoFactorSecret } from "@/lib/services/two-factor-auth";
import { withRateLimit, rateLimitPresets } from "@/lib/middleware/rateLimit";

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userEmail } = body;

    if (!userEmail) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const result = await generateTwoFactorSecret(userEmail);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Generate 2FA error:", error);
    return NextResponse.json(
      { error: "Failed to generate 2FA setup" },
      { status: 500 }
    );
  }
}

// Apply strict rate limiting to auth route
export const POST = withRateLimit(rateLimitPresets.auth, handlePOST);
