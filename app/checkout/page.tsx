'use client';
import { useState } from 'react';
// import * as PortOne from "@portone/browser-sdk"; // 포트원은 나중에 주석 해제

export default function CheckoutPage() {
  // 임시 상태 (나중에는 DB나 장바구니 상태관리에서 가져옴)
  const [totalAmount, setTotalAmount] = useState(1000); 

  const handlePayment = () => {
    // 3단계에서 여기에 포트원 코드를 넣을 예정입니다.
    alert("결제 연동이 들어갈 자리입니다.");
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">주문서 작성</h1>

      {/* 1. 주문 상품 요약 */}
      <section className="mb-8 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-4">주문 상품</h2>
        <div className="flex justify-between">
          <span>테스트 상품 외 1건</span>
          <span>{totalAmount.toLocaleString()}원</span>
        </div>
      </section>

      {/* 2. 배송지 선택 (이전 단계에서 구상한 부분) */}
      <section className="mb-8 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-4">배송지 정보</h2>
        <p className="text-gray-500 text-sm mb-4">
          여기에 만들어두신 주소록 선택 컴포넌트가 들어갑니다.
        </p>
        {/* <AddressSelector /> */}
      </section>

      {/* 3. 결제 버튼 */}
      <button 
        onClick={handlePayment}
        className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700"
      >
        {totalAmount.toLocaleString()}원 결제하기
      </button>
    </div>
  );
}