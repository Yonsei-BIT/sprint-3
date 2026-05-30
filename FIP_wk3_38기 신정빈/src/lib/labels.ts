import type {
  CollaborationType,
  CompanySize,
  EmailCta,
  EmailLength,
  EmailPurpose,
  EmailTone,
  ProposalLength,
  ProposalTone,
  SavedCompanyStatus,
  SocietyType
} from "@/lib/types";

export const societyTypeLabels: Record<SocietyType, string> = {
  business_society: "경영 학회",
  consulting_club: "컨설팅 학회/동아리",
  finance_society: "금융 학회",
  marketing_club: "마케팅 학회/동아리",
  data_ai_club: "데이터/AI 학회",
  technology_club: "기술 동아리",
  startup_club: "창업 동아리",
  social_impact_club: "소셜임팩트 동아리",
  other: "기타"
};

export const collaborationTypeLabels: Record<CollaborationType, string> = {
  corporate_project: "기업 프로젝트",
  industry_academic_collaboration: "산학협력",
  sponsorship: "스폰서십",
  recruiting_session: "채용 설명회",
  joint_event: "공동 행사",
  research_collaboration: "리서치 협업",
  user_interview: "사용자 인터뷰",
  market_research: "시장 조사",
  business_strategy_proposal: "사업 전략 제안",
  product_feedback: "제품 피드백",
  other: "기타"
};

export const companySizeLabels: Record<CompanySize, string> = {
  startup: "스타트업",
  SME: "중소기업",
  mid_sized_company: "중견기업",
  large_enterprise: "대기업",
  public_institution: "공공기관",
  nonprofit: "비영리",
  other: "기타"
};

export const proposalToneLabels: Record<ProposalTone, string> = {
  strategic: "전략적으로",
  professional: "전문적으로",
  student_friendly: "학생 조직답게",
  concise: "간결하게",
  formal: "격식 있게"
};

export const proposalLengthLabels: Record<ProposalLength, string> = {
  short_summary: "짧은 요약",
  one_page_proposal: "1페이지 제안서",
  detailed_proposal: "상세 제안서"
};

export const emailPurposeLabels: Record<EmailPurpose, string> = {
  corporate_project_proposal: "기업 프로젝트 제안",
  industry_academic_collaboration: "산학협력 제안",
  sponsorship: "스폰서십",
  recruiting_session: "채용 설명회",
  joint_event: "공동 행사",
  research_collaboration: "리서치 협업",
  user_interview: "사용자 인터뷰",
  market_research: "시장 조사",
  other: "기타"
};

export const emailToneLabels: Record<EmailTone, string> = {
  concise: "간결하게",
  formal: "격식 있게",
  confident: "자신감 있게",
  student_organization: "학생 조직답게",
  executive_facing: "임원/실무 리더 대상"
};

export const emailLengthLabels: Record<EmailLength, string> = {
  five_sentences: "5문장",
  short_email: "짧은 이메일",
  detailed_email: "상세 이메일"
};

export const emailCtaLabels: Record<EmailCta, string> = {
  request_meeting: "미팅 요청",
  request_feedback: "피드백 요청",
  request_introduction: "소개 요청",
  request_collaboration_discussion: "협업 논의 요청",
  request_project_opportunity: "프로젝트 기회 요청"
};

export const savedCompanyStatusLabels: Record<SavedCompanyStatus, string> = {
  not_contacted: "미연락",
  contacted: "연락 완료",
  replied: "답변 받음",
  meeting_scheduled: "미팅 예정",
  rejected: "거절",
  follow_up_needed: "후속 연락 필요"
};
