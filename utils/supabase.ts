// utils/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 에러 추적을 위한 안전장치 코드 (터미널 창에 경고를 띄워줍니다)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("🚨 경고: Supabase URL 또는 Anon Key가 읽히지 않습니다. .env.local 파일을 확인하세요.");
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');