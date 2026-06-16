"use client";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase'; // 💡 Supabase 도구 불러오기

export default function CheckoutPage() {
  const router = useRouter();

  // 테스트용 임시 데이터
  const dummyProduct = {
    id: "sample_apple_01",
    title: "A급 가정용 부사사과",
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
  
  const [isLoading, setIsLoading] = useState(true);

  // 💡 [핵심] 페이지가 열릴 때 로그인 상태와 주소록을 확인합니다.
  useEffect(() => {
    const fetchUserAndAddress = async () => {
      // 1. 현재 로그인한 카카오 유저 정보 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const userName = session.user.user_metadata.name || "";

        // 2. Supabase 주소록(shipping_addresses)에서 내 주소 가져오기
        const { data: savedAddress, error } = await supabase
          .from('shipping_addresses')
          .select('*')
          .eq('user_id', session.user.id)
          .order('is_default', { ascending: false }) // 기본 배송지를 제일 먼저 가져옴
          .limit(1)
          .single();

        if (savedAddress) {
          // 저장된 주소가 있으면 폼에 자동 입력
          setAddress({
            name: savedAddress.recipient_name || userName,
            phone: savedAddress.phone || "",
            postcode: savedAddress.postcode || "",
            roadAddress: savedAddress.road_address || "",
            detailAddress: savedAddress.detail_address || ""
          });
        } else {
          // 저장된 주소가 없으면 카카오 이름만이라도 폼에 미리 넣어둠
          setAddress(prev => ({ ...prev, name: userName }));
        }
      }
      setIsLoading(false);
    };

    fetchUserAndAddress();
  }, []);

  // 결제하기 버튼 함수
  const handlePayment = () => {
    if (!address.name || !address.phone || !address.roadAddress) {
      alert("배송지 정보를 모두 입력해 주세요!");
      return;
    }
    alert("여기에 포트원 결제창(KPN)이 뜨는 로직이 들어갑니다!");
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-20">
      {/* 1. 상단 네비게이션 헤더 */}
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
        
        {/* 2. 주문 상품 정보 */}
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
          <h2 className="font-bold text-lg text-slate-800 mb-4 border-b pb-2 flex justify-between items-center">
            <span>배송지 정보</span>
            {isLoading && <span className="text-xs text-blue-500 font-normal">정보를 불러오는 중...</span>}
          </h2>
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