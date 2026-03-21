// data/order.ts

export type OrderStatus = "pending" | "paid" | "confirmed" | "completed" | "cancelled" | "refunded";
export type OrderChannel = "direct" | "link";
export type DeliveryMethod = "pickup" | "shipping";

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  channel: OrderChannel;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerMemo: string | null;
  adminMemo: string | null;
  deliveryMethod: DeliveryMethod;
  deliveryAddress: string | null;
  pickupDate: string | null;
  totalAmount: number;
  shippingFee: number;
  paymentKey: string | null;
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

// DB 스네이크 케이스 타입
export interface DbOrder {
  id: string;
  order_number: string;
  channel: OrderChannel;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_memo: string | null;
  admin_memo: string | null;
  delivery_method: DeliveryMethod;
  delivery_address: string | null;
  pickup_date: string | null;
  total_amount: number;
  shipping_fee: number;
  payment_key: string | null;
  payment_method: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

// 주문 생성 입력 타입
export interface CreateOrderInput {
  channel: OrderChannel;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerMemo?: string;
  adminMemo?: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string;
  pickupDate?: string;
  shippingFee?: number;
  items: {
    menuItemId?: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }[];
}

// 상태 라벨/색상 매핑
export const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: "대기", color: "bg-yellow-100 text-yellow-800" },
  paid: { label: "결제완료", color: "bg-blue-100 text-blue-800" },
  confirmed: { label: "확정", color: "bg-green-100 text-green-800" },
  completed: { label: "완료", color: "bg-gray-100 text-gray-800" },
  cancelled: { label: "취소", color: "bg-red-100 text-red-800" },
  refunded: { label: "환불", color: "bg-purple-100 text-purple-800" },
};

export const CHANNEL_LABEL: Record<OrderChannel, string> = {
  direct: "직접 결제",
  link: "링크 결제",
};

export function formatOrderPrice(price: number): string {
  return price.toLocaleString("ko-KR") + "원";
}

// DB → 프론트엔드 변환
export function toOrder(dbOrder: DbOrder, dbItems: DbOrderItem[]): Order {
  return {
    id: dbOrder.id,
    orderNumber: dbOrder.order_number,
    channel: dbOrder.channel,
    status: dbOrder.status,
    customerName: dbOrder.customer_name,
    customerPhone: dbOrder.customer_phone,
    customerEmail: dbOrder.customer_email,
    customerMemo: dbOrder.customer_memo,
    adminMemo: dbOrder.admin_memo,
    deliveryMethod: dbOrder.delivery_method,
    deliveryAddress: dbOrder.delivery_address,
    pickupDate: dbOrder.pickup_date,
    totalAmount: dbOrder.total_amount,
    shippingFee: dbOrder.shipping_fee,
    paymentKey: dbOrder.payment_key,
    paymentMethod: dbOrder.payment_method,
    paidAt: dbOrder.paid_at,
    createdAt: dbOrder.created_at,
    updatedAt: dbOrder.updated_at,
    items: dbItems.map((item) => ({
      id: item.id,
      orderId: item.order_id,
      menuItemId: item.menu_item_id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      subtotal: item.subtotal,
    })),
  };
}
