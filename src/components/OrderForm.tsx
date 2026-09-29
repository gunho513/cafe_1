import React, { useState, useMemo } from 'react';
import { 
  MENU_ITEMS, 
  SIZE_OPTIONS, 
  EXTRA_OPTIONS, 
  MenuItem, 
  SizeOption, 
  ExtraOption,
  OrderRecord
} from '../types/cafe';
import { insertOrder } from '../lib/supabase';
import { 
  Coffee, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  Send, 
  Sparkles,
  Plus,
  Minus,
  ArrowRight
} from 'lucide-react';

interface OrderFormProps {
  onOrderCreated: (order: OrderRecord) => void;
  onGoToBoard?: () => void;
  nextOrderNumber: number;
}

export const OrderForm: React.FC<OrderFormProps> = ({ 
  onOrderCreated, 
  onGoToBoard,
  nextOrderNumber
}) => {
  // -------------------------------------------------------------
  // [1. 상태 관리 (State)]
  // -------------------------------------------------------------
  // 1. 이름 (필수, text)
  const [customerName, setCustomerName] = useState<string>('');

  // 2. 전화번호 (tel)
  const [phone, setPhone] = useState<string>('');

  // 3. 음료 선택 (드롭다운, 기본값은 빈 문자열)
  const [selectedBeverageId, setSelectedBeverageId] = useState<string>('');

  // 4. 사이즈 (라디오 버튼, 기본값 'M')
  const [selectedSizeId, setSelectedSizeId] = useState<'S' | 'M' | 'L'>('M');

  // 5. 추가 옵션 (체크박스, 다중 선택 가능)
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);

  // 6. 수량 (number 타입, 기본값 1, 최소 1, 최대 10)
  const [quantity, setQuantity] = useState<number>(1);

  // 7. 요청사항 (textarea)
  const [requests, setRequests] = useState<string>('');

  // 주문 확인 메시지 상태 (성공 시 노출)
  const [orderConfirmation, setOrderConfirmation] = useState<string | null>(null);

  // 유효성 검사 경고 메시지 상태 (이름 또는 음료 미입력 시)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Supabase 저장 중 여부 (중복 주문 방지)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // -------------------------------------------------------------
  // [2. 실시간 예상 금액 계산 (Real-time Price Calculation)]
  // -------------------------------------------------------------
  // 선택된 음료 정보 객체 조회
  const selectedBeverage: MenuItem | undefined = useMemo(() => {
    return MENU_ITEMS.find((item) => item.id === selectedBeverageId);
  }, [selectedBeverageId]);

  // 선택된 사이즈 정보 객체 조회
  const selectedSize: SizeOption = useMemo(() => {
    return SIZE_OPTIONS.find((s) => s.id === selectedSizeId) || SIZE_OPTIONS[1];
  }, [selectedSizeId]);

  // 선택된 추가 옵션 리스트 및 옵션 추가금 합산
  const { selectedOptionsList, optionsTotalAddPrice } = useMemo(() => {
    const list: ExtraOption[] = EXTRA_OPTIONS.filter((opt) => 
      selectedOptionIds.includes(opt.id)
    );
    const sum = list.reduce((acc, cur) => acc + cur.price, 0);
    return { selectedOptionsList: list, optionsTotalAddPrice: sum };
  }, [selectedOptionIds]);

  // 잔당 단가 = (음료 기본 가격 + 사이즈 추가금 + 옵션 추가금)
  // 음료 미선택 시 기본 가격 0원 계산
  const unitPrice = useMemo(() => {
    const beverageBasePrice = selectedBeverage ? selectedBeverage.price : 0;
    return beverageBasePrice + selectedSize.price + optionsTotalAddPrice;
  }, [selectedBeverage, selectedSize.price, optionsTotalAddPrice]);

  // 최종 예상 금액 = 잔당 단가 * 수량 (천 단위 콤마 toLocaleString 적용 대상)
  const totalPrice = useMemo(() => {
    return unitPrice * quantity;
  }, [unitPrice, quantity]);

  // -------------------------------------------------------------
  // [3. 핸들러 함수 (Event Handlers)]
  // -------------------------------------------------------------
  
  // 추가 옵션 체크박스 토글 핸들러
  const handleOptionToggle = (optionId: string) => {
    setSelectedOptionIds((prev) => 
      prev.includes(optionId) 
        ? prev.filter((id) => id !== optionId) 
        : [...prev, optionId]
    );
  };

  // 수량 증감 핸들러 (최소 1, 최대 10 제한)
  const handleQuantityChange = (newQty: number) => {
    if (newQty >= 1 && newQty <= 10) {
      setQuantity(newQty);
    }
  };

  // 주문하기 버튼 클릭 핸들러
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage(null);

    // 유효성 검사 1: 이름이 비어있는 경우
    if (!customerName.trim()) {
      setErrorMessage('이름을 입력해주세요');
      setOrderConfirmation(null);
      document.getElementById('customerName')?.focus();
      return;
    }

    // 유효성 검사 2: 음료를 선택하지 않은 경우
    if (!selectedBeverageId || !selectedBeverage) {
      setErrorMessage('음료를 선택해주세요');
      setOrderConfirmation(null);
      document.getElementById('beverageSelect')?.focus();
      return;
    }

    // 옵션 표시 문자열 생성 (예: "(샷 추가)" 또는 "(샷 추가, 크림 추가)")
    const optionsText = selectedOptionsList.length > 0 
      ? ` (${selectedOptionsList.map(opt => opt.name).join(', ')})` 
      : '';

    // 주문 확인 메시지 형식 생성:
    // "홍길동님, 카페라떼 M사이즈 (샷 추가) 1잔, 총 5,000원 주문이 접수되었습니다!"
    const formattedMessage = `${customerName.trim()}님, ${selectedBeverage.name} ${selectedSize.id}사이즈${optionsText} ${quantity}잔, 총 ${totalPrice.toLocaleString()}원 주문이 접수되었습니다!`;

    // 주문 접수판에 전달할 신규 주문 객체 생성
    const now = new Date();
    const newOrder: OrderRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      orderNumber: nextOrderNumber,
      customerName: customerName.trim(),
      phone: phone.trim(),
      beverageName: selectedBeverage.name,
      beveragePrice: selectedBeverage.price,
      size: selectedSize.id,
      sizePrice: selectedSize.price,
      selectedOptions: selectedOptionsList.map(opt => opt.name),
      optionsPrice: optionsTotalAddPrice,
      quantity,
      requests: requests.trim(),
      totalPrice,
      status: '접수완료',
      orderedAt: now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
      timestamp: now.getTime(),
    };

    // Supabase cafe_orders 테이블에 저장 (성공 시에만 접수 처리)
    setIsSubmitting(true);
    try {
      await insertOrder(newOrder);
    } catch (err) {
      setOrderConfirmation(null);
      setErrorMessage(`주문 저장에 실패했습니다: ${err instanceof Error ? err.message : String(err)}`);
      return;
    } finally {
      setIsSubmitting(false);
    }

    setOrderConfirmation(formattedMessage);
    onOrderCreated(newOrder);
  };

  // 다시 작성 버튼: 모든 입력과 금액 초기화
  const handleResetForm = () => {
    setCustomerName('');
    setPhone('');
    setSelectedBeverageId('');
    setSelectedSizeId('M'); // 기본값 M
    setSelectedOptionIds([]);
    setQuantity(1); // 기본값 1
    setRequests('');
    setOrderConfirmation(null);
    setErrorMessage(null);
  };

  return (
    <div className="w-full max-w-[520px] mx-auto bg-[#ffffff] rounded-2xl shadow-[0_8px_30px_rgb(107,66,38,0.08)] border border-[#ebdcd0] p-6 sm:p-8">
      
      {/* ========================================================= */}
      {/* [페이지 상단] 로고 및 카페 소개 */}
      {/* ========================================================= */}
      <header className="text-center pb-6 border-b border-[#ebdcd0]">
        {/* 카페 로고: ☕ 이모지 크게 */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#faf6f0] border-2 border-[#ebdcd0] shadow-inner mb-3 transform hover:scale-105 transition-transform">
          <span className="text-4xl filter drop-shadow-xs" role="img" aria-label="카페 로고">☕</span>
        </div>

        {/* 카페 이름: "바이브 카페" */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#6b4226] tracking-tight">
          바이브 카페
        </h1>

        {/* 부제: "당신의 하루에 바이브를 더하다" */}
        <p className="text-sm text-[#826b5a] mt-1.5 flex items-center justify-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-[#6b4226]/60" />
          당신의 하루에 바이브를 더하다
          <Sparkles className="w-3.5 h-3.5 text-[#6b4226]/60" />
        </p>

        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-[#faf6f0] rounded-full text-xs font-semibold text-[#6b4226] border border-[#ebdcd0]">
          <span>☕ 주문 접수 (주문서 작성)</span>
        </div>
      </header>

      {/* 유효성 검사 에러 알림 배너 */}
      {errorMessage && (
        <div 
          role="alert"
          className="mt-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2.5 text-sm"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* [주문서 폼 영역] */}
      {/* ========================================================= */}
      <form onSubmit={handleSubmitOrder} className="mt-6 space-y-5" noValidate>
        
        {/* 1. 이름 (필수, text) */}
        <div className="space-y-1.5">
          <label htmlFor="customerName" className="block text-sm font-bold text-[#4a3627]">
            1. 이름 <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            id="customerName"
            type="text"
            required
            value={customerName}
            onChange={(e) => {
              setCustomerName(e.target.value);
              if (errorMessage && e.target.value.trim()) setErrorMessage(null);
            }}
            placeholder="주문하시는 분의 성함을 입력해주세요"
            className="cafe-input"
          />
        </div>

        {/* 2. 전화번호 (tel) */}
        <div className="space-y-1.5">
          <label htmlFor="phoneNumber" className="block text-sm font-bold text-[#4a3627]">
            2. 전화번호 <span className="text-xs font-normal text-[#8c7462]">(선택)</span>
          </label>
          <input
            id="phoneNumber"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="예: 010-1234-5678"
            className="cafe-input"
          />
        </div>

        {/* 3. 음료 선택 (드롭다운) */}
        <div className="space-y-1.5">
          <label htmlFor="beverageSelect" className="block text-sm font-bold text-[#4a3627]">
            3. 음료 선택 <span className="text-red-500 font-bold">*</span>
          </label>
          <div className="relative">
            <select
              id="beverageSelect"
              value={selectedBeverageId}
              onChange={(e) => {
                setSelectedBeverageId(e.target.value);
                if (errorMessage && e.target.value) setErrorMessage(null);
              }}
              className="cafe-input appearance-none pr-10 cursor-pointer"
            >
              <option value="">-- 음료를 선택해주세요 --</option>
              {MENU_ITEMS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.emoji} {item.name} ({item.price.toLocaleString()}원)
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#6b4226]">
              <Coffee className="w-4 h-4 opacity-70" />
            </div>
          </div>
          {selectedBeverage && (
            <p className="text-xs text-[#8c7462] pl-1">
              {selectedBeverage.description}
            </p>
          )}
        </div>

        {/* 4. 사이즈 (라디오 버튼, 가로 배치) */}
        <div className="space-y-2">
          <span id="size-group-label" className="block text-sm font-bold text-[#4a3627]">
            4. 사이즈 선택 <span className="text-xs font-normal text-[#8c7462]">(기본: M)</span>
          </span>
          <div 
            role="radiogroup" 
            aria-labelledby="size-group-label"
            className="flex items-center gap-3 flex-wrap"
          >
            {SIZE_OPTIONS.map((size) => {
              const isChecked = selectedSizeId === size.id;
              return (
                <label
                  key={size.id}
                  htmlFor={`size-${size.id}`}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm cursor-pointer transition-all ${
                    isChecked
                      ? 'border-[#6b4226] bg-[#6b4226]/10 text-[#6b4226] font-bold shadow-xs'
                      : 'border-[#d4c3b3] bg-white text-[#5c4a3b] hover:bg-[#faf6f0]'
                  }`}
                >
                  <input
                    type="radio"
                    id={`size-${size.id}`}
                    name="cafeSize"
                    value={size.id}
                    checked={isChecked}
                    onChange={() => setSelectedSizeId(size.id)}
                    className="accent-[#6b4226] w-4 h-4 cursor-pointer"
                  />
                  <span>{size.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 5. 추가 옵션 (체크박스, 가로 배치) */}
        <div className="space-y-2">
          <span id="options-group-label" className="block text-sm font-bold text-[#4a3627]">
            5. 추가 옵션 <span className="text-xs font-normal text-[#8c7462]">(중복 선택 가능)</span>
          </span>
          <div 
            role="group" 
            aria-labelledby="options-group-label"
            className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:gap-3"
          >
            {EXTRA_OPTIONS.map((option) => {
              const isChecked = selectedOptionIds.includes(option.id);
              return (
                <label
                  key={option.id}
                  htmlFor={`option-${option.id}`}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-all ${
                    isChecked
                      ? 'border-[#6b4226] bg-[#6b4226]/10 text-[#6b4226] font-bold shadow-xs'
                      : 'border-[#d4c3b3] bg-white text-[#5c4a3b] hover:bg-[#faf6f0]'
                  }`}
                >
                  <input
                    type="checkbox"
                    id={`option-${option.id}`}
                    checked={isChecked}
                    onChange={() => handleOptionToggle(option.id)}
                    className="accent-[#6b4226] w-4 h-4 rounded cursor-pointer"
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 6. 수량 (number 타입, 최소 1, 최대 10, 기본값 1) */}
        <div className="space-y-1.5">
          <label htmlFor="quantityInput" className="block text-sm font-bold text-[#4a3627]">
            6. 수량 <span className="text-xs font-normal text-[#8c7462]">(최소 1잔, 최대 10잔)</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
              aria-label="수량 감소"
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#d4c3b3] bg-[#faf6f0] text-[#6b4226] hover:bg-[#eadecf] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>

            <input
              id="quantityInput"
              type="number"
              min={1}
              max={10}
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) {
                  if (val < 1) handleQuantityChange(1);
                  else if (val > 10) handleQuantityChange(10);
                  else handleQuantityChange(val);
                }
              }}
              className="cafe-input text-center font-bold text-base max-w-[100px]"
            />

            <button
              type="button"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= 10}
              aria-label="수량 증가"
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#d4c3b3] bg-[#faf6f0] text-[#6b4226] hover:bg-[#eadecf] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>

            <span className="text-xs text-[#8c7462]">
              총 {quantity}잔 선택됨
            </span>
          </div>
        </div>

        {/* 7. 요청사항 (textarea) */}
        <div className="space-y-1.5">
          <label htmlFor="requestsInput" className="block text-sm font-bold text-[#4a3627]">
            7. 요청사항
          </label>
          <textarea
            id="requestsInput"
            rows={3}
            value={requests}
            onChange={(e) => setRequests(e.target.value)}
            placeholder="예: 얼음 적게 넣어주세요, 시럽 반만 넣어주세요 등"
            className="cafe-input resize-none"
          />
        </div>

        {/* ========================================================= */}
        {/* [실시간 예상 금액 표시 영역] - 주문하기 버튼 바로 위 */}
        {/* 요구사항: 큰 글씨(24px), 갈색, 굵게, 가운데 정렬 */}
        {/* ========================================================= */}
        <div className="pt-4 pb-2 border-t border-[#ebdcd0]">
          <div 
            aria-live="polite"
            className="text-center py-3 px-4 bg-[#faf6f0] rounded-xl border border-[#d4c3b3]/70"
          >
            <div className="text-xs text-[#8c7462] mb-0.5">실시간 합계 금액</div>
            <div 
              className="text-[24px] font-bold text-[#6b4226] tracking-tight"
              style={{ fontSize: '24px', color: '#6b4226', fontWeight: 'bold', textAlign: 'center' }}
            >
              예상 금액: {totalPrice.toLocaleString()}원
            </div>
            {selectedBeverage && (
              <div className="text-[11px] text-[#8c7462] mt-1">
                ({selectedBeverage.name} {selectedBeverage.price.toLocaleString()}원 + 사이즈 {selectedSize.price.toLocaleString()}원 + 옵션 {optionsTotalAddPrice.toLocaleString()}원) × {quantity}잔
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 8. 주문하기 버튼 & 9. 다시 작성 버튼 */}
        {/* ========================================================= */}
        <div className="space-y-2.5 pt-1">
          {/* 주문하기 버튼: 갈색 배경(#6b4226), 흰색 글씨, hover시 약간 밝게 */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="cafe-btn-submit w-full py-3.5 px-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer transition-all disabled:opacity-60 disabled:cursor-wait"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? '주문 저장 중...' : '주문하기'}
          </button>

          {/* 다시 작성 버튼: 모든 입력과 금액 초기화 */}
          <button
            type="button"
            onClick={handleResetForm}
            className="w-full py-2.5 px-4 rounded-xl border border-[#d4c3b3] bg-white text-[#6b4226] font-semibold text-sm hover:bg-[#faf6f0] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            다시 작성
          </button>
        </div>
      </form>

      {/* ========================================================= */}
      {/* [주문 확인 메시지] */}
      {/* 요구사항: 연두색 배경, 초록 글씨, 둥근 모서리 */}
      {/* 예) "홍길동님, 카페라떼 M사이즈 (샷 추가) 1잔, 총 5,000원 주문이 접수되었습니다!" */}
      {/* ========================================================= */}
      {orderConfirmation && (
        <div 
          role="status"
          aria-live="polite"
          className="order-success-banner mt-6 p-4.5 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <div>
                <p className="font-bold text-emerald-900 text-sm">
                  주문 접수 완료 ☕
                </p>
                <p className="text-emerald-800 text-sm leading-relaxed mt-0.5">
                  {orderConfirmation}
                </p>
              </div>
              
              {onGoToBoard && (
                <button
                  type="button"
                  onClick={onGoToBoard}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                >
                  주문 접수판에서 확인하기
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
