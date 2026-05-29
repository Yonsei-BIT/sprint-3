import type { CollaborationType, CompanyLead, CompanySize, ContactRoute } from "@/lib/types";

type CompanySeed = {
  id: string;
  name: string;
  industry: string;
  size?: CompanySize;
  region?: string;
  description: string;
  recentBusinessContext: string;
  likelyNeeds: string[];
  possibleCollaborationTypes?: CollaborationType[];
  website: string;
  contactPage?: string;
  publicEmail?: string;
  linkedinUrl?: string;
  contactRoutes?: ContactRoute[];
  contactNotes?: string;
  sourceLinks?: string[];
  suggestedDepartment?: string;
  notes: string;
};

const noPublicEmailNotice = "검증된 공개 이메일이 없습니다. 공식 문의 페이지 또는 제휴/파트너십 문의 채널을 이용하세요.";

const defaultCollaborationTypes: CollaborationType[] = [
  "industry_academic_collaboration",
  "market_research",
  "business_strategy_proposal",
  "product_feedback"
];

function createCompany(seed: CompanySeed): CompanyLead {
  const contactRoutes = buildContactRoutes(seed);
  const linkedinUrl = seed.linkedinUrl || linkedinCompanySearchUrl(seed.name);
  const suggestedDepartment = seed.suggestedDepartment || inferSuggestedDepartment(seed);
  const contactNotes = seed.contactNotes || buildContactNotes(seed, suggestedDepartment, contactRoutes);

  return {
    id: seed.id,
    name: seed.name,
    industry: seed.industry,
    size: seed.size || "large_enterprise",
    region: seed.region || "한국",
    description: seed.description,
    recentBusinessContext: seed.recentBusinessContext,
    likelyNeeds: seed.likelyNeeds,
    possibleCollaborationTypes: seed.possibleCollaborationTypes || defaultCollaborationTypes,
    contact: {
      website: seed.website,
      contactPage: seed.contactPage,
      publicEmail: seed.publicEmail,
      linkedinUrl,
      routes: contactRoutes,
      notes: contactNotes
    },
    suggestedDepartment,
    sourceLinks: uniqueLinks([seed.website, seed.contactPage, linkedinUrl, ...contactRoutes.map((route) => route.url), ...(seed.sourceLinks || [])]),
    notes: `${seed.notes} 컨택 메모: ${contactNotes}`
  };
}

function uniqueLinks(links: Array<string | undefined>): string[] {
  return Array.from(new Set(links.filter(Boolean) as string[]));
}

function linkedinCompanySearchUrl(companyName: string) {
  return `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(companyName)}`;
}

function linkedinPeopleSearchUrl(companyName: string) {
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(companyName)}`;
}

function linkedinCompanyPeopleUrl(linkedinUrl: string) {
  return `${linkedinUrl.replace(/\/+$/, "")}/people/`;
}

function buildContactRoutes(seed: CompanySeed): ContactRoute[] {
  const routes: ContactRoute[] = [];

  if (seed.contactPage) {
    routes.push({
      type: inferContactRouteType(seed),
      label: inferContactRouteLabel(seed.contactPage),
      url: seed.contactPage,
      description: "공식 사이트에서 확인 가능한 공개 문의 접점입니다.",
      source: "official_site",
      verified: true
    });
  }

  routes.push(...(seed.contactRoutes || []));

  routes.push({
    type: "linkedin_company",
    label: seed.linkedinUrl ? "LinkedIn 회사 페이지" : "LinkedIn 기업 검색",
    url: seed.linkedinUrl || linkedinCompanySearchUrl(seed.name),
    description: "직접 문의 루트가 불명확할 때 회사 페이지, 채용 공고, 공개 게시글에서 공식 접점을 확인합니다.",
    source: seed.linkedinUrl ? "manual" : "mock_data",
    verified: Boolean(seed.linkedinUrl)
  });

  if (seed.linkedinUrl) {
    routes.push({
      type: "linkedin_people_search",
      label: "LinkedIn 재직자 보기",
      url: linkedinCompanyPeopleUrl(seed.linkedinUrl),
      description: "확인된 LinkedIn 회사 페이지의 사람 탭입니다. 공개 프로필의 현재 재직 여부를 한 번 더 확인한 뒤 1촌 신청과 DM을 남기세요.",
      source: "manual",
      verified: true
    });
  } else {
    routes.push({
      type: "linkedin_people_search",
      label: "LinkedIn 재직자 후보 검색",
      url: linkedinPeopleSearchUrl(seed.name),
      description: "회사명 기반 LinkedIn 사람 검색입니다. 동명이인이나 유사 기업 오표본이 섞일 수 있으니 현재 회사명과 직무를 확인한 뒤 1촌 신청과 DM을 남기세요.",
      source: "mock_data",
      verified: false
    });
  }

  const seen = new Set<string>();
  return routes.filter((route) => {
    const key = `${route.label}-${route.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function inferContactRouteType(seed: CompanySeed): ContactRoute["type"] {
  const linkText = `${seed.contactPage || ""} ${seed.industry} ${seed.likelyNeeds.join(" ")}`.toLowerCase();
  if (linkText.includes("support") || linkText.includes("customer") || linkText.includes("help") || linkText.includes("고객")) return "customer_support";
  if (linkText.includes("career") || linkText.includes("recruit") || linkText.includes("채용")) return "hr_recruiting";
  if (linkText.includes("press") || linkText.includes("pr") || linkText.includes("news")) return "pr_media";
  if (linkText.includes("partner") || linkText.includes("제휴")) return "partnership";
  return "official_contact";
}

function inferContactRouteLabel(url: string) {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("support") || lowerUrl.includes("customer") || lowerUrl.includes("help")) return "고객센터/문의";
  if (lowerUrl.includes("career") || lowerUrl.includes("recruit")) return "채용/HR 문의";
  if (lowerUrl.includes("press") || lowerUrl.includes("pr")) return "PR/미디어 문의";
  if (lowerUrl.includes("partner")) return "제휴/파트너십 문의";
  return "공식 문의 페이지";
}

function inferSuggestedDepartment(seed: CompanySeed) {
  const text = `${seed.industry} ${seed.likelyNeeds.join(" ")} ${seed.notes}`.toLowerCase();

  if (text.includes("채용") || text.includes("커리어") || text.includes("recruiting") || text.includes("hr")) {
    return "HR/채용팀, 캠퍼스 리크루팅 담당, 브랜드/커뮤니케이션팀";
  }
  if (text.includes("제휴") || text.includes("파트너") || text.includes("b2b") || text.includes("gtm")) {
    return "사업개발팀, 제휴/파트너십팀, 전략기획팀";
  }
  if (text.includes("마케팅") || text.includes("브랜드") || text.includes("콘텐츠") || text.includes("커뮤니티")) {
    return "마케팅팀, 브랜드전략팀, 콘텐츠/커뮤니티팀";
  }
  if (text.includes("고객") || text.includes("사용자") || text.includes("서비스") || text.includes("경험")) {
    return "고객경험팀, 프로덕트팀, 서비스기획팀";
  }
  if (text.includes("ai") || text.includes("데이터") || text.includes("디지털")) {
    return "전략기획팀, 데이터/AI 사업팀, 프로덕트팀";
  }
  if (text.includes("공공") || text.includes("기관")) {
    return "대외협력팀, 사업 담당 부서, 산학협력/교육 프로그램 담당";
  }
  return "전략기획팀, 사업개발팀, 마케팅팀, 고객경험팀";
}

