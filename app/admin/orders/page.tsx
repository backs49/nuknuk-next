"use client";
import OrderTable from "@/components/admin/OrderTable";

export default function AdminOrdersPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-charcoal-400">주문 관리</h1>
        <a href="/admin/orders/new" className="btn-primary text-sm px-4 py-2">
          + 주문 등록
        </a>
      </div>
      <OrderTable />
    </div>
  );
}
