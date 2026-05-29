import { NextResponse } from "next/server";

import { fallbackAnalyzeSociety } from "@/lib/fallbacks";
import { generateJson } from "@/lib/openai";
import { isRecord, toText, toTextArray } from "@/lib/normalize";
import type { SocietyAnalysis, SocietyProfileInput } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as SocietyProfileInput;
    const fallback = fallbackAnalyzeSociety(input);

    const analysis = await generateJson<SocietyAnalysis>({
      system:
        "당신은 대학 학회와 학생 조직의 기업 협업 기회를 발굴하는 전략가입니다. 이 제품은 학회의 비전과 역량을 분석해 협업 가능성이 높은 기업, 기업별 프로젝트 제안 방향, 콜드메일을 자동 생성하는 AI 기반 산학협력 아웃리치 웹앱입니다. 기업 프로젝트, 산학협력, 스폰서십, 채용 세션, 리서치 협업을 위한 학회 프로필만 분석하세요. 모든 필드는 구조화된 JSON으로 반환하세요.",
      user: {
        task: "학회 프로필 분석",
        required_keys: Object.keys(fallback),
        society: input
      },
      fallback
    });

    return NextResponse.json({ data: normalizeSocietyAnalysis(analysis, fallback), demoMode: !process.env.OPENAI_API_KEY });
  } catch {
    return NextResponse.json({ error: "학회 프로필 분석 중 문제가 발생했습니다." }, { status: 400 });
  }
}

function normalizeSocietyAnalysis(value: unknown, fallback: SocietyAnalysis): SocietyAnalysis {
  const record = isRecord(value) ? value : {};
  return {
    society_summary: toText(record.society_summary, fallback.society_summary),
    vision_summary: toText(record.vision_summary, fallback.vision_summary),
    strategic_direction: toText(record.strategic_direction, fallback.strategic_direction),
    core_capabilities: toTextArray(record.core_capabilities, fallback.core_capabilities),
    past_project_assets: toTextArray(record.past_project_assets, fallback.past_project_assets),
    collaboration_assets: toTextArray(record.collaboration_assets, fallback.collaboration_assets),
    suitable_company_types: toTextArray(record.suitable_company_types, fallback.suitable_company_types),
    suitable_industries: toTextArray(record.suitable_industries, fallback.suitable_industries),
    potential_project_themes: toTextArray(record.potential_project_themes, fallback.potential_project_themes),
    outreach_positioning: toText(record.outreach_positioning, fallback.outreach_positioning),
    keywords_for_company_search: toTextArray(record.keywords_for_company_search, fallback.keywords_for_company_search)
  };
}
