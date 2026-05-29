import { NextResponse } from "next/server";

import { fallbackAnalyzeEnvironment } from "@/lib/fallbacks";
import { generateJson } from "@/lib/openai";
import { isRecord, toText, toTextArray } from "@/lib/normalize";
import type { EnvironmentAnalysis, SocietyAnalysis, SocietyProfileInput } from "@/lib/types";

type Payload = {
  society: SocietyProfileInput;
  analysis: SocietyAnalysis;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Payload;
    const fallback = fallbackAnalyzeEnvironment(payload.society, payload.analysis);

    const analysis = await generateJson<EnvironmentAnalysis>({
      system:
        "당신은 학생 학회와 대학 동아리가 컨택할 기업의 문제 상황을 분석하는 B2B 전략 컨설턴트입니다. 여기서 내부환경분석은 학회의 내부 분석이 아니라, 타깃 기업들이 내부적으로 겪을 법한 성장 과제, 고객/사용자 마찰, 제품/서비스 갭, GTM/브랜딩 문제, 데이터/인사이트 공백을 분석하는 것입니다. 외부환경분석은 해당 기업들이 놓인 시장 트렌드, 경쟁 압력, 고객 행동 변화, 규제/사회 요인을 분석하는 것입니다. 이 분석을 기반으로 어떤 기업을 찾아야 하는지 기준을 제시하세요.",
      user: {
        task: "기업 문제 상황 기반 내부/외부 환경 분석",
        required_keys: Object.keys(fallback),
        society: payload.society,
        society_analysis: payload.analysis
      },
      fallback
    });

    return NextResponse.json({ data: normalizeEnvironmentAnalysis(analysis, fallback), demoMode: !process.env.OPENAI_API_KEY });
  } catch {
    return NextResponse.json({ error: "내부/외부 환경 분석 중 문제가 발생했습니다." }, { status: 400 });
  }
}

function normalizeEnvironmentAnalysis(value: unknown, fallback: EnvironmentAnalysis): EnvironmentAnalysis {
  const record = isRecord(value) ? value : {};
  const internal = isRecord(record.internal_environment_analysis) ? record.internal_environment_analysis : {};
  const external = isRecord(record.external_environment_analysis) ? record.external_environment_analysis : {};

  return {
    internal_environment_analysis: {
      likely_company_context: toText(internal.likely_company_context, fallback.internal_environment_analysis.likely_company_context),
      current_growth_challenges: toTextArray(internal.current_growth_challenges, fallback.internal_environment_analysis.current_growth_challenges),
      customer_or_user_frictions: toTextArray(internal.customer_or_user_frictions, fallback.internal_environment_analysis.customer_or_user_frictions),
      product_or_service_gaps: toTextArray(internal.product_or_service_gaps, fallback.internal_environment_analysis.product_or_service_gaps),
      go_to_market_or_branding_issues: toTextArray(internal.go_to_market_or_branding_issues, fallback.internal_environment_analysis.go_to_market_or_branding_issues),
      data_or_insight_gaps: toTextArray(internal.data_or_insight_gaps, fallback.internal_environment_analysis.data_or_insight_gaps),
      decision_questions_for_company: toTextArray(internal.decision_questions_for_company, fallback.internal_environment_analysis.decision_questions_for_company)
    },
    external_environment_analysis: {
      relevant_industries: toTextArray(external.relevant_industries, fallback.external_environment_analysis.relevant_industries),
      market_trends: toTextArray(external.market_trends, fallback.external_environment_analysis.market_trends),
      competitive_pressures: toTextArray(external.competitive_pressures, fallback.external_environment_analysis.competitive_pressures),
      customer_behavior_shifts: toTextArray(external.customer_behavior_shifts, fallback.external_environment_analysis.customer_behavior_shifts),
      regulatory_or_social_factors: toTextArray(external.regulatory_or_social_factors, fallback.external_environment_analysis.regulatory_or_social_factors),
      company_side_pain_points: toTextArray(external.company_side_pain_points, fallback.external_environment_analysis.company_side_pain_points),
      collaboration_opportunity_areas: toTextArray(external.collaboration_opportunity_areas, fallback.external_environment_analysis.collaboration_opportunity_areas),
      company_types_likely_to_have_these_problems: toTextArray(external.company_types_likely_to_have_these_problems, fallback.external_environment_analysis.company_types_likely_to_have_these_problems),
      recommended_target_selection_logic: toText(external.recommended_target_selection_logic, fallback.external_environment_analysis.recommended_target_selection_logic)
    },
    strategic_fit_summary: toText(record.strategic_fit_summary, fallback.strategic_fit_summary),
    recommended_target_company_criteria: toTextArray(record.recommended_target_company_criteria, fallback.recommended_target_company_criteria),
    problem_keywords_for_company_search: toTextArray(record.problem_keywords_for_company_search, fallback.problem_keywords_for_company_search)
  };
}
