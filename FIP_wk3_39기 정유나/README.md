# Eatween — 그룹 식당 추천 서비스

여러 명이 각자의 제약조건을 입력하면 모두가 먹을 수 있는 메뉴와 식당을 함께 추천해주는 웹 서비스입니다. 친구들과 현장에서 바로 쓸 수 있도록 설계되었습니다.

🔗 **배포 주소**: https://food-together.vercel.app  
🔗 **GitHub (소스코드)**: https://github.com/jeongyuna620/food-together

---

## 주요 기능

- 방장이 약속 장소를 입력하고 방을 생성, 링크/QR 코드로 친구 초대
- 각 참여자가 못 먹는 것(알레르기), 먹기 싫은 것(선호), 예산을 개별 입력
- 카카오 로컬 API를 활용해 실제 주변 식당을 메뉴별로 검색·추천
- 참여자들이 식당에 OK/NO 실시간 투표 (Supabase Realtime)

## 기술 스택

| 분류 | 기술 |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js API Routes (서버리스) |
| DB / Realtime | Supabase (PostgreSQL + Realtime) |
| 외부 API | 카카오 로컬 API |
| 배포 | Vercel |

## 로컬 실행 방법

```bash
npm install
cp .env.local.example .env.local
# .env.local에 Supabase, Kakao API 키 입력
npm run dev
```

## 환경변수

`.env.local.example` 참고
