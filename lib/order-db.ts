// lib/order-db.ts
import { getServiceSupabase } from "./supabase";
import {
  type DbOrder,
  type DbOrderItem,
  type CreateOrderInput,
  type OrderStatus,
  type Order,
  toOrder,
} from "@/data/order";

function getSupabaseOrThrow() {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase가 설정되지 않았습니다");
  return supabase;
}

// 주문 생성
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const supabase = getSupabaseOrThrow();

  const itemsTotal = input.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const shippingFee = input.shippingFee || 0;
  const totalAmount = itemsTotal + shippingFee;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      channel: input.channel,
      status: "pending",
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      customer_email: input.customerEmail || null,
      customer_memo: input.customerMemo || null,
      admin_memo: input.adminMemo || null,
      delivery_method: input.deliveryMethod,
      delivery_address: input.deliveryAddress || null,
      pickup_date: input.pickupDate || null,
      total_amount: totalAmount,
      shipping_fee: shippingFee,
    })
    .select()
    .single();

  if (orderError) throw new Error(`주문 생성 실패: ${orderError.message}`);

  const orderItems = input.items.map((item) => ({
    order_id: order.id,
    menu_item_id: item.menuItemId || null,
    name: item.name,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    subtotal: item.quantity * item.unitPrice,
  }));

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems)
    .select();

  if (itemsError) throw new Error(`주문 상품 생성 실패: ${itemsError.message}`);

  return toOrder(order as DbOrder, items as DbOrderItem[]);
}

// 주문번호로 주문 조회 (공개용)
export async function getOrderByNumber(
  orderNumber: string
): Promise<Order | null> {
  const supabase = getSupabaseOrThrow();

  const { data: order, error } = await supabase
    .from("orders")
    .select()
    .eq("order_number", orderNumber)
    .single();

  if (error || !order) return null;

  const { data: items } = await supabase
    .from("order_items")
    .select()
    .eq("order_id", order.id);

  return toOrder(order as DbOrder, (items || []) as DbOrderItem[]);
}

// ID로 주문 조회 (관리자용)
export async function getOrderById(id: string): Promise<Order | null> {
  const supabase = getSupabaseOrThrow();

  const { data: order, error } = await supabase
    .from("orders")
    .select()
    .eq("id", id)
    .single();

  if (error || !order) return null;

  const { data: items } = await supabase
    .from("order_items")
    .select()
    .eq("order_id", order.id);

  return toOrder(order as DbOrder, (items || []) as DbOrderItem[]);
}

// 주문 목록 조회 (관리자용, relation query로 N+1 방지)
export async function getOrders(params: {
  channel?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ orders: Order[]; total: number }> {
  const supabase = getSupabaseOrThrow();
  const { channel, status, search, page = 1, limit = 20 } = params;

  let query = supabase
    .from("orders")
    .select("*, order_items(*)", { count: "exact" });

  if (channel && channel !== "all")
    query = query.eq("channel", channel);
  if (status && status !== "all") query = query.eq("status", status);
  if (search) {
    query = query.or(
      `order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`
    );
  }

  query = query.order("created_at", { ascending: false });
  query = query.range((page - 1) * limit, page * limit - 1);

  const { data: ordersData, error, count } = await query;

  if (error) throw new Error(`주문 목록 조회 실패: ${error.message}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orders = (ordersData || []).map((row: any) => {
    const { order_items, ...order } = row;
    return toOrder(order as DbOrder, (order_items || []) as DbOrderItem[]);
  });

  return { orders, total: count || 0 };
}

// 주문 상태 변경
export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<Order> {
  const supabase = getSupabaseOrThrow();

  const updateData: Record<string, unknown> = { status };
  if (status === "paid") updateData.paid_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("orders")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`주문 상태 변경 실패: ${error.message}`);

  const { data: items } = await supabase
    .from("order_items")
    .select()
    .eq("order_id", id);

  return toOrder(data as DbOrder, (items || []) as DbOrderItem[]);
}

// 주문 메모 수정
export async function updateOrderMemo(
  id: string,
  adminMemo: string
): Promise<void> {
  const supabase = getSupabaseOrThrow();

  const { error } = await supabase
    .from("orders")
    .update({ admin_memo: adminMemo })
    .eq("id", id);

  if (error) throw new Error(`메모 수정 실패: ${error.message}`);
}

// 결제 정보 업데이트
export async function updateOrderPayment(
  id: string,
  paymentKey: string,
  paymentMethod: string
): Promise<void> {
  const supabase = getSupabaseOrThrow();

  const { error } = await supabase
    .from("orders")
    .update({
      payment_key: paymentKey,
      payment_method: paymentMethod,
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(`결제 정보 업데이트 실패: ${error.message}`);
}
