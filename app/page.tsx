import Image from 'next/image';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* 1. 상단 메인 배너 영역 */}
      <section className="relative w-full h-[500px] bg-slate-900 flex items-center justify-center overflow-hidden">
        {/* 배경 이미지: priority를 추가해 가장 먼저 로딩되게 하고, 글씨가 잘 보이도록 밝기(brightness)를 낮췄습니다 */}
        <Image 
          src="/images/6_fruitappleB01_main_01.png" 
          alt="애플어클락 메인 배너" 
          fill 
          priority
          className="object-cover brightness-[0.55]"
        />

        {/* 메인 텍스트: 배경이 어두워졌으므로 글씨를 흰색으로 변경하고 그림자(drop-shadow)를 주어 가독성을 높였습니다 */}
        <div className="z-10 text-center pointer-events-none">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            애플어클락
          </h1>
          <p className="text-lg md:text-xl text-white font-medium mb-6 drop-shadow-md">
            우리 가족의 가장 달콤한 시간
          </p>
          <p className="text-md text-white/90 drop-shadow-md">
            잘 저장되어 단맛이 꽉 찬 A급 가정용 부사
          </p>
        </div>
      </section>

      {/* 2. 상품 소개 (상세페이지 요약) 영역 */}
      <section className="max-w-4xl mx-auto py-20 px-4">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-10">
          매일 먹어도 질리지 않는 아삭함
        </h2>
        
        <div className="flex flex-col md:flex-row gap-8 items-center">
          {/* 상품 확대(디테일) 이미지 영역 */}
          <div className="w-full md:w-1/2 h-[400px] bg-slate-100 relative rounded-lg overflow-hidden shadow-sm group">
            {/* 마우스를 올렸을 때 사진이 부드럽게 살짝 확대되는 고급스러운 애니메이션(hover:scale)을 추가했습니다 */}
             <Image 
               src="/images/10_fruitappleB01_detail_03.png" 
               alt="A급 가정용 부사 확대 사진" 
               fill 
               className="object-cover transition-transform duration-700 group-hover:scale-105"
             />
          </div>
          
          {/* 상품 간단 설명 */}
          <div className="w-full md:w-1/2 space-y-4">
            <h3 className="text-xl font-bold text-slate-800">A급 가정용 부사 5kg</h3>
            <p className="text-slate-600 leading-relaxed">
              가장 맛있는 상태로 정성껏 저장했습니다. 
              부담 없이 매일 식탁에 올리기 좋은 크기와 훌륭한 당도를 자랑합니다.
            </p>
            <div className="text-2xl font-bold text-red-600 mt-4">
              [가격 입력]원
            </div>
            <button className="w-full bg-slate-800 text-white py-3 rounded-md mt-6 hover:bg-slate-700 transition shadow-md font-medium">
              장바구니 담기
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}