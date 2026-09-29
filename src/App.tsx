/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * [바이브 카페 (Vibe Cafe)]
 * 두 가지 뷰 분리 지원:
 * 1. [주문 접수] : 고객 및 주문서 작성 화면 (이름, 전화번호, 메뉴, 옵션, 예상금액, 주문하기)
 * 2. [주문 접수판] : 바리스타 및 매장용 실시간 주문 현황판 (상태 변경, 주문 상세, Supabase SQL 복사)
 * 3. [2분할 나란히 보기] : 데스크톱에서 주문 접수와 접수판을 동시에 볼 수 있는 분할 뷰
 */

import React, { useState, useEffect } from 'react';
import { OrderRecord, OrderStatus } from './types/cafe';
import { OrderForm } from './components/OrderForm';
import { OrderBoard } from './components/OrderBoard';
import { SupabaseModal } from './components/SupabaseModal';
import { 
  Coffee, 
  ClipboardList, 
  Columns, 
  Database, 
  Sparkles,
  Layers
} from 'lucide-react';

// 초기 기본 샘플 주문 (사용자 첨부 이미지 기준: 이건호 고객님)
const INITIAL_SAMPLE_ORDERS: OrderRecord[] = [
  {
    id: 'sample-order-1',
    orderNumber: 1,
    customerName: '이건호',
    phone: '010-1111-1111',
    beverageName: '아메리카노',
    beveragePrice: 3500,
    size: 'M',
    sizePrice: 500,
    selectedOptions: ['샷 추가'],
    optionsPrice: 500,
    quantity: 1,
    requests: '',
    totalPrice: 4500,
    status: '접수완료',
    orderedAt: '오후 01:04:19',
    timestamp: Date.now() - 3600000,
  }
];

