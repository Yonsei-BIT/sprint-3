import { collaborationTypeLabels } from "@/lib/labels";
import type {
  ColdEmailOutput,
  ColdEmailRequest,
  CompanyLead,
  CompanyScore,
  EnvironmentAnalysis,
  ProjectProposalOutput,
  ProjectProposalRequest,
  SocietyAnalysis,
  SocietyProfileInput
} from "@/lib/types";

function splitList(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function topicParticle(value: string) {
  const trimmed = value.trim();
  const last = trimmed.charCodeAt(trimmed.length - 1);
  if (last < 0xac00 || last > 0xd7a3) {
    return "는";
  }
  return (last - 0xac00) % 28 === 0 ? "는" : "은";
}

function overlapScore(source: string[], target: string[]): number {
  const normalized = new Set(source.map((item) => item.toLowerCase()));
  return target.reduce((score, item) => score + (normalized.has(item.toLowerCase()) ? 1 : 0), 0);
}

function stableNumber(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash, 31) + value.charCodeAt(index);
  }
  return Math.abs(hash);
}

const tierOneCompanyIds = new Set([
  "company-google",
  "company-samsung-electronics",
  "company-naver",
  "company-kakao",
  "company-sk-telecom",
  "company-kt",
  "company-hyundai-mobis",
  "company-lg-hnh",
  "company-amorepacific",
  "company-toss",
  "company-musinsa",
  "company-woowa-brothers",
  "company-hana-bank",
  "company-lotte",
  "company-sony",
  "company-hp",
  "company-dell",
  "company-gs-caltex",
  "company-nongshim",
  "company-krafton",
  "company-naver-webtoon",
  "company-olive-young",
  "company-gs25",
  "company-paris-baguette",
  "company-kotra"
]);

const tierTwoCompanyIds = new Set([
  "company-kakao-mobility",
  "company-socar",
  "company-kream",
  "company-todayhouse",
  "company-daangn",
  "company-yanolja",
  "company-kurly",
  "company-ridi",
  "company-gangnam-unni",
  "company-lunit",
  "company-wantedlab",
  "company-channel-talk",
  "company-myrealtrip",
  "company-sandbox",
  "company-pubg",
  "company-devsisters",
  "company-photoism",
  "company-kyobo",
  "company-ace-bed",
  "company-emart24",
  "company-jejuair",
  "company-29cm",
  "company-yogiyo",
  "company-class101",
  "company-tridge",
  "company-laundrygo",
  "company-spoon",
  "company-pozalabs"
]);

function companyValueTier(company: CompanyLead) {
  if (tierOneCompanyIds.has(company.id)) {
    return {
      tier: "Tier 1",
      reason: "전국적 또는 글로벌 인지도가 높고, 협업 성사 시 학회 포트폴리오와 대외 신뢰도에 주는 레퍼런스 가치가 큰 네임드 기업입니다."
    };
  }

  if (tierTwoCompanyIds.has(company.id) || company.size === "large_enterprise" || company.size === "mid_sized_company") {
    return {
      tier: "Tier 2",
      reason: "특정 산업이나 2030 고객 접점에서 인지도가 높고, 협업 사례로 활용했을 때 충분한 신뢰도와 설명력이 있는 기업입니다."
    };
  }

  return {
    tier: "Tier 3",
    reason: "브랜드 파급력은 상대적으로 제한적이지만, 문제 상황이 명확하면 대량 아웃리치나 파일럿 협업 후보로 검토할 수 있는 기업입니다."
  };
}

