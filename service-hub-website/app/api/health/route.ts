import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ 
    status: "ok", 
    timestamp: new Date().toISOString() 
  });
}

export const dynamic = "force-static";
export const runtime = "nodejs";