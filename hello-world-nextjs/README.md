# Hello World - Next.js + Vercel 

Next.js로 만든 Hello World 웹사이트입니다. API 키를 안전하게 사용할 수 있는 서버사이드 기능을 포함합니다.

## 특징
- 아름다운 그라디언트 배경과 애니메이션
- Next.js 14 (App Router)
- **API 키 보안**: 서버사이드에서 안전하게 처리
- Vercel 배포 최적화
- 반응형 디자인
- 실시간 시계
- TypeScript 지원

## 로컬 실행

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인하세요.

## API 키 보안 사용법

### 1. 환경변수 설정
```bash
# env.example을 .env.local로 복사
cp env.example .env.local

# .env.local 파일에 API 키 추가
OPENAI_API_KEY=your_actual_api_key_here
```

### 2. 서버사이드에서 안전하게 사용
```typescript
// src/app/api/chat/route.ts
const apiKey = process.env.OPENAI_API_KEY // 안전함

// 클라이언트에서는 절대 API 키 노출 안됨!
```

### 3. 보안 장점
- API 키가 브라우저에 노출되지 않음
- GitHub에 업로드되지 않음 (.gitignore)
- Vercel 환경변수로 안전하게 관리
- 서버에서만 실행되는 코드

## API 라우트

- `GET /api/hello` - 서버사이드 API 테스트
- `POST /api/hello` - 메시지 처리 예시

## Vercel 배포

1. GitHub에 푸시
2. Vercel에서 프로젝트 import
3. 환경변수 설정 (OPENAI_API_KEY 등)
4. 자동 배포 완료!

## 파일 구조
```
src/
├── app/
│   ├── api/hello/route.ts    # API 라우트 (서버사이드)
│   ├── layout.tsx            # 루트 레이아웃
│   └── page.tsx              # 메인 페이지
└── ...
```

**중요**: API 키는 절대 클라이언트 코드에 넣지 마세요! 항상 서버사이드 API 라우트를 통해 사용하세요.
