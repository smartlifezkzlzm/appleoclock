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
  const [cartCount, setCartCount] = useState(0);

  // [신규] 검색 및 카테고리 필터링 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const categories = ['전체', '가정용 사과', 'A급 가정용 사과', '과일선물세트'];

  // [신규] 움직이는 슬라이드 배너 상태
  const [currentBanner, setCurrentBanner] = useState(0);
  const banners = [
    { id: 1, text: "애플어클락 그랜드 오픈!", sub: "가장 맛있는 사과를 식탁으로", color: "bg-red-500" },
    { id: 2, text: "A급 가정용 사과 특가", sub: "매일 먹어도 질리지 않는 아삭함", color: "bg-orange-500" },
    { id: 3, text: "대량 구매 / B2B 환영", sub: "업체 및 단체 주문 문의", color: "bg-slate-800" },
  ];

  // 브라우저 뒤로가기 동기화 및 엑셀 데이터 로드
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setSelectedProductId(params.get('product'));
    };
    window.addEventListener('popstate', handlePopState);

    const params = new URLSearchParams(window.location.search);
    if (params.get('product')) setSelectedProductId(params.get('product'));

    const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSUFMMm_wd_T5bU3e80Y8P4xfBzuvAGBtSndB9CJa2p47sqbil0KHQzRqeagJEet1g2sol7h5jIBC7m/pub?output=csv";
    fetch(url)
      .then(res => res.arrayBuffer())
      .then(buffer => {
        const decoder = new TextDecoder('utf-8');
        const parsed = parseCSV(decoder.decode(buffer));
        setProducts(parsed);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 움직이는 배너 타이머 (3초마다 자동 슬라이드)
  useEffect(() => {
    if (selectedProductId) return; // 상세페이지에서는 타이머 일시정지
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [selectedProductId, banners.length]);

  const getProductValue = (product: any, keyword: string) => {
    const foundKey = Object.keys(product).find(key => key.toLowerCase().includes(keyword.toLowerCase()));
    return foundKey ? product[foundKey]?.trim() : '';
  };

  const parseOptions = (optionsStr: string) => {
    if (!optionsStr) return [];
    try {
      let cleanJson = optionsStr.trim();
      if (cleanJson.startsWith('"') && cleanJson.endsWith('"')) {
        cleanJson = cleanJson.slice(1, -1).replace(/"{2}/g, '"');
      }
      return JSON.parse(cleanJson);
    } catch { return []; }
  };

  const handleSelectProduct = (id: string) => {
    setSelectedProductId(id);
    window.history.pushState(null, '', `?product=${id}`);
  };

  const currentProduct = products.find(p => getProductValue(p, 'id') === selectedProductId);

  // --- [상세페이지 화면] ---
  if (selectedProductId && currentProduct) {
    const id = getProductValue(currentProduct, 'id');
    const title = getProductValue(currentProduct, 'title') || '상품명 없음';
    const basePrice = parseInt(getProductValue(currentProduct, 'price') || '0', 10);
    const description = getProductValue(currentProduct, 'description');
    const detailCount = parseInt(getProductValue(currentProduct, 'detailCount') || '1', 10);
    const parsedOptions = parseOptions(getProductValue(currentProduct, 'options'));

    const selectedOptObj = parsedOptions.find((opt: any) => opt.name === detailSelectedOption);
    const addPrice = selectedOptObj ? parseInt(selectedOptObj.addPrice || '0', 10) : 0;
    const totalPrice = basePrice + addPrice;

    const handleAddToCart = () => {
      if (parsedOptions.length > 0 && !detailSelectedOption) {
        alert('⚠️ [필수] 옵션을 먼저 선택해 주세요!');
        return;
      }
      setCartCount(prev => prev + 1);
    };

    const handleBuyNow = () => {
      if (parsedOptions.length > 0 && !detailSelectedOption) {
        alert('⚠️ [필수] 옵션을 먼저 선택해 주세요!');
        return;
      }
      alert('결제 페이지로 이동합니다. (다음 스텝에서 구현)');
    };

    return (
      <main className="min-h-screen bg-slate-50 pb-28"> {/* 하단 고정바 공간(pb-28) 확보 */}
        <header className="border-b border-slate-200 sticky top-0 bg-white z-50">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <button onClick={() => window.history.back()} className="text-slate-600 font-bold text-xl">←</button>
            <span className="font-bold text-slate-800">상품 상세</span>
            <div className="relative p-2 text-slate-700">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
              {cartCount > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">{cartCount}</span>}
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto bg-white mb-2">
          <div className="w-full aspect-square relative bg-slate-100">
            <img src={`https://zkzlzm.dothome.co.kr/img/product_assets/images/${id}_main_01.png`} alt={title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `https://zkzlzm.dothome.co.kr/img/product_assets/images/${id}_detail_01.png`; }} />
          </div>
          
          <div className="p-5">
            <h1 className="text-xl font-bold text-slate-800 mb-2">{title}</h1>
            <p className="text-slate-500 text-sm mb-4 leading-relaxed">{description}</p>
            <div className="text-2xl font-extrabold text-red-600 mb-6">{totalPrice.toLocaleString()}원</div>

            {/* 카카오톡 문의 배너 */}
            <div className="bg-[#FEE500] rounded-lg p-4 flex items-center justify-center gap-2 cursor-pointer hover:bg-[#F4DC00] transition mb-6 shadow-sm">
              <svg viewBox="0 0 24 24" fill="#191919" className="w-6 h-6"><path d="M12 3c-5.523 0-10 3.528-10 7.88 0 2.82 1.916 5.289 4.823 6.643-.223.805-.808 2.923-.836 3.037-.035.143.053.14.113.101.078-.052 3.197-2.148 4.475-3.036.463.064.938.095 1.425.095 5.523 0 10-3.528 10-7.88C22 6.528 17.523 3 12 3z"/></svg>
              <span className="text-[#191919] font-bold text-sm">카카오톡 실시간 상품 문의</span>
            </div>

            {parsedOptions.length > 0 && (
              <div className="space-y-2 border-t pt-6">
                <label className="text-sm font-semibold text-slate-700">옵션 선택 (필수)</label>
                <select value={detailSelectedOption} onChange={(e) => setDetailSelectedOption(e.target.value)} className="w-full border border-slate-300 p-3 text-sm rounded-md bg-white text-slate-700 outline-none">
                  <option value="">옵션을 선택해 주세요</option>
                  {parsedOptions.map((opt: any, idx: number) => (
                    <option key={idx} value={opt.name}>{opt.name} {parseInt(opt.addPrice, 10) > 0 ? `(+${parseInt(opt.addPrice, 10).toLocaleString()}원)` : ''}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 bg-white py-10">
          <h2 className="text-center font-bold text-slate-800 mb-8 text-lg border-b pb-4">상세 정보</h2>
          <div className="flex flex-col items-center w-full">
            {Array.from({ length: detailCount }).map((_, idx) => (
              <img key={idx} src={`https://zkzlzm.dothome.co.kr/img/product_assets/images/${id}_detail_${String(idx + 1).padStart(2, '0')}.png`} alt={`상세 ${idx + 1}`} className="w-full h-auto block" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ))}
          </div>
        </div>

        {/* [신규] 하단 고정 구매 액션 바 (장바구니 50% / 구매하기 50%) */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200">
          <div className="max-w-4xl mx-auto flex h-16">
            <button onClick={handleAddToCart} className="w-1/2 bg-white text-slate-800 font-bold border-r border-slate-200 hover:bg-slate-50 transition">
              장바구니
            </button>
            <button onClick={handleBuyNow} className="w-1/2 bg-slate-800 text-white font-bold hover:bg-slate-700 transition">
              바로 구매하기
            </button>
          </div>
        </div>
      </main>
    );
  }

  // --- [메인 화면] ---
  // 검색어 및 카테고리에 따른 상품 필터링 로직
  const filteredProducts = products.filter(product => {
    const title = getProductValue(product, 'title');
    const status = getProductValue(product, 'status') || '판매중';
    if (status.includes('판매중지')) return false;

    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
    // 엑셀에 카테고리 열이 없다면 상품명에 해당 카테고리 단어가 포함되어 있는지로 필터링합니다.
    const matchesCategory = selectedCategory === '전체' || title.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      
      {/* 1. 상단 글로벌 헤더 (로고, 검색창, 장바구니) */}
      <header className="bg-white sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="font-extrabold text-xl text-slate-800 cursor-pointer" onClick={() => { setSearchTerm(''); setSelectedCategory('전체'); }}>
            애플어클락
          </div>
          <div className="flex-1 max-w-md bg-slate-100 rounded-full flex items-center px-4 py-2 border border-slate-200 focus-within:border-slate-400 transition">
            <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="상품 검색..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent outline-none w-full text-sm text-slate-700" 
            />
          </div>
          <div className="relative p-1 text-slate-700 cursor-pointer">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
            {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">{cartCount}</span>}
          </div>
        </div>

        {/* 2. 네비게이션 및 상세 카테고리 */}
        <div className="max-w-5xl mx-auto px-4 py-2 border-t border-slate-50 flex gap-6 text-sm font-medium overflow-x-auto whitespace-nowrap scrollbar-hide">
          <span onClick={() => setSelectedCategory('전체')} className={`cursor-pointer ${selectedCategory === '전체' ? 'text-red-600 font-bold border-b-2 border-red-600 pb-2' : 'text-slate-500 hover:text-slate-800 pb-2'}`}>홈 (전체)</span>
          {categories.slice(1).map((cat, idx) => (
            <span key={idx} onClick={() => setSelectedCategory(cat)} className={`cursor-pointer ${selectedCategory === cat ? 'text-red-600 font-bold border-b-2 border-red-600 pb-2' : 'text-slate-500 hover:text-slate-800 pb-2'}`}>
              {cat}
            </span>
          ))}
        </div>
      </header>

      {/* 3. 움직이는 자동 슬라이드 배너 */}
      <section className="w-full relative h-[180px] md:h-[250px] overflow-hidden bg-slate-900">
        {banners.map((banner, index) => (
          <div 
            key={banner.id} 
            className={`absolute inset-0 flex flex-col items-center justify-center text-white transition-opacity duration-1000 ${banner.color} ${index === currentBanner ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            <h2 className="text-2xl md:text-4xl font-extrabold mb-2 drop-shadow-md">{banner.text}</h2>
            <p className="text-sm md:text-lg font-medium opacity-90">{banner.sub}</p>
          </div>
        ))}
        {/* 슬라이드 점(Dots) 표시 */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
          {banners.map((_, idx) => (
            <div key={idx} className={`w-2 h-2 rounded-full ${idx === currentBanner ? 'bg-white' : 'bg-white/40'}`} />
          ))}
        </div>
      </section>

      {/* 4. 상품 리스트 영역 */}
      <section className="max-w-5xl mx-auto py-10 px-4">
        {loading ? (
          <div className="text-center text-slate-500 py-12">상품 정보를 불러오는 중입니다...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center text-slate-500 py-12 bg-white rounded-lg border border-slate-100">
            조건에 맞는 상품이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {filteredProducts.map((product, index) => {
              const id = getProductValue(product, 'id');
              const title = getProductValue(product, 'title') || '상품명 없음';
              const price = parseInt(getProductValue(product, 'price') || '0', 10);
              const mainThumbnailUrl = `https://zkzlzm.dothome.co.kr/img/product_assets/images/${id}_main_01.png`;

              return (
                <div key={index} onClick={() => handleSelectProduct(id)} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer border border-slate-100 flex flex-col">
                  {/* 사진 확대(hover:scale) 효과 제거, 깔끔한 정규 썸네일 */}
                  <div className="w-full aspect-square bg-slate-50 relative">
                     <img src={mainThumbnailUrl} alt={title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `https://zkzlzm.dothome.co.kr/img/product_assets/images/${id}_detail_01.png`; }} />
                  </div>
                  <div className="p-3 md:p-4 flex flex-col flex-grow">
                    <h3 className="text-sm md:text-base font-bold text-slate-800 mb-1 line-clamp-2">{title}</h3>
                    <div className="text-base md:text-lg font-extrabold text-red-600 mt-auto">
                      {price.toLocaleString()}원
                    </div>
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