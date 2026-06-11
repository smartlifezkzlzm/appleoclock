"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import DaumPostcode from 'react-daum-postcode';

export default function AddressesPage() {
  const [user, setUser] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 새 배송지 입력 폼 상태
  const [addressName, setAddressName] = useState('집'); // 기본값 '집'
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [address, setAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const [isOpenPostcode, setIsOpenPostcode] = useState(false);

  useEffect(() => {
    checkUserAndFetchAddresses();
  }, []);

  const checkUserAndFetchAddresses = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      setUser(session.user);
      fetchAddresses(session.user.id);
    } else {
      setLoading(false);
    }
  };

  // 저장된 배송지 목록 불러오기
  const fetchAddresses = async (userId: string) => {
    const { data, error } = await supabase
      .from('shipping_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false }); // 기본 배송지가 맨 위로 오도록 정렬

    if (error) {
      console.error('주소록을 불러오지 못했습니다.', error);
    } else {
      setAddresses(data || []);
    }
    setLoading(false);
  };

  const handleCompletePostcode = (data: any) => {
    let fullAddress = data.address;
    let extraAddress = '';

    if (data.addressType === 'R') {
      if (data.bname !== '') extraAddress += data.bname;
      if (data.buildingName !== '') extraAddress += extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName;
      fullAddress += extraAddress !== '' ? ` (${extraAddress})` : '';
    }

    setZipCode(data.zonecode);
    setAddress(fullAddress);
    setIsOpenPostcode(false);
  };

  // 배송지 추가하기
  const handleAddAddress = async () => {
    if (!user) return;
    if (!recipientName || !phone || !address) {
      alert('필수 입력 항목을 채워주세요.');
      return;
    }

    // 만약 이번에 추가하는 주소를 '기본 배송지(isDefault: true)'로 체크했다면, 
    // 기존 다른 주소들의 기본 배송지 설정을 전부 false로 초기화하는 로직
    if (isDefault) {
      await supabase
        .from('shipping_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    const { error } = await supabase
      .from('shipping_addresses')
      .insert({
        user_id: user.id,
        address_name: addressName,
        recipient_name: recipientName,
        phone: phone,
        zip_code: zipCode,
        address: address,
        detail_address: detailAddress,
        is_default: isDefault
      });

    if (error) {
      console.error(error);
      alert('배송지 저장 중 오류가 발생했습니다.');
    } else {
      alert('새로운 배송지가 추가되었습니다.');
      // 폼 초기화 및 목록 새로고침
      setRecipientName('');
      setPhone('');
      setZipCode('');
      setAddress('');
      setDetailAddress('');
      setIsDefault(false);
      fetchAddresses(user.id);
    }
  };

  // 기본 배송지 변경 (별표나 버튼 클릭 시)
  const setAsDefault = async (id: string) => {
    if (!user) return;
    
    // 1. 유저의 모든 주소 기본값 해제
    await supabase
      .from('shipping_addresses')
      .update({ is_default: false })
      .eq('user_id', user.id);

    // 2. 선택한 주소만 기본값으로 설정
    const { error } = await supabase
      .from('shipping_addresses')
      .update({ is_default: true })
      .eq('id', id);

    if (!error) {
      alert('기본 배송지가 변경되었습니다.');
      fetchAddresses(user.id);
    }
  };

  // 배송지 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 배송지를 삭제하시겠습니까?')) return;

    const { error } = await supabase
      .from('shipping_addresses')
      .delete()
      .eq('id', id);

    if (!error) {
      alert('삭제되었습니다.');
      fetchAddresses(user.id);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">불러오는 중...</div>;

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="p-8 bg-white rounded-lg shadow-md text-center">
        <h2 className="text-xl font-bold mb-4">로그인이 필요합니다</h2>
        <button onClick={() => window.location.href = '/login'} className="bg-[#FEE500] px-6 py-2 rounded-md font-bold">
          카카오 로그인
        </button>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* 왼쪽: 내 주소록 목록 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-slate-800">나의 배송지 목록</h1>
            <button onClick={() => window.location.href = '/'} className="text-sm text-slate-500 hover:text-slate-800">홈으로 이동</button>
          </div>

          {addresses.length === 0 ? (
            <p className="text-center text-slate-400 py-12">등록된 배송지가 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {addresses.map((addr) => (
                <div key={addr.id} className={`p-4 rounded-lg border ${addr.is_default ? 'border-slate-800 bg-slate-50/50' : 'border-slate-200'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold bg-slate-200 text-slate-800 text-xs px-2 py-1 rounded">
                        {addr.address_name}
                      </span>
                      {addr.is_default && (
                        <span className="text-xs bg-slate-800 text-white px-2 py-0.5 rounded font-bold">기본배송지</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!addr.is_default && (
                        <button onClick={() => setAsDefault(addr.id)} className="text-xs text-slate-500 underline hover:text-slate-800">
                          기본설정
                        </button>
                      )}
                      <button onClick={() => handleDelete(addr.id)} className="text-xs text-red-500 underline hover:text-red-700">
                        삭제
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 font-semibold">{addr.recipient_name} | {addr.phone}</p>
                  <p className="text-sm text-slate-600 mt-1">[{addr.zip_code}] {addr.address} {addr.detail_address}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 오른쪽: 새 배송지 추가 폼 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6">새 배송지 추가</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">배송지 별칭</label>
              <div className="flex gap-2">
                {['집', '회사', '처가', '기타'].map((name) => (
                  <button 
                    key={name}
                    onClick={() => setAddressName(name)}
                    className={`px-4 py-2 text-sm font-bold rounded-md border ${addressName === name ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">받으시는 분</label>
              <input 
                type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)}
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
              <label className="block text-sm font-medium text-slate-700 mb-1">우편번호 및 주소</label>
              <div className="flex gap-2 mb-2">
                <input 
                  type="text" value={zipCode} readOnly
                  className="w-full border border-slate-300 p-3 rounded-md bg-slate-50 text-slate-500"
                  placeholder="우편번호"
                />
                <button 
                  onClick={() => setIsOpenPostcode(true)}
                  className="whitespace-nowrap bg-slate-800 text-white px-4 rounded-md font-bold hover:bg-slate-700"
                >
                  주소 검색
                </button>
              </div>
              <input 
                type="text" value={address} readOnly
                className="w-full border border-slate-300 p-3 rounded-md bg-slate-50 text-slate-500"
                placeholder="주소 검색 버튼을 눌러주세요"
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

            <div className="flex items-center gap-2 py-2">
              <input 
                type="checkbox" id="isDefault" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 text-slate-800 border-slate-300 rounded focus:ring-slate-500"
              />
              <label htmlFor="isDefault" className="text-sm font-medium text-slate-700 cursor-pointer">기본 배송지로 설정</label>
            </div>

            <button 
              onClick={handleAddAddress}
              className="w-full bg-slate-800 text-white font-bold py-4 rounded-md hover:bg-slate-700 transition shadow-sm"
            >
              배송지 저장하기
            </button>
          </div>
        </div>
      </div>

      {/* 다음 주소 검색 팝업 */}
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