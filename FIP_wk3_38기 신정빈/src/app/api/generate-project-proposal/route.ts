import { NextResponse } from "next/server";

import { collaborationTypeLabels, proposalLengthLabels, proposalToneLabels } from "@/lib/labels";
import { fallbackGenerateProjectProposal } from "@/lib/fallbacks";
import { generateJson } from "@/lib/openai";
import type { ProjectProposalOutput, ProjectProposalRequest } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ProjectProposalRequest;
    const fallback = fallbackGenerateProjectProposal(payload);

    const output = await generateJson<ProjectProposalOutput>({
      system:
        "당신은 대학 학회와 기업의 산학협력·기업 프로젝트 제안서를 만드는 전략 컨설턴트입니다. 결과는 실제 기업 제안서처럼 읽혀야 합니다. 반드시 제안 제목, 제안 배경, 기업 문제 정의, 프로젝트 목표, 핵심 질문, 수행 범위, 방법론, 일정/운영 방식, 예상 산출물, 기대효과, 학회 적합성, 협업 요청사항, 1페이지 요약을 포함하세요. 대상 기업의 문제 상황, 해소 가능 영역, 왜 이 학회여야 하는지를 반영하되 과장하지 말고, 기업 담당자가 바로 검토할 수 있는 문장으로 작성하세요. 모든 필드는 한국어 문자열로 반환하세요.",
      user: {
        task: "기업별 산학협력/기업 프로젝트 제안서 생성",
        required_keys: Object.keys(fallback),
        section_guide: {
          proposalTitle: "기업명과 핵심 과제가 드러나는 제안서 제목",
          proposalBackground: "시장/고객/기업 맥락을 연결한 제안 배경",
          companyProblemDefinition: "기업이 겪을 법한 문제를 의사결정 질문으로 재정의",
          projectGoals: "프로젝트로 달성할 목표",
          keyQuestions: "프로젝트가 답해야 할 핵심 질문",
          scopeOfWork: "수행 범위와 제외하거나 조정할 범위",
          methodology: "리서치와 분석 방법론",
          timelineAndOperation: "일정, 미팅, 중간 공유, 최종 발표 등 운영 방식",
          expectedDeliverables: "기업이 받게 될 산출물",
          expectedImpact: "기업 입장에서의 기대효과",
          societyFit: "학회 역량과 해당 기업 과제의 적합성",
          collaborationRequests: "기업에 요청할 협업 사항",
          onePageSummary: "제안 제목, 배경, 목표, 방법, 산출물, 기대효과가 들어간 1페이지 요약"
        },
        length_policy: {
          short_summary: "각 섹션은 1~2문장 중심으로 압축하고, 핵심 질문과 산출물만 짧게 정리하세요.",
          one_page_proposal: "각 섹션은 실제 1페이지 제안서에 들어갈 밀도로 2~4문장 또는 짧은 줄바꿈 목록으로 작성하세요.",
          detailed_proposal: "각 섹션은 상세 제안서 수준으로 근거, 운영 방식, 산출물을 더 구체적으로 작성하세요."
        },
        template_policy: {
          template_name: payload.proposalTemplateName || "기본 정형 제안서",
          template_text: payload.proposalTemplateText || "",
          instruction: "템플릿 텍스트가 있으면 해당 템플릿의 목차, 표현 밀도, 운영 항목을 우선 반영하되 required_keys의 JSON 구조는 반드시 유지하세요. BIT 템플릿의 경우 제안 개요, 주제 제안 1·2, 요청사항 및 최종 아웃풋, 진행 계획이 잘 드러나게 작성하세요."
        },
        labels: {
          collaboration_type: collaborationTypeLabels[payload.preferredCollaborationType],
          tone: proposalToneLabels[payload.tone],
          length: proposalLengthLabels[payload.outputLength]
        },
        request: payload
      },
      fallback,
      temperature: 0.45
    });

    return NextResponse.json({ data: output, demoMode: !process.env.OPENAI_API_KEY });
  } catch {
    return NextResponse.json({ error: "프로젝트 제안 생성 중 문제가 발생했습니다." }, { status: 400 });
  }
}
