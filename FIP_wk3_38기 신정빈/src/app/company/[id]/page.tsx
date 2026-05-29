"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BookmarkPlus, ExternalLink, FileText, MailPlus, Users } from "lucide-react";

import { DashboardShell } from "@/components/DashboardShell";
import { Badge, EmptyState, ErrorBox, FitScore, LoadingState, PageHeader } from "@/components/ui";
import { collaborationTypeLabels, companySizeLabels } from "@/lib/labels";
import { findCompanyById } from "@/lib/mockData";
import { readSavedCompanies, readSocietyState, writeSavedCompanies } from "@/lib/storage";
import type { CompanyLead, CompanyScore, ContactRoute, EnvironmentAnalysis, SavedCompany, SocietyAnalysis, SocietyProfileInput } from "@/lib/types";

const publicEmailFallback = "검증된 공개 이메일이 없습니다. 공식 문의 페이지 또는 제휴/파트너십 문의 채널을 이용하세요.";

export default function CompanyDetailPage() {
  const params = useParams<{ id: string }>();
  const company = useMemo(() => findCompanyById(params.id), [params.id]);
  const contactRoutes = useMemo(() => (company ? contactRoutesFor(company) : []), [company]);
  const [society, setSociety] = useState<SocietyProfileInput | null>(null);
  const [analysis, setAnalysis] = useState<SocietyAnalysis | null>(null);
  const [environmentAnalysis, setEnvironmentAnalysis] = useState<EnvironmentAnalysis | null>(null);
  const [score, setScore] = useState<CompanyScore | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = readSocietyState();
    setSociety(stored.society);
    setAnalysis(stored.analysis);
    setEnvironmentAnalysis(stored.environmentAnalysis);
  }, []);

  useEffect(() => {
    if (!company || !society || !analysis) return;
    let cancelled = false;

    async function loadScore() {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch("/api/score-company", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ society, analysis, environmentAnalysis, company })
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "기업 상세 분석에 실패했습니다.");
        if (!cancelled) setScore(payload.data);
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "알 수 없는 오류가 발생했습니다.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadScore();
    return () => {
      cancelled = true;
    };
  }, [company, society, analysis, environmentAnalysis]);

  function handleSave() {
    if (!company) return;
    const saved: SavedCompany = {
      id: `${company.id}-${Date.now()}`,
      companyId: company.id,
      companyName: company.name,
      industry: company.industry,
      fitScore: score?.fitScore ?? 0,
      problemSituation: score?.expectedCompanyProblem || company.likelyNeeds.join(", "),
      projectProposalDirection: score?.recommendedProjectDirection || company.notes,
      contactChannel: company.contact,
      generatedColdEmail: "",
      notes: "기업 상세에서 저장됨",
      status: "not_contacted",
      savedAt: new Date().toISOString()
    };
    writeSavedCompanies([saved, ...readSavedCompanies()]);
  }

  if (!company) {
    return (
      <DashboardShell>
        <EmptyState title="기업을 찾을 수 없습니다" description="목데이터에 없는 기업입니다. 기업 찾기 화면에서 다시 선택해주세요." />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <PageHeader
        eyebrow="기업 상세"
        title={company.name}
        description="기업 개요, 예상 문제 상황, 프로젝트 제안 방향, 연락 채널을 한 화면에서 확인합니다."
        action={
          <div className="flex flex-wrap gap-2">
            <button onClick={handleSave} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <BookmarkPlus size={16} />저장
            </button>
            <Link href={`/proposal?company=${company.id}`} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <FileText size={16} />제안서 생성
            </Link>
            <Link href={`/email?company=${company.id}`} className="inline-flex items-center gap-2 rounded-md bg-cyan-950 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-900">
              <MailPlus size={16} />이메일 생성
            </Link>
          </div>
        }
      />

      {!society || !analysis ? (
        <div className="space-y-4">
          <EmptyState title="먼저 학회 분석이 필요합니다" description="학회 프로필 화면에서 정보를 입력하면 기업 적합도 분석까지 볼 수 있습니다. 연락 채널은 아래에서 먼저 확인할 수 있습니다." />
          <ContactSection company={company} score={score} contactRoutes={contactRoutes} />
        </div>
      ) : (
        <div className="space-y-4">
          {isLoading ? <LoadingState label="기업 상세 적합도를 분석하는 중입니다." /> : null}
          {error ? <ErrorBox message={error} /> : null}

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="green">{company.industry}</Badge>
                  {score?.priorityTier ? <Badge tone="amber">{score.priorityTier}</Badge> : null}
                  <Badge tone="cyan">{companySizeLabels[company.size]}</Badge>
                  <Badge tone="amber">{company.region}</Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{company.description}</p>
              </div>
              <FitScore score={score?.fitScore ?? 0} />
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <DetailBlock title="기업 개요" value={company.description} />
            <DetailBlock title="산업 맥락" value={company.recentBusinessContext} />
            <DetailBlock title="티어 분류" value={score?.tierReason || "기업 후보 티어를 분류하는 중입니다."} />
            <DetailBlock title="왜 관련 있는 기업인가" value={score?.whyGoodTarget || "분석 대기 중입니다."} />
            <DetailBlock title="문제 상황 Fit" value={score?.environmentProblemFit || "기업 문제 상황 분석과의 연결성을 평가하는 중입니다."} />
            <DetailBlock title="기업 측 문제 상황" value={score?.expectedCompanyProblem || company.likelyNeeds.join(", ")} />
            <DetailBlock title="해소 가능 영역" value={score?.solvableArea || "학회가 해소할 수 있는 영역을 정리하는 중입니다."} />
            <DetailBlock title="왜 우리 학회인가" value={score?.whyOurSociety || "학회만의 설득 논리를 정리하는 중입니다."} />
            <DetailBlock title="가능한 비즈니스 니즈" value={company.likelyNeeds.join(", ")} />
            <DetailBlock title="학회가 기여할 수 있는 방식" value={analysis.outreach_positioning} />
            <DetailBlock title="추천 프로젝트 제안 방향" value={score?.recommendedProjectDirection || "분석 대기 중입니다."} />
            <DetailBlock title="구체 프로젝트 아이디어" value={`${company.likelyNeeds[0] || company.industry}를 중심으로 설문, IDI, 경쟁 사례 분석, 실행 전략 제안서를 구성합니다.`} />
            <DetailBlock title="예상 산출물" value="요약 보고서, raw insight, 인터뷰/설문 결과, 전략 제안서, 발표 자료" />
            <DetailBlock title="기업이 관심 가질 이유" value="내부 데이터만으로 보기 어려운 학생·청년 관점과 외부 관찰 기반 실행 아이디어를 얻을 수 있기 때문입니다." />
            <DetailBlock title="우려 또는 리스크" value={(score?.risks || []).join(" ")} />
            <DetailBlock title="추천 접촉 부서" value={company.suggestedDepartment} />
            <DetailBlock title="적합도 근거" value={score?.fitReasoning || "분석 대기 중입니다."} />
            <DetailBlock title="협업 유형 Fit" value={score?.collaborationTypeFit || company.possibleCollaborationTypes.map((type) => collaborationTypeLabels[type]).join(", ")} />
          </section>

          <ContactSection company={company} score={score} contactRoutes={contactRoutes} />
        </div>
      )}
    </DashboardShell>
  );
}