function buildContactNotes(seed: CompanySeed, suggestedDepartment: string, routes: ContactRoute[]) {
  const directRoute = routes.find((route) => route.type !== "linkedin_company" && route.type !== "linkedin_people_search");
  const linkedinGuide = seed.linkedinUrl ? "확인된 LinkedIn 회사 페이지의 사람 탭에서 재직자를 확인하세요." : "LinkedIn은 기업 검색 결과에서 공식 회사 페이지를 먼저 고른 뒤 사람 탭을 확인하세요.";
  const firstRoute = directRoute ? `${directRoute.label}를 1순위로 확인` : "직접 문의 루트가 불명확하므로 홈페이지와 LinkedIn 기업 검색을 병행";
  return `${firstRoute}하고, ${suggestedDepartment}에 맞춰 제안 주제를 분기하세요. ${linkedinGuide} 공개 프로필의 현재 재직 여부를 한 번 더 확인한 뒤 1촌 신청과 DM을 남기세요. ${seed.publicEmail ? `공개 이메일 ${seed.publicEmail} 사용 가능.` : noPublicEmailNotice}`;
}

export const companyPool: CompanyLead[] = [
  createCompany({
    id: "company-toss",
    name: "토스",
    industry: "금융/핀테크",
    website: "https://toss.im/",
    contactPage: "https://support.toss.im/",
    publicEmail: "partnership@toss.im",
    linkedinUrl: "https://www.linkedin.com/company/tossglobal/",
    description: "송금, 결제, 은행, 증권, 보험 등 생활 금융 전반을 다루는 금융 플랫폼입니다.",
    recentBusinessContext: "금융 슈퍼앱 내 서비스 간 락인, 오프라인 결제 확장, 2030 금융 습관 선점이 중요합니다.",
    likelyNeeds: ["2030 금융 행동 이해", "오프라인 결제 선택 장벽 분석", "금융 서비스 락인 전략"],
    notes: "2030 금융 플랫폼 락인과 오프라인 결제 습관 분석형 제안에 적합합니다."
  }),
  createCompany({
    id: "company-kakao-mobility",
    name: "카카오모빌리티",
    industry: "모빌리티/물류",
    website: "https://www.kakaomobility.com/",
    description: "카카오 T를 기반으로 이동, 주차, 대리, 배송, 글로벌 모빌리티 서비스를 운영합니다.",
    recentBusinessContext: "비택시 서비스 확장, 배송/물류 인지도 강화, 해외 이용자 확산 전략이 중요합니다.",
    likelyNeeds: ["비택시 서비스 브랜드 인식", "배송/물류 사용 맥락", "해외 이동 서비스 GTM"],
    notes: "비택시 서비스와 글로벌 이동 경험 확산 전략 제안에 적합합니다."
  }),
  createCompany({
    id: "company-hp",
    name: "HP",
    industry: "IT/하드웨어",
    website: "https://www.hp.com/",
    description: "PC, 프린터, 주변기기와 업무용 디바이스를 제공하는 글로벌 IT 기업입니다.",
    recentBusinessContext: "노트북과 디바이스 시장에서 가격, 성능, 브랜드 선호, 학생 고객 접점이 중요합니다.",
    likelyNeeds: ["학생·주니어 고객 시장 진입", "노트북 구매 기준 분석", "교육 시장 디바이스 포지셔닝"],
    notes: "과거 넷북 시장 진입 전략 사례처럼 학생 고객 구매 맥락 분석에 적합합니다."
  }),
  createCompany({
    id: "company-google",
    name: "Google",
    industry: "인터넷/플랫폼",
    website: "https://about.google/",
    description: "검색, 광고, 클라우드, 모바일 생태계를 운영하는 글로벌 플랫폼 기업입니다.",
    recentBusinessContext: "대학생 서비스 이용, AI 검색 전환, 생산성 도구 사용 습관이 중요합니다.",
    likelyNeeds: ["대학생 유입 전략", "AI 검색 사용 맥락", "캠퍼스 생산성 도구 확산"],
    notes: "대학생 계층 유입 유도 전략 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-sk-telecom",
    name: "SK텔레콤",
    industry: "통신/AI/콘텐츠",
    website: "https://www.sktelecom.com/",
    description: "이동통신, AI, 미디어, 구독, 커머스 서비스를 운영하는 통신 기업입니다.",
    recentBusinessContext: "통신 외 서비스 확장, 라이브 커머스, 쿠폰/선물하기, AI 서비스 전환이 중요합니다.",
    likelyNeeds: ["라이브 커머스 적용 전략", "쿠폰/선물하기 현황 분석", "통신 고객 락인 강화"],
    notes: "모바일 콘텐츠와 신규 비즈니스 모델 제안 사례가 많아 학회 프로젝트와 잘 맞습니다."
  }),
  createCompany({
    id: "company-loen",
    name: "LOEN Entertainment",
    industry: "음악/엔터테인먼트",
    size: "mid_sized_company",
    website: "https://www.kakaoent.com/",
    description: "음원과 콘텐츠 사업을 운영해온 엔터테인먼트 기업입니다.",
    recentBusinessContext: "음원 기반 수익 모델과 팬덤 기반 콘텐츠 확장이 중요합니다.",
    likelyNeeds: ["음원 활용 신규 사업", "팬덤 기반 비즈니스 모델", "콘텐츠 소비 행동 분석"],
    notes: "음원을 활용한 새로운 비즈니스 모델 제안 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-sony",
    name: "Sony",
    industry: "전자/콘텐츠",
    website: "https://www.sony.com/",
    description: "전자기기, 게임, 음악, 이미지 센서 등 다양한 사업을 운영하는 글로벌 기업입니다.",
    recentBusinessContext: "디바이스 시장 축소와 콘텐츠·경험 중심 가치 전환이 중요합니다.",
    likelyNeeds: ["MP3/디바이스 저변 확대", "콘텐츠 경험 결합", "젊은 고객 접점 확대"],
    notes: "MP3 Player 시장 저변 확대 방안 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-lotte",
    name: "롯데",
    industry: "식품/리테일",
    website: "https://www.lotte.co.kr/",
    description: "식품, 유통, 관광, 화학 등 다양한 사업을 운영하는 대기업 그룹입니다.",
    recentBusinessContext: "과자 신제품 콘셉트, 편의점·리테일 채널, MZ 고객 반응 검증이 중요합니다.",
    likelyNeeds: ["신제품 콘셉트 검증", "MZ 스낵 소비 맥락", "리테일 채널 프로모션"],
    notes: "과자 산업 내 신제품 콘셉트 제안 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-st-unitas",
    name: "영단기",
    industry: "교육/에듀테크",
    size: "mid_sized_company",
    website: "https://eng.conects.com/",
    publicEmail: "STunitas_cs@stunitas.com",
    description: "영어 학습과 시험 대비 교육 서비스를 제공하는 에듀테크 브랜드입니다.",
    recentBusinessContext: "오프라인 학원과 온라인 강의 간 전환, 대학생 대상 마케팅 효율이 중요합니다.",
    likelyNeeds: ["대학생 대상 마케팅", "온오프라인 학습 전환", "강의 선택 기준 분석"],
    notes: "오프라인 학원 대학생 대상 마케팅 전략 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-dell",
    name: "Dell",
    industry: "IT/하드웨어",
    website: "https://www.dell.com/",
    description: "PC, 노트북, 서버, 업무용 IT 인프라를 제공하는 글로벌 IT 기업입니다.",
    recentBusinessContext: "Inspiron과 같은 소비자 노트북의 타깃 세그먼트와 IMC 전략이 중요합니다.",
    likelyNeeds: ["노트북 IMC 전략", "학생 고객 구매 여정", "가격·성능 메시지 차별화"],
    notes: "Dell Inspiron IMC 전략 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-socar",
    name: "쏘카",
    industry: "모빌리티/카셰어링",
    size: "mid_sized_company",
    website: "https://www.socar.kr/",
    publicEmail: "hello@socar.kr",
    linkedinUrl: "https://kr.linkedin.com/company/socarkr",
    description: "카셰어링과 이동 서비스를 제공하는 모빌리티 플랫폼입니다.",
    recentBusinessContext: "차별화된 이용 경험, 프로모션 효율, 대학생·직장인 이동 수요가 중요합니다.",
    likelyNeeds: ["카셰어링 차별화", "프로모션 전략", "신규 고객 유입"],
    notes: "카셰어링 서비스 차별화 전략과 프로모션 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-kt",
    name: "KT",
    industry: "통신/AI/플랫폼",
    website: "https://corp.kt.com/",
    description: "통신, 미디어, AI, B2B 디지털 플랫폼 사업을 운영하는 기업입니다.",
    recentBusinessContext: "무선 시장 경쟁력 강화와 상품/서비스 차별화가 중요합니다.",
    likelyNeeds: ["무선 상품 경쟁력", "통신 서비스 차별화", "청년 고객 락인"],
    notes: "KT 무선 시장 경쟁력 강화를 위한 상품/서비스 제안 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-hana-bank",
    name: "하나은행",
    industry: "금융/은행",
    website: "https://www.kebhana.com/",
    description: "개인·기업 금융, 글로벌 금융 서비스를 제공하는 은행입니다.",
    recentBusinessContext: "디지털 뱅킹 경쟁력과 모바일 금융 이용 경험 개선이 중요합니다.",
    likelyNeeds: ["디지털 경쟁력 강화", "모바일 금융 경험", "2030 금융 고객 확보"],
    notes: "하나은행 디지털 경쟁력 강화 방안 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-snuh",
    name: "분당서울대학교병원",
    industry: "헬스케어/의료",
    size: "public_institution",
    website: "https://www.snubh.org/",
    description: "의료 서비스와 디지털 헬스케어 혁신을 수행하는 상급종합병원입니다.",
    recentBusinessContext: "환자 경험, 서비스 경쟁력, 의료 패러다임 변화 대응이 중요합니다.",
    likelyNeeds: ["병원 서비스 경쟁력", "환자 경험 개선", "디지털 헬스케어 인식"],
    notes: "분당서울대병원 서비스 경쟁력 강화 제안 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-naver",
    name: "NAVER",
    industry: "인터넷/콘텐츠 플랫폼",
    website: "https://www.navercorp.com/",
    description: "검색, 콘텐츠, 커머스, 광고, 커뮤니티 등 다양한 사용자 접점을 운영합니다.",
    recentBusinessContext: "20대 콘텐츠 유입, 블로그 활성화, 요금제/멤버십 전략, 검색 경험 전환이 중요합니다.",
    likelyNeeds: ["20대 블로그 유입", "커뮤니티 활성화", "요금제/멤버십 전략"],
    notes: "20대 블로그 유입과 네이버 뮤직 요금제 제안 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-poolus",
    name: "풀러스",
    industry: "모빌리티/카풀",
    size: "startup",
    website: "https://www.poolus.kr/",
    description: "차량 공유와 카풀 기반 이동 서비스를 제공했던 모빌리티 스타트업입니다.",
    recentBusinessContext: "신규 고객 유입, 리텐션 강화, 신뢰 기반 매칭 경험이 중요합니다.",
    likelyNeeds: ["신규 고객 유입", "리텐션 강화", "이용 신뢰 형성"],
    notes: "신규 고객 유입 및 리텐션 강화 방안 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-spoon",
    name: "스푼라디오",
    industry: "오디오/커뮤니티",
    size: "mid_sized_company",
    website: "https://www.spooncast.net/",
    description: "누구나 목소리로 소통할 수 있는 오디오 스트리밍 플랫폼입니다.",
    recentBusinessContext: "이용 경험, 브랜딩, 크리에이터 커뮤니티 활성화가 중요합니다.",
    likelyNeeds: ["이용 경험 개선", "브랜딩 개선", "크리에이터 리텐션"],
    notes: "이용 경험 개선 및 브랜딩 개선 방안 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-gs25",
    name: "GS25",
    industry: "편의점/리테일",
    website: "https://gs25.gsretail.com/",
    description: "전국 편의점 네트워크를 운영하는 리테일 브랜드입니다.",
    recentBusinessContext: "앱 활성화, 오프라인 연계, 냉장고 서비스와 개인화 혜택이 중요합니다.",
    likelyNeeds: ["앱 활성화", "오프라인 연계", "편의점 고객 리텐션"],
    notes: "나만의 냉장고 앱 활성화 및 오프라인 연계 방안 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-medibloc",
    name: "MediBloc",
    industry: "헬스케어/블록체인",
    size: "startup",
    website: "https://medibloc.com/",
    description: "블록체인 기반 의료정보 생태계를 구축하는 디지털 헬스케어 기업입니다.",
    recentBusinessContext: "의료정보 신뢰, 환자 데이터 활용, 헬스케어 서비스 기획이 중요합니다.",
    likelyNeeds: ["헬스케어 서비스 기획", "의료 데이터 신뢰", "사용자 수용성"],
    notes: "플랫폼/메디토큰을 활용한 헬스케어 서비스 기획 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-sandbox",
    name: "샌드박스네트워크",
    industry: "MCN/콘텐츠",
    size: "mid_sized_company",
    website: "https://sandbox.co.kr/",
    publicEmail: "contact@sandboxnetwork.net",
    linkedinUrl: "https://www.linkedin.com/company/sandbox-network-inc-/",
    description: "크리에이터와 커뮤니티 기반 콘텐츠 비즈니스를 운영하는 MCN 기업입니다.",
    recentBusinessContext: "콘텐츠 산업 트렌드, 크리에이터 수익 모델, 팬 커뮤니티 확장이 중요합니다.",
    likelyNeeds: ["콘텐츠 트렌드 분석", "중장기 사업모델", "신규 고객층 마케팅"],
    notes: "콘텐츠 산업 트렌드 분석과 MCN 사업모델 제안 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-pubg",
    name: "PUBG",
    industry: "게임/엔터테인먼트",
    website: "https://www.krafton.com/",
    description: "배틀그라운드를 중심으로 글로벌 게임 IP를 운영하는 게임 스튜디오입니다.",
    recentBusinessContext: "신규 서비스 잠재 고객 페르소나와 마케팅 전략이 중요합니다.",
    likelyNeeds: ["게임 신규 서비스 페르소나", "마케팅 전략", "IP 팬덤 확장"],
    notes: "신규 서비스 잠재 고객 페르소나 도출 및 마케팅 전략 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-laundrygo",
    name: "런드리고",
    industry: "생활서비스/세탁",
    size: "mid_sized_company",
    website: "https://www.laundrygo.com/",
    publicEmail: "business@lifegoeson.kr",
    linkedinUrl: "https://kr.linkedin.com/company/lifegoeson",
    description: "비대면 세탁과 생활 서비스를 제공하는 플랫폼입니다.",
    recentBusinessContext: "B2C 패션 신사업, 서비스 개선, 제휴와 마케팅 전략이 중요합니다.",
    likelyNeeds: ["서비스 개선", "B2C 패션 신사업", "제휴 마케팅"],
    notes: "마케팅, 제휴, B2C 패션 신사업 전략 및 서비스 개선 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-emart24",
    name: "이마트24",
    industry: "편의점/리테일",
    website: "https://www.emart24.co.kr/",
    description: "신세계그룹이 운영하는 편의점 브랜드입니다.",
    recentBusinessContext: "신규 앱 서비스 개선과 편의점 고객 활성화가 중요합니다.",
    likelyNeeds: ["앱 서비스 개선", "편의점 고객 활성화", "오프라인 연계"],
    notes: "신 어플리케이션 서비스 개선 및 활성화 방안 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-olive-young",
    name: "CJ올리브영",
    industry: "리테일/뷰티",
    website: "https://corp.oliveyoung.com/",
    description: "H&B 리테일과 K-뷰티 커머스를 운영하는 옴니채널 라이프스타일 플랫폼입니다.",
    recentBusinessContext: "펨테크, 메타버스, 라이프스타일, 콘텐츠 커머스 플랫폼 진화가 중요합니다.",
    likelyNeeds: ["K-뷰티 구매 여정", "콘텐츠 커머스", "라이프스타일 플랫폼 확장"],
    notes: "펨테크/메타버스/라이프스타일, 콘텐츠 커머스 플랫폼 진화 방안 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-kream",
    name: "KREAM",
    industry: "패션/리셀 커머스",
    size: "mid_sized_company",
    website: "https://kream.co.kr/",
    description: "한정판 패션과 리셀 거래를 기반으로 커뮤니티형 커머스를 운영합니다.",
    recentBusinessContext: "상품과 콘텐츠를 기반으로 한 고객 상호작용과 리셀 커뮤니티 성장이 중요합니다.",
    likelyNeeds: ["리셀 커뮤니티 활성화", "콘텐츠 기반 구매 전환", "MZ 고객 상호작용"],
    notes: "리셀 시장 고객 상호 소통 플랫폼 관점의 프로젝트와 적합합니다."
  }),
  createCompany({
    id: "company-paris-baguette",
    name: "파리바게뜨",
    industry: "F&B/베이커리",
    website: "https://www.paris.co.kr/",
    description: "대한민국 베이커리 시장을 선도해온 프리미엄 베이커리 브랜드입니다.",
    recentBusinessContext: "앱 기반 방문 증대, MZ 매장 경험, 굿즈와 프로모션 전략이 중요합니다.",
    likelyNeeds: ["앱 기반 매장 방문 증대", "MZ 프로모션", "굿즈 기획"],
    notes: "파바앱을 활용한 MZ 매장 방문 증대와 굿즈 기획 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-devsisters",
    name: "데브시스터즈",
    industry: "게임/IP",
    size: "mid_sized_company",
    website: "https://www.devsisters.com/",
    description: "쿠키런 IP를 중심으로 게임과 캐릭터 상품 사업을 운영하는 게임 기업입니다.",
    recentBusinessContext: "게임 IP의 상품화와 팬덤 커머스 확장이 중요합니다.",
    likelyNeeds: ["쿠키런 IP 상품화", "팬덤 굿즈 전략", "IP 커머스 확장"],
    notes: "쿠키런 IP를 활용한 상품화 전략 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-amorepacific",
    name: "아모레퍼시픽",
    industry: "뷰티/화장품",
    website: "https://www.apgroup.com/",
    description: "화장품과 생활용품을 판매하는 대표 뷰티 기업입니다.",
    recentBusinessContext: "M&A, 남성 컬러 메이크업, 신성장 동력, 글로벌 고객 확장이 중요합니다.",
    likelyNeeds: ["신규 고객 유입", "팬덤 유지", "M&A 신사업 전략", "남성 뷰티 시장"],
    notes: "Be READY 신규 고객 유입, M&A 전략, 채널 신사업 모델 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-myrealtrip",
    name: "마이리얼트립",
    industry: "여행/플랫폼",
    size: "mid_sized_company",
    website: "https://www.myrealtrip.com/",
    contactPage: "https://partner.myrealtrip.com/welcome/marketing_partner",
    publicEmail: "partnership@myrealtrip.com",
    linkedinUrl: "https://www.linkedin.com/company/myrealtrip/",
    description: "여행 상품 검색과 예약을 제공하는 여행 종합 플랫폼입니다.",
    recentBusinessContext: "여행 산업 내 타 서비스와의 차별화와 예약 경험 개선이 중요합니다.",
    likelyNeeds: ["여행 서비스 차별화", "예약 여정 개선", "2030 여행 의사결정"],
    notes: "여행 산업 내 타 서비스와의 차별화 전략 제안 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-welaaa",
    name: "윌라",
    industry: "오디오북/콘텐츠",
    size: "mid_sized_company",
    website: "https://www.welaaa.com/",
    publicEmail: "cs@welaaa.com",
    description: "오디오북과 모바일 강의 기반 구독형 콘텐츠 스트리밍을 제공합니다.",
    recentBusinessContext: "오디오북 대중화와 2030 고객 유입, 콘텐츠 전략이 중요합니다.",
    likelyNeeds: ["오디오북 대중화", "2030 콘텐츠 유입", "구독형 콘텐츠 전략"],
    notes: "오디오북 대중화와 저변 넓히기 전략 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-naver-webtoon",
    name: "네이버웹툰",
    industry: "미디어/콘텐츠",
    website: "https://webtoonscorp.com/",
    description: "웹툰과 스토리 콘텐츠를 글로벌로 서비스하며 창작자, 독자, IP 생태계를 운영합니다.",
    recentBusinessContext: "웹툰/시리즈 서비스 개선, 타깃 마케팅, 글로벌 독자 확장이 중요합니다.",
    likelyNeeds: ["서비스 개선", "타깃 마케팅", "콘텐츠 팬덤 확장"],
    notes: "네이버 웹툰/시리즈 서비스 개선 및 타깃 마케팅 전략 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-jejuair",
    name: "제주항공",
    industry: "항공/여행",
    website: "https://www.jejuair.net/",
    description: "합리적 가격을 앞세운 저비용 항공사입니다.",
    recentBusinessContext: "위드코로나 이후 항공업계 회복과 캠페인 전략이 중요합니다.",
    likelyNeeds: ["항공업계 위기 극복", "마케팅 캠페인", "가격 민감 고객 분석"],
    notes: "항공업계 위기 극복을 위한 마케팅 및 캠페인 전략 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-heybeauty",
    name: "헤이뷰티",
    industry: "뷰티 예약/플랫폼",
    size: "startup",
    website: "https://www.heybeauty.co.kr/",
    description: "뷰티샵 예약과 뷰티 서비스를 연결하는 플랫폼입니다.",
    recentBusinessContext: "뷰티 예약 플랫폼의 신규 사업모델과 고객 확보가 중요합니다.",
    likelyNeeds: ["신규 사업모델", "뷰티 예약 전환", "고객 경험 개선"],
    notes: "헤이뷰티 플랫폼 신규 사업 모델 제안 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-fast-track-asia",
    name: "패스트트랙아시아",
    industry: "컴퍼니빌더/투자",
    size: "mid_sized_company",
    website: "https://fast-track.asia/",
    description: "컴퍼니빌더형 스타트업 지주회사입니다.",
    recentBusinessContext: "포트폴리오 마케팅, 캠퍼스 접점, 신규 비즈니스 모델 발굴이 중요합니다.",
    likelyNeeds: ["신규 비즈니스 모델", "캠퍼스 마케팅", "포트폴리오 성장 전략"],
    notes: "패스트파이브/캠퍼스/인베스트먼트 3사 마케팅과 신사업 모델 제안 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-gs-caltex",
    name: "GS칼텍스",
    industry: "에너지/정유",
    website: "https://www.gscaltex.com/",
    description: "정유, 석유화학, 에너지 사업을 운영하는 종합 에너지 기업입니다.",
    recentBusinessContext: "Kixx 엔진오일 브랜드 인지도와 신규 공간 활용, 가치 확산 전략이 중요합니다.",
    likelyNeeds: ["엔진오일 브랜드 인지도", "신규 공간 활용", "가치 확산 전략"],
    notes: "Kixx 엔진오일 브랜드 인지도 및 가치 확산 전략 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-cnc-company",
    name: "CNC컴퍼니",
    industry: "FemCare/소비재",
    size: "SME",
    website: "https://cnccompany.net/",
    description: "FemCare 브랜드를 운영하며 여성 건강과 라이프스타일 시장을 다룹니다.",
    recentBusinessContext: "신사업 진출과 M&A 전략, 여성 소비자 니즈 이해가 중요합니다.",
    likelyNeeds: ["신사업 진출", "M&A 전략", "FemCare 고객 니즈"],
    notes: "신사업 진출을 위한 M&A 전략 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-hyundai-mobis",
    name: "현대모비스",
    industry: "자동차 부품/모빌리티",
    website: "https://www.mobis.co.kr/",
    description: "자동차 부품과 스마트 모빌리티 기술을 개발하는 글로벌 기업입니다.",
    recentBusinessContext: "스마트 모빌리티 전환과 미래차 부품 경쟁력, 글로벌 고객 전략이 중요합니다.",
    likelyNeeds: ["스마트 모빌리티 전략", "대외비 프로젝트", "미래차 고객 가치"],
    notes: "2024 산학협력 대외비 기업 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-samsung-electronics",
    name: "삼성전자",
    industry: "전자/IT",
    website: "https://www.samsung.com/sec/",
    description: "글로벌 IT 시장을 이끄는 전자·모바일·반도체 기업입니다.",
    recentBusinessContext: "AI 디바이스, 모바일 생태계, 글로벌 소비자 경험 경쟁이 중요합니다.",
    likelyNeeds: ["대외비 프로젝트", "AI 디바이스 경험", "글로벌 소비자 인사이트"],
    notes: "2024 산학협력 대외비 기업 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-ace-bed",
    name: "에이스침대",
    industry: "가구/리빙",
    website: "https://www.acebed.com/",
    description: "국내 침대 산업을 대표하는 침대 전문 기업입니다.",
    recentBusinessContext: "고객 로열티, 수면 경험, 중장기 서비스 전략이 중요합니다.",
    likelyNeeds: ["고객 로열티", "수면 경험 서비스", "중장기 고객 관리"],
    notes: "중장기적 고객 로열티 향상을 위한 서비스 전략 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-lg-hnh",
    name: "LG생활건강",
    industry: "뷰티/생활소비재",
    website: "https://www.lghnh.com/",
    description: "화장품, 생활용품, 음료를 아우르는 종합 소비재 기업입니다.",
    recentBusinessContext: "동남아 뷰티 이커머스 시장과 2030 타깃 브랜드 육성이 중요합니다.",
    likelyNeeds: ["동남아 뷰티 이커머스", "2030 타깃 브랜드 육성", "글로벌 운영 전략"],
    notes: "동남아 뷰티 이커머스 시장 경쟁력 확보를 위한 2030 타깃 뷰티 브랜드 전략 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-photoism",
    name: "포토이즘",
    industry: "라이프스타일/사진",
    size: "mid_sized_company",
    website: "https://photoism.co.kr/",
    description: "셀프 사진관과 포토부스 문화를 선도하는 라이프스타일 브랜드입니다.",
    recentBusinessContext: "고객 가치 확대, IP 협업, MZ 문화 접점 강화가 중요합니다.",
    likelyNeeds: ["고객 가치 확대", "스튜디오 활성화", "IP 협업"],
    notes: "포토이즘 스튜디오 고객 가치 확대를 위한 활성화 방안 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-kyobo",
    name: "교보문고",
    industry: "도서/문화 콘텐츠",
    website: "https://www.kyobobook.co.kr/",
    description: "오프라인과 온라인 서점, 출판 및 문화 콘텐츠 서비스를 운영합니다.",
    recentBusinessContext: "지속가능 성장, 문화 콘텐츠 경험, 온오프라인 독서 고객 관리가 중요합니다.",
    likelyNeeds: ["지속가능 성장", "문화 콘텐츠 경험", "오프라인 서점 활성화"],
    notes: "교보문고의 지속가능한 성장을 위한 중장기 전략 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-gangnam-unni",
    name: "강남언니",
    industry: "미용의료/헬스케어 플랫폼",
    size: "mid_sized_company",
    website: "https://www.gangnamunni.com/",
    description: "미용의료 시술 정보, 후기, 비용 정보를 제공하는 플랫폼입니다.",
    recentBusinessContext: "해외 미용의료 시장 파악, 신뢰 기반 정보 제공, 글로벌 진입 전략이 중요합니다.",
    likelyNeeds: ["해외 미용의료 시장", "글로벌 진입 전략", "소비자 신뢰 형성"],
    notes: "해외 미용의료 시장 파악 및 진입 전략 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-nongshim",
    name: "농심",
    industry: "식품/F&B",
    website: "https://www.nongshim.com/",
    description: "라면, 스낵, 음료 등 식품 사업을 운영하는 식품 전문 기업입니다.",
    recentBusinessContext: "자사몰 신규 유입, 유저 리텐션, D2C 식품 구매 경험이 중요합니다.",
    likelyNeeds: ["자사몰 신규 유입", "유저 리텐션", "D2C 식품 구매 경험"],
    notes: "자사몰 신규 유입 및 유저 리텐션 전략 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-pozalabs",
    name: "포자랩스",
    industry: "AI/음악",
    size: "startup",
    website: "https://www.pozalabs.com/",
    contactPage: "https://www.pozalabs.com/contact",
    publicEmail: "contact@pozalabs.com",
    linkedinUrl: "https://www.linkedin.com/company/pozalabs",
    description: "AI 음악 작곡 기술을 제공하는 기업입니다.",
    recentBusinessContext: "AI 음악 서비스 가격 전략과 창작자/브랜드 수요 검증이 중요합니다.",
    likelyNeeds: ["신규 서비스 프라이싱", "AI 창작 수요", "B2B 음악 활용"],
    notes: "신규 서비스 프라이싱 전략 수립 사례와 연결됩니다."
  }),
  createCompany({
    id: "company-krafton",
    name: "크래프톤",
    industry: "게임/콘텐츠",
    website: "https://www.krafton.com/",
    description: "글로벌 게임 IP와 스튜디오 포트폴리오를 운영하는 게임 기업입니다.",
    recentBusinessContext: "게임 IP 확장, 글로벌 팬덤, 신규 서비스 페르소나 도출이 중요합니다.",
    likelyNeeds: ["게임 IP 확장", "글로벌 팬덤", "잠재 고객 페르소나"],
    notes: "PUBG 프로젝트 사례와 함께 게임/엔터테인먼트 기업 후보로 적합합니다."
  }),
  createCompany({
    id: "company-channel-talk",
    name: "채널톡",
    industry: "AI/SaaS",
    size: "SME",
    website: "https://channel.io/",
    description: "고객 상담, CRM, 마케팅 자동화를 제공하는 B2B SaaS 기업입니다.",
    recentBusinessContext: "AI 상담 전환, SMB 고객 성공, 일본 등 글로벌 시장 확장이 중요합니다.",
    likelyNeeds: ["SMB 고객 니즈", "AI 상담 수용성", "글로벌 SaaS GTM"],
    notes: "SaaS 고객 세그먼트 분석과 글로벌 GTM 전략 제안에 적합합니다."
  }),
  createCompany({
    id: "company-wantedlab",
    name: "원티드랩",
    industry: "HR/리크루팅",
    size: "mid_sized_company",
    website: "https://www.wantedlab.com/",
    publicEmail: "biz@wantedlab.com",
    description: "채용 플랫폼, 커리어 콘텐츠, HR 솔루션을 제공하는 HR테크 기업입니다.",
    recentBusinessContext: "신입·주니어 채용, AI 매칭, 커리어 콘텐츠와 커뮤니티 접점이 중요합니다.",
    likelyNeeds: ["대학생 커리어 니즈", "주니어 채용 여정", "커리어 콘텐츠 반응"],
    possibleCollaborationTypes: ["recruiting_session", "joint_event", "market_research", "sponsorship"],
    notes: "채용 설명회, 커리어 세션, 대학생 리서치 협업으로 연결하기 좋습니다."
  }),
  createCompany({
    id: "company-todayhouse",
    name: "오늘의집",
    industry: "리빙/프롭테크",
    size: "mid_sized_company",
    website: "https://ohou.se/",
    description: "인테리어 콘텐츠, 커머스, 시공 연결을 제공하는 라이프스타일 플랫폼입니다.",
    recentBusinessContext: "이사·독립·신혼 고객 여정, 콘텐츠 기반 구매 전환, 시공 신뢰 형성이 중요합니다.",
    likelyNeeds: ["1인 가구 리빙 니즈", "콘텐츠-구매 전환", "시공 서비스 신뢰 장벽"],
    notes: "대학생·사회초년생 주거 경험을 다루는 프로젝트와 잘 맞습니다."
  }),
  createCompany({
    id: "company-musinsa",
    name: "무신사",
    industry: "패션/커머스",
    size: "large_enterprise",
    website: "https://www.musinsa.com/",
    description: "패션 커머스, 브랜드 인큐베이션, 오프라인 스토어를 운영하는 패션 플랫폼입니다.",
    recentBusinessContext: "브랜드 포트폴리오 확장, 오프라인 경험, Z세대 패션 취향 변화 대응이 중요합니다.",
    likelyNeeds: ["Z세대 패션 취향 분석", "오프라인 스토어 경험", "브랜드 포트폴리오 전략"],
    notes: "학생 소비자 관점에서 패션 플랫폼의 브랜드·커머스 전략을 제안하기 좋은 외부 확장 후보입니다."
  }),
  createCompany({
    id: "company-woowa-brothers",
    name: "우아한형제들",
    industry: "푸드테크/배달 플랫폼",
    size: "large_enterprise",
    website: "https://www.woowahan.com/",
    description: "배달의민족을 중심으로 음식 주문, 배달, 사장님 솔루션을 운영하는 플랫폼 기업입니다.",
    recentBusinessContext: "외식 경기 둔화, 배달비 민감도, 사장님 성장 지원, 멤버십 가치 강화가 중요합니다.",
    likelyNeeds: ["배달 이용자 리텐션", "외식 소비 패턴", "사장님 대상 서비스 가치"],
    notes: "사용자 리서치와 플랫폼 전략을 결합한 산학협력 주제로 확장하기 좋습니다."
  }),
  createCompany({
    id: "company-yogiyo",
    name: "요기요",
    industry: "푸드테크/배달 플랫폼",
    size: "mid_sized_company",
    website: "https://www.yogiyo.co.kr/",
    contactPage: "https://bizcenter.yogiyo.co.kr/",
    publicEmail: "partnership@yogiyo.co.kr",
    description: "음식 주문과 배달 서비스를 제공하는 배달 플랫폼입니다.",
    recentBusinessContext: "경쟁 플랫폼 대비 차별화, 할인 의존도 완화, 고객 재방문 유도가 중요합니다.",
    likelyNeeds: ["차별화 포지셔닝", "프로모션 효율", "재방문 유도 전략"],
    notes: "배달 플랫폼 간 선택 기준과 리텐션 전략을 분석하는 프로젝트에 적합합니다."
  }),
  createCompany({
    id: "company-kurly",
    name: "컬리",
    industry: "식품/이커머스",
    size: "large_enterprise",
    website: "https://www.kurly.com/",
    description: "신선식품과 라이프스타일 상품을 빠르게 배송하는 이커머스 플랫폼입니다.",
    recentBusinessContext: "프리미엄 식품 커머스 차별화, 반복 구매, PB/뷰티 확장 전략이 중요합니다.",
    likelyNeeds: ["프리미엄 커머스 차별화", "반복 구매 리텐션", "PB·뷰티 확장"],
    notes: "식품·뷰티·라이프스타일 카테고리 확장 전략을 제안하기 좋은 외부 후보입니다."
  }),
  createCompany({
    id: "company-daangn",
    name: "당근",
    industry: "지역 커뮤니티/플랫폼",
    size: "large_enterprise",
    website: "https://www.daangn.com/",
    publicEmail: "contact@daangn.com",
    linkedinUrl: "https://kr.linkedin.com/company/daangn",
    description: "지역 기반 중고거래, 동네생활, 로컬 광고와 커뮤니티 서비스를 운영합니다.",
    recentBusinessContext: "지역 커뮤니티 활성화, 로컬 비즈니스 광고, 신뢰 기반 거래 경험이 중요합니다.",
    likelyNeeds: ["동네 커뮤니티 활성화", "로컬 광고 가치", "거래 신뢰 경험"],
    notes: "지역 기반 서비스의 사용자 행동과 로컬 파트너십 전략을 다루기 좋습니다."
  }),
  createCompany({
    id: "company-yanolja",
    name: "야놀자",
    industry: "여행/호스피탈리티 테크",
    size: "large_enterprise",
    website: "https://www.yanolja.com/",
    description: "숙박, 여행, 레저 예약과 호스피탈리티 SaaS를 운영하는 여행 테크 기업입니다.",
    recentBusinessContext: "국내외 여행 수요 회복, 숙박 사업자 솔루션, 글로벌 호스피탈리티 기술 확장이 중요합니다.",
    likelyNeeds: ["여행 수요 세분화", "숙박 예약 전환", "B2B 솔루션 가치 제안"],
    notes: "소비자 여행 여정과 B2B 호스피탈리티 솔루션을 모두 제안할 수 있는 후보입니다."
  }),
  createCompany({
    id: "company-goodchoice",
    name: "여기어때",
    industry: "여행/예약 플랫폼",
    size: "mid_sized_company",
    website: "https://www.goodchoice.kr/",
    description: "숙박, 항공, 액티비티 등 여행 예약 서비스를 제공하는 플랫폼입니다.",
    recentBusinessContext: "숙박 예약 차별화, 앱 재방문, 여행 콘텐츠 기반 전환이 중요합니다.",
    likelyNeeds: ["앱 재방문", "여행 콘텐츠 전환", "숙박 예약 차별화"],
    notes: "2030 여행 의사결정과 앱 경험 분석 기반 프로젝트에 적합합니다."
  }),
  createCompany({
    id: "company-ridi",
    name: "리디",
    industry: "콘텐츠/웹소설/전자책",
    size: "mid_sized_company",
    website: "https://ridicorp.com/",
    description: "전자책, 웹소설, 웹툰 등 디지털 콘텐츠 서비스를 운영합니다.",
    recentBusinessContext: "콘텐츠 구독, IP 확장, 글로벌 독자 확보, 팬덤 기반 소비가 중요합니다.",
    likelyNeeds: ["콘텐츠 구독 리텐션", "IP 확장", "글로벌 독자 분석"],
    notes: "콘텐츠 플랫폼의 고객 세분화와 IP 사업 전략을 제안하기 좋은 후보입니다."
  }),
  createCompany({
    id: "company-zigbang",
    name: "직방",
    industry: "부동산/프롭테크",
    size: "mid_sized_company",
    website: "https://www.zigbang.com/",
    description: "부동산 정보 탐색과 주거 관련 디지털 서비스를 제공하는 프롭테크 기업입니다.",
    recentBusinessContext: "주거 탐색 신뢰, 1인 가구 수요, 디지털 부동산 경험 차별화가 중요합니다.",
    likelyNeeds: ["1인 가구 주거 탐색", "부동산 정보 신뢰", "앱 전환 경험"],
    notes: "대학생·사회초년생 주거 니즈 분석과 서비스 개선 프로젝트로 연결하기 좋습니다."
  }),
  createCompany({
    id: "company-ably",
    name: "에이블리",
    industry: "패션/커머스",
    size: "mid_sized_company",
    website: "https://a-bly.com/",
    description: "개인화 추천 기반 패션·라이프스타일 커머스 플랫폼입니다.",
    recentBusinessContext: "개인화 추천, 셀러 생태계, 여성 고객 리텐션과 카테고리 확장이 중요합니다.",
    likelyNeeds: ["개인화 추천 경험", "셀러 생태계 활성화", "여성 고객 리텐션"],
    notes: "패션 커머스 고객 행동과 추천 기반 구매 전환 분석에 적합합니다."
  }),
  createCompany({
    id: "company-kakao",
    name: "카카오",
    industry: "인터넷/플랫폼",
    size: "large_enterprise",
    website: "https://www.kakaocorp.com/",
    description: "메신저, 콘텐츠, 커머스, 광고, 금융 등 생활 플랫폼 생태계를 운영합니다.",
    recentBusinessContext: "플랫폼 신뢰 회복, 서비스 간 연결, AI 기반 사용자 경험, 생활 밀착 서비스 확장이 중요합니다.",
    likelyNeeds: ["플랫폼 신뢰", "서비스 간 연결 경험", "AI 사용자 경험"],
    notes: "대학생 관점의 생활 플랫폼 사용성과 신뢰 회복 전략을 제안하기 좋습니다."
  }),
  createCompany({
    id: "company-lunit",
    name: "루닛",
    industry: "AI/헬스케어",
    size: "mid_sized_company",
    website: "https://www.lunit.io/",
    contactPage: "https://www.lunit.io/contact",
    publicEmail: "pr@lunit.io",
    linkedinUrl: "https://www.linkedin.com/company/lunit-inc",
    description: "의료 영상과 암 진단 분야의 AI 솔루션을 개발하는 헬스케어 AI 기업입니다.",
    recentBusinessContext: "의료 AI 도입 장벽, 글로벌 병원 세일즈, 임상 현장 신뢰 확보가 중요합니다.",
    likelyNeeds: ["의료 AI 수용성", "글로벌 병원 GTM", "임상 현장 신뢰"],
    notes: "기술 기반 기업의 시장 진입과 이해관계자 설득 전략을 다루기 좋습니다."
  }),
  createCompany({
    id: "company-tridge",
    name: "트릿지",
    industry: "농식품/데이터 플랫폼",
    size: "mid_sized_company",
    website: "https://www.tridge.com/",
    contactPage: "https://www.tridge.com/contact-us",
    publicEmail: "press@tridge.com",
    linkedinUrl: "https://www.linkedin.com/company/tridge/",
    description: "글로벌 농식품 거래와 시장 데이터를 연결하는 B2B 플랫폼입니다.",
    recentBusinessContext: "글로벌 공급망 데이터 신뢰, B2B 고객 확보, 식품 원자재 시장 인사이트가 중요합니다.",
    likelyNeeds: ["B2B 고객 세분화", "글로벌 공급망 인사이트", "데이터 기반 가치 제안"],
    notes: "B2B 플랫폼의 고객 문제 정의와 시장 확장 전략을 제안하기 좋은 후보입니다."
  }),
  createCompany({
    id: "company-class101",
    name: "CLASS101",
    industry: "교육/크리에이터 이코노미",
    size: "mid_sized_company",
    website: "https://class101.net/",
    publicEmail: "ask@101.inc",
    linkedinUrl: "https://www.linkedin.com/company/class101",
    description: "온라인 클래스와 크리에이터 기반 교육 콘텐츠를 제공하는 플랫폼입니다.",
    recentBusinessContext: "구독형 교육 콘텐츠 리텐션, 크리에이터 공급, 학습 완료율이 중요합니다.",
    likelyNeeds: ["구독 리텐션", "학습 완료율", "크리에이터 콘텐츠 전략"],
    notes: "대학생·주니어 학습 니즈와 콘텐츠 구독 전략을 연결하기 좋습니다."
  }),
  createCompany({
    id: "company-29cm",
    name: "29CM",
    industry: "라이프스타일/커머스",
    size: "mid_sized_company",
    website: "https://www.29cm.co.kr/",
    publicEmail: "customer@29cm.co.kr",
    linkedinUrl: "https://www.linkedin.com/company/29cm",
    description: "브랜드 스토리와 감도 높은 큐레이션을 기반으로 라이프스타일 커머스를 운영합니다.",
    recentBusinessContext: "브랜드 큐레이션, 콘텐츠 기반 구매 전환, 프리미엄 라이프스타일 고객 확보가 중요합니다.",
    likelyNeeds: ["브랜드 큐레이션", "콘텐츠 커머스 전환", "프리미엄 고객 확보"],
    notes: "브랜드 스토리텔링과 커머스 전환 전략을 분석하기 좋은 후보입니다."
  }),
  createCompany({
    id: "company-makestar",
    name: "메이크스타",
    industry: "엔터테인먼트/팬덤 플랫폼",
    size: "SME",
    website: "https://www.makestar.co/",
    publicEmail: "cx@makestar.com",
    description: "K-pop 팬덤 기반 프로젝트, 굿즈, 이벤트 커머스를 운영하는 플랫폼입니다.",
    recentBusinessContext: "글로벌 팬덤 참여, 굿즈 구매 전환, 아티스트 프로젝트 기획이 중요합니다.",
    likelyNeeds: ["글로벌 팬덤 참여", "굿즈 구매 전환", "팬덤 프로젝트 기획"],
    notes: "팬덤 기반 커머스와 글로벌 고객 리서치 프로젝트에 적합합니다."
  }),
  createCompany({
    id: "company-supercat",
    name: "슈퍼캣",
    industry: "게임/메타버스",
    size: "mid_sized_company",
    website: "https://www.supercat.co.kr/",
    publicEmail: "we@supercat.co.kr",
    description: "게임 개발과 메타버스 플랫폼을 운영하는 게임 기업입니다.",
    recentBusinessContext: "커뮤니티 기반 게임 경험, UGC 콘텐츠, 장기 리텐션이 중요합니다.",
    likelyNeeds: ["게임 커뮤니티", "UGC 콘텐츠", "장기 리텐션"],
    notes: "게임 사용자 커뮤니티와 리텐션 전략을 제안하기 좋은 후보입니다."
  }),
  createCompany({
    id: "company-kotra",
    name: "KOTRA",
    industry: "공공기관/무역진흥",
    size: "public_institution",
    website: "https://www.kotra.or.kr/",
    description: "국내 기업의 해외 진출과 수출, 투자 유치를 지원하는 공공기관입니다.",
    recentBusinessContext: "중소기업 해외 진출, 수출 시장 데이터, 청년 글로벌 역량 연결이 중요합니다.",
    likelyNeeds: ["해외 진출 시장 조사", "중소기업 지원 프로그램", "청년 글로벌 프로젝트"],
    possibleCollaborationTypes: ["research_collaboration", "market_research", "joint_event", "sponsorship"],
    notes: "시장 조사와 공공 목적 프로젝트를 결합한 산학협력 후보로 적합합니다."
  }),
  createCompany({
    id: "company-greenpeace-seoul",
    name: "그린피스 서울사무소",
    industry: "ESG/비영리",
    size: "nonprofit",
    website: "https://www.greenpeace.org/korea/",
    description: "기후, 해양, 플라스틱, 에너지 전환 등 환경 캠페인을 수행하는 국제 비영리 단체입니다.",
    recentBusinessContext: "청년 참여 확대, 캠페인 메시지 설계, 기업 ESG 행동 촉구가 중요합니다.",
    likelyNeeds: ["청년 캠페인 참여", "ESG 메시지 전략", "디지털 캠페인 확산"],
    possibleCollaborationTypes: ["joint_event", "market_research", "business_strategy_proposal", "sponsorship"],
    notes: "사회적 임팩트와 캠페인 전략을 다루는 학회 프로젝트에 적합합니다."
  }),
  createCompany({
    id: "company-kleague",
    name: "K LEAGUE",
    industry: "스포츠/엔터테인먼트",
    size: "other",
    website: "https://www.kleague.com/",
    description: "국내 프로축구 리그 운영과 팬 경험, 경기, 구단 생태계를 관리하는 스포츠 브랜드입니다.",
    recentBusinessContext: "신규 관중 유입, 재방문, 리그 단위 팬 참여 이벤트와 관람 경험 설계가 중요합니다.",
    likelyNeeds: ["신규 팬 유입", "경기장 관람 경험", "리그 단위 팬 참여 프로그램"],
    possibleCollaborationTypes: ["business_strategy_proposal", "joint_event", "market_research", "sponsorship"],
    notes: "스포츠 관람을 경험형 엔터테인먼트로 재정의하는 제안에 적합합니다."
  })
];

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomFromSeed(seed: number) {
  let value = seed;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

export function getCompaniesForSeed(seed: string, count = 30): CompanyLead[] {
  const random = randomFromSeed(hashSeed(seed));
  return [...companyPool]
    .map((company) => ({ company, sort: random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, Math.min(count, companyPool.length))
    .map(({ company }) => company);
}

export const companyLeads: CompanyLead[] = getCompaniesForSeed("societybridge-default", 30);

export function findCompanyById(id: string): CompanyLead | undefined {
  return companyPool.find((company) => company.id === id);
}
