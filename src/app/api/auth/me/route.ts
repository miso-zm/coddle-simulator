import { NextResponse } from "next/server";
import { getCurrentUser } from "@/storage/database/auth";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({
    success: true,
    data: user,
  });
}
