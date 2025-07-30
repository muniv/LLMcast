# Hello World - Next.js + Vercel

Next.js로 만든 간단한 "Hello World" 웹사이트입니다. Vercel에 배포하여 서버사이드 기능을 테스트할 수 있습니다.

## 특징
- 🚀 Next.js 14 (App Router)
- 🎨 아름다운 그라디언트 배경
- ✨ 애니메이션 효과
- 📱 반응형 디자인
- ⏰ 실시간 시계
- 🔧 TypeScript 지원
- 🌐 Vercel 배포 최적화

## 로컬 실행
```bash
npm install
npm run dev
```

## 배포
이 프로젝트는 Vercel에 배포되도록 설정되어 있습니다.

## API 라우트 추가 예시
나중에 ChatGPT API 등을 추가할 때:
```typescript
// src/app/api/chat/route.ts
export async function POST(request: Request) {
  // API 로직
}
```

## 파일 구조
- `src/app/layout.tsx` - 루트 레이아웃
- `src/app/page.tsx` - 메인 페이지
- `package.json` - 프로젝트 설정
- `next.config.js` - Next.js 설정
