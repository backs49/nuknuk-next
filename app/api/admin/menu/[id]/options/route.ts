import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMenuOptions, saveMenuOptions } from "@/lib/menu-option-db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const options = await getMenuOptions(params.id);
  return NextResponse.json({ options });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { groups } = await req.json();
  await saveMenuOptions(params.id, groups);
  return NextResponse.json({ success: true });
}
