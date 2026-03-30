import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addPoints, deductPoints } from "@/lib/point-db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, amount, description } = body;

    if (!type || !amount || !description) {
      return NextResponse.json(
        { error: "type, amount, description은 필수입니다" },
        { status: 400 }
      );
    }

    if (type === "admin_add") {
      const result = await addPoints({
        customerId: params.id,
        type: "admin_add",
        amount: Math.abs(amount),
        description,
      });
      return NextResponse.json({ transaction: result });
    } else if (type === "admin_deduct") {
      const result = await deductPoints({
        customerId: params.id,
        type: "admin_deduct",
        amount: Math.abs(amount),
        description,
      });
      return NextResponse.json({ transaction: result });
    } else {
      return NextResponse.json({ error: "유효하지 않은 type" }, { status: 400 });
    }
  } catch (error) {
    console.error("포인트 조정 에러:", error);
    const message = error instanceof Error ? error.message : "포인트 조정 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
