"use client";

import { useState, useEffect, useRef } from 'react';

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

  // 상단 검색 및 카테고리 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('홈 (전체)');
  const categories = ['홈 (전체)', '가정용 사과', 'A급 가정용 사과', '과일선물세트'];

  // 캐로슬 배너 상태
  const banners = [
    { id: 1, title: "애플어클락 오픈!", sub: "전상품 무료배송", color: "bg-red-500" },
    { id: 2, title: "A급 부사 특가", sub: "매일 먹어도 질리지 않아요", color: "bg-orange-500" },
    { id: 3, title: "명절 선물세트", sub: "사전예약 10% 할인", color: "bg-slate-800" },
    { id: 4, title: "못난이 사과", sub: "맛은 그대로, 가격은 뚝!", color: "bg-green-600" },
    { id: 5, title: "제철 과일", sub: "가장 신선할 때 보내드려요", color: "bg-teal-600" },
    { id: 6, title: "대량 구매 / B2B", sub: "농장에서 식탁까지 직송", color: "bg-blue-600" },
  ];
  
  const displayBanners = [...banners, ...banners];
  const [bannerIndex, setBannerIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  // [신규] 하단 고정 버튼 노출 여부 및 기본 버튼 위치 추적을 위한 상태와 Ref
  const [showBottomBar, setShowBottomBar] = useState(false);
  const primaryButtonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedProductId) return; 
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setBannerIndex((prev) => prev + 1);
    }, 1500);
    return () => clearInterval(timer);
  }, [selectedProductId]);

  const handleTransitionEnd = () => {
    if (bannerIndex >= banners.length) {
      setIsTransitioning(false); 
      setBannerIndex(0);         
    }
  };

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
        setProducts(parseCSV(decoder.decode(buffer)));
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // [신규] 상세페이지의 본문 구매 버튼이 화면에서 사라졌는지 감지하는 기능
  useEffect(() => {
    if (!selectedProductId || !primaryButtonsRef.current) {
      setShowBottomBar(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // 버튼 영역이 화면 밖으로 나가면(isIntersecting === false) 하단 바를 켭니다.
        setShowBottomBar(!entry.isIntersecting);
      },
      { threshold: 0 } // 요소가 1픽셀이라도 보이면 화면에 있는 것으로 간주
    );

    observer.observe(primaryButtonsRef.current);
    
    return () => observer.disconnect();
  }, [selectedProductId, products]);

  const getProductValue = (product: any, keyword: string) => {
    const foundKey = Object.keys(product).find(key => key.toLowerCase().includes(keyword.toLowerCase()));
    return foundKey ? product[foundKey]?.trim() : '';
  };

  const currentProduct = products.find(p => getProductValue(p, 'id') === selectedProductId);

  const handleSelectProduct = (id: string) => {
    setSelectedProductId(id);
    window.history.pushState(null, '', `?product=${id}`);
    window.scrollTo(0, 0); 
  };

  // --- [상세페이지 화면] ---
  if (selectedProductId && currentProduct) {
    const id = getProductValue(currentProduct, 'id');
    const title = getProductValue(currentProduct, 'title') || '상품명 없음';
    const basePrice = parseInt(getProductValue(currentProduct, 'price') || '0', 10);
    const description = getProductValue(currentProduct, 'description');
    const detailCount = parseInt(getProductValue(currentProduct, 'detailCount') || '1', 10);
    
    let parsedOptions = [];
    try {
      let cleanJson = getProductValue(currentProduct, 'options').trim();
      if (cleanJson.startsWith('"')) cleanJson = cleanJson.slice(1, -1).replace(/"{2}/g, '"');
      parsedOptions = JSON.parse(cleanJson);
    } catch {}

    const selectedOptObj = parsedOptions.find((opt: any) => opt.name === detailSelectedOption);
    const addPrice = selectedOptObj ? parseInt(selectedOptObj.addPrice || '0', 10) : 0;
    const totalPrice = basePrice + addPrice;

    const handleAddToCart = () => {
      if (parsedOptions.length > 0 && !detailSelectedOption) return alert('⚠️ [필수] 옵션을 먼저 선택해 주세요!');
      setCartCount(prev => prev + 1);
    };

    const handleBuyNow = () => {
      if (parsedOptions.length > 0 && !detailSelectedOption) return alert('⚠️ [필수] 옵션을 먼저 선택해 주세요!');
      alert('결제 페이지로 이동합니다. (다음 스텝에서 연동)');
    };

    return (
      <main className="min-h-screen bg-slate-50 pb-28">
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

        <div className="max-w-4xl mx-auto bg-white mb-2 shadow-sm">
          <div className="w-full aspect-square relative bg-slate-100">
            <img src={`https://zkzlzm.dothome.co.kr/img/product_assets/images/${id}_main_01.png`} alt={title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `https://zkzlzm.dothome.co.kr/img/product_assets/images/${id}_detail_01.png`; }} />
          </div>
          
          <div className="p-5">
            <h1 className="text-xl font-bold text-slate-800 mb-2">{title}</h1>
            <p className="text-slate-500 text-sm mb-4">{description}</p>
            <div className="text-3xl font-extrabold text-red-600 mb-6">{totalPrice.toLocaleString()}원</div>

            {/* [변경] 옵션 선택이 제일 위로 올라옵니다 */}
            {parsedOptions.length > 0 && (
              <div className="space-y-2 mb-6 bg-slate-50 p-4 rounded-md">
                <label className="text-sm font-semibold text-slate-700">옵션 선택 (필수)</label>
                <select value={detailSelectedOption} onChange={(e) => setDetailSelectedOption(e.target.value)} className="w-full border border-slate-300 p-3 text-sm rounded-md bg-white text-slate-700 outline-none focus:border-slate-800">
                  <option value="">옵션을 선택해 주세요</option>
                  {parsedOptions.map((opt: any, idx: number) => (
                    <option key={idx} value={opt.name}>{opt.name} {parseInt(opt.addPrice, 10) > 0 ? `(+${parseInt(opt.addPrice, 10).toLocaleString()}원)` : ''}</option>
                  ))}
                </select>
              </div>
            )}

            {/* [신규] 기본 장바구니 / 바로 구매하기 버튼 영역 (스크롤 감지 대상) */}
            <div ref={primaryButtonsRef} className="flex gap-2 mb-6">
              <button onClick={handleAddToCart} className="w-1/2 bg-white border border-slate-300 text-slate-800 font-bold py-4 rounded-md hover:bg-slate-50 transition flex items-center justify-center gap-2">
                장바구니
              </button>
              <button onClick={handleBuyNow} className="w-1/2 bg-slate-800 text-white font-bold py-4 rounded-md hover:bg-slate-700 transition">
                바로 구매하기
              </button>
            </div>

            {/* 카카오톡 문의 배너가 기본 구매 버튼 아래에 위치합니다 */}
            <div className="bg-[#FEE500] rounded-md p-4 flex items-center justify-center gap-2 cursor-pointer hover:bg-[#F4DC00] transition shadow-sm">
              <svg viewBox="0 0 24 24" fill="#191919" className="w-6 h-6"><path d="M12 3c-5.523 0-10 3.528-10 7.88 0 2.82 1.916 5.289 4.823 6.643-.223.805-.808 2.923-.836 3.037-.035.143.053.14.113.101.078-.052 3.197-2.148 4.475-3.036.463.064.938.095 1.425.095 5.523 0 10-3.528 10-7.88C22 6.528 17.523 3 12 3z"/></svg>
              <span className="text-[#191919] font-bold text-sm">카카오톡 실시간 상품 문의</span>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 bg-white py-10 shadow-sm">
          <h2 className="text-center font-bold text-slate-800 mb-8 text-lg border-b pb-4">상세 정보</h2>
          <div className="flex flex-col items-center w-full">
            {Array.from({ length: detailCount }).map((_, idx) => (
              <img key={idx} src={`https://zkzlzm.dothome.co.kr/img/product_assets/images/${id}_detail_${String(idx + 1).padStart(2, '0')}.png`} alt={`상세 ${idx + 1}`} className="w-full h-auto block" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ))}
          </div>
        </div>

        {/* [변경] 본문 버튼이 사라질 때만 스르륵 나타나는 하단 고정 액션 바 */}
        <div className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 transition-transform duration-300 ease-in-out ${showBottomBar ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="max-w-4xl mx-auto flex h-16">
            <button onClick={handleAddToCart} className="w-1/2 bg-white text-slate-800 font-bold border-r border-slate-200 hover:bg-slate-50 transition flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
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

  // --- [메인 화면 필터링] ---
  const filteredProducts = products.filter(product => {
    const title = getProductValue(product, 'title');
    const status = getProductValue(product, 'status') || '판매중';
    if (status.includes('판매중지')) return false;

    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '홈 (전체)' || title.includes(selectedCategory.replace('홈 (전체)', ''));
    
    return matchesSearch && matchesCategory;
  });

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <style dangerouslySetInnerHTML={{__html: `
        :root { --visible-items: 2; }
        @media (min-width: 768px) { :root { --visible-items: 4; } }
        .carousel-track {
           display: flex;
           transform: translateX(calc(-1 * var(--slide-index) * 100% / var(--visible-items)));
        }
        .carousel-item { flex: 0 0 calc(100% / var(--visible-items)); }
      `}} />

      <header className="bg-white sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="font-extrabold text-2xl text-slate-800 cursor-pointer flex-shrink-0" onClick={() => { setSearchTerm(''); setSelectedCategory('홈 (전체)'); }}>
            애플어클락
          </div>
          
          <div className="flex-1 max-w-sm bg-slate-100 rounded-md flex items-center px-4 py-2 border border-slate-200 focus-within:border-slate-400 transition ml-auto">
            <input 
              type="text" 
              placeholder="상품 검색..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent outline-none w-full text-sm text-slate-700" 
            />
            <svg className="w-5 h-5 text-slate-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>

          <div className="relative p-1 text-slate-700 cursor-pointer ml-2">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
            {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">{cartCount}</span>}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-2 flex gap-6 text-sm font-medium overflow-x-auto whitespace-nowrap scrollbar-hide">
          {categories.map((cat, idx) => (
            <span key={idx} onClick={() => setSelectedCategory(cat)} className={`cursor-pointer transition-colors ${selectedCategory === cat ? 'text-red-600 font-bold border-b-2 border-red-600 pb-2' : 'text-slate-500 hover:text-slate-800 pb-2'}`}>
              {cat}
            </span>
          ))}
        </div>
      </header>

      <section className="w-full bg-slate-800 py-6 overflow-hidden">
        <div className="max-w-6xl mx-auto px-2 relative">
          <div 
            className={`carousel-track ${isTransitioning ? 'transition-transform duration-500 ease-in-out' : ''}`}
            style={{ '--slide-index': bannerIndex } as any}
            onTransitionEnd={handleTransitionEnd}
          >
            {displayBanners.map((b, i) => (
              <div key={i} className="carousel-item px-2">
                <div className={`h-32 md:h-40 rounded-xl shadow-md flex flex-col items-center justify-center text-white ${b.color}`}>
                  <h3 className="font-bold text-lg md:text-xl mb-1">{b.title}</h3>
                  <p className="text-xs md:text-sm opacity-90">{b.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto py-10 px-4">
        {loading ? (
          <div className="text-center text-slate-500 py-12">상품 정보를 불러오는 중입니다...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center text-slate-500 py-12 bg-white rounded-lg border border-slate-100 shadow-sm">
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
                  <div className="w-full aspect-square bg-slate-50 relative">
                     <img src={mainThumbnailUrl} alt={title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `https://zkzlzm.dothome.co.kr/img/product_assets/images/${id}_detail_01.png`; }} />
                  </div>
                  <div className="p-3 md:p-4 flex flex-col flex-grow">
                    <h3 className="text-sm md:text-base font-bold text-slate-800 mb-1 line-clamp-2">{title}</h3>
                    <div className="text-base md:text-lg font-extrabold text-red-600 mt-auto pt-2 border-t border-slate-50">
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