export function fallbackAnalyzeSociety(input: SocietyProfileInput): SocietyAnalysis {
  const industries = splitList(input.industriesOfInterest);
  const capabilities = splitList(input.coreCapabilities || input.mainActivities);
  const projects = splitList(input.pastProjects);
  const keywords = [
    ...industries,
    ...capabilities,
    input.university,
    input.preferredCollaborationType,
    ...input.oneLineIntroduction.split(" ").slice(0, 8)
  ].filter(Boolean).slice(0, 12);

  return {
    society_summary: `${input.societyName}은 ${input.university || "대학"} 기반의 학생 조직으로, ${input.oneLineIntroduction || "기업 협업 프로젝트를 수행할 수 있는 역량"}을 갖추고 있습니다.`,
    vision_summary: input.visionAndDirection || "학생 조직의 학습과 실행 경험을 기업의 실제 과제와 연결하는 방향을 지향합니다.",
    strategic_direction: `${industries.join(", ") || "관심 산업"} 분야 기업을 대상으로 ${collaborationTypeLabels[input.preferredCollaborationType]} 기회를 발굴하는 것이 적합합니다.`,
    core_capabilities: capabilities.length ? capabilities : ["시장 조사", "소비자 인터뷰", "경쟁사 분석", "전략 제안서 작성", "발표 자료 제작"],
    past_project_assets: projects.length ? projects : ["이전 프로젝트 사례", "리서치 보고서", "팀 단위 분석 경험"],
    collaboration_assets: ["대학생·청년 관점의 생생한 인사이트", "짧은 기간 내 실행 가능한 리서치", "설문·IDI·데스크리서치 기반 전략 제안"],
    suitable_company_types: ["2030 고객 접점이 있는 B2C 기업", "신규 서비스 검증이 필요한 성장 기업", "채용·브랜딩 접점이 필요한 기업", "시장 조사와 제품 피드백이 필요한 조직"],
    suitable_industries: industries.length ? industries : ["금융", "리테일", "소비자 플랫폼", "교육", "AI/SaaS", "콘텐츠"],
    potential_project_themes: [
      "2030 고객 행동과 니즈 분석",
      "신규 서비스 또는 캠페인 기획",
      "시장 진입 및 고객 세그먼트 전략",
      "제품 사용성 피드백과 개선 제안"
    ],
    outreach_positioning: `${input.societyName}을 기업이 내부 데이터만으로 보기 어려운 학생·청년 고객의 실제 맥락을 빠르게 조사하고 전략 제안으로 정리하는 파트너로 포지셔닝하세요.`,
    keywords_for_company_search: keywords
  };
}

