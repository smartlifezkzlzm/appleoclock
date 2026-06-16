"use client";
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CheckoutPage() {
  const router = useRouter();

  // 💡 테스트용 임시 데이터 (실제로는 이전 페이지에서 넘어온 데이터를 받아서 쓰게 됩니다)
  const dummyProduct = {
    id: "sample_apple_01",
    title: "A급 가정용 부사사과", // 대표님이 판매하시는 상품명 예시
    option: "5kg 1박스",
    price: 35000,
    imageUrl: "https://zkzlzm.dothome.co.kr/img/product_assets/images/sample_apple_01_main_01.png"
  };

  // 배송지 정보 상태 관리
  const [address, setAddress] = useState({
    name: "",
    phone: "",
    postcode: "",
    roadAddress: "",
    detailAddress: ""
  });

  // 결제하기 버튼 함수
  const handlePayment = () => {
    if (!address.name || !address.phone || !address.roadAddress) {
      alert("배송지 정보를 모두 입력해 주세요!");
      return;
    }
    alert("여기에 포트원 결제창(KPN)이 뜨는 로직이 들어갑니다!");
    // 향후 여기에 PortOne SDK 호출 코드를 작성합니다.
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-20">
      {/* 1. 상단 네비게이션 헤더 (상세페이지와 동일한 구조) */}
      <header className="bg-white sticky top-0 z-50 border-b border-slate-100 shadow-sm w-full">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => router.back()} 
            className="text-slate-600 hover:text-slate-900 font-bold text-xl md:text-2xl mr-1 transition"
          >
            ←
          </button>
          <div 
            className="font-extrabold text-xl md:text-2xl text-slate-800 cursor-pointer flex-shrink-0" 
            onClick={() => router.push('/')}
          >
            애플어클락
          </div>
          <div className="flex-1 text-right text-sm font-bold text-slate-800">
            주문/결제
          </div>
        </div>
      </header>

      <div className="max-w-3xl w-full mx-auto px-4 py-6 space-y-6">
        
        {/* 2. 주문 상품 정보 (메인 사진, 상품명, 옵션, 가격) */}
        <section className="bg-white p-5 rounded-lg shadow-sm border border-slate-100">
          <h2 className="font-bold text-lg text-slate-800 mb-4 border-b pb-2">주문 상품 정보</h2>
          <div className="flex gap-4">
            <div className="w-24 h-24 bg-slate-100 rounded-md overflow-hidden flex-shrink-0">
              <img 
                src={dummyProduct.imageUrl} 
                alt={dummyProduct.title} 
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150'; }}
              />
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="font-bold text-slate-800">{dummyProduct.title}</h3>
              <p className="text-sm text-slate-500 mt-1">선택 옵션: <span className="font-semibold text-slate-700">{dummyProduct.option}</span></p>
              <div className="text-lg font-extrabold text-red-600 mt-2">
                {dummyProduct.price.toLocaleString()}원
              </div>
            </div>
          </div>
        </section>

        {/* 3. 배송지 정보 입력란 */}
        <section className="bg-white p-5 rounded-lg shadow-sm border border-slate-100">
          <h2 className="font-bold text-lg text-slate-800 mb-4 border-b pb-2">배송지 정보</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">받으시는 분</label>
              <input type="text" placeholder="이름을 입력하세요" className="w-full border border-slate-300 p-3 text-sm rounded-md outline-none focus:border-slate-800"
                value={address.name} onChange={(e) => setAddress({...address, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">휴대폰 번호</label>
              <input type="tel" placeholder="010-0000-0000" className="w-full border border-slate-300 p-3 text-sm rounded-md outline-none focus:border-slate-800"
                value={address.phone} onChange={(e) => setAddress({...address, phone: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">배송지 주소</label>
              <div className="flex gap-2 mb-2">
                <input type="text" placeholder="우편번호" readOnly className="w-1/3 bg-slate-50 border border-slate-300 p-3 text-sm rounded-md"
                  value={address.postcode} />
                <button className="w-1/3 bg-slate-200 text-slate-700 font-bold rounded-md text-sm hover:bg-slate-300 transition">
                  주소 찾기
                </button>
              </div>
              <input type="text" placeholder="기본 주소" readOnly className="w-full bg-slate-50 border border-slate-300 p-3 text-sm rounded-md mb-2"
                value={address.roadAddress} />
              <input type="text" placeholder="상세 주소를 입력해주세요" className="w-full border border-slate-300 p-3 text-sm rounded-md outline-none focus:border-slate-800"
                value={address.detailAddress} onChange={(e) => setAddress({...address, detailAddress: e.target.value})} />
            </div>
          </div>
        </section>

      </div>

      {/* 4. 하단 고정 결제하기 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-sm text-slate-500">총 결제 금액</span>
            <div className="text-2xl font-extrabold text-red-600">{dummyProduct.price.toLocaleString()}원</div>
          </div>
          <button 
            onClick={handlePayment} 
            className="bg-slate-800 text-white font-bold py-4 px-8 rounded-md hover:bg-slate-700 transition w-1/2 text-center"
          >
            결제하기
          </button>
        </div>
      </div>
    </main>
  );
}