import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { copyOptionsFromMenu } from "@/lib/menu-option-db";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { sourceMenuId } = await req.json();
  if (!sourceMenuId) {
    return NextResponse.json({ error: "복사할 메뉴를 선택해주세요" }, { status: 400 });
  }

  await copyOptionsFromMenu(sourceMenuId, params.id);
  return NextResponse.json({ success: true });
}