export function fallbackAnalyzeEnvironment(input: SocietyProfileInput, analysis: SocietyAnalysis): EnvironmentAnalysis {
  const industries = analysis.suitable_industries.length ? analysis.suitable_industries : splitList(input.industriesOfInterest);
  const themes = analysis.potential_project_themes.length ? analysis.potential_project_themes : ["2030 고객 행동 분석", "제품/서비스 개선 기회 발굴"];

  return {
    internal_environment_analysis: {
      likely_company_context: `${industries.join(", ") || "관심 산업"} 기업은 신규 고객 유입, 2030 고객 이해, 제품/서비스 개선, 브랜드 차별화 같은 내부 과제를 겪을 가능성이 높습니다.`,
      current_growth_challenges: ["신규 고객 유입 비용 증가", "기존 고객 재방문 또는 락인 약화", "신규 서비스와 캠페인의 검증 부담"],
      customer_or_user_frictions: ["청년 고객의 실제 선택 기준을 내부 지표만으로 설명하기 어려움", "오프라인과 온라인 접점 사이의 사용 맥락 파악 부족", "제품 사용 장벽과 이탈 이유에 대한 정성 데이터 부족"],
      product_or_service_gaps: ["경쟁 서비스 대비 차별화 포인트가 고객 언어로 정리되지 않음", "신규 기능 또는 프로그램의 초기 반응 검증이 필요함", "고객 세그먼트별 제안 가치가 명확하지 않을 수 있음"],
      go_to_market_or_branding_issues: ["대학생·청년 타깃 메시지와 채널 선택이 불명확함", "커뮤니티와 캠퍼스 접점 활용 전략이 부족함", "브랜드 경험을 실제 행동 전환으로 연결하는 근거가 필요함"],
      data_or_insight_gaps: ["설문·IDI·현장 관찰 기반 raw insight 부족", "경쟁사/대체재와 비교한 고객 선택 맥락 부족", "실행 아이디어를 뒷받침할 외부 관점의 자료 부족"],
      decision_questions_for_company: themes.map((theme) => `${theme}를 실제 프로젝트로 추진하면 어떤 고객 문제를 해결할 수 있는가`)
    },
    external_environment_analysis: {
      relevant_industries: industries,
      market_trends: ["기업의 Z세대·2030 고객 이해 수요 증가", "커뮤니티와 오프라인 경험 기반 마케팅 확대", "AI와 데이터 기반 고객 경험 개선 요구", "채용 브랜딩과 대학생 접점 강화"],
      competitive_pressures: ["플랫폼 간 고객 시간 점유 경쟁 심화", "할인·광고 중심 성장의 효율 저하", "유사 서비스 증가로 브랜드 차별화 난이도 상승"],
      customer_behavior_shifts: ["2030 고객의 구매·사용 의사결정이 커뮤니티, 리뷰, 숏폼, 오프라인 경험에 더 크게 영향받음", "제품 기능보다 경험, 정체성, 편의성을 함께 비교하는 경향 강화"],
      regulatory_or_social_factors: ["개인정보와 데이터 활용에 대한 민감도 증가", "ESG와 사회적 책임에 대한 브랜드 평가 기준 강화", "공정한 채용·청년 기회에 대한 사회적 관심 증가"],
      company_side_pain_points: ["청년 고객의 실제 선택 이유를 내부 데이터만으로 해석하기 어려움", "신규 캠페인과 제품 개선 아이디어 검증 필요", "대학생 커뮤니티 접점 부족", "실행 가능한 외부 관점의 전략 제안 부족"],
      collaboration_opportunity_areas: themes,
      company_types_likely_to_have_these_problems: analysis.suitable_company_types,
      recommended_target_selection_logic: "먼저 기업 후보를 기업 인지도, 브랜드 파급력, 협업 레퍼런스 가치 기준의 Tier 1, Tier 2, Tier 3로 분류하세요. 이후 같은 Tier 안에서 각 기업이 겪을 법한 고객·제품·GTM 문제, 학회가 해소 가능한 영역, 왜 이 학회가 해야 하는지를 기준으로 적합도와 콜드메일 우선순위를 정하세요."
    },
    strategic_fit_summary: `${input.societyName}${topicParticle(input.societyName)} 기업의 내부 문제 상황과 외부 시장 압력을 먼저 정의하고, 그중 학생·청년 관점의 리서치로 풀 수 있는 문제를 가진 기업을 우선 컨택해야 합니다.`,
    recommended_target_company_criteria: ["Tier 1: 기업 인지도와 협업 레퍼런스 가치가 매우 높은 네임드 기업", "Tier 2: 특정 산업 또는 2030 고객 접점에서 인지도가 높아 포트폴리오 가치가 충분한 기업", "Tier 3: 브랜드 파급력은 낮지만 문제 상황이 명확하면 파일럿 또는 대량 아웃리치 후보가 될 기업", "같은 Tier 안에서는 정의된 기업 문제 상황과 직접 연결되는 정도가 높음", "학생·청년 고객 또는 인재 접점이 있음", "공개 문의 채널이 있음", "기업이 받을 산출물이 명확함"],
    problem_keywords_for_company_search: [...industries, "2030 고객", "락인", "재방문", "브랜드 경험", "제품 피드백", "시장 조사"].filter(Boolean).slice(0, 12)
  };
}

