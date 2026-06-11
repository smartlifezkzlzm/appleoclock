"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase'; // utils 폴더 위치에 따라 경로(../)를 조절해 주세요.

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 입력칸 상태 관리
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [address, setAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');

  useEffect(() => {
    checkUserAndProfile();
  }, []);

  const checkUserAndProfile = async () => {
    // 1. 현재 카카오 로그인된 유저가 있는지 확인
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      setUser(session.user);
      
      // 2. 로그인된 유저의 기존 주소가 'profiles' 테이블에 있는지 확인
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      // 3. 기존 주소가 있다면 화면 빈칸에 촥! 채워주기
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

  const handleSave = async () => {
    if (!user) {
      alert('카카오 로그인이 필요합니다!');
      return;
    }

    // 4. 입력한 정보를 profiles 테이블에 저장(또는 덮어쓰기)
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id, // 핵심! 카카오 유저 고유 ID와 주소를 연결
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
        <button onClick={() => window.location.href = '/login'} className="bg-yellow-400 text-black px-6 py-2 rounded-md font-bold">
          카카오 로그인하러 가기
        </button>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-slate-100 p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">기본 배송지 관리</h1>
        
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
            <input 
              type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)}
              className="w-full border border-slate-300 p-3 rounded-md outline-none focus:border-slate-800"
              placeholder="우편번호 입력 (예: 12345)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">기본 주소</label>
            <input 
              type="text" value={address} onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-slate-300 p-3 rounded-md outline-none focus:border-slate-800"
              placeholder="시/군/구 동/면/읍"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">상세 주소</label>
            <input 
              type="text" value={detailAddress} onChange={(e) => setDetailAddress(e.target.value)}
              className="w-full border border-slate-300 p-3 rounded-md outline-none focus:border-slate-800"
              placeholder="동/호수 입력"
            />
          </div>

          <button 
            onClick={handleSave}
            className="w-full bg-slate-800 text-white font-bold py-4 rounded-md hover:bg-slate-700 transition mt-4"
          >
            배송지 저장하기
          </button>
        </div>
      </div>
    </main>
  );
}