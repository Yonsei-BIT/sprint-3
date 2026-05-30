"use client";

import Link from "next/link";
import { BookmarkPlus, ExternalLink, FileText, MailPlus, Users } from "lucide-react";

import { Badge, FitScore } from "@/components/ui";
import { collaborationTypeLabels, companySizeLabels } from "@/lib/labels";
import { readSavedCompanies, writeSavedCompanies } from "@/lib/storage";
import type { CompanyLead, CompanyScore, ContactRoute, SavedCompany } from "@/lib/types";

const publicEmailFallback = "검증된 공개 이메일이 없습니다. 공식 문의 페이지 또는 제휴/파트너십 문의 채널을 이용하세요.";

export function CompanyCard({ company, score }: { company: CompanyLead; score: CompanyScore | null }) {
  const routes = contactRoutesFor(company);

  function handleSave() {
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
      notes: "기업 카드에서 저장됨",
      status: "not_contacted",
      savedAt: new Date().toISOString()
    };
    writeSavedCompanies([saved, ...readSavedCompanies()]);
  }

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-slate-950">{company.name}</h2>
            {score?.priorityTier ? <Badge tone="amber">{score.priorityTier}</Badge> : null}
            <Badge tone="green">{company.industry}</Badge>
            <Badge tone="cyan">{companySizeLabels[company.size]}</Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{company.description}</p>
        </div>
        <FitScore score={score?.fitScore ?? 0} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {company.possibleCollaborationTypes.slice(0, 4).map((type) => (
          <Badge key={type}>{collaborationTypeLabels[type]}</Badge>
        ))}
        <Badge tone="amber">{company.region}</Badge>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Info label="티어 분류 근거" value={score?.tierReason || "기업 후보 티어를 분류하는 중입니다."} />
        <Info label="좋은 타깃인 이유" value={score?.whyGoodTarget || "분석 대기 중입니다."} />
        <Info label="문제 상황 Fit" value={score?.environmentProblemFit || "기업 문제 상황 분석과의 연결성을 평가하는 중입니다."} />
        <Info label="예상 문제/니즈" value={score?.expectedCompanyProblem || company.likelyNeeds.join(", ")} />
        <Info label="해소 가능 영역" value={score?.solvableArea || "학회가 해소할 수 있는 영역을 정리하는 중입니다."} />
        <Info label="왜 우리 학회인가" value={score?.whyOurSociety || "학회만의 설득 논리를 정리하는 중입니다."} />
        <Info label="추천 프로젝트 방향" value={score?.recommendedProjectDirection || "분석 대기 중입니다."} />
        <Info label="추천 접촉 부서" value={company.suggestedDepartment} />
        <Info label="연락 가능성" value={contactAvailability(company, score?.contactAvailability)} />
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-2 text-sm">
          <p className="text-xs font-bold text-slate-500">실제 컨택 루트</p>
          <div className="flex flex-wrap gap-2">
            {routes.slice(0, 4).map((route) => (
              <a key={`${route.label}-${route.url}`} className="contact-link" href={route.url} target="_blank" rel="noreferrer" title={route.description}>
                {route.type === "linkedin_people_search" ? <Users size={14} /> : null}
                {route.label} <ExternalLink size={14} />
              </a>
            ))}
            {company.contact.publicEmail ? (
              <a className="contact-link" href={`mailto:${company.contact.publicEmail}`}>
                {company.contact.publicEmail}
              </a>
            ) : null}
          </div>
          <p className="max-w-3xl text-xs leading-5 text-slate-500">{contactAvailability(company, score?.contactAvailability)}</p>
        </div>

        <div className="flex flex-wrap gap-2 text-sm lg:justify-end">
          {company.contact.website ? (
            <a className="contact-link" href={company.contact.website} target="_blank" rel="noreferrer">
              홈페이지 <ExternalLink size={14} />
            </a>
          ) : null}
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <BookmarkPlus size={16} />
            저장
          </button>
          <Link href={`/company/${company.id}`} className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            상세 보기
          </Link>
          <Link href={`/proposal?company=${company.id}`} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            <FileText size={16} />
            제안서 생성
          </Link>
          <Link href={`/email?company=${company.id}`} className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-cyan-900">
            <MailPlus size={16} />
            이메일 생성
          </Link>
        </div>
      </div>
    </article>
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}
