"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';

// 1. CSV 파싱 함수: 구글 시트 특유의 유니코드 숨은 글자(BOM) 및 줄바꿈(\r)을 완벽하게 제거
function parseCSV(csv: string) {
  const cleanCSV = csv.replace(/^\uFEFF/, '').replace(/\r/g, ''); // BOM 및 캐리지 리턴 제거
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

// 2. 개별 상품 카드 컴포넌트: 옵션 선택 상태 및 장바구니 클릭 로직을 독립적으로 처리
function ProductCard({ product }: { product: any }) {
  // 구글 시트 헤더 명칭의 미세한 공백이나 따옴표 꼬임을 유연하게 방어하는 유틸리티
  const getValue = (keys: string[]) => {
    for (const key of keys) {
      if (product[key] !== undefined) return product[key];
      const cleanKey = key.replace(/"/g, '').trim();
      for (const prodKey in product) {
        if (prodKey.trim().replace(/"/g, '') === cleanKey) {
          return product[prodKey];
        }
      }
    }
    return '';
  };

  const id = getValue(['id', '상품코드', '상품 코드']);
  const title = getValue(['title', '상품명', '상품 명']) || '상품명 없음';
  const price = getValue(['price', '판매가격', '판매 가격']) || 0;
  const status = getValue(['status', '판매상태', '판매 상태']) || '판매중';
  const description = getValue(['description', '간단설명', '간단 설명']);
  const optionsStr = getValue(['options', '옵션 리스트', '옵션리스트', '옵션']);

  const [selectedOption, setSelectedOption] = useState('');

  // '판매중지' 상태인 위탁 상품은 화면에서 노출하지 않음
  if (status.includes('판매중지')) return null;

  // 닷홈 이미지 호스팅 주소 자동 매칭 규칙 (_detail_01.png)
  const thumbnailUrl = `https://zkzlzm.dothome.co.kr/img/product_assets/images/${id}_detail_01.png`;

  // 옵션 JSON 데이터 안전하게 파싱
  let parsedOptions = [];
  if (optionsStr) {
    try {
      let cleanJson = optionsStr.trim();
      if (cleanJson.startsWith('"') && cleanJson.endsWith('"')) {
        cleanJson = cleanJson.slice(1, -1).replace(/"{2}/g, '"');
      }
      parsedOptions = JSON.parse(cleanJson);
    } catch (e) {
      console.error("옵션 데이터 파싱 실패:", e);
    }
  }

  // 장바구니 담기 클릭 핸들러 (유저 인터랙션 확인용 알림 추가)
  const handleAddToCart = () => {
    if (parsedOptions.length > 0 && !selectedOption) {
      alert('⚠️ [필수] 옵션을 선택해 주세요!');
      return;
    }
    
    // 성공 시 작동을 눈으로 확인하기 위한 alert 팝업
    alert(`🛒 장바구니 담기 성공!\n\n• 상품명: ${title}\n• 선택옵션: ${selectedOption || '없음'}\n• 결제금액: ${Number(price).toLocaleString()}원\n\n정상적으로 작동합니다. 단계별 로드맵에 맞춰 백엔드 연동을 이어가면 됩니다!`);
  };

  return (
    <div className="border border-slate-100 rounded-lg p-5 shadow-sm hover:shadow-md transition bg-white flex flex-col justify-between">
      <div>
        {/* 상품 이미지 영역 */}
        <div className="w-full h-[250px] bg-slate-50 relative rounded-md overflow-hidden mb-5 group">
           {/* eslint-disable-next-line @next/next/no-img-element */}
           <img 
             src={thumbnailUrl}
             alt={title} 
             className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
             onError={(e) => {
               // 닷홈에 이미지가 없거나 경로가 틀렸을 때 깨짐 방지용 기본 이미지 처리
               (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Apple+Image+Preparing';
             }}
           />
        </div>
        
        {/* 상품 주요 정보 */}
        <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 text-sm mb-4 leading-relaxed line-clamp-2 h-10">
          {description}
        </p>
      </div>

      <div>
        <div className="text-xl font-bold text-red-600 mb-4">
          {Number(price).toLocaleString()}원
        </div>

        {/* 옵션 선택창 */}
        {parsedOptions.length > 0 && (
          <div className="mb-4">
            <select 
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="w-full border border-slate-300 p-2 text-sm rounded bg-white text-slate-700 outline-none focus:border-slate-800 transition cursor-pointer"
            >
              <option value="">[필수] 옵션을 선택해 주세요</option>
              {parsedOptions.map((opt: any, optIdx: number) => (
                <option key={optIdx} value={opt.name}>
                  {opt.name} {Number(opt.addPrice) > 0 ? `(+${Number(opt.addPrice).toLocaleString()}원)` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <button 
          onClick={handleAddToCart}
          className="w-full bg-slate-800 text-white py-3 rounded-md hover:bg-slate-700 transition font-medium text-sm active:scale-[0.99]"
        >
          장바구니 담기
        </button>
      </div>
    </div>
  );
}

// 3. 메인 홈 화면 컴포넌트
export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSUFMMm_wd_T5bU3e80Y8P4xfBzuvAGBtSndB9CJa2p47sqbil0KHQzRqeagJEet1g2sol7h5jIBC7m/pub?output=csv";
    
    // 브라우저 단에서 구글 시트 데이터를 다이렉트로 실시간 페치
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

  return (
    <main className="min-h-screen bg-slate-50/50">
      {/* 대문 배너 */}
      <section className="relative w-full h-[400px] bg-slate-900 flex items-center justify-center overflow-hidden">
        <Image 
          src="/images/6_fruitappleB01_main_01.png" 
          alt="애플어클락 메인 배너" 
          fill 
          priority
          className="object-cover brightness-[0.55]"
        />
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

      {/* 실시간 상품 진열대 */}
      <section className="max-w-5xl mx-auto py-16 px-4">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-10">
          애플어클락 실시간 상점
        </h2>
        
        {loading ? (
          <div className="text-center text-slate-500 py-12 bg-white rounded-lg border border-slate-100 shadow-sm">
            싱싱한 사과 데이터를 구글 시트에서 불러오는 중입니다...
          </div>
        ) : products.length === 0 ? (
          <div className="text-center text-slate-500 py-12 border border-slate-200 rounded-lg bg-slate-50">
            구글 시트에 등록된 상품 정보가 없거나 주소가 올바르지 않습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, index) => (
              <ProductCard key={index} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}