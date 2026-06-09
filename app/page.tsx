"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';

// 1. CSV 파싱 함수
function parseCSV(csv: string) {
  const cleanCSV = csv.replace(/^\uFEFF/, '').replace(/\r/g, '');
  const lines = cleanCSV.split('\n');
  const result: Record<string, string>[] = [];
  if (lines.length === 0) return result;

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

  for (let i = 1; i < lines.length; i++) {
    const currentline = lines[i].trim();
    if (!currentline) continue;

    const obj: Record<string, string> = {};
    let inQuotes = false;
    let value = '';
    let col = 0;

    for (let j = 0; j < currentline.length; j++) {
      const char = currentline[j];
      if (char === '"' && currentline[j + 1] === '"') {
        value += '"';
        j++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        if (headers[col]) obj[headers[col]] = value;
        value = '';
        col++;
      } else {
        value += char;
      }
    }
    if (headers[col]) obj[headers[col]] = value;
    result.push(obj);
  }
  return result;
}

// 2. 메인 홈 화면 컴포넌트
export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 상세페이지 전환 상태
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // [수정포인트 2] 상세페이지 전용 '옵션 선택' 상태 추가
  const [detailSelectedOption, setDetailSelectedOption] = useState('');

  useEffect(() => {
    const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSUFMMm_wd_T5bU3e80Y8P4xfBzuvAGBtSndB9CJa2p47sqbil0KHQzRqeagJEet1g2sol7h5jIBC7m/pub?output=csv";
    
    fetch(url)
      .then(res => res.arrayBuffer())
      .then(buffer => {
        const decoder = new TextDecoder('utf-8');
        const csvText = decoder.decode(buffer);
        const parsed = parseCSV(csvText);
        setProducts(parsed);
        setLoading(false);
      })
      .catch(err => {
        console.error("구글 시트 연동 실패:", err);
        setLoading(false);
      });
  }, []);

  // 엑셀 헤더 유연 매칭 함수
  const getProductValue = (product: any, keyword: string) => {
    const foundKey = Object.keys(product).find(key => 
      key.toLowerCase().includes(keyword.toLowerCase())
    );
    return foundKey ? product[foundKey]?.trim() : '';
  };

  // 현재 보고 있는 상세상품
  const currentProduct = products.find(p => getProductValue(p, 'id') === selectedProductId);

  // 시트에서 가져온 옵션 텍스트를 JSON 배열로 예쁘게 변환하는 함수
  const parseOptions = (optionsStr: string) => {
    if (!optionsStr) return [];
    try {
      let cleanJson = optionsStr.trim();
      if (cleanJson.startsWith('"') && cleanJson.endsWith('"')) {
        cleanJson = cleanJson.slice(1, -1).replace(/"{2}/g, '"'); // 엑셀 중첩 따옴표 방어
      }
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error("옵션 파싱 실패:", e);
      return [];
    }
  };

  // --- [상세페이지 화면] ---
  if (selectedProductId && currentProduct) {
    const id = getProductValue(currentProduct, 'id');
    const title = getProductValue(currentProduct, 'title') || '상품명 없음';
    const basePrice = parseInt(getProductValue(currentProduct, 'price') || '0', 10);
    const description = getProductValue(currentProduct, 'description');
    const detailCount = parseInt(getProductValue(currentProduct, 'detailCount') || '1', 10);
    
    // 옵션 리스트 추출
    const optionsStr = getProductValue(currentProduct, 'options');
    const parsedOptions = parseOptions(optionsStr);

    // 선택된 옵션의 '추가 금액' 찾아내기
    const selectedOptObj = parsedOptions.find((opt: any) => opt.name === detailSelectedOption);
    const addPrice = selectedOptObj ? parseInt(selectedOptObj.addPrice || '0', 10) : 0;
    
    // 기본 가격 + 옵션 추가 금액 = 최종 결제 금액
    const totalPrice = basePrice + addPrice;

    // 장바구니 담기 클릭 시 작동하는 로직
    const handleDetailAddToCart = () => {
      // 옵션이 있는데 선택을 안 한 경우 방어막
      if (parsedOptions.length > 0 && !detailSelectedOption) {
        alert('⚠️ [필수] 옵션을 먼저 선택해 주세요!');
        return;
      }
      
      alert(`🛒 장바구니 담기 성공!\n\n• 상품명: ${title}\n• 선택옵션: ${detailSelectedOption || '기본 (옵션없음)'}\n• 결제금액: ${totalPrice.toLocaleString()}원`);
    };

    return (
      <main className="min-h-screen bg-white pb-20">
        <div className="border-b border-slate-100 sticky top-0 bg-white z-50">
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <button 
              onClick={() => {
                setSelectedProductId(null);
                setDetailSelectedOption(''); // 뒤로갈 때 옵션 상태 초기화
              }} 
              className="text-slate-600 hover:text-slate-900 flex items-center gap-1 text-sm font-medium"
            >
              ← 목록으로 돌아가기
            </button>
            <span className="font-bold text-slate-800">애플어클락</span>
            <div className="w-20"></div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto pt-10 px-4 grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
          <div className="w-full h-[400px] relative rounded-lg overflow-hidden bg-slate-50">
            {/* [수정포인트 1 반영] 상세페이지 대표 이미지도 _main_01.png 규칙 사용 */}
            <img 
              src={`https://zkzlzm.dothome.co.kr/img/product_assets/images/${id}_main_01.png`}
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => {
                 // main_01.png 파일이 없으면 detail_01.png로 대체 (이미지 엑스박스 방지)
                (e.target as HTMLImageElement).src = `https://zkzlzm.dothome.co.kr/img/product_assets/images/${id}_detail_01.png`;
              }}
            />
          </div>
          
          <div className="flex flex-col py-2">
            <div className="space-y-4 flex-grow">
              <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
              <p className="text-slate-600 leading-relaxed">{description}</p>
              
              {/* 결제 금액 출력 (옵션 선택 시 실시간 합산됨) */}
              <div className="text-3xl font-extrabold text-red-600 pt-2">
                {totalPrice.toLocaleString()}원
              </div>

              {/* [수정포인트 2 반영] 상세페이지에 옵션 선택 상자(Select) 추가 */}
              {parsedOptions.length > 0 && (
                <div className="pt-6 space-y-2">
                  <label className="text-sm font-semibold text-slate-700">옵션 선택 (필수)</label>
                  <select 
                    value={detailSelectedOption}
                    onChange={(e) => setDetailSelectedOption(e.target.value)}
                    className="w-full border border-slate-300 p-3 text-sm rounded-md bg-white text-slate-700 outline-none focus:border-slate-800 transition cursor-pointer"
                  >
                    <option value="">옵션을 선택해 주세요</option>
                    {parsedOptions.map((opt: any, optIdx: number) => (
                      <option key={optIdx} value={opt.name}>
                        {opt.name} {parseInt(opt.addPrice, 10) > 0 ? `(+${parseInt(opt.addPrice, 10).toLocaleString()}원)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <button 
              onClick={handleDetailAddToCart}
              className="w-full bg-slate-800 text-white py-4 rounded-md font-medium text-md hover:bg-slate-700 transition mt-6 shadow-md"
            >
              장바구니 담기
            </button>
          </div>
        </div>

        {/* 닷홈 호스팅 연동 상세페이지(세로로 길게 나오는 이미지) 영역 */}
        <div className="max-w-3xl mx-auto px-4 border-t border-slate-100 pt-16">
          <h2 className="text-center font-bold text-slate-800 mb-10 text-lg">💡 상품 상세 정보</h2>
          <div className="flex flex-col items-center w-full">
            {Array.from({ length: detailCount }).map((_, index) => {
              const pageNum = String(index + 1).padStart(2, '0');
              const imageUrl = `https://zkzlzm.dothome.co.kr/img/product_assets/images/${id}_detail_${pageNum}.png`;
              
              return (
                <img 
                  key={pageNum}
                  src={imageUrl}
                  alt={`상세내용 ${pageNum}`}
                  className="w-full h-auto block"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              );
            })}
          </div>
        </div>
      </main>
    );
  }

  // --- [메인 상점 화면] ---
  return (
    <main className="min-h-screen bg-slate-50/50">
      <section className="relative w-full h-[360px] bg-slate-900 flex items-center justify-center overflow-hidden">
        <Image 
          src="/images/6_fruitappleB01_main_01.png" 
          alt="애플어클락 메인 배너" 
          fill 
          priority
          className="object-cover brightness-[0.55]"
        />
        <div className="z-10 text-center pointer-events-none">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">
            애플어클락
          </h1>
          <p className="text-md md:text-lg text-white/90 font-medium drop-shadow-md">
            우리 가족의 가장 달콤한 시간
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto py-16 px-4">
        <h2 className="text-xl font-bold text-slate-800 mb-8">인기 판매 상품</h2>
        
        {loading ? (
          <div className="text-center text-slate-500 py-12 bg-white rounded-lg border border-slate-100 shadow-sm">
            스프레드시트에서 사과 정보를 안전하게 가져오는 중입니다...
          </div>
        ) : products.length === 0 ? (
          <div className="text-center text-slate-500 py-12 bg-white rounded-lg border border-slate-100 shadow-sm">
            등록된 상품이 없거나 엑셀 파일 형식을 확인해 주세요.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, index) => {
              const id = getProductValue(product, 'id');
              const title = getProductValue(product, 'title') || '상품명 없음';
              const price = parseInt(getProductValue(product, 'price') || '0', 10);
              const status = getProductValue(product, 'status') || '판매중';
              const description = getProductValue(product, 'description');

              if (status.includes('판매중지')) return null;

              // [수정포인트 1 반영] 메인 상점 목록의 썸네일은 {id}_main_01.png 주소를 불러옵니다.
              const mainThumbnailUrl = `https://zkzlzm.dothome.co.kr/img/product_assets/images/${id}_main_01.png`;

              return (
                <div key={index} className="border border-slate-100 rounded-lg p-5 shadow-sm hover:shadow-md transition bg-white flex flex-col justify-between">
                  <div>
                    <div 
                      onClick={() => setSelectedProductId(id)}
                      className="w-full h-[240px] bg-slate-50 relative rounded-md overflow-hidden mb-4 group cursor-pointer"
                    >
                       <img 
                         src={mainThumbnailUrl}
                         alt={title} 
                         className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                         onError={(e) => {
                           // main_01 파일이 닷홈에 없으면 빈 박스가 아니라 detail_01 사진을 대신 보여주도록 안전장치 마련
                           (e.target as HTMLImageElement).src = `https://zkzlzm.dothome.co.kr/img/product_assets/images/${id}_detail_01.png`;
                         }}
                       />
                    </div>
                    
                    <h3 
                      onClick={() => setSelectedProductId(id)}
                      className="text-lg font-bold text-slate-800 mb-2 cursor-pointer hover:text-red-600 transition inline-block"
                    >
                      {title}
                    </h3>
                    
                    <p className="text-slate-500 text-sm mb-4 leading-relaxed line-clamp-2 h-10">
                      {description}
                    </p>
                  </div>

                  <div>
                    <div className="text-xl font-bold text-red-600 mb-4">
                      {price.toLocaleString()}원
                    </div>
                    <button 
                      onClick={() => setSelectedProductId(id)}
                      className="w-full bg-slate-800 text-white py-3 rounded-md hover:bg-slate-700 transition font-medium text-sm"
                    >
                      상세보기 및 주문
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}