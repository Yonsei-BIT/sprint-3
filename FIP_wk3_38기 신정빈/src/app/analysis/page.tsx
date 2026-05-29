"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

import { DashboardShell } from "@/components/DashboardShell";
import { Badge, EmptyState, ErrorBox, LoadingState, PageHeader } from "@/components/ui";
import { readSocietyState, saveEnvironmentAnalysis } from "@/lib/storage";
import type { EnvironmentAnalysis, SocietyAnalysis, SocietyProfileInput } from "@/lib/types";

export default function AnalysisPage() {
  const [society, setSociety] = useState<SocietyProfileInput | null>(null);
  const [analysis, setAnalysis] = useState<SocietyAnalysis | null>(null);
  const [environment, setEnvironment] = useState<EnvironmentAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = readSocietyState();
    setSociety(stored.society);
    setAnalysis(stored.analysis);
    setEnvironment(stored.environmentAnalysis);
  }, []);

  useEffect(() => {
    if (!society || !analysis || environment) return;

    let cancelled = false;
    async function loadEnvironment() {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch("/api/analyze-environment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ society, analysis })
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "환경 분석에 실패했습니다.");
        if (!cancelled) {
          setEnvironment(payload.data);
          saveEnvironmentAnalysis(payload.data);
        }
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "알 수 없는 오류가 발생했습니다.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadEnvironment();
    return () => {
      cancelled = true;
    };
  }, [society, analysis, environment]);

  return (
    <DashboardShell>
      <PageHeader
        eyebrow="내부/외부 분석"
        title="기업의 문제 상황과 시장 압력을 먼저 분석합니다"
        description="학회 분석이 아니라, 컨택할 기업들이 내부적으로 겪을 법한 문제와 외부 시장 변화를 분석한 뒤 기업 선정 기준을 만듭니다."
      />

      {!society || !analysis ? (
        <EmptyState title="먼저 학회 분석이 필요합니다" description="학회 프로필 화면에서 정보를 입력하면 내부/외부 분석을 생성할 수 있습니다." />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <span>현재 프로필: <strong className="text-slate-950">{society.societyName}</strong></span>
            <Link href="/profile" className="inline-flex items-center gap-2 font-semibold text-cyan-800"><ArrowLeft size={16} />학회 정보 수정</Link>
          </div>
          {isLoading ? <LoadingState label="기업 문제 상황과 외부 시장 환경을 분석하는 중입니다." /> : null}
          {error ? <ErrorBox message={error} /> : null}

          {environment ? (
            <div className="grid gap-4">
              <Section title="1. 기업 내부 환경 분석">
                <TextBlock title="예상 기업 맥락" text={environment.internal_environment_analysis.likely_company_context} />
                <ListBlock title="현재 성장 과제" items={environment.internal_environment_analysis.current_growth_challenges} />
                <ListBlock title="고객/사용자 마찰" items={environment.internal_environment_analysis.customer_or_user_frictions} />
                <ListBlock title="제품/서비스 갭" items={environment.internal_environment_analysis.product_or_service_gaps} />
                <ListBlock title="GTM/브랜딩 이슈" items={environment.internal_environment_analysis.go_to_market_or_branding_issues} />
                <ListBlock title="데이터/인사이트 공백" items={environment.internal_environment_analysis.data_or_insight_gaps} />
                <ListBlock title="기업이 답해야 할 의사결정 질문" items={environment.internal_environment_analysis.decision_questions_for_company} />
              </Section>

              <Section title="2. 기업 외부 환경 분석">
                <BadgeBlock title="관련 산업" items={environment.external_environment_analysis.relevant_industries} />
                <ListBlock title="시장 트렌드" items={environment.external_environment_analysis.market_trends} />
                <ListBlock title="경쟁 압력" items={environment.external_environment_analysis.competitive_pressures} />
                <ListBlock title="고객 행동 변화" items={environment.external_environment_analysis.customer_behavior_shifts} />
                <ListBlock title="규제/사회 요인" items={environment.external_environment_analysis.regulatory_or_social_factors} />
                <ListBlock title="기업 측 예상 페인포인트" items={environment.external_environment_analysis.company_side_pain_points} />
                <ListBlock title="협업 기회 영역" items={environment.external_environment_analysis.collaboration_opportunity_areas} />
                <ListBlock title="이 문제를 겪을 가능성이 높은 기업 유형" items={environment.external_environment_analysis.company_types_likely_to_have_these_problems} />
                <TextBlock title="타깃 선정 로직" text={environment.external_environment_analysis.recommended_target_selection_logic} />
              </Section>

              <Section title="3. 전략적 Fit 요약">
                <TextBlock title="요약" text={environment.strategic_fit_summary} />
              </Section>

              <Section title="4. 추천 타깃 기업 기준">
                <ListBlock title="우선 연락 기준" items={environment.recommended_target_company_criteria} />
                <BadgeBlock title="기업 검색 키워드" items={environment.problem_keywords_for_company_search} />
              </Section>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
              <Loader2 className="mr-2 inline animate-spin" size={16} /> 분석 결과를 준비하고 있습니다.
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">{children}</div>
    </section>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

function BadgeBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">{items.map((item) => <Badge key={item} tone="cyan">{item}</Badge>)}</div>
    </div>
  );
}

function TextBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3 md:col-span-2">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}