export default function App() {
  // 현재 활성화된 뷰 모드 ('form' = 주문 접수, 'board' = 주문 접수판, 'split' = 나란히 보기)
  const [activeTab, setActiveTab] = useState<'form' | 'board' | 'split'>('form');

  // 주문 내역 상태 (로컬 스토리지 연동)
  const [orders, setOrders] = useState<OrderRecord[]>(() => {
    try {
      const saved = localStorage.getItem('vibe_cafe_orders_v2');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SAMPLE_ORDERS;
  });

  // Supabase SQL 모달 표시 상태
  const [isSqlModalOpen, setIsSqlModalOpen] = useState<boolean>(false);

  // 주문 데이터 변경 시 로컬 스토리지 동기화
  useEffect(() => {
    try {
      localStorage.setItem('vibe_cafe_orders_v2', JSON.stringify(orders));
    } catch (e) {
      console.error(e);
    }
  }, [orders]);

  // 신규 주문 접수 처리 핸들러
  const handleOrderCreated = (newOrder: OrderRecord) => {
    setOrders((prev) => [newOrder, ...prev]);
  };

  // 개별 주문 상태 업데이트 핸들러 (접수완료 -> 제조중 -> 제조완료 -> 수령완료)
  const handleUpdateStatus = (id: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id ? { ...order, status: newStatus } : order
      )
    );
  };

  // 개별 주문 삭제 핸들러
  const handleDeleteOrder = (id: string) => {
    setOrders((prev) => prev.filter((order) => order.id !== id));
  };

  // 전체 주문 내역 초기화 핸들러
  const handleClearOrders = () => {
    if (window.confirm('정말 모든 주문 내역을 초기화하시겠습니까?')) {
      setOrders([]);
    }
  };

  // 테스트용 샘플 주문 즉시 추가
  const handleAddSampleOrder = () => {
    const sampleNames = ['홍길동', '김민지', '박서준', '이지은', '최현우'];
    const sampleBeverages = [
      { name: '카페라떼', price: 4000 },
      { name: '바닐라라떼', price: 4500 },
      { name: '녹차라떼', price: 4500 },
      { name: '아메리카노', price: 3500 },
    ];
    const sampleSizes: ('S' | 'M' | 'L')[] = ['S', 'M', 'L'];
    const sampleOptionsList = [['샷 추가'], ['크림 추가'], ['디카페인'], ['시럽 추가', '샷 추가'], []];

    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const randomBeverage = sampleBeverages[Math.floor(Math.random() * sampleBeverages.length)];
    const randomSize = sampleSizes[Math.floor(Math.random() * sampleSizes.length)];
    const randomOption = sampleOptionsList[Math.floor(Math.random() * sampleOptionsList.length)];
    const sizePrice = randomSize === 'S' ? 0 : randomSize === 'M' ? 500 : 1000;
    const optionPrice = randomOption.length * 500;
    const quantity = Math.floor(Math.random() * 2) + 1;
    const total = (randomBeverage.price + sizePrice + optionPrice) * quantity;
    const now = new Date();

    const newOrder: OrderRecord = {
      id: `sample-${Date.now()}`,
      orderNumber: orders.length + 1,
      customerName: randomName,
      phone: `010-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      beverageName: randomBeverage.name,
      beveragePrice: randomBeverage.price,
      size: randomSize,
      sizePrice,
      selectedOptions: randomOption,
      optionsPrice: optionPrice,
      quantity,
      requests: Math.random() > 0.5 ? '덜 달게 부탁드립니다 ☕' : '',
      totalPrice: total,
      status: '접수완료',
      orderedAt: now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
      timestamp: now.getTime(),
    };

    setOrders((prev) => [newOrder, ...prev]);
  };

  // 접수 대기 중인 주문 수
  const pendingOrdersCount = orders.filter((o) => o.status === '접수완료').length;

  return (
    <div className="min-h-screen bg-[#faf6f0] text-[#3b2f2f] flex flex-col items-center py-6 px-3 sm:px-6">
      
      {/* ========================================================= */}
      {/* [상단 글로벌 헤더 & 네비게이션 탭] */}
      {/* ========================================================= */}
      <header className="w-full max-w-5xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* 카페 브랜딩 로고 */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#6b4226] text-white flex items-center justify-center text-xl shadow-sm">
            ☕
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-[#6b4226] tracking-tight">바이브 카페</h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#f0e6dc] text-[#6b4226] border border-[#d4c3b3]">
                POS & KDS
              </span>
            </div>
            <p className="text-xs text-[#826b5a]">당신의 하루에 바이브를 더하다</p>
          </div>
        </div>

        {/* 탭 네비게이션 컨트롤 (주문 접수 / 주문 접수판 / 2분할 분할 보기) */}
        <div className="flex items-center gap-2 bg-[#ecdcd0]/70 p-1.5 rounded-2xl border border-[#d4c3b3] shadow-xs">
          
          {/* 1. 주문 접수 탭 */}
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'form'
                ? 'bg-[#6b4226] text-white shadow-md'
                : 'text-[#6b4226] hover:bg-[#faf6f0]'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span>주문 접수</span>
          </button>

          {/* 2. 주문 접수판 탭 */}
          <button
            type="button"
            onClick={() => setActiveTab('board')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer relative ${
              activeTab === 'board'
                ? 'bg-[#6b4226] text-white shadow-md'
                : 'text-[#6b4226] hover:bg-[#faf6f0]'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>주문 접수판</span>
            {pendingOrdersCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'board' ? 'bg-emerald-400 text-[#065f46]' : 'bg-[#6b4226] text-white'
              }`}>
                {pendingOrdersCount}
              </span>
            )}
          </button>

          {/* 3. 2분할 나란히 보기 탭 (PC 및 태블릿) */}
          <button
            type="button"
            onClick={() => setActiveTab('split')}
            className={`hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'split'
                ? 'bg-[#6b4226] text-white shadow-md'
                : 'text-[#6b4226] hover:bg-[#faf6f0]'
            }`}
            title="주문 접수와 접수판을 나란히 한 화면에서 확인"
          >
            <Columns className="w-4 h-4" />
            <span>2분할 보기</span>
          </button>

          {/* Supabase SQL 모달 버튼 */}
          <button
            type="button"
            onClick={() => setIsSqlModalOpen(true)}
            className="p-2 rounded-xl text-[#6b4226] hover:bg-[#faf6f0] border border-transparent hover:border-[#d4c3b3] transition-colors cursor-pointer"
            title="Supabase 테이블 생성 및 INSERT SQL 보기"
          >
            <Database className="w-4 h-4" />
          </button>
        </div>

      </header>

      {/* ========================================================= */}
      {/* [메인 뷰 영역] */}
      {/* ========================================================= */}
      <main className="w-full flex justify-center">
        
        {/* 단일 뷰: 1. 주문 접수 화면 */}
        {activeTab === 'form' && (
          <div className="w-full flex justify-center animate-in fade-in duration-200">
            <OrderForm 
              onOrderCreated={handleOrderCreated}
              onGoToBoard={() => setActiveTab('board')}
              nextOrderNumber={orders.length + 1}
            />
          </div>
        )}

        {/* 단일 뷰: 2. 주문 접수판 화면 */}
        {activeTab === 'board' && (
          <div className="w-full flex justify-center animate-in fade-in duration-200">
            <OrderBoard
              orders={orders}
              onClearOrders={handleClearOrders}
              onDeleteOrder={handleDeleteOrder}
              onUpdateStatus={handleUpdateStatus}
              onAddSampleOrder={handleAddSampleOrder}
              onOpenSqlModal={() => setIsSqlModalOpen(true)}
              onGoToOrderForm={() => setActiveTab('form')}
            />
          </div>
        )}

        {/* 분할 뷰: 3. 2분할 나란히 보기 (좌: 주문 접수 / 우: 주문 접수판) */}
        {activeTab === 'split' && (
          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-start animate-in fade-in duration-200">
            <div>
              <div className="mb-2 text-xs font-bold text-[#6b4226] flex items-center gap-1.5 px-2">
                <Coffee className="w-4 h-4" />
                <span>[화면 1] 주문 접수 (고객용 주문서)</span>
              </div>
              <OrderForm 
                onOrderCreated={handleOrderCreated}
                onGoToBoard={() => setActiveTab('board')}
                nextOrderNumber={orders.length + 1}
              />
            </div>

            <div>
              <div className="mb-2 text-xs font-bold text-[#6b4226] flex items-center gap-1.5 px-2">
                <ClipboardList className="w-4 h-4" />
                <span>[화면 2] 주문 접수판 (바리스타용 현황판)</span>
              </div>
              <OrderBoard
                orders={orders}
                onClearOrders={handleClearOrders}
                onDeleteOrder={handleDeleteOrder}
                onUpdateStatus={handleUpdateStatus}
                onAddSampleOrder={handleAddSampleOrder}
                onOpenSqlModal={() => setIsSqlModalOpen(true)}
                onGoToOrderForm={() => setActiveTab('form')}
              />
            </div>
          </div>
        )}

      </main>

      {/* 푸터 */}
      <footer className="w-full max-w-5xl mt-8 pt-4 border-t border-[#ebdcd0] text-center text-xs text-[#8c7462] flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© 2026 바이브 카페 (Vibe Cafe). All rights reserved.</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSqlModalOpen(true)}
            className="hover:text-[#6b4226] font-semibold underline cursor-pointer"
          >
            Supabase SQL 쿼리문
          </button>
          <span>•</span>
          <span className="text-[#8c7462]">주문 접수 & 주문 접수판 실시간 연동</span>
        </div>
      </footer>

      {/* Supabase SQL 모달 */}
      <SupabaseModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />

    </div>
  );
}
