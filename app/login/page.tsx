// app/login/page.tsx
"use client";

import { useState } from 'react';
import { supabase } from '../../utils/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 이메일로 가입하기 로직
  const handleSignUp = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      alert(`가입 실패: ${error.message}`);
    } else {
      alert('가입 성공! 가입하신 이메일의 메일함을 확인해서 인증 링크를 눌러주세요.');
    }
  };

  // 이메일로 로그인하기 로직
  const handleSignIn = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      alert(`로그인 실패: ${error.message}`);
    } else {
      alert('환영합니다!');
      window.location.href = '/'; 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-slate-800">애플어클락 로그인</h1>
          <p className="text-slate-500 mt-2 text-sm">신선한 사과를 만나볼 시간입니다.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">이메일</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 p-3 rounded-lg focus:outline-none focus:border-red-500 transition"
              placeholder="apple@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">비밀번호</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 p-3 rounded-lg focus:outline-none focus:border-red-500 transition"
              placeholder="6자리 이상 입력해 주세요"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button 
            onClick={handleSignIn}
            disabled={loading}
            className="w-1/2 bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-700 transition"
          >
            {loading ? '처리 중...' : '로그인'}
          </button>
          <button 
            onClick={handleSignUp}
            disabled={loading}
            className="w-1/2 bg-white text-slate-800 border border-slate-300 font-bold py-3 rounded-lg hover:bg-slate-50 transition"
          >
            {loading ? '처리 중...' : '회원가입'}
          </button>
        </div>
      </div>
    </div>
  );
}