import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json({ ok: true, received: body }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Invalid JSON" },
      { status: 400 }
    );
  }
}

export function GET() {
  return NextResponse.json({ ok: true, method: "GET" }, { status: 200 });
}