export function fallbackScoreCompany(input: SocietyProfileInput, analysis: SocietyAnalysis, company: CompanyLead, environmentAnalysis?: EnvironmentAnalysis | null): CompanyScore {
  const industries = splitList(input.industriesOfInterest);
  const capabilities = analysis.core_capabilities;
  const collaborationMatch = company.possibleCollaborationTypes.includes(input.preferredCollaborationType) ? 14 : 5;
  const industryMatch = company.industry.includes(input.industriesOfInterest) ? 10 : overlapScore(industries, [company.industry, ...company.likelyNeeds]) * 6;
  const contactBonus = company.contact.publicEmail || company.contact.contactPage ? 8 : 3;
  const problemKeywords = environmentAnalysis?.problem_keywords_for_company_search || [];
  const problemMatch = overlapScore(problemKeywords, [company.industry, company.recentBusinessContext, ...company.likelyNeeds]) * 3;
  const companyText = `${company.name} ${company.industry} ${company.description} ${company.recentBusinessContext} ${company.likelyNeeds.join(" ")} ${company.notes}`;
  const strategicNeedScore = [
    "2030",
    "대학생",
    "청년",
    "고객",
    "리텐션",
    "신규",
    "마케팅",
    "브랜드",
    "서비스",
    "전략",
    "커뮤니티",
    "글로벌"
  ].reduce((total, keyword) => total + (companyText.includes(keyword) ? 2 : 0), 0);
  const sizeScore = company.size === "large_enterprise" ? 4 : company.size === "mid_sized_company" ? 3 : company.size === "public_institution" ? 2 : 0;
  const historySignal = company.notes.includes("사례") || company.notes.includes("산학협력") ? 5 : 0;
  const spread = (stableNumber(company.id) % 23) - 11;
  const score = Math.max(
    52,
    Math.min(
      97,
      36 + collaborationMatch + industryMatch + contactBonus + Math.min(capabilities.length, 5) * 2 + problemMatch + Math.min(strategicNeedScore, 16) + sizeScore + historySignal + spread
    )
  );
  const valueTier = companyValueTier(company);
  const priorityTier = valueTier.tier;
  const environmentProblemFit = environmentAnalysis
    ? `${company.name}${topicParticle(company.name)} ${environmentAnalysis.internal_environment_analysis.current_growth_challenges.slice(0, 2).join(", ")} 같은 내부 문제 상황과 ${company.likelyNeeds.slice(0, 2).join(", ")} 니즈가 맞닿아 있습니다.`
    : `${company.name}의 니즈는 학회가 정의한 기업 문제 상황과 연결될 수 있습니다.`;
  const solvableArea = `${company.likelyNeeds.slice(0, 2).join(", ")} 영역은 ${analysis.core_capabilities.slice(0, 3).join(", ")} 역량으로 문제 정의, 고객 리서치, 실행 제안까지 연결할 수 있습니다.`;
  const whyOurSociety = `${input.societyName}${topicParticle(input.societyName)} ${analysis.outreach_positioning}이라는 포지셔닝을 갖고 있어, ${company.name}이 내부에서 보기 어려운 학생·청년 관점의 외부 인사이트를 제공할 수 있습니다.`;

  return {
    fitScore: score,
    priorityTier,
    tierReason: `${priorityTier}로 분류됩니다. ${valueTier.reason} 적합도 ${score}점은 별도 기준이며, 같은 Tier 안에서 컨택 우선순위를 나눌 때 사용하세요.`,
    whyGoodTarget: `${company.name}${topicParticle(company.name)} ${company.industry} 영역에서 ${company.likelyNeeds.slice(0, 2).join(", ")} 니즈가 있어 ${input.societyName}의 관심 방향과 연결됩니다.`,
    expectedCompanyProblem: company.likelyNeeds.join(", "),
    solvableArea,
    whyOurSociety,
    recommendedProjectDirection: `${company.name}의 ${company.likelyNeeds[0] || "고객 과제"}를 주제로 설문, 인터뷰, 경쟁 사례 분석을 결합한 ${collaborationTypeLabels[input.preferredCollaborationType]} 프로젝트를 제안하세요.`,
    collaborationTypeFit: company.possibleCollaborationTypes.map((type) => collaborationTypeLabels[type]).join(", "),
    contactAvailability: company.contact.publicEmail
      ? `공개 이메일 ${company.contact.publicEmail}로 연락할 수 있습니다.`
      : "No verified public email is available. Use the company contact page or partnership inquiry form.",
    fitReasoning: `${analysis.outreach_positioning} 이 포지셔닝은 ${company.description}라는 맥락에서 기업이 바로 이해할 수 있는 협업 가치로 전환됩니다.`,
    risks: ["담당 부서가 명확하지 않으면 응답률이 낮을 수 있습니다.", "기업 내부 데이터 접근이 필요한 주제는 범위를 조정해야 합니다."],
    environmentProblemFit
  };
}