function ContactSection({ company, score, contactRoutes }: { company: CompanyLead; score: CompanyScore | null; contactRoutes: ContactRoute[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">연락 채널과 출처 링크</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{contactAvailability(company, score?.contactAvailability)}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">추천 접촉 부서: {company.suggestedDepartment}</p>
        </div>
        {company.contact.publicEmail ? (
          <a className="contact-link" href={`mailto:${company.contact.publicEmail}`}>
            {company.contact.publicEmail}
          </a>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {contactRoutes.map((route) => (
          <a
            key={`${route.label}-${route.url}`}
            href={route.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-slate-200 bg-slate-50 p-3 transition hover:bg-white"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="inline-flex items-center gap-2 text-sm font-bold text-slate-950">
                {route.type === "linkedin_people_search" ? <Users size={15} /> : null}
                {route.label}
              </p>
              <ExternalLink size={14} className="shrink-0 text-slate-500" />
            </div>
            <p className="mt-1 text-xs font-semibold text-cyan-800">{routeTypeLabel(route)}</p>
            {route.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{route.description}</p> : null}
          </a>
        ))}
      </div>

      {company.contact.notes ? <p className="mt-4 rounded-md bg-cyan-50 p-3 text-sm leading-6 text-cyan-950">{company.contact.notes}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {company.contact.website ? <a className="contact-link" href={company.contact.website} target="_blank" rel="noreferrer">홈페이지 <ExternalLink size={14} /></a> : null}
        {company.sourceLinks.filter((link) => link !== company.contact.website).map((link) => (
          <a key={link} className="contact-link" href={link} target="_blank" rel="noreferrer">
            {sourceLinkLabel(link)} <ExternalLink size={14} />
          </a>
        ))}
      </div>
    </section>
  );
}

function contactRoutesFor(company: CompanyLead): ContactRoute[] {
  if (company.contact.routes?.length) return company.contact.routes;
  const routes: ContactRoute[] = [];
  if (company.contact.contactPage) {
    routes.push({
      type: "official_contact",
      label: "공식 문의 페이지",
      url: company.contact.contactPage,
      description: "공식 사이트에서 확인 가능한 공개 문의 접점입니다."
    });
  }
  if (company.contact.linkedinUrl) {
    routes.push({
      type: "linkedin_company",
      label: "LinkedIn 회사 페이지",
      url: company.contact.linkedinUrl,
      description: "회사 공개 페이지에서 담당 부서와 공개 게시글을 확인합니다."
    });
  }
  return routes;
}

function contactAvailability(company: CompanyLead, scoreAvailability?: string) {
  if (company.contact.publicEmail) {
    return `공개 이메일 ${company.contact.publicEmail} 사용 가능`;
  }
  if (!scoreAvailability || scoreAvailability.includes("No verified public email")) {
    return publicEmailFallback;
  }
  return scoreAvailability;
}

function routeTypeLabel(route: ContactRoute) {
  const labels: Record<ContactRoute["type"], string> = {
    official_contact: "공식 문의",
    customer_support: "고객센터",
    partnership: "제휴/파트너십",
    business_development: "사업개발",
    strategy: "전략/기획",
    marketing: "마케팅",
    hr_recruiting: "HR/채용",
    pr_media: "PR/미디어",
    linkedin_company: "LinkedIn 회사",
    linkedin_people_search: "LinkedIn 재직자 탭",
    careers: "채용 페이지",
    other: "기타 공개 접점"
  };
  return labels[route.type];
}

function sourceLinkLabel(link: string) {
  try {
    const hostname = new URL(link).hostname.replace(/^www\./, "");
    if (hostname.includes("linkedin.com")) return "LinkedIn";
    return hostname;
  } catch {
    return "출처";
  }
}

function DetailBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-bold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{value}</p>
    </div>
  );
}
