import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDetailBlocks, saveDetailBlocks } from "@/lib/menu-option-db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const blocks = await getDetailBlocks(params.id);
  return NextResponse.json({ blocks });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { blocks } = await req.json();
  await saveDetailBlocks(params.id, blocks);
  return NextResponse.json({ success: true });
}