export function fallbackGenerateProjectProposal(request: ProjectProposalRequest): ProjectProposalOutput {
  const society = request.society?.societyName || "우리 학회";
  const company = request.company?.name || "대상 기업";
  const need = request.scoreContext?.expectedCompanyProblem || request.company?.likelyNeeds.join(", ") || "고객 이해와 성장 과제";
  const duration = request.desiredProjectDuration || "2~4주";
  const capabilities = request.capabilitiesToEmphasize || request.analysis?.core_capabilities.join(", ") || "시장 조사, 설문, 인터뷰, 경쟁사 분석, 전략 제안";
  const projectTheme = request.scoreContext?.recommendedProjectDirection || `${need}를 주제로 한 산학협력 프로젝트`;

  if (request.outputLength === "short_summary") {
    return {
      proposalTitle: `${company} ${need} 해결을 위한 ${society} 협업 제안`,
      proposalBackground: `${company}${topicParticle(company)} ${need}와 관련된 의사결정을 더 정교하게 만들 필요가 있습니다. ${society}${topicParticle(society)} 학생·청년 관점의 리서치와 분석으로 기업 내부에서 놓치기 쉬운 고객 맥락을 보완할 수 있습니다.`,
      companyProblemDefinition: `${need} 영역에서 고객의 실제 선택 이유, 경쟁 대안과의 비교 기준, 실행 우선순위를 명확히 정의해야 합니다.`,
      projectGoals: `${duration} 안에 핵심 문제를 구조화하고, 기업이 바로 검토할 수 있는 실행 제안과 우선순위를 도출합니다.`,
      keyQuestions: `1. ${company}의 핵심 고객은 어떤 기준으로 선택하고 이탈하는가?\n2. 현재 제품·서비스·브랜드 경험에서 개선 우선순위는 무엇인가?\n3. 단기 실행 가능한 협업 과제는 무엇인가?`,
      scopeOfWork: "문제 정의, 2차 자료 조사, 간단한 고객 리서치, 경쟁 사례 비교, 핵심 제안 도출",
      methodology: `${capabilities}를 중심으로 가설 수립, 고객 검증, 전략 정리를 진행합니다.`,
      timelineAndOperation: `${duration} 동안 착수 미팅, 중간 공유, 최종 발표 순서로 운영합니다.`,
      expectedDeliverables: "1페이지 요약, 핵심 인사이트, 실행 제안, 최종 발표 자료",
      expectedImpact: "기업은 청년 고객 관점의 외부 인사이트와 우선 실행 과제를 빠르게 확보할 수 있습니다.",
      societyFit: `${society}${topicParticle(society)} ${request.analysis?.outreach_positioning || "학생 조직의 현장감 있는 관점과 구조화된 분석 역량을 결합할 수 있습니다."}`,
      collaborationRequests: "담당자 미팅, 공개 가능한 기초 자료, 중간 피드백 1회, 최종 발표 참석을 요청드립니다.",
      onePageSummary: `${projectTheme}\n\n${society}${topicParticle(society)} ${company}의 ${need} 과제를 학생·청년 고객 관점에서 분석하고, ${duration} 내 실행 가능한 제안과 산출물로 정리하는 협업을 제안합니다.`
    };
  }

  if (request.outputLength === "detailed_proposal") {
    return {
      proposalTitle: `${company}의 ${need} 해결을 위한 ${society} 산학협력 프로젝트 제안서`,
      proposalBackground: `${company}${topicParticle(company)} ${request.company?.recentBusinessContext || "변화하는 시장 환경"} 속에서 ${need}와 관련된 의사결정을 더 정교하게 만들 필요가 있습니다. 특히 청년 고객의 선택 기준과 사용 맥락은 내부 지표만으로 설명하기 어려운 경우가 많아, 외부 관점의 리서치와 구조화된 분석이 필요합니다. ${society}${topicParticle(society)} 기업의 실제 과제를 학습형 프로젝트가 아니라 실무 검토 가능한 제안서로 전환하는 것을 목표로 합니다.`,
      companyProblemDefinition: `현재 예상되는 핵심 문제는 ${need}입니다. 이를 세분화하면 고객이 어떤 상황에서 제품·서비스를 선택하는지, 경쟁 대안과 비교할 때 어떤 차별점이 충분히 전달되는지, 단기간에 검증 가능한 개선 과제가 무엇인지로 나눌 수 있습니다. 프로젝트는 문제를 넓게 나열하기보다 기업이 후속 논의에 바로 사용할 수 있는 의사결정 질문으로 재정의합니다.`,
      projectGoals: `1. ${company}의 고객·시장·경쟁 맥락에서 핵심 문제를 명확히 정의합니다.\n2. 설문, 인터뷰, 데스크리서치를 통해 문제의 근거와 고객 언어를 확보합니다.\n3. ${company}가 검토할 수 있는 실행 과제, 우선순위, 기대효과를 제안합니다.\n4. 향후 산학협력 또는 기업 프로젝트로 확장 가능한 운영 방식을 제시합니다.`,
      keyQuestions: `1. ${company}의 주요 고객은 현재 어떤 상황과 기준으로 선택·이탈을 결정하는가?\n2. ${need} 중 기업이 단기간에 검증할 수 있는 핵심 과제는 무엇인가?\n3. 경쟁사 또는 대체 서비스는 유사 문제를 어떤 방식으로 해결하고 있는가?\n4. 청년·대학생 고객 관점에서 가장 설득력 있는 메시지, 기능, 경험 개선 방향은 무엇인가?\n5. 프로젝트 종료 후 기업이 바로 실행하거나 추가 검토할 수 있는 다음 단계는 무엇인가?`,
      scopeOfWork: `프로젝트 범위는 문제 정의, 자료 조사, 고객 리서치, 경쟁 사례 분석, 전략 방향 도출, 최종 제안서 작성으로 구성합니다. 필요 시 설문과 IDI를 병행하되, 기업 내부 기밀 데이터가 필요한 영역은 제외하고 공개 자료와 제공 가능한 범위의 자료를 기준으로 진행합니다. 최종 결과는 아이디어 나열이 아니라 우선순위가 있는 제안 패키지로 정리합니다.`,
      methodology: `초기에는 ${company}의 사업 맥락과 ${need}를 바탕으로 가설을 설정합니다. 이후 ${capabilities} 역량을 활용해 고객 관점의 증거를 수집하고, 경쟁사·대체재 분석으로 외부 기준을 보강합니다. 마지막으로 인사이트를 실행안, 기대효과, 운영 난이도 기준으로 평가해 기업이 논의 가능한 형태의 제안서로 정리합니다.`,
      timelineAndOperation: `${duration} 기준으로 1단계 착수 미팅과 자료 정리, 2단계 리서치 설계와 데이터 수집, 3단계 분석과 중간 공유, 4단계 최종 제안서 및 발표로 운영합니다. 기업 담당자는 착수 미팅, 중간 피드백, 최종 발표에 참여하고, 학회는 주간 단위로 진행 상황과 주요 발견점을 공유합니다.`,
      expectedDeliverables: `1. 1페이지 제안 요약\n2. 기업 문제 정의 및 핵심 질문 정리\n3. 설문·인터뷰 또는 데스크리서치 인사이트\n4. 경쟁사·대체재 벤치마킹\n5. 실행 과제 우선순위와 기대효과\n6. 최종 제안서 및 발표 자료`,
      expectedImpact: `${company}${topicParticle(company)} 청년 고객 관점의 구체적인 언어와 행동 근거를 확보하고, 내부 논의에 바로 올릴 수 있는 실행 후보를 얻을 수 있습니다. 또한 비교적 짧은 기간 안에 시장 반응, 고객 니즈, 커뮤니케이션 방향을 검증해 후속 프로젝트의 리스크를 줄일 수 있습니다.`,
      societyFit: `${society}${topicParticle(society)} ${request.analysis?.outreach_positioning || "학생·청년 관점의 리서치와 전략 제안 역량을 갖춘 조직입니다."} 특히 ${capabilities} 역량을 바탕으로 기업이 내부에서 접근하기 어려운 고객 맥락을 수집하고, 이를 실무자가 이해하기 쉬운 제안서와 발표 자료로 전환할 수 있습니다.`,
      collaborationRequests: `${company}에는 담당 부서 또는 실무 담당자 연결, 공개 가능한 기초 자료 제공, 착수 미팅 1회, 중간 피드백 1회, 최종 발표 참석을 요청드립니다. 프로젝트 범위와 산출물은 첫 미팅에서 기업의 우선순위에 맞춰 조정할 수 있습니다.`,
      onePageSummary: `제안 제목: ${company}의 ${need} 해결을 위한 ${society} 산학협력 프로젝트\n\n제안 배경: ${company}${topicParticle(company)} ${need}와 관련된 고객·시장 의사결정을 더 정교하게 만들 필요가 있습니다.\n\n목표: ${duration} 동안 문제 정의, 고객 리서치, 경쟁 분석, 실행 제안 도출을 진행합니다.\n\n핵심 산출물: 1페이지 요약, 인사이트 보고서, 실행 과제 우선순위, 최종 제안서 및 발표 자료\n\n기대효과: 기업은 청년 고객 관점의 외부 인사이트와 바로 논의 가능한 후속 실행안을 확보할 수 있습니다.`
    };
  }

  return {
    proposalTitle: `${company}를 위한 2030 고객 인사이트 기반 산학협력 제안서`,
    proposalBackground: `${company}${topicParticle(company)} ${need}와 관련된 의사결정을 더 정교하게 만들 필요가 있습니다. 빠르게 변하는 청년 고객 행동과 경쟁 환경 때문에, 기업 내부 데이터만으로는 실제 선택 맥락을 충분히 설명하기 어렵습니다.`,
    companyProblemDefinition: `${need}를 핵심 문제로 보고, 고객 니즈·경쟁 대안·실행 우선순위 관점에서 기업이 바로 논의할 수 있는 문제로 재정의합니다.`,
    projectGoals: `${society}의 리서치와 분석 역량을 활용해 ${company}의 핵심 고객 문제를 검증하고, 실행 가능한 프로젝트 방향과 우선순위를 제안합니다.`,
    keyQuestions: `1. 고객은 어떤 맥락에서 ${company}를 선택하거나 이탈하는가?\n2. ${need} 중 우선 해결해야 할 문제는 무엇인가?\n3. 경쟁사 대비 강화할 수 있는 메시지와 경험은 무엇인가?\n4. 단기 실행 가능한 협업 과제는 무엇인가?`,
    scopeOfWork: "데스크리서치, 설문, 심층 인터뷰, 경쟁 사례 분석, 전략 방향 도출, 최종 제안서 작성",
    methodology: "2차 자료 분석으로 가설을 세우고, 설문과 IDI로 고객 맥락을 검증한 뒤 기업 관점의 실행 제안으로 정리합니다.",
    timelineAndOperation: `${duration} 동안 착수 미팅, 리서치 설계, 데이터 수집, 중간 공유, 최종 발표 순서로 운영합니다.`,
    expectedDeliverables: "1페이지 요약, 설문/인터뷰 인사이트, 핵심 문제 정의, 프로젝트 아이디어, 실행 로드맵, 최종 발표 자료",
    expectedImpact: "기업은 청년 고객 관점의 raw insight와 바로 논의 가능한 프로젝트 아이디어를 낮은 부담으로 확보할 수 있습니다.",
    societyFit: `${society}${topicParticle(society)} 학생 고객 접근성과 구조화된 분석 역량을 동시에 보유하고 있어, ${company}가 내부에서 보기 어려운 외부 관점을 제공할 수 있습니다.`,
    collaborationRequests: "담당자 미팅, 공개 가능한 기초 자료, 중간 피드백, 최종 발표 참석을 요청드립니다.",
    onePageSummary: `${society}${topicParticle(society)} ${company}의 ${need} 과제를 학생·청년 관점에서 분석하고 실행 가능한 협업 제안으로 정리합니다. 프로젝트는 ${duration} 동안 문제 정의, 리서치, 경쟁 분석, 최종 제안서 작성 순서로 진행되며, 기업은 후속 의사결정에 활용할 수 있는 인사이트와 실행 우선순위를 확보할 수 있습니다.`
  };
}

