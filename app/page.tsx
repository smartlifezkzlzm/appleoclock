import Image from 'next/image';

// 외부 라이브러리 없이 CSV 데이터의 쉼표와 따옴표(옵션 JSON 등)를 정교하게 분리해 주는 함수
function parseCSV(csv: string) {
  const lines = csv.split('\n');
  const result: Record<string, string>[] = []; // <- 이렇게 이름표를 붙여줍니다!
  if (lines.length === 0) return result;
  
  const headers = lines[0].split(',').map(h => h.trim());

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
        value += '"'; // 따옴표 내부 이스케이프 처리
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

// 구글 스프레드시트 데이터 불러오기
async function getProducts() {
  const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSUFMMm_wd_T5bU3e80Y8P4xfBzuvAGBtSndB9CJa2p47sqbil0KHQzRqeagJEet1g2sol7h5jIBC7m/pub?output=csv";
  
  try {
    // cache: 'no-store' 옵션으로 구글 시트 수정 내용이 즉각 반영되도록 합니다.
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('데이터 로드 실패');
    
    const buffer = await res.arrayBuffer();
    const decoder = new TextDecoder('utf-8'); // 한글 깨짐 방지
    const csvText = decoder.decode(buffer);
    
    return parseCSV(csvText);
  } catch (error) {
    console.error("데이터 로드 에러:", error);
    return [];
  }
}

export default async function Home() {
  // 컴포넌트가 실행될 때 시트에서 상품 목록을 가져옵니다.
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-white">
      {/* 1. 상단 메인 배너 영역 */}
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

      {/* 2. 구글 시트 연동 상품 리스트 영역 */}
      <section className="max-w-5xl mx-auto py-20 px-4">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-10">
          애플어클락 판매 상품
        </h2>
        
        {products.length === 0 ? (
          <div className="text-center text-slate-500 py-10 border border-slate-200 rounded-lg bg-slate-50">
            상품 데이터를 불러오는 중이거나 구글 시트에 등록된 상품이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, index) => {
              // 영어 헤더나 한글 헤더 중 어떤 것을 사용하셨든 유연하게 값을 가져옵니다.
              const id = product.id || product['상품코드'] || '';
              const title = product.title || product['상품명'] || '상품명 없음';
              const price = product.price || product['판매가격'] || 0;
              const status = product.status || product['판매상태'] || '판매중';
              const description = product.description || product['간단설명'] || '';
              const optionsStr = product.options || product['옵션 리스트'] || product['옵션리스트'] || '';

              // '판매중지' 상태인 상품은 화면에 보여주지 않고 건너뜁니다.
              if (status.includes('판매중지')) return null;

              // 닷홈 이미지 주소 자동 생성 (예: fruitappleA01_detail_01.png)
              const thumbnailUrl = `https://zkzlzm.dothome.co.kr/img/product_assets/images/${id}_detail_01.png`;

              // 옵션 데이터(JSON) 파싱
              let parsedOptions = [];
              if (optionsStr) {
                try {
                  parsedOptions = JSON.parse(optionsStr);
                } catch (e) {
                  // 옵션 데이터가 올바른 JSON 형태가 아니면 빈 배열 유지
                }
              }

              return (
                <div key={index} className="border border-slate-100 rounded-lg p-5 shadow-sm hover:shadow-md transition">
                  {/* 상품 썸네일 이미지 (닷홈 연동) */}
                  <div className="w-full h-[250px] bg-slate-50 relative rounded-md overflow-hidden mb-5 group">
                     {/* 외부 도메인(닷홈) 이미지는 일반 img 태그를 사용하는 것이 에러 방지에 좋습니다 */}
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                     <img 
                       src={thumbnailUrl}
                       alt={title} 
                       className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                     />
                  </div>
                  
                  {/* 상품 정보 출력 */}
                  <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
                  <p className="text-slate-500 text-sm mb-4 leading-relaxed line-clamp-2 h-10">
                    {description}
                  </p>
                  <div className="text-xl font-bold text-red-600 mb-4">
                    {Number(price).toLocaleString()}원
                  </div>

                  {/* 옵션이 있을 경우에만 선택창 표시 */}
                  {parsedOptions.length > 0 && (
                    <div className="mb-4">
                      <select className="w-full border border-slate-300 p-2 text-sm rounded bg-white text-slate-700 outline-none focus:border-slate-800 transition">
                        <option value="">[필수] 옵션을 선택해 주세요</option>
                        {parsedOptions.map((opt: any, optIdx: number) => (
                          <option key={optIdx} value={opt.name}>
                            {opt.name} {Number(opt.addPrice) > 0 ? `(+${Number(opt.addPrice).toLocaleString()}원)` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button className="w-full bg-slate-800 text-white py-3 rounded-md hover:bg-slate-700 transition font-medium text-sm">
                    장바구니 담기
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}