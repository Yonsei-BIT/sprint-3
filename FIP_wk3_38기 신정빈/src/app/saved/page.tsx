"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Trash2 } from "lucide-react";

import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState, FitScore, PageHeader } from "@/components/ui";
import { savedCompanyStatusLabels } from "@/lib/labels";
import { readSavedCompanies, writeSavedCompanies } from "@/lib/storage";
import type { SavedCompany, SavedCompanyStatus } from "@/lib/types";

export default function SavedPage() {
  const [companies, setCompanies] = useState<SavedCompany[]>([]);

  useEffect(() => {
    setCompanies(readSavedCompanies());
  }, []);

  function removeCompany(id: string) {
    const next = companies.filter((company) => company.id !== id);
    setCompanies(next);
    writeSavedCompanies(next);
  }

  function updateNotes(id: string, notes: string) {
    const next = companies.map((company) => (company.id === id ? { ...company, notes } : company));
    setCompanies(next);
    writeSavedCompanies(next);
  }

  function updateStatus(id: string, status: SavedCompanyStatus) {
    const next = companies.map((company) => (company.id === id ? { ...company, status } : company));
    setCompanies(next);
    writeSavedCompanies(next);
  }

  return (
    <DashboardShell>
      <PageHeader
        eyebrow="저장한 기업"
        title="후속 연락할 기업을 로컬에 저장합니다"
        description="기업명, 산업, 적합도, 문제 상황, 프로젝트 방향, 연락 채널, 생성된 이메일, 상태와 메모를 관리합니다."
      />

      {companies.length === 0 ? (
        <EmptyState title="저장한 기업이 없습니다" description="기업 카드나 이메일 생성 화면에서 저장 버튼을 누르면 여기에 표시됩니다." />
      ) : (
        <div className="grid gap-4">
          {companies.map((company) => (
            <article key={company.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-950">{company.companyName}</h2>
                    <span className="rounded-md bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-800">{company.industry}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">저장일: {new Date(company.savedAt).toLocaleString("ko-KR")}</p>
                </div>
                <FitScore score={company.fitScore} />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Info title="문제 상황" value={company.problemSituation} />
                <Info title="프로젝트 제안 방향" value={company.projectProposalDirection} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                {company.contactChannel.website ? <a className="contact-link" href={company.contactChannel.website} target="_blank" rel="noreferrer">웹사이트 <ExternalLink size={14} /></a> : null}
                {company.contactChannel.contactPage ? <a className="contact-link" href={company.contactChannel.contactPage} target="_blank" rel="noreferrer">문의 페이지 <ExternalLink size={14} /></a> : null}
                {company.contactChannel.publicEmail ? <span className="contact-chip">{company.contactChannel.publicEmail}</span> : null}
                {company.contactChannel.linkedinUrl ? <a className="contact-link" href={company.contactChannel.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn <ExternalLink size={14} /></a> : null}
              </div>

              {company.generatedColdEmail ? (
                <div className="mt-4 rounded-md bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-950">생성된 콜드 이메일</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{company.generatedColdEmail}</p>
                </div>
              ) : null}

              <div className="mt-4 grid gap-4 md:grid-cols-[240px_1fr]">
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  상태
                  <select value={company.status} onChange={(event) => updateStatus(company.id, event.target.value as SavedCompanyStatus)} className="input">
                    {Object.entries(savedCompanyStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  메모
                  <textarea value={company.notes} onChange={(event) => updateNotes(company.id, event.target.value)} className="input min-h-24 resize-y" />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-4">
                <Link href={`/company/${company.companyId}`} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  상세 보기
                </Link>
                <button type="button" onClick={() => removeCompany(company.id)} className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">
                  <Trash2 size={16} />
                  삭제
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-sm font-bold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{value}</p>
    </div>
  );
}
