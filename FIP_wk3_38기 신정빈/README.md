# SocietyBridge AI

대학 학회와 학생 조직의 비전, 역량, 과거 프로젝트 경험을 기반으로 협업 가능성이 높은 기업을 찾고, 기업별 문제 상황과 프로젝트 제안 방향, 공식 콜드메일을 생성하는 AI 기반 산학협력 아웃리치 웹앱입니다.

## 주요 기능

- 학회 프로필 및 소개자료 분석
- 기업 문제 상황 중심의 내외부 환경 분석
- 기업 Value Tier 및 적합도 기반 후보 기업 분류
- 실제 컨택 루트와 추천 접촉 부서 표시
- 기업별 산학협력 제안서 생성
- 공식적인 대외협력 콜드메일 생성
- 저장한 기업 로컬 관리

## 실행

```bash
npm install
npm run dev
```

## 환경 변수

`.env.example`을 참고해 배포 환경에 값을 등록합니다. 실제 API 키는 GitHub에 커밋하지 않습니다.

```bash
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4.1-mini"
OPENAI_VISION_MODEL="gpt-4.1-mini"
```

OpenAI API 키가 없으면 데모용 deterministic fallback 응답으로 동작합니다.
