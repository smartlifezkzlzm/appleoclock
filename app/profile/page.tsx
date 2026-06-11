"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
// 💡 카카오(다음) 주소 검색 도구 불러오기
import DaumPostcode from 'react-daum-postcode';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [address, setAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  
  // 💡 주소 검색창(팝업)을 띄울지 말지 결정하는 스위치
  const [isOpenPostcode, setIsOpenPostcode] = useState(false);

  useEffect(() => {
    checkUserAndProfile();
  }, []);

  const checkUserAndProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      setUser(session.user);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setName(profile.name || '');
        setPhone(profile.phone || '');
        setZipCode(profile.zip_code || '');
        setAddress(profile.address || '');
        setDetailAddress(profile.detail_address || '');
      }
    }
    setLoading(false);
  };

  // 💡 주소 검색이 완료되었을 때 실행되는 마법의 함수
  const handleCompletePostcode = (data: any) => {
    let fullAddress = data.address; // 기본 주소
    let extraAddress = ''; // 추가 주소 (동, 건물명 등)

    if (data.addressType === 'R') {
      if (data.bname !== '') extraAddress += data.bname;
      if (data.buildingName !== '') extraAddress += extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName;
      fullAddress += extraAddress !== '' ? ` (${extraAddress})` : '';
    }

    // 화면의 빈칸에 검색된 우편번호와 주소를 촥! 채워줍니다.
    setZipCode(data.zonecode);
    setAddress(fullAddress);
    
    // 검색창 팝업을 닫습니다.
    setIsOpenPostcode(false);
  };

  const handleSave = async () => {
    if (!user) {
      alert('카카오 로그인이 필요합니다!');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        name: name,
        phone: phone,
        zip_code: zipCode,
        address: address,
        detail_address: detailAddress,
        updated_at: new Date()
      });

    if (error) {
      console.error(error);
      alert('저장 중 오류가 발생했습니다.');
    } else {
      alert('📦 기본 배송지가 안전하게 저장되었습니다!');
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">정보를 불러오는 중입니다...</div>;
  
  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="p-8 bg-white rounded-lg shadow-md text-center">
        <h2 className="text-xl font-bold mb-4">로그인이 필요합니다</h2>
        <p className="text-slate-500 mb-6">배송지를 관리하려면 먼저 로그인해 주세요.</p>
        <button onClick={() => window.location.href = '/login'} className="bg-[#FEE500] text-[#191919] px-6 py-2 rounded-md font-bold">
          카카오 로그인하러 가기
        </button>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 relative">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-slate-100 p-8">
        {/* 뒤로가기 버튼 추가 */}
        <div className="flex items-center mb-6">
          <button onClick={() => window.location.href = '/'} className="text-slate-400 hover:text-slate-800 mr-3 text-xl">←</button>
          <h1 className="text-2xl font-bold text-slate-800">기본 배송지 관리</h1>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">받으시는 분</label>
            <input 
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-300 p-3 rounded-md outline-none focus:border-slate-800"
              placeholder="홍길동"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">연락처</label>
            <input 
              type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-slate-300 p-3 rounded-md outline-none focus:border-slate-800"
              placeholder="010-1234-5678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">우편번호</label>
            <div className="flex gap-2">
              <input 
                type="text" value={zipCode} readOnly
                className="w-full border border-slate-300 p-3 rounded-md outline-none bg-slate-50 text-slate-500"
                placeholder="우편번호"
              />
              <button 
                onClick={() => setIsOpenPostcode(true)}
                className="whitespace-nowrap bg-slate-800 text-white px-4 rounded-md font-bold hover:bg-slate-700 transition"
              >
                주소 검색
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">기본 주소</label>
            <input 
              type="text" value={address} readOnly
              className="w-full border border-slate-300 p-3 rounded-md outline-none bg-slate-50 text-slate-500"
              placeholder="주소 검색을 이용해 주세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">상세 주소</label>
            <input 
              type="text" value={detailAddress} onChange={(e) => setDetailAddress(e.target.value)}
              className="w-full border border-slate-300 p-3 rounded-md outline-none focus:border-slate-800"
              placeholder="동/호수 입력 (예: 101동 202호)"
            />
          </div>

          <button 
            onClick={handleSave}
            className="w-full bg-slate-800 text-white font-bold py-4 rounded-md hover:bg-slate-700 transition mt-4 shadow-sm"
          >
            배송지 저장하기
          </button>
        </div>
      </div>

      {/* 💡 주소 검색창 팝업 화면 */}
      {isOpenPostcode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl overflow-hidden shadow-2xl relative">
            <div className="bg-slate-800 px-4 py-3 flex justify-between items-center">
              <h3 className="text-white font-bold">주소 검색</h3>
              <button onClick={() => setIsOpenPostcode(false)} className="text-white text-xl font-bold hover:text-red-400">✕</button>
            </div>
            <div className="h-[400px] w-full">
              <DaumPostcode onComplete={handleCompletePostcode} style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}