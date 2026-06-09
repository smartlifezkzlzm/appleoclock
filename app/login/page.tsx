// app/login/page.tsx
"use client";

import { useState } from 'react';
import { supabase } from '../../utils/supabase';

export default function Login() {
  const [loading, setLoading] = useState(false);

  // 구글 로그인 실행 함수
  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`, // 로그인 성공 시 메인으로 이동
      }
    });
    if (error) {
      alert(`구글 로그인 에러: ${error.message}`);
      setLoading(false);
    }
  };

  // 카카오 로그인 실행 함수
  const handleKakaoLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/`,
      }
    });
    if (error) {
      alert(`카카오 로그인 에러: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-sm w-full rounded-2xl shadow-sm border border-slate-100 p-8 space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-slate-800">애플어클락</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">3초 만에 시작하는 달콤한 쇼핑</p>
        </div>

        <div className="space-y-3 pt-4">
          {/* 카카오 로그인 버튼 (카카오 공식 색상 #FEE500) */}
          <button 
            onClick={handleKakaoLogin}
            disabled={loading}
            className="w-full bg-[#FEE500] text-[#191919] font-bold py-3.5 rounded-xl hover:bg-[#F4DC00] transition flex items-center justify-center gap-2 shadow-sm"
          >
            <svg viewBox="0 0 24 24" fill="#191919" className="w-5 h-5">
              <path d="M12 3c-5.523 0-10 3.528-10 7.88 0 2.82 1.916 5.289 4.823 6.643-.223.805-.808 2.923-.836 3.037-.035.143.053.14.113.101.078-.052 3.197-2.148 4.475-3.036.463.064.938.095 1.425.095 5.523 0 10-3.528 10-7.88C22 6.528 17.523 3 12 3z"/>
            </svg>
            카카오로 시작하기
          </button>

          {/* 구글 로그인 버튼 */}
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-slate-700 border border-slate-300 font-bold py-3.5 rounded-xl hover:bg-slate-50 transition flex items-center justify-center gap-2 shadow-sm"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google로 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}