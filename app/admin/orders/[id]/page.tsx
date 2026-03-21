"use client";
import { useParams } from "next/navigation";
import OrderDetail from "@/components/admin/OrderDetail";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  return <OrderDetail orderId={id} />;
}
