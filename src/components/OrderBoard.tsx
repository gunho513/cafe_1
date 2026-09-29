import React, { useState } from 'react';
import { OrderRecord, OrderStatus } from '../types/cafe';
import { 
  ClipboardList, 
  Coffee, 
  Copy, 
  Check, 
  Trash2, 
  Clock, 
  Filter, 
  PlusCircle, 
  CheckCircle2, 
  Timer, 
  Coins,
  ChevronRight,
  Database,
  ChefHat
} from 'lucide-react';

interface OrderBoardProps {
  orders: OrderRecord[];
  onClearOrders: () => void;
  onDeleteOrder: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: OrderStatus) => void;
  onAddSampleOrder: () => void;
  onOpenSqlModal: () => void;
  onGoToOrderForm?: () => void;
}

export const OrderBoard: React.FC<OrderBoardProps> = ({
  orders,
  onClearOrders,
  onDeleteOrder,
  onUpdateStatus,
  onAddSampleOrder,
  onOpenSqlModal,
  onGoToOrderForm
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // 개별 주문을 Supabase INSERT SQL로 변환하여 복사
  const copyOrderSql = (order: OrderRecord) => {
    const formattedOptions = order.selectedOptions.length > 0 
      ? `ARRAY[${order.selectedOptions.map(opt => `'${opt}'`).join(', ')}]` 
      : `ARRAY[]::TEXT[]`;
    const safeRequests = order.requests ? `'${order.requests.replace(/'/g, "''")}'` : 'NULL';
    const safePhone = order.phone ? `'${order.phone.replace(/'/g, "''")}'` : 'NULL';

    const sql = `INSERT INTO cafe_orders (customer_name, phone, beverage, size, options, quantity, requests, total_price, status)
VALUES ('${order.customerName.replace(/'/g, "''")}', ${safePhone}, '${order.beverageName}', '${order.size}', ${formattedOptions}, ${order.quantity}, ${safeRequests}, ${order.totalPrice}, '${order.status}');`;

    navigator.clipboard.writeText(sql);
    setCopiedId(order.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 통계 계산
  const totalCount = orders.length;
  const waitingCount = orders.filter(o => o.status === '접수완료').length;
  const inProgressCount = orders.filter(o => o.status === '제조중').length;
  const completedCount = orders.filter(o => o.status === '제조완료' || o.status === '수령완료').length;
  const totalRevenue = orders.reduce((acc, cur) => acc + cur.totalPrice, 0);

  // 필터링된 주문 목록
  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'ALL') return true;
    return order.status === statusFilter;
  });

  // 상태 변경 다음 단계 가져오기
  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    if (current === '접수완료') return '제조중';
    if (current === '제조중') return '제조완료';
    if (current === '제조완료') return '수령완료';
    return null;
  };

  return (
    <div className="w-full max-w-[580px] mx-auto space-y-4">
      
      {/* ========================================================= */}
      {/* [주문 접수판 헤더 & 컨트롤] */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(107,66,38,0.08)] border border-[#ebdcd0] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#ebdcd0]">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-[#6b4226] text-white rounded-xl shadow-xs">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-[#6b4226]">주문 접수판</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#faf6f0] text-[#6b4226] border border-[#d4c3b3]">
                  총 {totalCount}건
                </span>
              </div>
              <p className="text-xs text-[#827163] mt-0.5">
                바리스타 실시간 주문 현황 및 상태 관리
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onAddSampleOrder}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#6b4226] bg-[#faf6f0] hover:bg-[#eadecf] border border-[#d4c3b3] rounded-lg transition-colors cursor-pointer"
              title="테스트용 주문 1건 즉시 추가"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              샘플 주문 추가
            </button>
            <button
              onClick={onOpenSqlModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#6b4226] hover:bg-[#7f4f2f] rounded-lg transition-colors shadow-xs cursor-pointer"
              title="Supabase SQL Editor 쿼리 보기"
            >
              <Database className="w-3.5 h-3.5" />
              SQL
            </button>
          </div>
        </div>

        {/* 상단 통계 지표 카드들 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
          <div className="bg-[#faf6f0] p-3 rounded-xl border border-[#ebdcd0] text-center">
            <span className="text-[11px] text-[#827163] block font-medium">총 접수</span>
            <span className="text-lg font-extrabold text-[#6b4226]">{totalCount}건</span>
          </div>
          <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 text-center">
            <span className="text-[11px] text-emerald-800 block font-medium">접수 대기</span>
            <span className="text-lg font-extrabold text-emerald-700">{waitingCount}건</span>
          </div>
          <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 text-center">
            <span className="text-[11px] text-amber-800 block font-medium">제조 중</span>
            <span className="text-lg font-extrabold text-amber-700">{inProgressCount}건</span>
          </div>
          <div className="bg-[#f5ede4] p-3 rounded-xl border border-[#d4c3b3] text-center">
            <span className="text-[11px] text-[#6b4226] block font-medium">누적 금액</span>
            <span className="text-base font-extrabold text-[#6b4226] truncate block">
              {totalRevenue.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 상태 필터 탭 & 내역 초기화 */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#ebdcd0] gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-[#6b4226] text-white'
                  : 'bg-[#faf6f0] text-[#6b4226] hover:bg-[#eadecf]'
              }`}
            >
              전체 ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('접수완료')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === '접수완료'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              접수완료 ({waitingCount})
            </button>
            <button
              onClick={() => setStatusFilter('제조중')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === '제조중'
                  ? 'bg-amber-700 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              제조중 ({inProgressCount})
            </button>
            <button
              onClick={() => setStatusFilter('제조완료')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === '제조완료'
                  ? 'bg-blue-700 text-white'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
              }`}
            >
              제조완료 ({completedCount})
            </button>
          </div>

          {orders.length > 0 && (
            <button
              onClick={onClearOrders}
              className="text-xs text-[#8c7462] hover:text-[#dc2626] transition-colors flex items-center gap-1 cursor-pointer font-medium"
              title="모든 주문 내역 삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
              내역 초기화
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* [주문 카드 목록 영역 (이미지 1 스타일 일치)] */}
      {/* ========================================================= */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#ebdcd0] p-8 text-center text-[#827163] shadow-xs">
            <Coffee className="w-12 h-12 mx-auto text-[#d4c3b3] mb-3 stroke-[1.5]" />
            <p className="font-bold text-base text-[#4a3627]">
              {statusFilter === 'ALL' ? '접수된 주문이 없습니다' : `'${statusFilter}' 상태의 주문이 없습니다`}
            </p>
            <p className="text-xs text-[#8c7462] mt-1 mb-4">
              [주문 접수] 탭에서 새로운 주문을 넣거나, 상단의 [샘플 주문 추가]를 눌러보세요.
            </p>
            <div className="flex items-center justify-center gap-2">
              {onGoToOrderForm && (
                <button
                  onClick={onGoToOrderForm}
                  className="px-4 py-2 bg-[#6b4226] text-white text-xs font-bold rounded-xl hover:bg-[#7f4f2f] transition-colors shadow-xs cursor-pointer"
                >
                  주문서 작성하러 가기
                </button>
              )}
              <button
                onClick={onAddSampleOrder}
                className="px-4 py-2 bg-[#faf6f0] border border-[#d4c3b3] text-[#6b4226] text-xs font-bold rounded-xl hover:bg-[#eadecf] transition-colors cursor-pointer"
              >
                샘플 주문 넣기
              </button>
            </div>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const nextStatus = getNextStatus(order.status);

            // 상태별 배지 스타일
            const statusBadgeClasses = {
              접수완료: 'bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]',
              제조중: 'bg-amber-50 text-amber-800 border border-amber-200',
              제조완료: 'bg-blue-50 text-blue-800 border border-blue-200',
              수령완료: 'bg-stone-100 text-stone-600 border border-stone-300'
            }[order.status] || 'bg-emerald-50 text-emerald-800';

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-[#ebdcd0] p-4 sm:p-5 shadow-xs hover:border-[#6b4226] transition-all hover:shadow-md"
              >
                {/* 상단 라인: 이름(전화번호) & 금액/접수시각 */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#2e2017] text-base">
                        {order.customerName} 고객님
                      </span>
                      {order.orderNumber && (
                        <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-[#faf6f0] text-[#6b4226] border border-[#ebdcd0]">
                          #{order.orderNumber}
                        </span>
                      )}
                      {order.phone && (
                        <span className="text-xs text-[#827163]">
                          ({order.phone})
                        </span>
                      )}
                    </div>

                    {/* 음료 상세 및 옵션 */}
                    <div className="text-xs sm:text-sm text-[#4a3627] mt-1.5 flex items-center gap-1.5 flex-wrap">
                      <span className="text-base">☕</span>
                      <span className="font-bold text-[#6b4226]">
                        {order.beverageName}
                      </span>
                      <span className="font-semibold text-[#826b5a]">
                        [{order.size} 사이즈]
                      </span>
                      {order.selectedOptions && order.selectedOptions.length > 0 && (
                        <span className="text-[#827163]">
                          ({order.selectedOptions.join(', ')})
                        </span>
                      )}
                      <span className="font-extrabold text-[#6b4226] ml-1 bg-[#faf6f0] px-2 py-0.5 rounded border border-[#ebdcd0]">
                        × {order.quantity}잔
                      </span>
                    </div>
                  </div>

                  {/* 우측 금액 및 접수 시간 */}
                  <div className="text-right flex-shrink-0">
                    <span className="text-base sm:text-lg font-extrabold text-[#6b4226] block">
                      {order.totalPrice.toLocaleString()}원
                    </span>
                    <span className="text-xs text-[#827163] block mt-0.5">
                      {order.orderedAt}
                    </span>
                  </div>
                </div>

                {/* 고객 요청사항 (있을 경우) */}
                {order.requests && (
                  <div className="mt-2.5 bg-[#faf6f0] px-3 py-2 rounded-xl text-xs text-[#5c4a3b] border border-[#ebdcd0] flex items-start gap-1.5">
                    <span className="font-bold text-[#6b4226] flex-shrink-0">요청사항:</span>
                    <span>{order.requests}</span>
                  </div>
                )}

                {/* 하단 컨트롤 영역: 상태 뱃지 + 상태 변경 액션 + Supabase SQL 복사 */}
                <div className="mt-3.5 pt-2.5 border-t border-[#f0e6dc] flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {/* 상태 뱃지 */}
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${statusBadgeClasses}`}>
                      {order.status}
                    </span>

                    {/* 바리스타 원클릭 다음 상태 변경 버튼 */}
                    {nextStatus && (
                      <button
                        onClick={() => onUpdateStatus(order.id, nextStatus)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#faf6f0] hover:bg-[#6b4226] text-[#6b4226] hover:text-white border border-[#d4c3b3] transition-colors cursor-pointer"
                        title={`${nextStatus} 단계로 변경`}
                      >
                        <span>{nextStatus}로 변경</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Supabase SQL 복사 버튼 (이미지 1 요구사항) */}
                    <button
                      onClick={() => copyOrderSql(order)}
                      className="text-xs font-medium text-[#6b4226] hover:text-[#835231] flex items-center gap-1.5 py-1 px-2 rounded hover:bg-[#faf6f0] transition-colors cursor-pointer"
                      title="이 주문에 대한 Supabase INSERT SQL 복사"
                    >
                      {copiedId === order.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-600" />
                          <span className="font-bold text-green-700">복사 완료!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#6b4226]" />
                          <span>Supabase SQL 복사</span>
                        </>
                      )}
                    </button>

                    {/* 개별 주문 삭제 */}
                    <button
                      onClick={() => onDeleteOrder(order.id)}
                      className="p-1 text-stone-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                      title="이 주문 내역 삭제"
                      aria-label="주문 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