export function fallbackGenerateColdEmail(request: ColdEmailRequest): ColdEmailOutput {
  const society = request.society?.societyName || "우리 학회";
  const company = request.company?.name || "귀사";
  const sender = [request.senderRole, request.senderName].filter(Boolean).join(" ") || "대외협력 담당자";
  const direction = request.scoreContext?.recommendedProjectDirection || "청년 고객 인사이트 기반 협업 프로젝트";
  const expectedProblem = request.scoreContext?.expectedCompanyProblem || request.company?.likelyNeeds.join(", ") || "청년 고객 이해와 신규 협업 기회";
  const companyReason = request.scoreContext?.whyGoodTarget || `${company}${topicParticle(company)} ${request.company?.industry || "관련 산업"}에서 청년 고객 접점과 협업 확장 가능성이 높다고 판단했습니다.`;
  const companyValue = request.scoreContext?.solvableArea || "설문, 인터뷰, 시장 조사, 경쟁 사례 분석을 바탕으로 기업 내부에서 검토 가능한 인사이트와 실행 제안을 제공할 수 있습니다.";
  const attachmentSentence = request.optionalAttachmentMention || "필요하시면 학회 소개자료와 세부 협업 방향을 함께 전달드리겠습니다.";

  return {
    subjectLines: [
      `[${society}] 산학협력 검토 요청`,
      `${company} 고객 과제 협업 제안`,
      `대외협력 담당 부서 연결 요청`
    ],
    emailBody: `안녕하세요, ${company} 담당자님.\n\n저는 ${society}의 ${sender}입니다. ${society}${topicParticle(society)} ${request.society?.oneLineIntroduction || "기업의 실제 과제를 학생 관점의 리서치와 전략 제안으로 연결하는 학생 조직"}입니다.\n\n${company}에 연락드린 이유는 ${companyReason} 특히 ${expectedProblem} 측면에서 외부 관점의 리서치와 학생·청년 고객 인사이트가 의미 있는 검토 자료가 될 수 있다고 보았습니다.\n\n이에 ${direction} 방향의 협업 가능성을 제안드립니다. ${companyValue} 이를 통해 ${company}에서는 고객 이해, 신규 프로젝트 검증, 실행 우선순위 논의에 활용 가능한 자료를 확보하실 수 있을 것으로 기대합니다.\n\n${attachmentSentence}\n\n가능하시다면 관련 담당 부서 연결 또는 20분 내외의 온라인 미팅을 통해 협업 가능성을 논의드리고자 합니다. 검토 후 회신 주시면 감사하겠습니다.\n\n감사합니다.\n${sender} 드림`,
    shortLinkedInDm: `안녕하세요. ${society}에서 ${company}와의 산학협력 가능성 검토를 요청드리고자 연락드립니다. ${direction} 방향으로 담당 부서 연결 또는 간단한 논의가 가능하실지 확인 부탁드립니다.`,
    followUpEmailMessage: `안녕하세요, 이전에 ${society}의 ${company} 협업 제안 검토를 요청드린 바 있어 후속으로 연락드립니다. 검토에 필요한 소개자료나 협업 방향을 추가로 전달드릴 수 있으며, 관련 담당 부서 연결 또는 20분 내외의 온라인 미팅 가능 여부를 확인해 주시면 감사하겠습니다.`,
    oneSentencePitch: `${society}${topicParticle(society)} 학생·청년 고객 인사이트와 구조화된 분석 역량을 바탕으로 ${company}의 과제를 검토 가능한 협업 제안으로 구체화합니다.`,
    suggestedCtaSentence: "가능하시다면 관련 담당 부서 연결 또는 다음 주 중 20분 내외의 온라인 미팅 가능 여부를 회신 부탁드립니다."
  };
}
