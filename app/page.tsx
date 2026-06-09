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

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [detailSelectedOption, setDetailSelectedOption] = useState('');
  
  // 장바구니 담긴 수량 카운트 상태
  const [cartCount, setCartCount] = useState(0);

  // [핵심 기능] 브라우저 기본 뒤로가기 / 앞으로가기 단추 완벽 싱크 로직
  useEffect(() => {
    const handlePopState = () => {
      // 주소창이 바뀔 때마다 파라미터를 읽어 화면을 전환합니다.
      const params = new URLSearchParams(window.location.search);
      const prodId = params.get('product');
      setSelectedProductId(prodId);
    };

    // 브라우저 뒤로가기 감지 리스너 등록
    window.addEventListener('popstate', handlePopState);

    // 첫 진입 시 URL 뒤에 ?product=코드 가 붙어있다면 해당 상세페이지로 바로 로딩
    const params = new URLSearchParams(window.location.search);
    const prodId = params.get('product');
    if (prodId) {
      setSelectedProductId(prodId);
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

  const getProductValue = (product: any, keyword: string) => {
    const foundKey = Object.keys(product).find(key => 
      key.toLowerCase().includes(keyword.toLowerCase())
    );
    return foundKey ? product[foundKey]?.trim() : '';
  };

  const currentProduct = products.find(p => getProductValue(p, 'id') === selectedProductId);

  const parseOptions = (optionsStr: string) => {
    if (!optionsStr) return [];
    try {
      let cleanJson = optionsStr.trim();
      if (cleanJson.startsWith('"') && cleanJson.endsWith('"')) {
        cleanJson = cleanJson.slice(1, -1).replace(/"{2}/g, '"');
      }
      return JSON.parse(cleanJson);
    } catch (e) {
      return [];
    }
  };

  // 상품 포스터나 제목을 누르면 주소창을 바꾸면서 히스토리에 기록을 남김
  const handleSelectProduct = (id: string) => {
    setSelectedProductId(id);
    window.history.pushState(null, '', `?product=${id}`);
  };

  // 목록으로 돌아가기 단추를 누르면 브라우저의 자체 뒤로가기 기능 기능을 강제 실행
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <main className="min-h-screen bg-slate-50/50 pb-20">
      
      {/* 2. 상단 통합 공통 헤더 바 (디자인 일관성 및 장바구니 아이콘 탑재) */}
      <header className="border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedProductId && (
              <button 
                onClick={handleGoBack} 
                className="text-slate-500 hover:text-slate-800 flex items-center gap-0.5 text-sm font-medium transition"
              >
                ← 뒤로
              </button>
            )}
            <span 
              onClick={() => {
                if (selectedProductId) {
                  window.history.pushState(null, '', '/');
                  setSelectedProductId(null);
                  setDetailSelectedOption('');
                }
              }}
              className="font-bold text-lg text-slate-800 cursor-pointer hover:text-red-600 transition"
            >
              애플어클락
            </span>
          </div>
          
          {/* 장바구니 수량 숫자 표시 배지 영역 */}
          <div className="relative p-2 text-slate-700 hover:text-slate-900 transition cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow animate-fade-in">
                {cartCount}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* 3. 조건부 본문 영역 분기 */}
      {selectedProductId && currentProduct ? (
        (() => {
          const id = getProductValue(currentProduct, 'id');
          const title = getProductValue(currentProduct, 'title') || '상품명 없음';
          const basePrice = parseInt(getProductValue(currentProduct, 'price') || '0', 10);
          const description = getProductValue(currentProduct, 'description');
          const detailCount = parseInt(getProductValue(currentProduct, 'detailCount') || '1', 10);
          const optionsStr = getProductValue(currentProduct, 'options');
          const parsedOptions = parseOptions(optionsStr);

          const selectedOptObj = parsedOptions.find((opt: any) => opt.name === detailSelectedOption);
          const addPrice = selectedOptObj ? parseInt(selectedOptObj.addPrice || '0', 10) : 0;
          const totalPrice = basePrice + addPrice;

          const handleDetailAddToCart = () => {
            if (parsedOptions.length > 0 && !detailSelectedOption) {
              alert('⚠️ [필수] 옵션을 먼저 선택해 주세요!');
              return;
            }
            // 기존 팝업 알림을 완벽히 제거하고 카운팅만 올립니다
            setCartCount(prev => prev + 1);
          };

          return (
            <div className="bg-white pb-20">
              <div className="max-w-4xl mx-auto pt-10 px-4 grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
                <div className="w-full h-[400px] relative rounded-lg overflow-hidden bg-slate-50">
                  <img 
                    src={`https://zkzlzm.dothome.co.kr/img/product_assets/images/${id}_main_01.png`}
                    alt={title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://zkzlzm.dothome.co.kr/img/product_assets/images/${id}_detail_01.png`;
                    }}
                  />
                </div>
                
                <div className="flex flex-col py-2">
                  <div className="space-y-4 flex-grow">
                    <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
                    <p className="text-slate-600 leading-relaxed">{description}</p>
                    <div className="text-3xl font-extrabold text-red-600 pt-2">
                      {totalPrice.toLocaleString()}원
                    </div>

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
            </div>
          );
        })()
      ) : (
        <>
          {/* 메인 상점 화면 배너 */}
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

          {/* 메인 상점 상업 리스트 */}
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

                  const mainThumbnailUrl = `https://zkzlzm.dothome.co.kr/img/product_assets/images/${id}_main_01.png`;

                  return (
                    <div key={index} className="border border-slate-100 rounded-lg p-5 shadow-sm hover:shadow-md transition bg-white flex flex-col justify-between">
                      <div>
                        <div 
                          onClick={() => handleSelectProduct(id)}
                          className="w-full h-[240px] bg-slate-50 relative rounded-md overflow-hidden mb-4 group cursor-pointer"
                        >
                           <img 
                             src={mainThumbnailUrl}
                             alt={title} 
                             className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                             onError={(e) => {
                               (e.target as HTMLImageElement).src = `https://zkzlzm.dothome.co.kr/img/product_assets/images/${id}_detail_01.png`;
                             }}
                           />
                        </div>
                        
                        <h3 
                          onClick={() => handleSelectProduct(id)}
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
                          onClick={() => handleSelectProduct(id)}
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
        </>
      )}
    </main>
  );
}