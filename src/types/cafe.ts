/**
 * 바이브 카페(Vibe Cafe) 타입 정의 및 메뉴 데이터
 */

// 음료 메뉴 항목 인터페이스
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  emoji: string;
  description: string;
}

// 사이즈 옵션 인터페이스
export interface SizeOption {
  id: 'S' | 'M' | 'L';
  name: string;
  price: number;
  label: string;
}

// 추가 옵션 인터페이스
export interface ExtraOption {
  id: string;
  name: string;
  price: number;
  label: string;
}

// 주문 상태 타입
export type OrderStatus = '접수완료' | '제조중' | '제조완료' | '수령완료';

// 주문 내역 인터페이스
export interface OrderRecord {
  id: string;
  orderNumber: number; // 일련 주문 번호 (예: #1, #2)
  customerName: string;
  phone: string;
  beverageName: string;
  beveragePrice: number;
  size: 'S' | 'M' | 'L';
  sizePrice: number;
  selectedOptions: string[];
  optionsPrice: number;
  quantity: number;
  requests: string;
  totalPrice: number;
  status: OrderStatus;
  orderedAt: string;
  timestamp: number;
}

// 1. 음료 메뉴 목록 (프롬프트 요구사항 반영)
export const MENU_ITEMS: MenuItem[] = [
  { id: 'americano', name: '아메리카노', price: 3500, emoji: '☕', description: '깊고 깔끔한 풍미의 에스프레소 블렌드' },
  { id: 'caffe_latte', name: '카페라떼', price: 4000, emoji: '🥛', description: '신선한 스팀 밀크와 고소한 에스프레소' },
  { id: 'caffe_mocha', name: '카페모카', price: 4500, emoji: '🍫', description: '진한 초콜릿과 부드러운 우유의 조화' },
  { id: 'vanilla_latte', name: '바닐라라떼', price: 4500, emoji: '✨', description: '달콤한 천연 바닐라 향이 감도는 라떼' },
  { id: 'greentea_latte', name: '녹차라떼', price: 4500, emoji: '🍵', description: '제주 유기농 녹차의 깊고 진한 맛' },
];

// 2. 사이즈 목록 (기본 선택: M)
export const SIZE_OPTIONS: SizeOption[] = [
  { id: 'S', name: 'S', price: 0, label: 'S (+0원)' },
  { id: 'M', name: 'M', price: 500, label: 'M (+500원)' },
  { id: 'L', name: 'L', price: 1000, label: 'L (+1,000원)' },
];

// 3. 추가 옵션 목록
export const EXTRA_OPTIONS: ExtraOption[] = [
  { id: 'shot', name: '샷 추가', price: 500, label: '샷 추가 (+500원)' },
  { id: 'cream', name: '크림 추가', price: 500, label: '크림 추가 (+500원)' },
  { id: 'syrup', name: '시럽 추가', price: 300, label: '시럽 추가 (+300원)' },
  { id: 'decaf', name: '디카페인', price: 0, label: '디카페인 (+0원)' },
];
