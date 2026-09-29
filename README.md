# 바이브 카페 - 주문서

주문하기를 누르면 Supabase `cafe_orders` 테이블에 주문이 한 행으로 저장됩니다.

## 1. Supabase 설정

1. https://supabase.com 에서 프로젝트 생성
2. **SQL Editor**에 `supabase_schema.sql` 내용을 붙여넣고 **Run** → `cafe_orders` 테이블 + RLS 정책 생성
3. **Project Settings > API**에서 `Project URL`과 `anon public` 키 복사

## 2. 로컬 실행

```bash
npm install
cp .env.example .env.local   # 값 채우기
npm run dev
```

## 3. Vercel 배포

1. 이 폴더를 GitHub 저장소에 push
2. https://vercel.com/new 에서 저장소 Import (Framework: Vite 자동 인식)
3. **Environment Variables**에 추가
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **Deploy** → 배포된 URL에서 주문하면 Supabase **Table Editor > cafe_orders**에 바로 표시됩니다.

> 환경변수를 나중에 추가/변경했다면 Vercel에서 **Redeploy** 해야 반영됩니다.
