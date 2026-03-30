import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMenuImages, saveMenuImages } from "@/lib/menu-option-db";
import { uploadMenuImage } from "@/lib/menu-db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const images = await getMenuImages(params.id);
  return NextResponse.json({ images });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { images } = await req.json();
  await saveMenuImages(params.id, images);
  return NextResponse.json({ success: true });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "파일이 없습니다" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadMenuImage(buffer, file.name);
  return NextResponse.json({ url });
}
