"use client";
import { supabase } from '@/utils/supabase';
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

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('홈 (전체)');
  const categories = ['홈 (전체)', '가정용 사과', 'A급 가정용 사과', '과일선물세트'];

  const [showBottomBar, setShowBottomBar] = useState(false);
  const primaryButtonsRef = useRef<HTMLDivElement>(null);

  const [bannerIndex, setBannerIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  // 💡 추가된 부분: 카카오 로그인 세션(고객 정보)을 담을 그릇
  const [session, setSession] = useState<any>(null);

  // 구글 시트 연동, 뒤로가기 및 로그인 세션 세팅
  useEffect(() => {
    // --- 로그인 세션 처리 시작 ---
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // URL에 남아있는 지저분한 토큰을 감지해서 로그인 처리하고 주소창을 깔끔하게 만들어줍니다.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    // --- 로그인 세션 처리 끝 ---

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

    return () => {
      window.removeEventListener('popstate', handlePopState);
      subscription.unsubscribe();
    };
  }, []);

  const getProductValue = (product: any, keyword: string) => {
    const foundKey = Object.keys(product).find(key => key.toLowerCase().includes(keyword.toLowerCase()));
    return foundKey ? product[foundKey]?.trim() : '';
  };

  // 캐로슬 전용 상위 5개 상품 추출
  const carouselProducts = products.filter(p => {
    const status = getProductValue(p, 'status') || '판매중';
    return !status.includes('판매중지');
  }).slice(0, 5);
  
  const displayBanners = [...carouselProducts, ...carouselProducts];

  // 캐로슬 타이머
  useEffect(() => {
    if (selectedProductId || carouselProducts.length === 0) return; 
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setBannerIndex((prev) => prev + 1);
    }, 2000);
    return () => clearInterval(timer);
  }, [selectedProductId, carouselProducts.length]);

  const handleTransitionEnd = () => {
    if (bannerIndex >= carouselProducts.length) {
      setIsTransitioning(false); 
      setBannerIndex(0);         
    }
  };

  // 하단 구매버튼 스크롤 감지
  useEffect(() => {
    if (!selectedProductId || !primaryButtonsRef.current) {
      setShowBottomBar(false);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setShowBottomBar(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(primaryButtonsRef.current);
    return () => observer.disconnect();
  }, [selectedProductId, products]);

  const currentProduct = products.find(p => getProductValue(p, 'id') === selectedProductId);

  const handleSelectProduct = (id: string) => {
    setSelectedProductId(id);
    window.history.pushState(null, '', `?product=${id}`);
    window.scrollTo(0, 0); 
  };

  // 공통 푸터 컴포넌트
  const Footer = () => (
    <footer className="bg-slate-100 text-slate-500 py-10 px-4 mt-auto border-t border-slate-200 w-full">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-6 text-xs md:text-sm">
        <div className="space-y-2 text-center md:text-left">
          <h4 className="font-extrabold text-slate-700 text-base mb-3">스마트라이프 주식회사</h4>
          <p>대표: 박영환 | 사업자등록번호: [번호 입력]</p>
          <p>주소: 충청남도 천안시 [상세 주소 입력]</p>
          <p>통신판매업 신고번호: [번호 입력]</p>
          <p>이메일: [이메일 입력] | 고객센터: [전화번호 입력]</p>
        </div>
        <div className="flex gap-4 font-medium">
          <span className="cursor-pointer hover:text-slate-800 transition">이용약관</span>
          <span className="cursor-pointer hover:text-slate-800 transition font-bold">개인정보처리방침</span>
        </div>
      </div>
    </footer>
  );

  const filteredProducts = products.filter(product => {
    const title = getProductValue(product, 'title');
    const status = getProductValue(product, 'status') || '판매중';
    if (status.includes('판매중지')) return false;

    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '홈 (전체)' || title.includes(selectedCategory.replace('홈 (전체)', ''));
    
    return matchesSearch && matchesCategory;
  });

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <style dangerouslySetInnerHTML={{__html: `
        :root { --visible-items: 2; }
        @media (min-width: 768px) { :root { --visible-items: 4; } }
        .carousel-track { display: flex; transform: translateX(calc(-1 * var(--slide-index) * 100% / var(--visible-items))); }
        .carousel-item { flex: 0 0 calc(100% / var(--visible-items)); }
      `}} />

      {/* --- 통합 공통 상단 헤더 --- */}
      <header className="bg-white sticky top-0 z-50 border-b border-slate-100 shadow-sm w-full">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2 md:gap-4">
          
          {selectedProductId && (
            <button 
              onClick={() => window.history.back()} 
              className="text-slate-600 hover:text-slate-900 font-bold text-xl md:text-2xl mr-1 transition"
            >
              ←
            </button>
          )}

          <div 
            className="font-extrabold text-xl md:text-2xl text-slate-800 cursor-pointer flex-shrink-0" 
            onClick={() => { setSearchTerm(''); setSelectedCategory('홈 (전체)'); setSelectedProductId(null); window.history.pushState(null, '', '/'); }}
          >
            애플어클락
          </div>
          
          <div className="flex-1 max-w-sm bg-slate-100 rounded-md flex items-center px-3 py-2 border border-slate-200 focus-within:border-slate-400 transition ml-auto">
            <input 
              type="text" 
              placeholder="상품 검색..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (selectedProductId) {
                  setSelectedProductId(null);
                  window.history.pushState(null, '', '/');
                }
              }}
              className="bg-transparent outline-none w-full text-sm text-slate-700 hidden md:block" 
            />
            <svg className="w-5 h-5 text-slate-400 ml-2 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>

          {/* 💡 수정된 부분: 로그인 상태에 따라 버튼 변경 */}
          {session ? (
            <div 
              className="text-sm font-bold text-slate-800 hover:text-red-600 cursor-pointer transition ml-2 whitespace-nowrap bg-yellow-100 px-3 py-1.5 rounded-full"
              onClick={() => window.location.href = '/profile'}
            >
              {session.user.user_metadata.name}님
            </div>
          ) : (
            <div 
              className="text-sm font-bold text-slate-600 hover:text-slate-900 cursor-pointer transition ml-2 whitespace-nowrap"
              onClick={() => window.location.href = '/login'}
            >
              로그인
            </div>
          )}

          {/* 장바구니 아이콘 */}
          <div className="relative p-1 text-slate-700 cursor-pointer ml-1 md:ml-2">
            <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
            {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center">{cartCount}</span>}
          </div>
        </div>

        {/* 카테고리 네비게이션 바 */}
        <div className="max-w-5xl mx-auto px-4 py-2 flex gap-6 text-sm font-medium overflow-x-auto whitespace-nowrap scrollbar-hide">
          {categories.map((cat, idx) => (
            <span 
              key={idx} 
              onClick={() => {
                setSelectedCategory(cat);
                if (selectedProductId) {
                  setSelectedProductId(null);
                  window.history.pushState(null, '', '/');
                }
              }} 
              className={`cursor-pointer transition-colors ${selectedCategory === cat ? 'text-red-600 font-bold border-b-2 border-red-600 pb-2' : 'text-slate-500 hover:text-slate-800 pb-2'}`}
            >
              {cat}
            </span>
          ))}
        </div>
      </header>

      {/* --- 본문 영역 분기 --- */}
      {selectedProductId && currentProduct ? (
        <div className="w-full flex flex-col flex-grow items-center">
          {(() => {
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
              alert('결제 페이지로 이동합니다.');
            };

            return (
              <>
                <div className="max-w-4xl w-full bg-white mb-2 shadow-sm">
                  <div className="w-full aspect-square relative bg-slate-100">
                    <img src={`https://zkzlzm.dothome.co.kr/img/product_assets/images/${id}_main_01.png`} alt={title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `https://zkzlzm.dothome.co.kr/img/product_assets/images/${id}_detail_01.png`; }} />
                  </div>
                  
                  <div className="p-5">
                    <h1 className="text-xl font-bold text-slate-800 mb-2">{title}</h1>
                    <p className="text-slate-500 text-sm mb-4">{description}</p>
                    <div className="text-3xl font-extrabold text-red-600 mb-6">{totalPrice.toLocaleString()}원</div>

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

                    <div ref={primaryButtonsRef} className="flex gap-2 mb-6">
                      <button onClick={handleAddToCart} className="w-1/2 bg-white border border-slate-300 text-slate-800 font-bold py-4 rounded-md hover:bg-slate-50 transition flex items-center justify-center gap-2">
                        장바구니
                      </button>
                      <button onClick={handleBuyNow} className="w-1/2 bg-slate-800 text-white font-bold py-4 rounded-md hover:bg-slate-700 transition">
                        바로 구매하기
                      </button>
                    </div>

                    <div className="bg-[#FEE500] rounded-md p-4 flex items-center justify-center gap-2 cursor-pointer hover:bg-[#F4DC00] transition shadow-sm">
                      <svg viewBox="0 0 24 24" fill="#191919" className="w-6 h-6"><path d="M12 3c-5.523 0-10 3.528-10 7.88 0 2.82 1.916 5.289 4.823 6.643-.223.805-.808 2.923-.836 3.037-.035.143.053.14.113.101.078-.052 3.197-2.148 4.475-3.036.463.064.938.095 1.425.095 5.523 0 10-3.528 10-7.88C22 6.528 17.523 3 12 3z"/></svg>
                      <span className="text-[#191919] font-bold text-sm">카카오톡 실시간 상품 문의</span>
                    </div>
                  </div>
                </div>

                <div className="max-w-3xl w-full mx-auto px-4 bg-white py-10 shadow-sm mb-10">
                  <h2 className="text-center font-bold text-slate-800 mb-8 text-lg border-b pb-4">상세 정보</h2>
                  <div className="flex flex-col items-center w-full">
                    {Array.from({ length: detailCount }).map((_, idx) => (
                      <img key={idx} src={`https://zkzlzm.dothome.co.kr/img/product_assets/images/${id}_detail_${String(idx + 1).padStart(2, '0')}.png`} alt={`상세 ${idx + 1}`} className="w-full h-auto block" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ))}
                  </div>
                </div>

                {/* 하단 고정 스크롤 바 */}
                <div className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 transition-transform duration-300 ease-in-out ${(showBottomBar && selectedProductId) ? 'translate-y-0' : 'translate-y-full'}`}>
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
              </>
            );
          })()}
        </div>
      ) : (
        <div className="w-full flex flex-col flex-grow">
          {carouselProducts.length > 0 && (
            <section className="w-full bg-slate-900 py-6 overflow-hidden border-b border-slate-800">
              <div className="max-w-6xl mx-auto px-2 relative">
                <div 
                  className={`carousel-track ${isTransitioning ? 'transition-transform duration-500 ease-in-out' : ''}`}
                  style={{ '--slide-index': bannerIndex } as any}
                  onTransitionEnd={handleTransitionEnd}
                >
                  {displayBanners.map((product, i) => {
                    const id = getProductValue(product, 'id');
                    const title = getProductValue(product, 'title');
                    const price = parseInt(getProductValue(product, 'price') || '0', 10);
                    const bannerImageUrl = `https://zkzlzm.dothome.co.kr/img/product_assets/images/${id}_main_01.png`;

                    return (
                      <div key={i} className="carousel-item px-2" onClick={() => handleSelectProduct(id)}>
                        <div className="cursor-pointer relative h-36 md:h-44 rounded-xl shadow-lg flex flex-col items-center justify-center overflow-hidden group border border-slate-700/50">
                          <img src={bannerImageUrl} className="absolute inset-0 w-full h-full object-cover brightness-[0.45] group-hover:scale-110 transition-transform duration-700" alt={title} onError={(e) => { (e.target as HTMLImageElement).src = `https://zkzlzm.dothome.co.kr/img/product_assets/images/${id}_detail_01.png`; }} />
                          <div className="relative z-10 text-white text-center px-4 w-full">
                            <h3 className="font-extrabold text-lg md:text-xl mb-1 truncate drop-shadow-md">{title}</h3>
                            <p className="text-sm md:text-base font-medium opacity-90 text-red-400 drop-shadow-md">{price.toLocaleString()}원</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          <section className="max-w-5xl w-full mx-auto py-10 px-4">
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
        </div>
      )}
      
      <Footer />
    </main>
  );
}