"use client";
import OrderCreateForm from "@/components/admin/OrderCreateForm";

export default function AdminOrderNewPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal-400 mb-6">주문 등록</h1>
      <OrderCreateForm />
    </div>
  );
}
