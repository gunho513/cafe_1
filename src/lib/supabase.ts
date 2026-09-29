/**
 * Supabase 클라이언트
 * - 로컬: .env.local 에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 설정
 * - Vercel: Project Settings > Environment Variables 에 같은 이름으로 설정
 */
import { createClient } from '@supabase/supabase-js';
import { OrderRecord } from '../types/cafe';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

// 주문 1건을 cafe_orders 테이블에 INSERT
export async function insertOrder(order: OrderRecord): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase 환경변수(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)가 설정되지 않았습니다.');
  }

  const { error } = await supabase.from('cafe_orders').insert({
    customer_name: order.customerName,
    phone: order.phone || null,
    beverage: order.beverageName,
    size: order.size,
    options: order.selectedOptions,
    quantity: order.quantity,
    requests: order.requests || null,
    total_price: order.totalPrice,
    status: order.status,
  });

  if (error) {
    throw new Error(error.message);
  }
}
